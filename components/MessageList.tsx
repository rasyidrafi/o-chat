// Simplified MessageList with cleaner rendering logic
import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '../types/chat';
import Message from './Message';
import { AnimatePresence } from 'framer-motion';

interface MessageListProps {
  messages: ChatMessage[];
  streamingMessageId: string | null;
  onStopStreaming: () => void;
  animationsDisabled: boolean;
  isLoadingMessages: boolean;
  isLoadingMoreMessages: boolean;
  hasMoreMessages: boolean;
  onLoadMoreMessages: () => void;
}

const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  streamingMessageId,
  onStopStreaming,
  animationsDisabled,
  isLoadingMessages,
  isLoadingMoreMessages,
  hasMoreMessages,
  onLoadMoreMessages
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

  // Handle scroll to load more messages
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop } = container;
      const isNearTop = scrollTop <= 100; // 100px threshold from top
      
      if (isNearTop && hasMoreMessages && !isLoadingMoreMessages && !isLoadingMessages) {
        const previousScrollHeight = container.scrollHeight;
        setShouldScrollToBottom(false);
        
        onLoadMoreMessages();
        
        // Maintain scroll position after loading more messages
        setTimeout(() => {
          const newScrollHeight = container.scrollHeight;
          const scrollDiff = newScrollHeight - previousScrollHeight;
          container.scrollTop = scrollTop + scrollDiff;
        }, 100);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMoreMessages, isLoadingMoreMessages, isLoadingMessages, onLoadMoreMessages]);

  useEffect(() => {
    if (shouldScrollToBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingMessageId, shouldScrollToBottom]);

  // Reset scroll behavior when messages change (new conversation)
  useEffect(() => {
    setShouldScrollToBottom(true);
  }, [messages.length === 0]);

  if (messages.length === 0) {
    if (isLoadingMessages) {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center text-zinc-500 dark:text-zinc-400">
            <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <div className="text-sm">Loading conversation...</div>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div 
      ref={messagesContainerRef}
      className="absolute inset-0 overflow-y-auto custom-scrollbar pt-8"
    >
      <div className="px-4 md:px-6 lg:px-8 xl:px-16 max-w-4xl mx-auto overflow-x-hidden">
        {/* Loading more messages indicator */}
        {isLoadingMoreMessages && (
          <div className="flex flex-col items-center justify-center py-4 text-zinc-500 dark:text-zinc-400">
            <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <div className="text-xs">Loading more messages...</div>
          </div>
        )}
        
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
        {/* Bottom padding to account for the overlay chat input */}
        <div className="h-32 md:h-36"></div>
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;