import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Message {
  id: string;
  conversation_id: string;
  sender_role: 'student' | 'admin';
  sender_id: string;
  message_text: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  student_id: string;
  created_at: string;
  last_message_at: string;
  student_unread_count: number;
  admin_unread_count: number;
  // Joined student data (for admin view)
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    student_id: string;
    photo_url: string | null;
  };
  // Latest message preview
  latest_message?: string;
}

export const useStudentChat = () => {
  const { student, user } = useAuth();
  const { toast } = useToast();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Get or create conversation for the student
  const initializeConversation = useCallback(async () => {
    if (!student?.id) return;

    setIsLoading(true);
    try {
      // Use the RPC function to get or create conversation
      const { data: convId, error: rpcError } = await supabase
        .rpc('get_or_create_conversation', { _student_id: student.id });

      if (rpcError) throw rpcError;

      // Fetch the full conversation
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', convId)
        .single();

      if (convError) throw convError;

      setConversation(convData as Conversation);
      setUnreadCount(convData.student_unread_count || 0);

      // Fetch messages
      const { data: messagesData, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (msgError) throw msgError;

      setMessages((messagesData || []) as Message[]);
    } catch (error) {
      console.error('Error initializing conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [student?.id, toast]);

  // Send a message
  const sendMessage = async (text: string) => {
    if (!conversation?.id || !user?.id || !text.trim()) return;

    setIsSending(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_role: 'student' as const,
          sender_id: user.id,
          message_text: text.trim()
        })
        .select()
        .single();

      if (error) throw error;

      // Add message to local state immediately
      setMessages(prev => [...prev, data as Message]);
      
      return { success: true };
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
      return { success: false };
    } finally {
      setIsSending(false);
    }
  };

  // Mark messages as read
  const markAsRead = async () => {
    if (!conversation?.id) return;

    try {
      await supabase.rpc('mark_messages_read', {
        _conversation_id: conversation.id,
        _reader_role: 'student'
      });
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!conversation?.id) return;

    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => {
            // Check if message already exists
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
          
          // Update unread count if message is from admin
          if (newMessage.sender_role === 'admin') {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation?.id]);

  return {
    conversation,
    messages,
    isLoading,
    isSending,
    unreadCount,
    initializeConversation,
    sendMessage,
    markAsRead
  };
};

export const useAdminChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);

  // Fetch all conversations with student info
  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          student:students (
            id,
            first_name,
            last_name,
            student_id,
            photo_url
          )
        `)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Fetch latest message for each conversation
      const conversationsWithMessages = await Promise.all(
        (data || []).map(async (conv) => {
          const { data: msgData } = await supabase
            .from('messages')
            .select('message_text')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...conv,
            latest_message: msgData?.message_text || ''
          };
        })
      );

      setConversations(conversationsWithMessages as Conversation[]);
      
      // Calculate total unread
      const total = (data || []).reduce((sum, conv) => sum + (conv.admin_unread_count || 0), 0);
      setTotalUnread(total);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages((data || []) as Message[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, []);

  // Select a conversation
  const selectConversation = async (conv: Conversation) => {
    setSelectedConversation(conv);
    await fetchMessages(conv.id);
    
    // Mark as read
    if (conv.admin_unread_count > 0) {
      try {
        await supabase.rpc('mark_messages_read', {
          _conversation_id: conv.id,
          _reader_role: 'admin'
        });
        
        // Update local state
        setConversations(prev =>
          prev.map(c =>
            c.id === conv.id ? { ...c, admin_unread_count: 0 } : c
          )
        );
        setTotalUnread(prev => Math.max(0, prev - conv.admin_unread_count));
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    }
  };

  // Send a message
  const sendMessage = async (text: string) => {
    if (!selectedConversation?.id || !user?.id || !text.trim()) return;

    setIsSending(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_role: 'admin' as const,
          sender_id: user.id,
          message_text: text.trim()
        })
        .select()
        .single();

      if (error) throw error;

      // Add message to local state
      setMessages(prev => [...prev, data as Message]);
      
      // Update conversation last message
      setConversations(prev =>
        prev.map(c =>
          c.id === selectedConversation.id
            ? { ...c, latest_message: text.trim(), last_message_at: new Date().toISOString() }
            : c
        )
      );
      
      return { success: true };
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
      return { success: false };
    } finally {
      setIsSending(false);
    }
  };

  // Set up real-time subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel('admin-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMessage = payload.new as Message;
          
          // If this is for the selected conversation, add it
          if (selectedConversation?.id === newMessage.conversation_id) {
            setMessages(prev => {
              if (prev.some(m => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
          }
          
          // Update conversation list
          if (newMessage.sender_role === 'student') {
            setConversations(prev =>
              prev.map(c =>
                c.id === newMessage.conversation_id
                  ? {
                      ...c,
                      latest_message: newMessage.message_text,
                      last_message_at: newMessage.created_at,
                      admin_unread_count: selectedConversation?.id === c.id
                        ? c.admin_unread_count
                        : c.admin_unread_count + 1
                    }
                  : c
              )
            );
            
            // Update total unread if not viewing this conversation
            if (selectedConversation?.id !== newMessage.conversation_id) {
              setTotalUnread(prev => prev + 1);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation?.id]);

  return {
    conversations,
    selectedConversation,
    messages,
    isLoading,
    isSending,
    totalUnread,
    fetchConversations,
    selectConversation,
    sendMessage,
    clearSelection: () => setSelectedConversation(null)
  };
};
