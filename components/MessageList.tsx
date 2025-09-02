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
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const prevMessages = usePrevious(messages);

  // Intersection Observer for scroll detection
  useEffect(() => {
    const sentinel = sentinelRef.current;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Button shows when bottom sentinel is NOT visible
        const shouldShowButton = !entry.isIntersecting && messages.length > 0;
        onScrollStateChange?.(shouldShowButton);
      },
      {
        rootMargin: '0px 0px -100px 0px', // Trigger 100px before actual bottom
        threshold: 0
      }
    );

    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => observer.disconnect();
  }, [messages.length, onScrollStateChange]);

  // Smooth scroll to bottom function
  const scrollToBottom = React.useCallback((smooth = true) => {
    if (sentinelRef.current) {
      sentinelRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      });
    }
  }, []);

  // Expose scrollToBottom function to parent component
  React.useImperativeHandle(ref, () => ({
    scrollToBottom: (smooth = true) => scrollToBottom(smooth)
  }), [scrollToBottom]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (prevMessages && messages.length > prevMessages.length) {
      // New message added, scroll to bottom automatically
      setTimeout(() => scrollToBottom(true), 50); // Small delay to ensure DOM is updated
    }
  }, [messages.length, prevMessages, scrollToBottom]);

  // Detect when we're transitioning between conversations (empty -> filled)
  useEffect(() => {
    if (prevMessages && prevMessages.length > 0 && messages.length === 0) {
      // Starting transition (had messages, now empty)
      setIsTransitioning(true);
    } else if (isTransitioning && messages.length > 0) {
      // Ending transition (was empty, now has messages)
      setIsTransitioning(false);
      // Auto scroll to bottom after loading new conversation
      setTimeout(() => scrollToBottom(false), 100);
    }
  }, [messages.length, prevMessages, isTransitioning, scrollToBottom]);

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
        {/* Intersection Observer sentinel - placed at the very bottom */}
        <div 
          ref={sentinelRef} 
          style={{ height: '1px', width: '1px' }} 
          aria-hidden="true"
        />
        {/* Bottom padding to account for the overlay chat input */}
        <div className="h-32 md:h-36"></div>
      </div>
    </div>
  );
});

export default MessageList;
