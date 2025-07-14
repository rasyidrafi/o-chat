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
    <div className="absolute inset-0 overflow-y-auto custom-scrollbar pt-8">
      <div className="px-4 md:px-6 lg:px-8 xl:px-16 max-w-4xl mx-auto">
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
        {/* Bottom padding to account for the overlay chat input
        <div className="h-32 md:h-36"></div>
        <div ref={messagesEndRef} /> */}
      </div>
    </div>
  );
};

export default MessageList;