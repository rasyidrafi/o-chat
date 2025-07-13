// Simplified ChatView with cleaner logic and better separation of concerns
import React from 'react';
import WelcomeScreen from './WelcomeScreen';
import ChatInput from './ChatInput';
import MessageList from './MessageList';
import { LinkIcon, MoreHorizontal, SlidersHorizontal, Sun, Moon, Desktop, Menu } from './Icons';
import { Theme } from '../App';
import { Tab as SettingsTab } from './SettingsPage';
import { User as FirebaseUser } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../hooks/useChat';

interface ChatViewProps {
  onMenuClick: () => void;
  toggleSidebar: () => void;
  onOpenSettings: (tab?: SettingsTab) => void;
  theme: Theme;
  toggleTheme: () => void;
  user: FirebaseUser | null;
  animationsDisabled: boolean;
}

const ChatView: React.FC<ChatViewProps> = ({ 
  onMenuClick, 
  toggleSidebar, 
  onOpenSettings, 
  theme, 
  toggleTheme, 
  user, 
  animationsDisabled 
}) => {
  const { currentConversation, streamingState, sendMessage, stopStreaming } = useChat(user);

  const handleSendMessage = (message: string, model: string, source: string = 'system') => {
    sendMessage(message, model, source);
  };

  const handlePromptSelect = (prompt: string) => {
    sendMessage(prompt, 'gemini-1.5-flash', 'system');
  };

  const hasContent = currentConversation && currentConversation.messages.length > 0;
  const shouldShowWelcome = !hasContent && !streamingState.isStreaming;

  const getThemeIcon = () => {
    const iconProps = {
      initial: { opacity: 0, rotate: -90, scale: 0.5 },
      animate: { opacity: 1, rotate: 0, scale: 1 },
      exit: { opacity: 0, rotate: 90, scale: 0.5 },
      transition: { duration: animationsDisabled ? 0 : 0.3 }
    };

    switch (theme) {
      case 'light':
        return <motion.div key="moon" {...iconProps}><Moon className="w-5 h-5" /></motion.div>;
      case 'dark':
        return <motion.div key="sun" {...iconProps}><Sun className="w-5 h-5" /></motion.div>;
      case 'system':
        return <motion.div key="desktop" {...iconProps}><Desktop className="w-5 h-5" /></motion.div>;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#1c1c1c]">
      <header className="flex items-center justify-between p-4 text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center">
          <button 
            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full md:hidden" 
            onClick={onMenuClick} 
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <button 
            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full hidden md:block" 
            onClick={toggleSidebar} 
            aria-label="Toggle sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full">
            <LinkIcon className="w-5 h-5" />
          </button>
          <button className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full">
            <MoreHorizontal className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-700"></div>
          <button 
            onClick={() => onOpenSettings()} 
            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full" 
            aria-label="Settings"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
          <button 
            className="w-8 h-8 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full" 
            onClick={toggleTheme} 
            aria-label={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'} mode`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {getThemeIcon()}
            </AnimatePresence>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden">
        {shouldShowWelcome ? (
          <div className="flex-1 flex items-center justify-center p-4 md:p-6">
            <div className="w-full max-w-4xl mx-auto px-0 md:px-2 lg:px-8 xl:px-16">
              <WelcomeScreen user={user} onPromptSelect={handlePromptSelect} />
            </div>
          </div>
        ) : (
          <MessageList
            messages={currentConversation?.messages || []}
            streamingMessageId={streamingState.currentMessageId}
            onStopStreaming={stopStreaming}
            animationsDisabled={animationsDisabled}
          />
        )}
      </main>

      <footer className="p-4 md:p-6 pb-0 md:pb-0">
        <div className="max-w-4xl mx-auto px-0 md:px-2 lg:px-8 xl:px-16">
          <ChatInput 
            onMessageSend={handleSendMessage}
            disabled={streamingState.isStreaming}
          />
        </div>
      </footer>
    </div>
  );
};

export default ChatView;