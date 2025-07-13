// Simplified MessageList with cleaner rendering logic
import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types/chat';
import Message from './Message';
import { AnimatePresence } from 'framer-motion';

interface MessageListProps {
  messages: ChatMessage[];
  streamingMessageId: string | null;
  onStopStreaming: () => void;
  animationsDisabled: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  streamingMessageId,
  onStopStreaming,
  animationsDisabled
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessageId]);

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="flex-1 overflow-y-auto py-4">
      <div className="px-4 md:px-6 lg:px-8 xl:px-16 max-w-4xl mx-auto space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <Message
              key={message.id}
              message={message}
              isStreaming={streamingMessageId === message.id}
              onStopStreaming={streamingMessageId === message.id ? onStopStreaming : undefined}
              animationsDisabled={animationsDisabled}
            />
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;