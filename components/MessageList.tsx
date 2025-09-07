import React, { useEffect, useRef, useState, useCallback } from "react";
import { ChatMessage } from "../types/chat";
import Message from "./Message";
import { AnimatePresence } from "framer-motion";
import { useSettingsContext } from "../contexts/SettingsContext";

interface MessageListProps {
  messages: ChatMessage[];
  streamingMessageId: string | null;
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

const MessageList = React.forwardRef<MessageListRef, MessageListProps>(
  (
    {
      messages,
      streamingMessageId,
      onScrollStateChange,
      // isLoadingMoreMessages,
      // hasMoreMessages,
      // onLoadMoreMessages,
    },
    ref
  ) => {
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const { isMobile } = useSettingsContext();

    // Optimized scroll tracking
    const scrollState = useRef<{
      scrollTop: number;
      scrollHeight: number;
      clientHeight: number;
      shouldShowButton: boolean;
    }>({
      scrollTop: 0,
      scrollHeight: 0,
      clientHeight: 0,
      shouldShowButton: false,
    });
    const rafId = useRef<number | null>(null);
    const prevMessages = usePrevious(messages);

    // Add throttling for scroll state updates to reduce button flickering
    const lastUpdateTime = useRef<number>(0);
    const SCROLL_UPDATE_THROTTLE = isMobile ? 100 : 50; // Less frequent updates on mobile

    // --- Scroll Handler Optimization ---
    const checkScrollPosition = useCallback(() => {
      const container = messagesContainerRef.current;
      if (!container || !onScrollStateChange) return;

      const now = performance.now();

      // Reduce throttling during streaming for better responsiveness
      const isStreaming = streamingMessageId !== null;
      const throttleTime = isStreaming
        ? isMobile
          ? 50
          : 25 // More frequent checks during streaming
        : SCROLL_UPDATE_THROTTLE;

      // Throttle updates, but be more responsive during streaming
      if (now - lastUpdateTime.current < throttleTime) {
        rafId.current = null;
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = container;

      // During streaming, always check even with smaller changes
      const scrollDiff = Math.abs(scrollTop - scrollState.current.scrollTop);
      const heightChanged = scrollHeight !== scrollState.current.scrollHeight;

      if (
        !isStreaming &&
        scrollDiff < 10 && // Only update if scroll changed by more than 10px (non-streaming)
        !heightChanged &&
        clientHeight === scrollState.current.clientHeight
      ) {
        rafId.current = null;
        return;
      }

      // Calculate distance from bottom (use a larger threshold for mobile)
      const threshold = 100;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const shouldShowButton = distanceFromBottom > threshold;

      // Check if the button state changed BEFORE updating scrollState
      const previousShouldShowButton = scrollState.current.shouldShowButton;

      // Update scroll state
      scrollState.current = {
        scrollTop,
        scrollHeight,
        clientHeight,
        shouldShowButton,
      };

      // Only call onScrollStateChange if the button state actually changed
      if (shouldShowButton !== previousShouldShowButton) {
        lastUpdateTime.current = now;
        onScrollStateChange(shouldShowButton);
      }

      rafId.current = null;
    }, [
      isMobile,
      onScrollStateChange,
      SCROLL_UPDATE_THROTTLE,
      streamingMessageId,
    ]);

    const handleScroll = useCallback(() => {
      if (!rafId.current) {
        rafId.current = requestAnimationFrame(checkScrollPosition);
      }
    }, [checkScrollPosition]);

    // --- Mobile-Specific Scroll Handling ---
    useEffect(() => {
      const container = messagesContainerRef.current;
      if (!container || !onScrollStateChange || messages.length === 0) return;

      // Use passive listeners for both mobile and desktop
      const options: AddEventListenerOptions = { passive: true };

      container.addEventListener("scroll", handleScroll, options);

      // Initial check
      checkScrollPosition();

      return () => {
        container.removeEventListener("scroll", handleScroll);
        if (rafId.current) cancelAnimationFrame(rafId.current);
      };
    }, [
      handleScroll,
      checkScrollPosition,
      messages.length,
      onScrollStateChange,
    ]);

    // --- Auto-Scroll Optimization ---
    const scrollToBottom = useCallback(
      (smooth = true) => {
        if (!sentinelRef.current) return;

        try {
          // On mobile, use "auto" behavior for smoother scrolls
          const behavior = isMobile ? "auto" : smooth ? "smooth" : "auto";
          sentinelRef.current.scrollIntoView({ behavior, block: "end" });
        } catch (error) {
          // Fallback for edge cases where scrollIntoView fails
          const container = messagesContainerRef.current;
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        }
      },
      [isMobile]
    );

    React.useImperativeHandle(ref, () => ({ scrollToBottom }), [
      scrollToBottom,
    ]);

    // --- Content Growth Detection During Streaming ---
    useEffect(() => {
      // When content is streaming, we need to continuously check scroll position
      // because the content height changes but scroll events don't fire
      if (streamingMessageId && onScrollStateChange) {
        const interval = setInterval(() => {
          checkScrollPosition();
        }, 200); // Check every 200ms during streaming

        return () => clearInterval(interval);
      }
    }, [streamingMessageId, checkScrollPosition, onScrollStateChange]);

    // --- Transition Handling ---
    useEffect(() => {
      if (prevMessages && prevMessages.length > 0 && messages.length === 0) {
        setIsTransitioning(true);
      } else if (isTransitioning && messages.length > 0) {
        setIsTransitioning(false);
        requestAnimationFrame(() => scrollToBottom(false));
      }
    }, [messages.length, prevMessages, isTransitioning, scrollToBottom]);

    if (messages.length === 0) return null;

    return (
      <div
        ref={messagesContainerRef}
        className="absolute inset-0 overflow-y-auto custom-scrollbar pt-8 overflow-x-hidden"
        // Disable overscroll bounce on mobile (optional, reduces jank)
        style={{ overscrollBehaviorY: "contain" }}
      >
        <div className="px-4 md:px-6 lg:px-8 xl:px-16 max-w-4xl mx-auto overflow-x-hidden">
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <Message
                key={message.id}
                message={message}
                isStreaming={streamingMessageId === message.id}
              />
            ))}
          </AnimatePresence>
          {/* Bottom padding + sentinel for scroll tracking */}
          <div ref={sentinelRef} className="h-40 md:h-45"></div>

          {/* Load more messages indicator (if needed) */}
          {/* {isLoadingMoreMessages && (
            <div className="text-center p-4"> Loading more...</div>
          )} */}
        </div>
      </div>
    );
  }
);

export default MessageList;
