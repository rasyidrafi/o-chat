// Improved MessageList with performance optimizations
import React, { useEffect, useRef, useState } from "react";
import { ChatMessage } from "../types/chat";
import Message from "./Message";
import { AnimatePresence } from "framer-motion";

interface MessageListProps {
  messages: ChatMessage[];
  streamingMessageId: string | null;
  animationsDisabled: boolean;
  isLoadingMoreMessages: boolean;
  hasMoreMessages: boolean;
  onLoadMoreMessages: () => void;
  onScrollStateChange?: (showScrollButton: boolean) => void;
}

interface MessageListRef {
  scrollToBottom: (smooth?: boolean) => void;
}

function usePrevious<T>(value: T): T | null {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

const MessageList = React.forwardRef<MessageListRef, MessageListProps>(({
  messages,
  streamingMessageId,
  animationsDisabled,
  onScrollStateChange,
}, ref) => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const prevMessages = usePrevious(messages);

  // Smooth scroll to bottom function
  const scrollToBottom = React.useCallback((smooth = true) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, []);

  // Check if user is at bottom of scroll
  const checkIfAtBottom = React.useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50; // 50px threshold
      // Notify parent component about scroll state
      if (onScrollStateChange) {
        onScrollStateChange(!isAtBottom);
      }
    }
  }, [onScrollStateChange]);

  // Handle scroll events
  const handleScroll = React.useCallback(() => {
    checkIfAtBottom();
  }, [checkIfAtBottom]);

  // Expose scrollToBottom function to parent component
  React.useImperativeHandle(ref, () => ({
    scrollToBottom: (smooth = true) => scrollToBottom(smooth)
  }), [scrollToBottom]);

  // Scroll to bottom only when user sends a new message
  useEffect(() => {
    if (prevMessages && messages.length > prevMessages.length) {
      // New message added, scroll to bottomno
      scrollToBottom(true);
    }
  }, [messages.length, prevMessages, scrollToBottom]);

  // Set up scroll listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      // Check initial position
      checkIfAtBottom();
      
      return () => {
        container.removeEventListener('scroll', handleScroll);
      };
    }
  }, [handleScroll, checkIfAtBottom]);

  // Detect when we're transitioning between conversations (empty -> filled)
  useEffect(() => {
    if (prevMessages && prevMessages.length > 0 && messages.length === 0) {
      // Starting transition (had messages, now empty)
      setIsTransitioning(true);
    } else if (isTransitioning && messages.length > 0) {
      // Ending transition (was empty, now has messages)
      setIsTransitioning(false);
    }
  }, [messages.length, prevMessages, isTransitioning]);

  if (messages.length === 0) {
    // Don't show loading here - let ChatView handle all loading states
    return null;
  }

  return (
    <div
      ref={messagesContainerRef}
      className="absolute inset-0 overflow-y-auto custom-scrollbar pt-8 overflow-x-hidden"
    >
      <div className="px-4 md:px-6 lg:px-8 xl:px-16 max-w-4xl mx-auto overflow-x-hidden">
        <AnimatePresence mode="popLayout">
          {messages.map((message, idx) => (
            <Message
              key={message.id}
              message={message}
              isStreaming={streamingMessageId === message.id}
              animationsDisabled={animationsDisabled}
              isLastMessage={idx === messages.length - 1}
            />
          ))}
        </AnimatePresence>
        {/* Bottom padding to account for the overlay chat input */}
        <div className="h-32 md:h-36"></div>
      </div>
    </div>
  );
});

export default MessageList;
