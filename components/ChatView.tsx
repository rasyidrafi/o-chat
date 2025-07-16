// Simplified ChatView with cleaner logic and better separation of concerns
import React, { useCallback, useRef } from "react";
import WelcomeScreen from "./WelcomeScreen";
import ChatInput from "./ChatInput";
import MessageList from "./MessageList";
import { SlidersHorizontal, Sun, Moon, Desktop, Menu } from "./Icons";
import { Theme } from "../App";
import { Tab as SettingsTab } from "./SettingsPage";
import { User as FirebaseUser } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "../hooks/useChat";
import SmallButton from "./ui/SmallButton";

interface ChatViewProps {
  onMenuClick: () => void;
  toggleSidebar: () => void;
  isSidebarCollapsed: boolean;
  onOpenSettings: (tab?: SettingsTab) => void;
  theme: Theme;
  toggleTheme: () => void;
  user: FirebaseUser | null;
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
  user,
  animationsDisabled,
  chat,
}) => {
  const {
    currentConversation,
    streamingState,
    sendMessage,
    stopStreaming,
    isLoading,
    isLoadingMessages,
    isLoadingMoreMessages,
    hasMoreMessages,
    loadMoreMessages,
  } = chat;

  const [windowWidth, setWindowWidth] = React.useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );

  React.useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  // State to track selected model info from ChatInput
  const [selectedModelInfo, setSelectedModelInfo] = React.useState({
    model: "gemini-1.5-flash",
    source: "system",
    providerId: "",
  });

  const handleSendMessage = useCallback(
    (
      message: string,
      model: string,
      source: string = "system",
      providerId?: string
    ) => {
      sendMessage(message, model, source, providerId);
    },
    [sendMessage]
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

  // Calculate sidebar width based on collapsed state
  const sidebarWidth = isSidebarCollapsed ? 80 : 256; // w-20 = 80px, w-64 = 256px

  const shouldShowWelcome = !currentConversation;

  const getThemeIcon = () => {
    const iconProps = {
      initial: { opacity: 0, rotate: -90, scale: 0.5 },
      animate: { opacity: 1, rotate: 0, scale: 1 },
      exit: { opacity: 0, rotate: 90, scale: 0.5 },
      transition: { duration: animationsDisabled ? 0 : 0.3 },
    };

    switch (theme) {
      case "light":
        return (
          <motion.div key="moon" {...iconProps}>
            <Moon className="w-5 h-5" />
          </motion.div>
        );
      case "dark":
        return (
          <motion.div key="sun" {...iconProps}>
            <Sun className="w-5 h-5" />
          </motion.div>
        );
      case "system":
        return (
          <motion.div key="desktop" {...iconProps}>
            <Desktop className="w-5 h-5" />
          </motion.div>
        );
      default:
        return (
          <motion.div key="sun" {...iconProps}>
            <Sun className="w-5 h-5" />
          </motion.div>
        );
    }
  };

  // State to control scroll-to-bottom button visibility
  const [showScrollToBottom, setShowScrollToBottom] = React.useState(false);

  // Handler to scroll to bottom
  const handleScrollToBottom = () => {
    // Use a custom event to trigger scroll in MessageList
    const event = new CustomEvent("scrollToBottom");
    window.dispatchEvent(event);
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#1c1c1c] relative">
      {/* Top-left positioned collapse button for desktop */}
      <motion.div
        className="fixed z-50 hidden md:block"
        style={{
          top: "10px",
        }}
        animate={{
          left: `${sidebarWidth + 10}px`,
        }}
        transition={{
          duration: animationsDisabled ? 0 : 0.3,
          ease: "easeOut",
        }}
      >
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 bg-white/80 dark:bg-[#1c1c1c]/80 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 rounded-lg transition-all duration-200"
          style={{
            width: "40px",
            height: "40px",
          }}
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
        </button>
      </motion.div>

      {/* Top-left positioned menu button for mobile */}
      <div
        className="fixed z-50 md:hidden"
        style={{
          top: "10px",
          left: "10px",
        }}
      >
        <button
          onClick={onMenuClick}
          className="flex items-center justify-center hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 bg-white/80 dark:bg-[#1c1c1c]/80 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 rounded-lg transition-all duration-200"
          style={{
            width: "40px",
            height: "40px",
          }}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
        </button>
      </div>

      {/* Top-right positioned buttons */}
      <div
        className="fixed z-10 flex items-center"
        style={{
          top: "10px",
          right: "18px",
        }}
      >
        <button
          onClick={() => onOpenSettings()}
          className="flex items-center justify-center hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 bg-white/80 dark:bg-[#1c1c1c]/80 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 rounded-bl-lg rounded-tl-lg transition-all duration-200"
          style={{
            width: "40px",
            height: "40px",
          }}
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
          style={{
            width: "40px",
            height: "40px",
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {getThemeIcon()}
          </AnimatePresence>
        </button>
      </div>

      <main className="flex-1 flex flex-col overflow-hidden">
        {isLoading ? (
          <div className="w-full flex-1 flex items-center justify-center">
            <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 xl:px-16">
              <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                Loading conversations...
              </p>
            </div>
          </div>
        ) : shouldShowWelcome ? (
          <div className="w-full flex-1 flex items-center justify-center">
            <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 xl:px-16">
              <WelcomeScreen user={user} onPromptSelect={handlePromptSelect} />
            </div>
          </div>
        ) : (
          <div className="flex-1 relative overflow-hidden">
            <MessageList
              messages={currentConversation?.messages || []}
              streamingMessageId={streamingState.currentMessageId}
              onStopStreaming={stopStreaming}
              animationsDisabled={animationsDisabled}
              isLoadingMessages={isLoadingMessages}
              isLoadingMoreMessages={isLoadingMoreMessages}
              hasMoreMessages={hasMoreMessages}
              onLoadMoreMessages={() => {}}
              onShowScrollToBottom={setShowScrollToBottom}
            />
          </div>
        )}
      </main>

      {showScrollToBottom && !shouldShowWelcome && (
        <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
          <div
            className="max-w-4xl mx-auto pointer-events-auto px-4 md:px-6 lg:px-8 xl:px-16 flex justify-center"
            style={{
              paddingLeft: isMobile ? "16px" : `${sidebarWidth + 16}px`,
              paddingRight: "16px",
              paddingBottom: isMobile ? "140px" : "160px",
            }}
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
          style={{
            paddingLeft: isMobile ? "0" : `${sidebarWidth + 16}px`,
            paddingRight: isMobile ? "0" : "16px",
          }}
        >
          <ChatInput
            onMessageSend={handleSendMessage}
            onModelSelect={handleModelSelection}
            disabled={streamingState.isStreaming || isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatView;
