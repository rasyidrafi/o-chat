// Improved ChatView with better scroll handling
import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import { useLocation } from "react-router-dom";
import WelcomeScreen from "./WelcomeScreen";
import ChatInput from "./ChatInput";
import MessageList from "./MessageList";
import {
  SlidersHorizontal,
  Sun,
  Moon,
  Desktop,
  Menu,
  ArrowDown,
  Search,
  Edit,
} from "./Icons";
import { Theme } from "../hooks/useSettings";
import { Tab as SettingsTab } from "./SettingsPage";
import { motion, AnimatePresence } from "framer-motion";
import { DEFAULT_MODEL_ID } from "../constants/models";
import { useChat } from "../hooks/useChat";
import { useSettingsContext } from "../contexts/SettingsContext";
import LoadingState from "./ui/LoadingState";
import { themes } from "@/constants/themes";

interface ChatViewProps {
  onMenuClick: () => void;
  toggleSidebar: () => void;
  isSidebarCollapsed: boolean;
  onOpenSettings: (tab?: SettingsTab) => void;
  onOpenSearchCenter: () => void;
  theme: Theme;
  toggleTheme: () => void;
  chat: ReturnType<typeof useChat>;
}

declare global {
  interface Window {
    __closeSettingsPage?: () => void;
    __settingsPageOpen?: boolean;
  }
}

