// Improved MessageList with fixed scroll behavior
import React, { useEffect, useRef, useCallback } from "react";
import { ChatMessage } from "../types/chat";
import Message from "./Message";
import { AnimatePresence } from "framer-motion";

interface MessageListProps {
  messages: ChatMessage[];
  streamingMessageId: string | null;
  onStopStreaming: () => void;
  animationsDisabled: boolean;
  isLoadingMessages: boolean;
  isLoadingMoreMessages: boolean;
  hasMoreMessages: boolean;
  onLoadMoreMessages: () => void;
  onShowScrollToBottom: (show: boolean) => void;
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
  const SCROLL_THRESHOLD = 50;

  // Helper function to check if user is at bottom
  const isAtBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return false;

    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollHeight - scrollTop - clientHeight <= SCROLL_THRESHOLD;
  }, []);

  // Helper function to scroll to bottom
  // Helper function to scroll to bottom with interval
  const scrollToBottom = useCallback(
    (smooth = true) => {
      if (!messagesEndRef.current) return;

      // Initial scroll
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
      });

      // Continue scrolling until at bottom
      const scrollInterval = setInterval(() => {
        if (isAtBottom()) {
          clearInterval(scrollInterval);
          return;
        }

        messagesEndRef.current?.scrollIntoView({
          behavior: smooth ? "smooth" : "auto",
        });
      }, 100);

      // Safety timeout to prevent infinite scrolling
      setTimeout(() => {
        clearInterval(scrollInterval);
      }, 3000);
    },
    [isAtBottom]
  );

  // Handle external scroll to bottom requests
  useEffect(() => {
    const handler = () => {
      scrollToBottom(true);
    };

    window.addEventListener("scrollToBottom", handler);
    return () => window.removeEventListener("scrollToBottom", handler);
  }, [scrollToBottom, onShowScrollToBottom]);

  // Handle scroll events
  const detectScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const isCurrentlyAtBottom = isAtBottom();

    onShowScrollToBottom(!isCurrentlyAtBottom);
  }, [isAtBottom, onShowScrollToBottom, messages.length]);

  // Set up scroll listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", detectScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", detectScroll);
    };
  }, [detectScroll]);

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
          {messages.map((message, i) => (
            <Message
              key={message.id}
              message={message}
              isStreaming={streamingMessageId === message.id}
              onStopStreaming={
                streamingMessageId === message.id ? onStopStreaming : undefined
              }
              onLoaded={() => {
                // if last index scrolltoBottom
                if (i == messages.length - 1) {
                  scrollToBottom();
                }
              }}
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
