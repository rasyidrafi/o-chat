// Simplified MessageList with cleaner rendering logic
import React, { useEffect, useRef, useState } from "react";
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
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  // Show/hide "Scroll to bottom" button based on scroll position
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // More generous threshold - show button when user has scrolled up more than 100px from bottom
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      const shouldShowButton = !isNearBottom && messages.length > 0;

      console.log("Scroll position:", {
        scrollTop,
        scrollHeight,
        clientHeight,
        distanceFromBottom: scrollHeight - scrollTop - clientHeight,
        isNearBottom,
        shouldShowButton,
      });

      // Track if user has scrolled up from bottom
      setUserScrolledUp(!isNearBottom);

      if (onShowScrollToBottom) {
        onShowScrollToBottom(shouldShowButton);
      }
    };

    container.addEventListener("scroll", handleScroll);

    // Initial check after a brief delay to ensure content is rendered
    const timer = setTimeout(() => {
      handleScroll();
    }, 100);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, [messages.length, onShowScrollToBottom]);

  // Listen for scrollToBottom event from parent
  useEffect(() => {
    const handler = () => {
      setShouldScrollToBottom(true);
      setUserScrolledUp(false);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      // Hide the scroll button when scrolling to bottom
      if (onShowScrollToBottom) {
        onShowScrollToBottom(false);
      }
    };
    window.addEventListener("scrollToBottom", handler);
    return () => window.removeEventListener("scrollToBottom", handler);
  }, [onShowScrollToBottom]);

  // Auto-scroll to bottom for new messages only if user hasn't scrolled up
  useEffect(() => {
    if (shouldScrollToBottom && !userScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingMessageId, shouldScrollToBottom, userScrolledUp]);

  // Reset scroll behavior when messages change (new conversation)
  useEffect(() => {
    setShouldScrollToBottom(true);
    setUserScrolledUp(false);
    // Reset scroll button state for new conversation
    if (onShowScrollToBottom) {
      onShowScrollToBottom(false);
    }
  }, [messages.length === 0, onShowScrollToBottom]);

  // Auto-scroll to bottom when new messages arrive, but only if user was already at bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || messages.length === 0) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const wasAtBottom = scrollHeight - scrollTop - clientHeight < 100;

    if (wasAtBottom) {
      setShouldScrollToBottom(true);
      setUserScrolledUp(false);
    } else {
      setShouldScrollToBottom(false);
      setUserScrolledUp(true);
    }
  }, [messages.length]);

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
        {/* {hasMoreMessages && !isLoadingMessages && !isNewConversation && (
          <div className="flex justify-center mb-6">
            <Button
              onClick={handleLoadPreviousMessages}
              variant="secondary"
              size="sm"
              disabled={isLoadingMoreMessages}
              className="gap-2"
            >
              {isLoadingMoreMessages ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  Loading...
                </>
              ) : (
                'Load Previous Messages'
              )}
            </Button>
          </div>
        )}
        
        {isLoadingMoreMessages && !hasMoreMessages && !isNewConversation && (
          <div className="flex flex-col items-center justify-center py-4 text-zinc-500 dark:text-zinc-400">
            <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <div className="text-xs">Loading more messages...</div>
          </div>
        )} */}

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
