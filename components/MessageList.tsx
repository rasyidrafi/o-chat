import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types/chat';
import Message from './Message';
import ChatLoading from './ChatLoading';
import { AnimatePresence } from 'framer-motion';

interface MessageListProps {
  messages: ChatMessage[];
  animationsDisabled: boolean;
  streamingMessageId: string | null;
  onStopStreaming: () => void;
  isLoading?: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  animationsDisabled, 
  streamingMessageId,
  onStopStreaming,
  isLoading = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingMessageId]);

  if (isLoading) {
    return <ChatLoading message="Loading conversation..." />;
  }

  if (messages.length === 0) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto py-4"
    >
      <div className="px-4 md:px-6 lg:px-8 xl:px-16 max-w-4xl mx-auto space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <Message
              key={message.id}
              message={message}
              animationsDisabled={animationsDisabled}
              isStreaming={streamingMessageId === message.id}
              onStop={streamingMessageId === message.id ? onStopStreaming : undefined}
            />
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;
