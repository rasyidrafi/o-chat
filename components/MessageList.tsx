import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { List, ListImperativeAPI } from "react-window";
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

// Default estimated height for messages - will be measured dynamically
const DEFAULT_MESSAGE_HEIGHT = 120;
const BOTTOM_PADDING_HEIGHT = 128; // Height of the bottom padding (h-32)

function usePrevious<T>(value: T): T | null {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

// Message item renderer for virtual scrolling
interface MessageItemProps {
  index: number;
  style: React.CSSProperties;
  messages: ChatMessage[];
  streamingMessageId: string | null;
  setSize: (index: number, size: number) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ index, style, messages, streamingMessageId, setSize }) => {
  const message = messages[index];
  const ref = useRef<HTMLDivElement>(null);

  // Measure the actual height of the message after render
  useEffect(() => {
    if (ref.current) {
      const height = ref.current.getBoundingClientRect().height;
      setSize(index, height);
    }
  }, [index, setSize, message.content, message.attachments]);

  if (!message) return null;

  return (
    <div style={style}>
      <div ref={ref} className="px-4 md:px-6 lg:px-8 xl:px-16 max-w-4xl mx-auto overflow-x-hidden">
        <AnimatePresence mode="popLayout">
          <Message
            key={message.id}
            message={message}
            isStreaming={streamingMessageId === message.id}
            isLastMessage={index === messages.length - 1}
          />
        </AnimatePresence>
      </div>
    </div>
  );
};

