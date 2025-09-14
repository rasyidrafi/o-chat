import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
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
  onRetry?: (
    messageId: string,
    model: string,
    source: string,
    providerId?: string
  ) => void;
  onVersionChange?: (messageId: string, versionIndex: number) => void;
  currentVersions?: Record<string, number>;
  modelOptions?: Array<{
    label: string;
    value: string;
    source: string;
    providerId?: string;
    providerName?: string;
    supported_parameters?: string[];
  }>;
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
      onRetry,
      onVersionChange,
      currentVersions = {},
      modelOptions = [],
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

    // Build conversation tree and show messages leading to current selection
    const visibleMessages = useMemo(() => {
      // Build message map for quick lookup
      const messageMap = new Map<string, ChatMessage>();
      messages.forEach((message) => {
        messageMap.set(message.id, message);
      });

      // If no current versions specified, show all messages in chronological order
      if (Object.keys(currentVersions).length === 0) {
        return messages.sort(
          (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
        );
      }

      // Find the currently selected message for each branch
      const selectedMessages = new Set<string>();

      Object.entries(currentVersions).forEach(([groupId, versionIndex]) => {
        // Find all messages in this group
        // Use the same grouping logic as initializeCurrentVersions: originalMessageId || parentMessageId || id
        const groupMessages = messages.filter(
          (msg) => (msg.originalMessageId || msg.id) === groupId
        );

        // Sort by timestamp
        groupMessages.sort(
          (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
        );

        // Get the selected message
        const selectedMessage =
          groupMessages[Math.min(versionIndex, groupMessages.length - 1)];
        if (selectedMessage) {
          selectedMessages.add(selectedMessage.id);
        }
      });

      // Build conversation paths for each selected message
      const conversationPaths = new Set<string>();

      selectedMessages.forEach((selectedMessageId) => {
        let currentMessage = messageMap.get(selectedMessageId);
        while (currentMessage) {
          conversationPaths.add(currentMessage.id);
          // Traverse up the tree using parentMessageId
          if (currentMessage.parentMessageId) {
            currentMessage = messageMap.get(currentMessage.parentMessageId);
          } else {
            break;
          }
        }
        // Also traverse down to find messages that have this message as parent
        const traverseDown = (parentId: string) => {
          messages.forEach((msg) => {
            if (msg.parentMessageId === parentId) {
              conversationPaths.add(msg.id);
              traverseDown(msg.id);
            }
          });
        };
        traverseDown(selectedMessageId);
      });

      // Return messages in chronological order that are part of the conversation paths
      // Enrich messages with version information for UI
      const baseMessages = messages
        .filter((message) => conversationPaths.has(message.id))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      // Add version information to messages that have multiple versions
      return baseMessages.map((message) => {
        const groupId = message.originalMessageId || message.id;
        if (!groupId) return message;

        const groupMessages = messages.filter(
          (msg) => (msg.originalMessageId || msg.id) === groupId
        );

        if (groupMessages.length > 1) {
          // Sort group messages by timestamp
          groupMessages.sort(
            (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
          );

          // Find current version index
          const messageIndex = groupMessages.findIndex(
            (msg) => msg.id === message.id
          );

          return {
            ...message,
            totalVersions: groupMessages.length,
            currentVersionIndex: messageIndex,
          };
        }

        return message;
      });
    }, [messages, currentVersions]); // Optimized scroll tracking
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
            {visibleMessages.map((message, index) => (
              <Message
                key={message.id}
                message={message}
                isStreaming={streamingMessageId === message.id}
                isLastMessage={index === visibleMessages.length - 1}
                onRetry={onRetry}
                onVersionChange={onVersionChange}
                modelOptions={modelOptions}
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
