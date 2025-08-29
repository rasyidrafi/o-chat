// Improved MessageList with fixed scroll behavior and performance optimizations
import React, { useEffect, useRef, useCallback, useState } from "react";
import { ChatMessage } from "../types/chat";
import Message from "./Message";
import { AnimatePresence } from "framer-motion";

interface MessageListProps {
  messages: ChatMessage[];
  streamingMessageId: string | null;
  animationsDisabled: boolean;
  isLoadingMessages: boolean;
  isLoadingMoreMessages: boolean;
  hasMoreMessages: boolean;
  onLoadMoreMessages: () => void;
  onShowScrollToBottom: (show: boolean) => void;
}

function usePrevious<T>(value: T): T | null {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  streamingMessageId,
  animationsDisabled,
  isLoadingMessages,
  onShowScrollToBottom,
}) => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const SCROLL_THRESHOLD = 100;

  const prevMessages = usePrevious(messages);
  const isConversationSwitch =
    !prevMessages ||
    (messages.length > 0 &&
      prevMessages.length > 0 &&
      messages[0].id !== prevMessages[0].id);

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

  const scrollToBottom = useCallback(
    (behavior: "smooth" | "auto" = "smooth") => {
      messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
    },
    []
  );

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (isConversationSwitch) {
      requestAnimationFrame(() => {
        scrollToBottom("auto");
      });
      return;
    }

    if (prevMessages && messages.length > prevMessages.length && isAtBottom) {
      scrollToBottom("smooth");
    }
  }, [
    messages,
    prevMessages,
    isAtBottom,
    isConversationSwitch,
    scrollToBottom,
  ]);

  useEffect(() => {
    const handler = () => scrollToBottom("smooth");
    window.addEventListener("scrollToBottom", handler);
    return () => window.removeEventListener("scrollToBottom", handler);
  }, [scrollToBottom]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const atBottom =
        scrollHeight - scrollTop - clientHeight <= SCROLL_THRESHOLD;
      setIsAtBottom(atBottom);
      onShowScrollToBottom(!atBottom);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => container.removeEventListener("scroll", handleScroll);
  }, [onShowScrollToBottom]);

  if (messages.length === 0) {
    if (isLoadingMessages || isTransitioning) {
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
