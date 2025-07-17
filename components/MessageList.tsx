// Improved MessageList with fixed scroll behavior
import React, { useEffect, useRef, useState, useCallback } from "react";
import { ChatMessage } from "../types/chat";
import Message from "./Message";
import { AnimatePresence } from "framer-motion";
import Button from "./ui/Button";
import SmallButton from "./ui/SmallButton";

interface MessageListProps {
  messages: ChatMessage[];
  streamingMessageId: string | null;
  onStopStreaming: () => void;
  animationsDisabled: boolean;
  isLoadingMessages: boolean;
  isLoadingMoreMessages: boolean;
  hasMoreMessages: boolean;
  onLoadMoreMessages: () => void;
  onShowScrollToBottom?: (show: boolean) => void;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  streamingMessageId,
  onStopStreaming,
  animationsDisabled,
  isLoadingMessages,
  onShowScrollToBottom,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const lastMessageCountRef = useRef(messages.length);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  const SCROLL_THRESHOLD = 5; // Very small threshold - even tiny scrolls up will disable auto-scroll

  // Helper function to check if user is at bottom
  const isAtBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return false;
    
    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollHeight - scrollTop - clientHeight <= SCROLL_THRESHOLD;
  }, []);

  // Helper function to scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? "smooth" : "auto" 
      });
    }
  }, []);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const isCurrentlyAtBottom = isAtBottom();
    
    // Clear any existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Set user scrolling flag
    setIsUserScrolling(true);

    // Immediately disable auto-scroll if user scrolled up (not at bottom)
    if (!isCurrentlyAtBottom) {
      setShouldAutoScroll(false);
    }

    // After user stops scrolling, update auto-scroll behavior
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
      // Only re-enable auto-scroll if user is exactly at bottom
      if (isCurrentlyAtBottom) {
        setShouldAutoScroll(true);
      }
    }, 100); // Shorter debounce for more responsive behavior

    // Update scroll button visibility with a slightly larger threshold for UX
    const showButton = container.scrollHeight - container.scrollTop - container.clientHeight > 50;
    if (onShowScrollToBottom) {
      onShowScrollToBottom(showButton && messages.length > 0);
    }
  }, [isAtBottom, onShowScrollToBottom, messages.length]);

  // Set up scroll listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  // Handle external scroll to bottom requests
  useEffect(() => {
    const handler = () => {
      setShouldAutoScroll(true);
      setIsUserScrolling(false);
      scrollToBottom(true);
      
      // Hide scroll button immediately
      if (onShowScrollToBottom) {
        onShowScrollToBottom(false);
      }
    };

    window.addEventListener("scrollToBottom", handler);
    return () => window.removeEventListener("scrollToBottom", handler);
  }, [scrollToBottom, onShowScrollToBottom]);

  // Auto-scroll when messages change (new message or streaming)
  useEffect(() => {
    const hasNewMessages = messages.length > lastMessageCountRef.current;
    const isStreaming = streamingMessageId !== null;
    
    // Update last message count
    lastMessageCountRef.current = messages.length;

    // Only auto-scroll if:
    // 1. We should auto-scroll (user was at bottom)
    // 2. User is not currently scrolling
    // 3. We have messages to show
    // 4. User is actually at the bottom (double-check to prevent forced scrolling)
    if (shouldAutoScroll && !isUserScrolling && messages.length > 0 && isAtBottom()) {
      // Use smooth scrolling for new messages, instant for streaming updates
      const shouldUseSmooth = hasNewMessages && !isStreaming;
      
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        scrollToBottom(shouldUseSmooth);
      }, 10);
    }
  }, [messages, streamingMessageId, shouldAutoScroll, isUserScrolling, scrollToBottom, isAtBottom]);

  // Reset scroll state when conversation changes
  useEffect(() => {
    if (messages.length === 0) {
      setShouldAutoScroll(true);
      setIsUserScrolling(false);
      lastMessageCountRef.current = 0;
      
      if (onShowScrollToBottom) {
        onShowScrollToBottom(false);
      }
    }
  }, [messages.length, onShowScrollToBottom]);

  // Initial scroll to bottom when messages first load
  useEffect(() => {
    if (messages.length > 0 && lastMessageCountRef.current === 0) {
      // First time loading messages - scroll to bottom immediately
      setTimeout(() => {
        scrollToBottom(false); // No smooth scroll for initial load
      }, 50);
    }
  }, [messages.length, scrollToBottom]);

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
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <Message
              key={message.id}
              message={message}
              isStreaming={streamingMessageId === message.id}
              onStopStreaming={
                streamingMessageId === message.id ? onStopStreaming : undefined
              }
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