const ChatView: React.FC<ChatViewProps> = ({
  onMenuClick,
  toggleSidebar,
  isSidebarCollapsed,
  onOpenSettings,
  onOpenSearchCenter,
  theme,
  toggleTheme,
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

  // Get isMobile and animationsDisabled from SettingsContext
  const { isMobile, settings } = useSettingsContext();
  const animationsDisabled = settings.animationsDisabled;

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle sidebar: Ctrl/Cmd + B
      if ((event.metaKey || event.ctrlKey) && event.key === "b") {
        event.preventDefault();
        toggleSidebar();
      }
      // Toggle Settings: Ctrl/Cmd + Shift + S
      if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        (event.key === "S" || event.key === "s")
      ) {
        event.preventDefault();
        // ignore type script error

        if (typeof window !== "undefined" && window.__settingsPageOpen) {
          if (window.__closeSettingsPage) {
            window.__closeSettingsPage();
          }
        } else {
          onOpenSettings();
        }
      }
      // Close Settings: Esc
      if (event.key === "Escape") {
        // Try to close settings if open
        if (typeof window !== "undefined" && window.__settingsPageOpen) {
          event.preventDefault();
          if (window.__closeSettingsPage) {
            window.__closeSettingsPage();
          }
        }
      }
      // Focus Chat Input: Ctrl/Cmd + Shift + L
      if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        (event.key === "L" || event.key === "l")
      ) {
        event.preventDefault();
        if (chatInputRef.current) {
          chatInputRef.current.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [toggleSidebar, onOpenSettings]);

  // MessageList ref and scroll state
  const messageListRef = useRef<{ scrollToBottom: (smooth?: boolean) => void }>(
    null
  );
  const chatInputRef = useRef<{ focus: () => void }>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // State to track selected model info from ChatInput
  const [selectedModelInfo, setSelectedModelInfo] = React.useState({
    model: DEFAULT_MODEL_ID, // This will be updated when models are loaded
    source: "system",
    providerId: "",
  });

  const handleSendMessage = useCallback(
    (
      message: string,
      model: string,
      source: string = "system",
      providerId?: string,
      attachments?: any[]
    ) => {
      sendMessage(message, model, source, providerId, attachments);

      // Force scroll to bottom after sending a message with a slight delay
      // to ensure the message is added to the DOM
      setTimeout(() => {
        if (messageListRef.current) {
          messageListRef.current.scrollToBottom(false);
        }
      }, 100);
    },
    [sendMessage]
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

      // Force scroll to bottom after generating image
      setTimeout(() => {
        if (messageListRef.current) {
          messageListRef.current.scrollToBottom(false);
        }
      }, 100);
    },
    [generateImage]
  );

  const handlePromptSelect = useCallback(
    (prompt: string) => {
      sendMessage(
        prompt,
        selectedModelInfo.model,
        selectedModelInfo.source,
        selectedModelInfo.providerId
      );

      // Force scroll to bottom after prompt selection
      setTimeout(() => {
        if (messageListRef.current) {
          messageListRef.current.scrollToBottom(false);
        }
      }, 100);
    },
    [sendMessage, selectedModelInfo]
  );

  const handleModelSelection = useCallback(
    (model: string, source: string, providerId?: string) => {
      setSelectedModelInfo({ model, source, providerId: providerId || "" });
    },
    []
  );

  // Handle scroll state changes from MessageList - optimized with useCallback
  const handleScrollStateChange = useCallback((shouldShowButton: boolean) => {
    setShowScrollButton(shouldShowButton);
  }, []);

  // Handle scroll to bottom button click - optimized
  const handleScrollToBottom = React.useCallback(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollToBottom(false);
      setShowScrollButton(false); // Hide button immediately for better UX
    }
  }, []);

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
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: animationsDisabled ? 0 : 0.2 },
    }),
    [animationsDisabled]
  );

  const getThemeIcon = useCallback(() => {
    switch (theme) {
      case "light":
        return (
          <motion.div key="moon" {...themeIconProps}>
            <Moon className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          </motion.div>
        );
      case "dark":
        return (
          <motion.div key="sun" {...themeIconProps}>
            <Sun className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          </motion.div>
        );
      case "system":
        return (
          <motion.div key="desktop" {...themeIconProps}>
            <Desktop className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          </motion.div>
        );
      default:
        return (
          <motion.div key="sun" {...themeIconProps}>
            <Sun className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
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

  const chatInputPadding = useMemo(
    () => ({
      paddingLeft: isMobile
        ? "0"
        : `${sidebarWidth + 16 + (isSidebarCollapsed ? 90 : 0)}px`,
      paddingRight: isMobile ? "0" : `${16 + (isSidebarCollapsed ? 90 : 0)}px`,
    }),
    [isMobile, sidebarWidth, isSidebarCollapsed]
  );

  return (
    <div
      className={`flex-1 flex flex-col relative ${themes.chatview.backdrop}`}
    >
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
          className={`flex items-center justify-center border rounded-lg transition-all duration-200 cursor-pointer ${themes.sidebar.bg} ${themes.sidebar.bgHover} ${themes.sidebar.fg} ${themes.chatview.border} shadow-sm`}
          style={buttonSizeStyle}
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
      </motion.div>

      <div
        className="fixed z-10 md:hidden"
        style={{
          ...sidebarButtonStyle,
          left: "10px",
        }}
      >
        <button
          onClick={onMenuClick}
          className={`flex items-center justify-center border rounded-lg transition-all duration-200 cursor-pointer ${themes.sidebar.bg} ${themes.sidebar.bgHover} ${themes.sidebar.fg} ${themes.chatview.border} shadow-sm`}
          style={buttonSizeStyle}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Top-right positioned buttons */}
      <div
        className="fixed z-10 flex items-center rounded-lg border-none shadow-sm"
        style={topRightButtonsStyle}
      >
        <button
          onClick={() => onOpenSettings()}
          className={`flex items-center justify-center border rounded-bl-lg rounded-tl-lg transition-all duration-200 cursor-pointer ${themes.sidebar.bg} ${themes.sidebar.bgHover} ${themes.sidebar.fg} ${themes.chatview.border}`}
          style={buttonSizeStyle}
          aria-label="Settings"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
        <button
          className={`flex items-center justify-center border rounded-tr-lg rounded-br-lg transition-all duration-200 cursor-pointer ${themes.sidebar.bg} ${themes.sidebar.bgHover} ${themes.sidebar.fg} ${themes.chatview.border}`}
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
            <LoadingState message={""} size="md" centerContent={true} />
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
              ref={messageListRef}
              messages={currentConversation?.messages || []}
              streamingMessageId={streamingState.currentMessageId}
              // onStopStreaming={stopStreaming}
              isLoadingMoreMessages={isLoadingMoreMessages}
              hasMoreMessages={hasMoreMessages}
              onLoadMoreMessages={() => {}}
              onScrollStateChange={handleScrollStateChange}
            />
          </div>
        )}
      </main>

      {/* Chat Input Container - separate from scroll button */}
      <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
        <AnimatePresence>
          {showScrollButton && !isLoading && !isLoadingMessages && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: animationsDisabled ? 0 : 0.2 }}
              className="absolute -top-12 left-0 right-0 flex justify-center pointer-events-auto"
              style={chatInputPadding}
            >
              <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 xl:px-16 w-full flex justify-center">
                <button
                  onClick={handleScrollToBottom}
                  className={`w-9 h-9 rounded-full transition-all duration-200 flex items-center justify-center group cursor-pointer shadow-sm border-1 ${themes.chatview.inputBg} ${themes.sidebar.bgHover} ${themes.sidebar.fg} ${themes.chatview.border}`}
                  aria-label="Scroll to bottom"
                >
                  <ArrowDown className={`w-5 h-5`} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile bottom buttons - vertical layout - mobile only */}
        <div
          className="absolute -top-24 right-0 flex justify-end pointer-events-auto md:hidden"
          style={chatInputPadding}
        >
          <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 xl:px-16 w-full flex justify-end">
            <div className="flex flex-col gap-2">
              <button
                onClick={onOpenSearchCenter}
                className={`w-9 h-9 rounded-lg transition-all duration-200 flex items-center justify-center group cursor-pointer shadow-sm border-1 ${themes.chatview.inputBg} ${themes.sidebar.bgHover} ${themes.sidebar.fg} ${themes.chatview.border}`}
                aria-label="Search conversations"
              >
                <Search className={`w-5 h-5`} />
              </button>
              <button
                onClick={() => chat.selectConversation(null)}
                className={`w-9 h-9 rounded-lg transition-all duration-200 flex items-center justify-center group cursor-pointer shadow-sm border-none ${themes.special.bgGradient} ${themes.special.fg}`}
                aria-label="New chat"
              >
                <Edit className={`w-4 h-5`} />
              </button>
            </div>
          </div>
        </div>

        <div
          className="max-w-4xl mx-auto pointer-events-auto px-4 md:px-6 lg:px-8 xl:px-16 pb-0 md:pb-4"
          style={chatInputPadding}
        >
          <ChatInput
            ref={chatInputRef}
            onMessageSend={handleSendMessage}
            onImageGenerate={handleImageGenerate}
            onModelSelect={handleModelSelection}
            disabled={streamingState.isStreaming || isLoading}
            isStreaming={streamingState.isStreaming}
            animationsDisabled={animationsDisabled}
            currentConversation={currentConversation}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatView;
