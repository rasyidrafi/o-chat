// Alternative: Scroll-based bottom detection with RAF throttling
import React, { useEffect, useRef, useState, useCallback } from "react";
import { ChatMessage } from "../types/chat";
import Message from "./Message";
import { AnimatePresence } from "framer-motion";
import { useSettingsContext } from "../contexts/SettingsContext";

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
  const { isMobile } = useSettingsContext();
  
  // RAF throttling
  const rafId = useRef<number | null>(null);
  const lastScrollTop = useRef<number>(0);

  const prevMessages = usePrevious(messages);

  // Optimized scroll detection with RAF throttling
  useEffect(() => {
    const container = messagesContainerRef.current;
    
    if (!container || !onScrollStateChange || messages.length === 0) {
      return;
    }

    const checkScrollPosition = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      
      // Only check if scroll position actually changed
      if (scrollTop === lastScrollTop.current) {
        return;
      }
      
      lastScrollTop.current = scrollTop;
      
      // Calculate if we're near the bottom (within 200px)
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const shouldShowButton = distanceFromBottom > 200;
      
      onScrollStateChange(shouldShowButton);
    };

    const handleScroll = () => {
      // Cancel previous RAF if still pending
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
      
      // Schedule check for next frame
      rafId.current = requestAnimationFrame(checkScrollPosition);
    };

    // Use passive listener for better performance
    if (!isMobile) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }

    // Initial check
    checkScrollPosition();

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
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
      requestAnimationFrame(() => {
        scrollToBottom(true);
      });
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
      requestAnimationFrame(() => {
        scrollToBottom(false);
      });
    }
  }, [messages.length, prevMessages, isTransitioning, scrollToBottom]);

  if (messages.length === 0) {
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
        <div ref={sentinelRef} className="h-32 md:h-36"></div>
      </div>
    </div>
  );
});

export default MessageList;