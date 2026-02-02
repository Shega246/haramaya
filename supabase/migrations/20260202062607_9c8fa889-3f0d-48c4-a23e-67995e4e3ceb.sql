-- =====================================================
-- CHAT SYSTEM DATABASE SCHEMA
-- =====================================================

-- Create message sender role enum
CREATE TYPE public.message_sender_role AS ENUM ('student', 'admin');

-- Create conversations table
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    student_unread_count INTEGER NOT NULL DEFAULT 0,
    admin_unread_count INTEGER NOT NULL DEFAULT 0
);

-- Create messages table
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_role public.message_sender_role NOT NULL,
    sender_id UUID NOT NULL,
    message_text TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_conversations_student_id ON public.conversations(student_id);
CREATE INDEX idx_conversations_last_message ON public.conversations(last_message_at DESC);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_messages_sender ON public.messages(sender_id, sender_role);

-- Enable RLS on both tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES FOR CONVERSATIONS
-- =====================================================

-- Students can view their own conversations
CREATE POLICY "Students can view own conversations"
ON public.conversations
FOR SELECT
USING (is_student_owner(student_id));

-- Students can create their own conversations
CREATE POLICY "Students can create own conversations"
ON public.conversations
FOR INSERT
WITH CHECK (is_student_owner(student_id));

-- Students can update their own conversations (for unread count)
CREATE POLICY "Students can update own conversations"
ON public.conversations
FOR UPDATE
USING (is_student_owner(student_id));

-- Admins can view all conversations
CREATE POLICY "Admins can view all conversations"
ON public.conversations
FOR SELECT
USING (is_admin());

-- Admins can update all conversations
CREATE POLICY "Admins can update all conversations"
ON public.conversations
FOR UPDATE
USING (is_admin());

-- =====================================================
-- RLS POLICIES FOR MESSAGES
-- =====================================================

-- Students can view messages in their own conversations
CREATE POLICY "Students can view own messages"
ON public.messages
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_id
        AND is_student_owner(c.student_id)
    )
);

-- Students can insert messages in their own conversations
CREATE POLICY "Students can send own messages"
ON public.messages
FOR INSERT
WITH CHECK (
    sender_role = 'student' AND
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_id
        AND is_student_owner(c.student_id)
    )
);

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
ON public.messages
FOR SELECT
USING (is_admin());

-- Admins can insert messages to any conversation
CREATE POLICY "Admins can send messages"
ON public.messages
FOR INSERT
WITH CHECK (sender_role = 'admin' AND is_admin());

-- Admins can update messages (for marking as read)
CREATE POLICY "Admins can update messages"
ON public.messages
FOR UPDATE
USING (is_admin());

-- Students can update messages in their conversations (for marking as read)
CREATE POLICY "Students can update own messages"
ON public.messages
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_id
        AND is_student_owner(c.student_id)
    )
);

-- =====================================================
-- TRIGGER: Update conversation last_message_at on new message
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET 
        last_message_at = NEW.created_at,
        student_unread_count = CASE 
            WHEN NEW.sender_role = 'admin' THEN student_unread_count + 1
            ELSE student_unread_count
        END,
        admin_unread_count = CASE
            WHEN NEW.sender_role = 'student' THEN admin_unread_count + 1
            ELSE admin_unread_count
        END
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_message_insert
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_on_message();

-- =====================================================
-- FUNCTION: Get or create conversation for a student
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(_student_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    conv_id UUID;
BEGIN
    -- Check if conversation exists
    SELECT id INTO conv_id
    FROM public.conversations
    WHERE student_id = _student_id
    LIMIT 1;
    
    -- Create if not exists
    IF conv_id IS NULL THEN
        INSERT INTO public.conversations (student_id)
        VALUES (_student_id)
        RETURNING id INTO conv_id;
    END IF;
    
    RETURN conv_id;
END;
$$;

-- =====================================================
-- FUNCTION: Mark messages as read
-- =====================================================
CREATE OR REPLACE FUNCTION public.mark_messages_read(_conversation_id UUID, _reader_role message_sender_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Mark messages from the opposite role as read
    UPDATE public.messages
    SET is_read = true
    WHERE conversation_id = _conversation_id
    AND sender_role != _reader_role
    AND is_read = false;
    
    -- Reset unread count for the reader
    IF _reader_role = 'student' THEN
        UPDATE public.conversations
        SET student_unread_count = 0
        WHERE id = _conversation_id;
    ELSE
        UPDATE public.conversations
        SET admin_unread_count = 0
        WHERE id = _conversation_id;
    END IF;
END;
$$;

-- Enable realtime for messages (for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;