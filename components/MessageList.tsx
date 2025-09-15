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

    // COMPLETELY REDESIGNED message filtering logic
    const visibleMessages = useMemo(() => {
      // If no versions specified, return all messages
      if (Object.keys(currentVersions).length === 0) {
        return messages;
      }

      // STEP 1: Build a message map for quick lookups
      const messageMap = new Map<string, ChatMessage>();
      messages.forEach((msg) => messageMap.set(msg.id, msg));

      // STEP 2: Build version groups
      const versionGroups = new Map<string, ChatMessage[]>();
      messages.forEach((msg) => {
        const groupId = msg.originalMessageId || msg.id;
        if (!versionGroups.has(groupId)) {
          versionGroups.set(groupId, []);
        }
        versionGroups.get(groupId)!.push(msg);
      });

      // STEP 3: Sort version groups by timestamp and build selected version map
      const selectedVersionMap = new Map<string, string>();
      versionGroups.forEach((versions, groupId) => {
        // Sort versions by timestamp
        versions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        // Get the selected version index
        const versionIndex = currentVersions[groupId] ?? 0;
        // Get the selected version and store its ACTUAL ID for lookup
        const selectedVersion =
          versions[Math.min(versionIndex, versions.length - 1)];

        if (selectedVersion) {
          selectedVersionMap.set(groupId, selectedVersion.id);
        }
      });

      // STEP 4: Build valid message branches using a tree-based approach
      const validMessageIds = new Set<string>();

      // For each message, check if its entire ancestry consists of selected versions
      const isValidMessageBranch = (msg: ChatMessage): boolean => {
        // If already processed and found valid, return true
        if (validMessageIds.has(msg.id)) return true;

        // If the message is itself a version of something, check if it's the selected version
        if (msg.originalMessageId) {
          const selectedVersionId = selectedVersionMap.get(
            msg.originalMessageId
          );
          if (selectedVersionId !== msg.id) {
            return false; // This is not the selected version
          }
        }

        // If no parent, it's valid
        if (!msg.parentMessageId) {
          validMessageIds.add(msg.id);
          return true;
        }

        // Get the parent message
        const parentMsg = messageMap.get(msg.parentMessageId);
        if (!parentMsg) {
          // No parent found (shouldn't happen), consider valid
          validMessageIds.add(msg.id);
          return true;
        }

        // Check if the parent is the selected version in its group
        const parentGroupId = parentMsg.originalMessageId || parentMsg.id;
        if (versionGroups.has(parentGroupId)) {
          const selectedParentId = selectedVersionMap.get(parentGroupId);
          if (selectedParentId !== parentMsg.id) {
            // Parent is not the selected version, this branch is invalid
            return false;
          }
        }

        // Recursively check if parent is valid
        if (!isValidMessageBranch(parentMsg)) {
          return false;
        }

        // If we get here, the message is valid
        validMessageIds.add(msg.id);
        return true;
      };

      // Check each message if it's part of a valid branch
      const result: ChatMessage[] = [];

      for (const msg of messages) {
        // Skip version checking for messages that are not selected versions
        const groupId = msg.originalMessageId || msg.id;
        const selectedId = selectedVersionMap.get(groupId);

        // If this message is a version but not the selected one, skip it entirely
        if (msg.originalMessageId && selectedId !== msg.id) {
          continue;
        }

        // For the selected version and regular messages, check entire parent chain
        if (isValidMessageBranch(msg)) {
          result.push(msg);
        }
      }

      // Sort by timestamp to maintain chronological order
      result.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      // STEP 5: Add version information for UI
      return result.map((message) => {
        const groupId = message.originalMessageId || message.id;
        const versions = versionGroups.get(groupId) || [];

        if (versions.length > 1) {
          const versionIndex = versions.findIndex((v) => v.id === message.id);
          return {
            ...message,
            totalVersions: versions.length,
            currentVersionIndex: versionIndex >= 0 ? versionIndex : 0,
          };
        }

        return message;
      });
    }, [messages, currentVersions]);

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
          <div ref={sentinelRef} className={isMobile ? "h-24" : "h-40 md:h-45"}></div>
        </div>
      </div>
    );
  }
);

export default MessageList;
