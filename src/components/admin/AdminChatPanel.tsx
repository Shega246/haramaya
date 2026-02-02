import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, MessageCircle, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAdminChat, Message, Conversation } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export const AdminChatPanel: React.FC = () => {
  const { user } = useAuth();
  const {
    conversations,
    selectedConversation,
    messages,
    isLoading,
    isSending,
    totalUnread,
    fetchConversations,
    selectConversation,
    sendMessage,
    clearSelection
  } = useAdminChat();

  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selectedConversation]);

  const handleSend = async () => {
    if (!messageText.trim() || isSending) return;

    const text = messageText;
    setMessageText('');

    await sendMessage(text);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Filter conversations by search
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const studentName = `${conv.student?.first_name} ${conv.student?.last_name}`.toLowerCase();
    const studentId = conv.student?.student_id?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return studentName.includes(query) || studentId.includes(query);
  });

  return (
    <div className="h-[600px] bg-card rounded-xl border border-border overflow-hidden flex">
      {/* Conversation List */}
      <div
        className={cn(
          'w-full md:w-80 border-r border-border flex flex-col',
          selectedConversation ? 'hidden md:flex' : 'flex'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg">Messages</h3>
            {totalUnread > 0 && (
              <Badge variant="destructive">{totalUnread} unread</Badge>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Conversation List */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {searchQuery ? 'No matching conversations' : 'No conversations yet'}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredConversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isSelected={selectedConversation?.id === conv.id}
                  onClick={() => selectConversation(conv)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat View */}
      <div
        className={cn(
          'flex-1 flex flex-col',
          selectedConversation ? 'flex' : 'hidden md:flex'
        )}
      >
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={clearSelection}
                className="md:hidden h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedConversation.student?.photo_url || ''} />
                <AvatarFallback>
                  {selectedConversation.student?.first_name?.[0]}
                  {selectedConversation.student?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium">
                  {selectedConversation.student?.first_name}{' '}
                  {selectedConversation.student?.last_name}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {selectedConversation.student?.student_id}
                </p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No messages yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwn={message.sender_role === 'admin'}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your reply..."
                  disabled={isSending}
                  className="flex-1"
                  maxLength={1000}
                />
                <Button
                  onClick={handleSend}
                  disabled={!messageText.trim() || isSending}
                  size="icon"
                  className="shrink-0"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <MessageCircle className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">
              Select a conversation
            </h3>
            <p className="text-sm text-muted-foreground/70">
              Choose a student from the list to view messages
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const ConversationItem: React.FC<{
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}> = ({ conversation, isSelected, onClick }) => {
  const hasUnread = conversation.admin_unread_count > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-4 flex items-start gap-3 text-left hover:bg-muted/50 transition-colors',
        isSelected && 'bg-muted',
        hasUnread && 'bg-primary/5'
      )}
    >
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={conversation.student?.photo_url || ''} />
        <AvatarFallback>
          {conversation.student?.first_name?.[0]}
          {conversation.student?.last_name?.[0]}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className={cn('font-medium truncate', hasUnread && 'text-primary')}>
            {conversation.student?.first_name} {conversation.student?.last_name}
          </h4>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: false })}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-1">
          <p className="text-sm text-muted-foreground truncate">
            {conversation.latest_message || 'No messages'}
          </p>
          {hasUnread && (
            <Badge variant="destructive" className="h-5 min-w-[20px] p-0 flex items-center justify-center text-[10px]">
              {conversation.admin_unread_count}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
};

const MessageBubble: React.FC<{ message: Message; isOwn: boolean }> = ({ message, isOwn }) => {
  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2',
          isOwn
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted text-foreground rounded-bl-md'
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.message_text}</p>
        <p
          className={cn(
            'text-[10px] mt-1',
            isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}
        >
          {format(new Date(message.created_at), 'HH:mm')}
        </p>
      </div>
    </div>
  );
};

export default AdminChatPanel;
