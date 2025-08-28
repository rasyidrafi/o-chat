// Improved MessageList with fixed scroll behavior and performance optimizations
import React, { useEffect, useRef, useCallback } from "react";
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

const MessageList: React.FC<MessageListProps> = ({
  messages,
  streamingMessageId,
  animationsDisabled,
  isLoadingMessages,
  onShowScrollToBottom,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const SCROLL_THRESHOLD = 50;
  const isInitialLoadRef = useRef(true);
  const processedMessagesRef = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastConversationIdRef = useRef<string | null>(null);

  // Helper function to check if user is at bottom - memoized with throttling
  const isAtBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return false;

    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollHeight - scrollTop - clientHeight <= SCROLL_THRESHOLD;
  }, [SCROLL_THRESHOLD]);

  // Smart scroll to bottom with time limit for initial load
  const scrollToBottomSmart = useCallback(
    (smooth = true, isInitial = false) => {
      if (!messagesEndRef.current) return;

      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }

      if (isInitial) {
        // For initial load, check if we should use smooth or instant scroll
        const container = messagesContainerRef.current;
        if (container) {
          const { scrollHeight, clientHeight } = container;
          const totalHeight = scrollHeight - clientHeight;
          
          // If content is very long (more than 3 screen heights), use instant scroll
          // Otherwise, use smooth with max 0.5s duration
          if (totalHeight > clientHeight * 3) {
            messagesEndRef.current.scrollIntoView({
              behavior: "auto",
              block: "end",
            });
          } else {
            messagesEndRef.current.scrollIntoView({
              behavior: "smooth",
              block: "end",
            });
            
            // Force scroll completion after 0.5s max
            scrollTimeoutRef.current = setTimeout(() => {
              if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({
                  behavior: "auto",
                  block: "end",
                });
              }
              scrollTimeoutRef.current = null;
            }, 500);
          }
        }
      } else {
        // For non-initial scrolls, use the requested behavior
        messagesEndRef.current.scrollIntoView({
          behavior: smooth ? "smooth" : "auto",
          block: "end",
        });
      }
    },
    []
  );

  // Handle external scroll to bottom requests
  useEffect(() => {
    const handler = () => {
      scrollToBottomSmart(true);
    };

    window.addEventListener("scrollToBottom", handler);
    return () => window.removeEventListener("scrollToBottom", handler);
  }, [scrollToBottomSmart]);

  // Track when all messages are processed for initial scroll
  const handleMessageLoaded = useCallback(() => {
    processedMessagesRef.current += 1;
    
    // Check if all messages are processed or if enough time has passed
    const allMessagesProcessed = processedMessagesRef.current >= messages.length;
    const shouldTriggerScroll = allMessagesProcessed && isInitialLoadRef.current;
    
    if (shouldTriggerScroll) {
      isInitialLoadRef.current = false;
      
      // Small delay to ensure DOM is updated and animations complete
      requestAnimationFrame(() => {
        setTimeout(() => {
          scrollToBottomSmart(true, true); // Initial scroll with smart logic
        }, 200); // Increased delay to account for code block animations
      });
    }
  }, [messages.length, scrollToBottomSmart]);

  // Also trigger scroll when all messages are likely loaded (fallback)
  useEffect(() => {
    if (messages.length > 0 && isInitialLoadRef.current) {
      // Set a timer that triggers scroll after a reasonable delay
      const fallbackScrollTimer = setTimeout(() => {
        if (isInitialLoadRef.current) {
          handleMessageLoaded(); // Use the same logic
        }
      }, 1000); // 1 second fallback
      
      return () => clearTimeout(fallbackScrollTimer);
    }
  }, [messages.length, handleMessageLoaded]);

  // Reset tracking when messages change significantly or conversation changes
  useEffect(() => {
    // Detect conversation change by checking first message ID
    const currentConversationId = messages.length > 0 ? messages[0].id : null;
    
    if (messages.length === 0) {
      // No messages - reset everything
      isInitialLoadRef.current = true;
      processedMessagesRef.current = 0;
      lastConversationIdRef.current = null;
    } else if (lastConversationIdRef.current !== currentConversationId) {
      // Conversation changed - reset for new conversation
      isInitialLoadRef.current = true;
      processedMessagesRef.current = 0;
      lastConversationIdRef.current = currentConversationId;
      
      // Immediate check if all messages are already loaded quickly
      requestAnimationFrame(() => {
        if (isInitialLoadRef.current) {
          // Quick scroll trigger for fast-loading conversations
          const quickScrollTimer = setTimeout(() => {
            if (isInitialLoadRef.current) {
              isInitialLoadRef.current = false;
              scrollToBottomSmart(true, true);
            }
          }, 100); // Very quick trigger for immediate loads
          
          setTimeout(() => clearTimeout(quickScrollTimer), 400);
        }
      });
    }
  }, [messages, scrollToBottomSmart]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Handle initial mount with existing messages (conversation reopening)
  useEffect(() => {
    // If component mounts and there are messages but we haven't scrolled yet
    if (messages.length > 0 && isInitialLoadRef.current) {
      // Set a timeout to trigger scroll if message-based scroll doesn't happen
      const mountScrollTimer = setTimeout(() => {
        if (isInitialLoadRef.current) {
          isInitialLoadRef.current = false;
          scrollToBottomSmart(true, true);
        }
      }, 500); // 500ms timeout as fallback
      
      return () => clearTimeout(mountScrollTimer);
    }
  }, []); // Run only on mount

  // Additional effect to handle conversation loading completion
  useEffect(() => {
    // If we have messages, are in initial load state, and not currently loading
    if (messages.length > 0 && isInitialLoadRef.current && !isLoadingMessages) {
      // Start a timer to scroll after a reasonable delay
      const loadCompleteTimer = setTimeout(() => {
        if (isInitialLoadRef.current) {
          isInitialLoadRef.current = false;
          scrollToBottomSmart(true, true);
        }
      }, 400); // 400ms delay for processing
      
      return () => clearTimeout(loadCompleteTimer);
    }
  }, [messages.length, isLoadingMessages, scrollToBottomSmart]);
  const detectScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const isCurrentlyAtBottom = isAtBottom();
    onShowScrollToBottom(!isCurrentlyAtBottom);
  }, [isAtBottom, onShowScrollToBottom]);

  // Throttle scroll events for better performance
  const throttledDetectScroll = useCallback(() => {
    let ticking = false;
    
    return () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          detectScroll();
          ticking = false;
        });
        ticking = true;
      }
    };
  }, [detectScroll])();

  // Set up scroll listener with throttling
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", throttledDetectScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", throttledDetectScroll);
    };
  }, [throttledDetectScroll]);

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
              onLoaded={() => {
                handleMessageLoaded();
                
                // Auto-scroll on new messages only if user is at bottom
                if (i === messages.length - 1 && !isInitialLoadRef.current) {
                  // Small delay to allow for DOM updates
                  requestAnimationFrame(() => {
                    if (isAtBottom()) {
                      scrollToBottomSmart(false); // Use instant scroll for better UX
                    }
                  });
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