const MessageList = React.forwardRef<MessageListRef, MessageListProps>(
  (
    {
      messages,
      streamingMessageId,
      onScrollStateChange,
      isLoadingMoreMessages,
      // hasMoreMessages,
      // onLoadMoreMessages,
    },
    ref
  ) => {
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<ListImperativeAPI>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const { isMobile } = useSettingsContext();

    // Track message heights for virtual scrolling
    const itemSizes = useRef<Map<number, number>>(new Map());

    // Get item height for virtual list
    const getItemHeight = useCallback((index: number) => {
      return itemSizes.current.get(index) || DEFAULT_MESSAGE_HEIGHT;
    }, []);

    // Set item size when measured
    const setItemSize = useCallback((index: number, size: number) => {
      const currentSize = itemSizes.current.get(index);
      if (currentSize !== size) {
        itemSizes.current.set(index, size);
        // Force a re-render to update the virtual list
        setContainerHeight(prev => prev); // Trigger re-render
      }
    }, []);

    // Memoize the message item renderer with props
    const MessageItemRenderer = useCallback((props: { index: number; style: React.CSSProperties }) => {
      return (
        <MessageItem
          {...props}
          messages={messages}
          streamingMessageId={streamingMessageId}
          setSize={setItemSize}
        />
      );
    }, [messages, streamingMessageId, setItemSize]);

    // Calculate total height including bottom padding
    const totalHeight = useMemo(() => {
      let height = 0;
      for (let i = 0; i < messages.length; i++) {
        height += getItemHeight(i);
      }
      return height + BOTTOM_PADDING_HEIGHT;
    }, [messages.length, getItemHeight]);

    // Clear item sizes when messages change significantly
    useEffect(() => {
      const currentMessageIds = new Set(messages.map(m => m.id));
      const sizesToKeep = new Map();
      
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        if (message && itemSizes.current.has(i) && currentMessageIds.has(message.id)) {
          sizesToKeep.set(i, itemSizes.current.get(i));
        }
      }
      
      itemSizes.current = sizesToKeep;
    }, [messages]);

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

    // Handle scroll events from virtual list
    const handleScroll = useCallback(({ scrollOffset, scrollUpdateWasRequested }: {
      scrollOffset: number;
      scrollUpdateWasRequested: boolean;
    }) => {
      if (!scrollUpdateWasRequested && !rafId.current && onScrollStateChange) {
        rafId.current = requestAnimationFrame(() => {
          const container = listRef.current?.element;
          if (!container) {
            rafId.current = null;
            return;
          }

          const now = performance.now();
          
          // Throttle updates, especially on mobile
          if (now - lastUpdateTime.current < SCROLL_UPDATE_THROTTLE) {
            rafId.current = null;
            return;
          }

          const { scrollTop, scrollHeight, clientHeight } = container;

          // Only update if values changed significantly
          const scrollDiff = Math.abs(scrollTop - scrollState.current.scrollTop);
          if (
            scrollDiff < 10 && // Only update if scroll changed by more than 10px
            scrollHeight === scrollState.current.scrollHeight &&
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
        });
      }
    }, [isMobile, onScrollStateChange, SCROLL_UPDATE_THROTTLE]);

    // --- Initial scroll position check ---
    useEffect(() => {
      if (onScrollStateChange && messages.length > 0) {
        // Initial check after mount - wait for the virtual list to be ready
        const timer = setTimeout(() => {
          handleScroll({ scrollOffset: 0, scrollUpdateWasRequested: false });
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [handleScroll, messages.length, onScrollStateChange]);

    // Track container dimensions
    const [containerHeight, setContainerHeight] = useState(600);

    // Observe container size changes
    useEffect(() => {
      const container = messagesContainerRef.current;
      if (!container) return;

      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const height = entry.contentRect.height - 32; // Subtract top padding
          setContainerHeight(height);
        }
      });

      resizeObserver.observe(container);
      
      // Set initial height
      const height = container.clientHeight - 32;
      setContainerHeight(height);

      return () => {
        resizeObserver.disconnect();
      };
    }, []);

    // --- Auto-Scroll Optimization ---
    const scrollToBottom = useCallback(
      (smooth = true) => {
        if (listRef.current && messages.length > 0) {
          // Always scroll to the last item at the end position
          listRef.current.scrollToRow({ 
            index: messages.length - 1, 
            align: "end",
            behavior: smooth && !isMobile ? "smooth" : "auto"
          });
        }
      },
      [messages.length, isMobile]
    );

    React.useImperativeHandle(ref, () => ({ scrollToBottom }), [
      scrollToBottom,
    ]);

    // --- Auto-Scroll on New Messages ---
    useEffect(() => {
      if (prevMessages && messages.length > prevMessages.length) {
        // Only auto-scroll if we're near the bottom (to avoid jarring users)
        const container = listRef.current?.element;
        if (container) {
          const { scrollTop, scrollHeight, clientHeight } = container;
          const isNearBottom = scrollHeight - scrollTop - clientHeight < 300;

          if (isNearBottom || isMobile) {
            // Mobile always auto-scrolls
            requestAnimationFrame(() => scrollToBottom(false));
          }
        }
      }
    }, [messages.length, prevMessages, scrollToBottom, isMobile]);

    // --- Transition Handling ---
    useEffect(() => {
      if (prevMessages && prevMessages.length > 0 && messages.length === 0) {
        setIsTransitioning(true);
      } else if (isTransitioning && messages.length > 0) {
        setIsTransitioning(false);
        requestAnimationFrame(() => scrollToBottom(false));
      }
    }, [messages.length, prevMessages, isTransitioning, scrollToBottom]);

    // Cleanup RAF on unmount
    useEffect(() => {
      return () => {
        if (rafId.current) {
          cancelAnimationFrame(rafId.current);
        }
      };
    }, []);

    if (messages.length === 0) return null;

    return (
      <div
        ref={messagesContainerRef}
        className="absolute inset-0 overflow-hidden pt-8"
        // Disable overscroll bounce on mobile (optional, reduces jank)
        style={{ overscrollBehaviorY: "contain" }}
      >
        <List
          listRef={listRef}
          rowCount={messages.length}
          rowHeight={getItemHeight}
          rowComponent={MessageItemRenderer}
          rowProps={{}}
          onScroll={handleScroll}
          overscanCount={5}
          className="custom-scrollbar"
          style={{ height: containerHeight }}
        />
        
        {/* Bottom padding + sentinel for scroll tracking - positioned absolutely */}
        <div 
          ref={sentinelRef} 
          className="absolute bottom-0 left-0 right-0 h-32 md:h-36 pointer-events-none"
        />

        {/* Load more messages indicator (if needed) */}
        {isLoadingMoreMessages && (
          <div className="absolute bottom-0 left-0 right-0 text-center p-4 px-4 md:px-6 lg:px-8 xl:px-16 max-w-4xl mx-auto bg-white dark:bg-zinc-900">
            Loading more...
          </div>
        )}
      </div>
    );
  }
);

export default MessageList;
