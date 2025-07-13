import React from 'react';
import WelcomeScreen from './WelcomeScreen';
import ChatInput from './ChatInput';
import { LinkIcon, MoreHorizontal, SlidersHorizontal, Sun, Moon, Desktop, Menu } from './Icons';
import { Theme } from '../App';
import { Tab as SettingsTab } from './SettingsPage';
import { User as FirebaseUser } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';


interface ChatViewProps {
  onMenuClick: () => void;
  toggleSidebar: () => void;
  onOpenSettings: (tab?: SettingsTab) => void;
  theme: Theme;
  toggleTheme: () => void;
  user: FirebaseUser | null;
  animationsDisabled: boolean;
}

const ChatView: React.FC<ChatViewProps> = ({ onMenuClick, toggleSidebar, onOpenSettings, theme, toggleTheme, user, animationsDisabled }) => {
  const animationProps = {
    initial: { opacity: 0, rotate: -90, scale: 0.5 },
    animate: { opacity: 1, rotate: 0, scale: 1 },
    exit: { opacity: 0, rotate: 90, scale: 0.5 },
    transition: { duration: animationsDisabled ? 0 : 0.3 }
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#1c1c1c]">
      <header className="flex items-center justify-between p-4 text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center">
            <button className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full md:hidden" onClick={onMenuClick} aria-label="Open menu">
                <Menu className="w-6 h-6" />
            </button>
            <button className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full hidden md:block" onClick={toggleSidebar} aria-label="Toggle sidebar">
                <Menu className="w-6 h-6" />
            </button>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full"><LinkIcon className="w-5 h-5" /></button>
          <button className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full"><MoreHorizontal className="w-5 h-5" /></button>
          <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-700"></div>
          <button onClick={() => onOpenSettings()} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full" aria-label="Settings">
            <SlidersHorizontal className="w-5 h-5" />
          </button>
          <button 
            className="w-8 h-8 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full" 
            onClick={toggleTheme} 
            aria-label={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'} mode`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {theme === 'light' && (
                <motion.div key="moon" {...animationProps}>
                  <Moon className="w-5 h-5" />
                </motion.div>
              )}
              {theme === 'dark' && (
                <motion.div key="sun" {...animationProps}>
                  <Sun className="w-5 h-5" />
                </motion.div>
              )}
              {theme === 'system' && (
                <motion.div key="desktop" {...animationProps}>
                  <Desktop className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-3xl mx-auto">
          <WelcomeScreen user={user} />
        </div>
      </main>

      <footer className="p-4 md:p-6 w-full max-w-4xl mx-auto">
        <ChatInput />
      </footer>
    </div>
  );
};

export default ChatView;