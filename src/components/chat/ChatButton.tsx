import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StudentChatModal } from './StudentChatModal';
import { useStudentChat } from '@/hooks/useChat';
import { cn } from '@/lib/utils';

interface ChatButtonProps {
  className?: string;
}

export const ChatButton: React.FC<ChatButtonProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount, initializeConversation } = useStudentChat();

  // Initialize to get unread count
  useEffect(() => {
    initializeConversation();
  }, [initializeConversation]);

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        className={cn('relative', className)}
        aria-label="Open chat"
      >
        <MessageCircle className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 min-w-[20px] p-0 flex items-center justify-center text-[10px]"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      <StudentChatModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default ChatButton;
