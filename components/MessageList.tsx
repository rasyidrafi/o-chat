// Improved MessageList with performance optimizations
import React, { useEffect, useRef, useState, useCallback } from "react";
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
  const [showScrollButton, setShowScrollButton] = useState(false);
  const isUserScrolling = useRef(false);
  const scrollCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const prevMessages = usePrevious(messages);

  // Smooth scroll to bottom function
  const scrollToBottom = React.useCallback((smooth = true) => {
    if (messagesContainerRef.current) {
      isUserScrolling.current = false; // Reset user scrolling flag
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, []);

  // Optimized scroll check with immediate response
  const checkScrollPosition = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100; // 100px threshold
      const shouldShow = !isAtBottom && messages.length >= 1; // Show if not at bottom and has messages
      
      if (shouldShow !== showScrollButton) {
        setShowScrollButton(shouldShow);
        onScrollStateChange?.(shouldShow);
      }
    }
  }, [showScrollButton, onScrollStateChange, messages.length]);

  // Immediate scroll handler for instant feedback using RAF
  const immediateScrollHandler = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      const shouldShow = !isAtBottom && messages.length >= 1;
      
      // Only update if state needs to change (prevents unnecessary re-renders)
      if (shouldShow !== showScrollButton) {
        // Use RAF for smooth state updates
        requestAnimationFrame(() => {
          setShowScrollButton(shouldShow);
          onScrollStateChange?.(shouldShow);
        });
      }
    }
  }, [showScrollButton, onScrollStateChange, messages.length]);

  // Throttled scroll handler for final accuracy check
  const throttledScrollHandler = useCallback(() => {
    // Clear existing timeout
    if (scrollCheckTimeoutRef.current) {
      clearTimeout(scrollCheckTimeoutRef.current);
    }
    
    // Set a timeout to do a final check after scrolling stops
    scrollCheckTimeoutRef.current = setTimeout(() => {
      checkScrollPosition();
    }, 50); // Further reduced to 50ms for better responsiveness
  }, [checkScrollPosition]);

  // Handle touch events for mobile optimization
  const handleTouchStart = useCallback(() => {
    isUserScrolling.current = true;
  }, []);

  const handleTouchEnd = useCallback(() => {
    // Immediate check when touch ends
    immediateScrollHandler();
    // Also do a delayed check for accuracy
    setTimeout(() => {
      checkScrollPosition();
      isUserScrolling.current = false;
    }, 50);
  }, [immediateScrollHandler, checkScrollPosition]);

  // Combined scroll handler for best of both worlds
  const combinedScrollHandler = useCallback(() => {
    // Immediate check for instant feedback
    immediateScrollHandler();
    // Throttled check for final accuracy
    throttledScrollHandler();
  }, [immediateScrollHandler, throttledScrollHandler]);

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
    
    // Check scroll position whenever messages change
    if (messages.length > 0) {
      setTimeout(() => checkScrollPosition(), 100);
    }
  }, [messages.length, prevMessages, scrollToBottom, checkScrollPosition]);

  // Set up optimized scroll detection with immediate response
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      // Add passive scroll listener for better performance
      const options: AddEventListenerOptions = { passive: true };
      
      container.addEventListener('scroll', combinedScrollHandler, options);
      container.addEventListener('touchstart', handleTouchStart, options);
      container.addEventListener('touchend', handleTouchEnd, options);
      
      // Initial check with delay to ensure content is rendered
      setTimeout(() => checkScrollPosition(), 200);
      
      return () => {
        container.removeEventListener('scroll', combinedScrollHandler);
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchend', handleTouchEnd);
        
        // Clean up timeout
        if (scrollCheckTimeoutRef.current) {
          clearTimeout(scrollCheckTimeoutRef.current);
        }
      };
    }
  }, [combinedScrollHandler, handleTouchStart, handleTouchEnd, checkScrollPosition]);

  // Detect when we're transitioning between conversations (empty -> filled)
  useEffect(() => {
    if (prevMessages && prevMessages.length > 0 && messages.length === 0) {
      // Starting transition (had messages, now empty)
      setIsTransitioning(true);
      setShowScrollButton(false); // Hide scroll button during transition
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
        {/* Bottom padding to account for the overlay chat input */}
        <div className="h-32 md:h-36"></div>
      </div>
    </div>
  );
});

export default MessageList;
