// Improved ChatView with better scroll handling
import React, { useCallback, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import WelcomeScreen from "./WelcomeScreen";
import ChatInput from "./ChatInput";
import MessageList from "./MessageList";
import { SlidersHorizontal, Sun, Moon, Desktop, Menu } from "./Icons";
import { Theme } from "../hooks/useSettings";
import { Tab as SettingsTab } from "./SettingsPage";
import { motion, AnimatePresence } from "framer-motion";
import { DEFAULT_MODEL_ID } from "../constants/models";
import { useChat } from "../hooks/useChat";
import SmallButton from "./ui/SmallButton";
import LoadingState from "./ui/LoadingState";

interface ChatViewProps {
  onMenuClick: () => void;
  toggleSidebar: () => void;
  isSidebarCollapsed: boolean;
  onOpenSettings: (tab?: SettingsTab) => void;
  theme: Theme;
  toggleTheme: () => void;
  animationsDisabled: boolean;
  chat: ReturnType<typeof useChat>;
}

const ChatView: React.FC<ChatViewProps> = ({
  onMenuClick,
  toggleSidebar,
  isSidebarCollapsed,
  onOpenSettings,
  theme,
  toggleTheme,
  animationsDisabled,
  chat,
}) => {
  const location = useLocation();
  const {
    currentConversation,
    streamingState,
    sendMessage,
    generateImage,
    isLoading,
    isLoadingMessages,
    isLoadingMoreMessages,
    hasMoreMessages,
  } = chat;

  const [windowWidth, setWindowWidth] = React.useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );

  // Throttled resize handler for better performance
  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowWidth(window.innerWidth);
      }, 100); // Throttle to 100ms
    };

    window.addEventListener("resize", handleResize, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Memoize mobile calculation to prevent unnecessary re-renders
  const isMobile = useMemo(() => windowWidth < 768, [windowWidth]);

  // State to track selected model info from ChatInput
  const [selectedModelInfo, setSelectedModelInfo] = React.useState({
    model: DEFAULT_MODEL_ID, // This will be updated when models are loaded
    source: "system",
    providerId: "",
  });

  // State to control scroll-to-bottom button visibility
  const [showScrollToBottom] = React.useState(false);

  // Handler to scroll to bottom - memoized to prevent recreation
  const handleScrollToBottom = useCallback(() => {
    const event = new CustomEvent("scrollToBottom");
    window.dispatchEvent(event);
  }, []);

  // Optimized scroll trigger with requestAnimationFrame for better performance
  const triggerScrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      handleScrollToBottom();
    });
  }, [handleScrollToBottom]);

  const handleSendMessage = useCallback(
    (
      message: string,
      model: string,
      source: string = "system",
      providerId?: string,
      attachments?: any[]
    ) => {
      sendMessage(message, model, source, providerId, attachments);

      // Use optimized scroll trigger
      triggerScrollToBottom();
    },
    [sendMessage, triggerScrollToBottom]
  );

  const handleImageGenerate = useCallback(
    (
      prompt: string,
      imageUrl: string,
      model: string,
      source: string = "system",
      providerId?: string,
      params?: any
    ) => {
      generateImage(prompt, imageUrl, model, source, providerId, params);

      // Use optimized scroll trigger
      triggerScrollToBottom();
    },
    [generateImage, triggerScrollToBottom]
  );

  const handlePromptSelect = useCallback(
    (prompt: string) => {
      sendMessage(
        prompt,
        selectedModelInfo.model,
        selectedModelInfo.source,
        selectedModelInfo.providerId
      );
    },
    [sendMessage, selectedModelInfo]
  );

  const handleModelSelection = useCallback(
    (model: string, source: string, providerId?: string) => {
      setSelectedModelInfo({ model, source, providerId: providerId || "" });
    },
    []
  );

  // Calculate sidebar width based on collapsed state - memoized
  const sidebarWidth = useMemo(
    () => (isSidebarCollapsed ? 80 : 256), // w-20 = 80px, w-64 = 256px
    [isSidebarCollapsed]
  );

  // Determine if we should show welcome based on URL and conversation state
  const shouldShowWelcome = useMemo(() => {
    const isRootPath = location.pathname === "/";
    const isConversationPath = location.pathname.startsWith("/c/");

    // Only show welcome screen when we're on root path
    // Don't show it on conversation paths, even if conversation is temporarily null/loading
    return isRootPath && !isConversationPath;
  }, [location.pathname]);

  // Memoized theme icon props to prevent recreation on every render
  const themeIconProps = useMemo(
    () => ({
      initial: { opacity: 0, rotate: -90, scale: 0.5 },
      animate: { opacity: 1, rotate: 0, scale: 1 },
      exit: { opacity: 0, rotate: 90, scale: 0.5 },
      transition: { duration: animationsDisabled ? 0 : 0.3 },
    }),
    [animationsDisabled]
  );

  const getThemeIcon = useCallback(() => {
    switch (theme) {
      case "light":
        return (
          <motion.div key="moon" {...themeIconProps}>
            <Moon className="w-5 h-5" />
          </motion.div>
        );
      case "dark":
        return (
          <motion.div key="sun" {...themeIconProps}>
            <Sun className="w-5 h-5" />
          </motion.div>
        );
      case "system":
        return (
          <motion.div key="desktop" {...themeIconProps}>
            <Desktop className="w-5 h-5" />
          </motion.div>
        );
      default:
        return (
          <motion.div key="sun" {...themeIconProps}>
            <Sun className="w-5 h-5" />
          </motion.div>
        );
    }
  }, [theme, themeIconProps]);

  // Memoize styles to prevent object recreation on every render
  const sidebarButtonStyle = useMemo(
    () => ({
      top: "10px",
    }),
    []
  );

  const buttonSizeStyle = useMemo(
    () => ({
      width: "40px",
      height: "40px",
    }),
    []
  );

  const topRightButtonsStyle = useMemo(
    () => ({
      top: "10px",
      right: "18px",
    }),
    []
  );

  const sidebarTransition = useMemo(
    () => ({
      duration: animationsDisabled ? 0 : 0.3,
      ease: "easeOut" as const,
    }),
    [animationsDisabled]
  );

  // Memoize padding styles for scroll button and chat input
  const scrollButtonPadding = useMemo(
    () => ({
      paddingLeft: isMobile ? "16px" : `${sidebarWidth + 16}px`,
      paddingRight: "16px",
      paddingBottom: isMobile ? "140px" : "160px",
    }),
    [isMobile, sidebarWidth]
  );
  const chatInputPadding = useMemo(
    () => ({
      paddingLeft: isMobile ? "0" : `${sidebarWidth + 16}px`,
      paddingRight: isMobile ? "0" : "16px",
    }),
    [isMobile, sidebarWidth]
  );

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#1c1c1c] relative">
      {/* Top-left positioned collapse button for desktop */}
      <motion.div
        className="fixed z-50 hidden md:block"
        style={sidebarButtonStyle}
        animate={{
          left: `${sidebarWidth + 10}px`,
        }}
        transition={sidebarTransition}
      >
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 bg-white/80 dark:bg-[#1c1c1c]/80 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 rounded-lg transition-all duration-200"
          style={buttonSizeStyle}
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
        </button>
      </motion.div>

      {/* Top-left positioned menu button for mobile */}
      <div
        className="fixed z-50 md:hidden"
        style={{
          ...sidebarButtonStyle,
          left: "10px",
        }}
      >
        <button
          onClick={onMenuClick}
          className="flex items-center justify-center hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 bg-white/80 dark:bg-[#1c1c1c]/80 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 rounded-lg transition-all duration-200"
          style={buttonSizeStyle}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
        </button>
      </div>

      {/* Top-right positioned buttons */}
      <div
        className="fixed z-10 flex items-center"
        style={topRightButtonsStyle}
      >
        <button
          onClick={() => onOpenSettings()}
          className="flex items-center justify-center hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 bg-white/80 dark:bg-[#1c1c1c]/80 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 rounded-bl-lg rounded-tl-lg transition-all duration-200"
          style={buttonSizeStyle}
          aria-label="Settings"
        >
          <SlidersHorizontal className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
        </button>
        <button
          className="flex items-center justify-center hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 bg-white/80 dark:bg-[#1c1c1c]/80 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 rounded-tr-lg rounded-br-lg transition-all duration-200"
          onClick={toggleTheme}
          aria-label={`Switch to ${
            theme === "light" ? "dark" : theme === "dark" ? "system" : "light"
          } mode`}
          style={buttonSizeStyle}
        >
          <AnimatePresence mode="wait" initial={false}>
            {getThemeIcon()}
          </AnimatePresence>
        </button>
      </div>

      <main className="flex-1 flex flex-col overflow-hidden">
        {isLoading || isLoadingMessages ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingState
              message={"Loading conversation..."}
              size="md"
              centerContent={true}
            />
          </div>
        ) : shouldShowWelcome ? (
          <div className="w-full flex-1 flex items-center justify-center">
            <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 xl:px-16">
              <WelcomeScreen onPromptSelect={handlePromptSelect} />
            </div>
          </div>
        ) : (
          <div className="flex-1 relative overflow-hidden">
            <MessageList
              messages={currentConversation?.messages || []}
              streamingMessageId={streamingState.currentMessageId}
              // onStopStreaming={stopStreaming}
              animationsDisabled={animationsDisabled}
              isLoadingMoreMessages={isLoadingMoreMessages}
              hasMoreMessages={hasMoreMessages}
              onLoadMoreMessages={() => {}}
            />
          </div>
        )}
      </main>

      {showScrollToBottom && !shouldShowWelcome && (
        <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
          <div
            className="max-w-4xl mx-auto pointer-events-auto px-4 md:px-6 lg:px-8 xl:px-16 flex justify-center"
            style={scrollButtonPadding}
          >
            <SmallButton
              onClick={handleScrollToBottom}
              aria-label="Scroll to bottom"
              animationsDisabled={animationsDisabled}
              className="shadow-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/90 transition-all duration-200"
            >
              Scroll to bottom
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </SmallButton>
          </div>
        </div>
      )}

      {/* Chat Input Container - separate from scroll button */}
      <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
        <div
          className="max-w-4xl mx-auto pointer-events-auto px-4 md:px-6 lg:px-8 xl:px-16 pb-0 md:pb-4"
          style={chatInputPadding}
        >
          <ChatInput
            onMessageSend={handleSendMessage}
            onImageGenerate={handleImageGenerate}
            onModelSelect={handleModelSelection}
            disabled={streamingState.isStreaming || isLoading}
            animationsDisabled={animationsDisabled}
            currentConversation={currentConversation}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatView;
