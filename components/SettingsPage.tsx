import React, { useState, useEffect } from 'react';
import { ArrowLeft, LogOut, Info } from './Icons';
import TabButton from './settings/TabButton';
import ApiKeysTab from './settings/Tab/ApiKeysTab';
import AccountTab from './settings/Tab/AccountTab';
import CustomizationTab from './settings/Tab/CustomizationTab';
import ModelsTab from './settings/Tab/ModelsTab';
import AttachmentsTab from './settings/Tab/AttachmentsTab';
import ContactUsTab from './settings/Tab/ContactUsTab';
import { User } from 'firebase/auth';
import Button from './ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSettings } from '../hooks/useSettings';
import { ChatStorageService } from '../services/chatStorageService';

// Avatar component with fallback handling (same as in Sidebar)
const UserAvatar: React.FC<{ 
  user: User; 
  className?: string; 
  size?: number;
}> = ({ user, className = '', size = 96 }) => {

  // Generate initials from display name or email
  const getInitials = () => {
    if (user.displayName) {
      return user.displayName
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Generate a consistent background color based on user info
  const getBackgroundColor = () => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const userString = user.displayName || user.email || user.uid;
    const hash = userString.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  // Always show initials to avoid Google's rate limiting issues
  return (
    <div 
      className={`${className} ${getBackgroundColor()} flex items-center justify-center text-white font-semibold rounded-full ring-4 ring-white dark:ring-zinc-700`}
      style={{ width: size, height: size, fontSize: size * 0.3 }}
      title={`${user.displayName || user.email}`}
    >
      {getInitials()}
    </div>
  );
};


export type Tab = 'Account' | 'Customization' | 'Models' | 'API Keys' | 'Attachments' | 'Contact Us';

interface SettingsPageProps {
    onClose: () => void;
    user: User | null;
    initialTab?: Tab;
    onOpenAuthModal: () => void;
    onSignOutClick: () => void;
    settings: AppSettings;
    updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onClose, user, initialTab, onOpenAuthModal, onSignOutClick, settings, updateSettings }) => {
    const [activeTab, setActiveTab] = useState<Tab>(initialTab || 'Customization');
    const [backedByServerCount, setBackedByServerCount] = useState(0);
    const [byokCount, setByokCount] = useState(0);
    const [totalConversations, setTotalConversations] = useState(0);
    const [isLoadingUsage, setIsLoadingUsage] = useState(true);

    const tabs: Tab[] = ['Account', 'Customization', 'Models', 'API Keys', 'Attachments', 'Contact Us'];

    // Load message usage data when component mounts
    useEffect(() => {
        loadUsageData();
    }, [user]);

    const loadUsageData = async () => {
        setIsLoadingUsage(true);
        try {
            if (user) {
                // Get message counts using collection group queries
                const chatStats = await ChatStorageService.getUserChatStats(user.uid);
                setBackedByServerCount(chatStats.serverMessages);
                setByokCount(chatStats.byokMessages);
                setTotalConversations(chatStats.totalConversations);
                
            } else {
                // Get message count from localStorage
                const conversations = getConversationsFromLocal();
                let serverMessageCount = 0;
                let byokMessageCount = 0;

                // Count user messages by source from localStorage
                conversations.forEach((conv: any) => {
                    const messages = getMessagesFromLocal(conv.id);
                    const userMessages = messages.filter((msg: any) => msg.role === 'user');
                    userMessages.forEach((msg: any) => {
                        if (msg.source === 'server') {
                            serverMessageCount++;
                        } else if (msg.source === 'byok') {
                            byokMessageCount++;
                        }
                    });
                });
                
                setBackedByServerCount(serverMessageCount);
                setByokCount(byokMessageCount);
                setTotalConversations(conversations.length);
            }
        } catch (error) {
            console.error('Error loading usage data:', error);
        } finally {
            setIsLoadingUsage(false);
        }
    };

    // Helper functions for localStorage (same as in ChatStorageService)
    const getConversationsFromLocal = () => {
        try {
            const stored = localStorage.getItem('chat_conversations');
            if (!stored) return [];
            
            const conversations = JSON.parse(stored);
            return conversations.map((conv: any) => ({
                ...conv,
                createdAt: new Date(conv.createdAt),
                updatedAt: new Date(conv.updatedAt),
            }));
        } catch (error) {
            console.error('Error loading conversations from localStorage:', error);
            return [];
        }
    };

    const getMessagesFromLocal = (conversationId: string) => {
        try {
            const stored = localStorage.getItem(`chat_messages_${conversationId}`);
            if (!stored) return [];
            
            const messages = JSON.parse(stored);
            return messages.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp),
                source: msg.source || 'server' // Default to server for existing messages
            }));
        } catch (error) {
            console.error('Error loading messages from localStorage:', error);
            return [];
        }
    };

    const renderContent = () => {
        let content;
        switch(activeTab) {
            case 'Account':
                content = (
                    <AccountTab 
                        user={user}
                        onOpenAuthModal={onOpenAuthModal}
                        onSignOutClick={onSignOutClick}
                    />
                );
                break;
            case 'Customization':
                content = (
                    <CustomizationTab 
                        settings={settings}
                        updateSettings={updateSettings}
                    />
                );
                break;
            case 'Models':
                content = (
                    <ModelsTab 
                        settings={settings}
                    />
                );
                break;
            case 'API Keys':
                content = <ApiKeysTab />;
                break;
            case 'Attachments':
                content = <AttachmentsTab />;
                break;
            case 'Contact Us':
                content = <ContactUsTab />;
                break;
            default:
                content = (
                    <div>
                        <h2 className="text-2xl font-bold mb-1 text-zinc-900 dark:text-white">{activeTab}</h2>
                        <p className="mt-4">Settings for {activeTab} are not implemented yet.</p>
                    </div>
                );
                break;
        }
        return (
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: settings.animationsDisabled ? 0 : 0.2 }}
            >
                {content}
            </motion.div>
        );
    }

    return (
        <div className="fixed inset-0 z-70 bg-white dark:bg-[#1c1c1c] text-zinc-900 dark:text-zinc-200 font-sans overflow-y-auto custom-scrollbar">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="flex items-center justify-between mb-8">
                    <Button variant="ghost" size="sm" onClick={onClose} className="gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Chat
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <aside className="lg:col-span-3">
                        <div className="space-y-6">
                           {user ? (
                               <div className="flex flex-col items-center p-6 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl text-center">
                                   <UserAvatar user={user} size={96} className="mb-4" />
                                   <h2 className="font-bold text-xl text-zinc-900 dark:text-white truncate max-w-full">{user.displayName || user.email}</h2>
                                   {user.displayName && (
                                       <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate max-w-full">{user.email}</p>
                                   )}
                                   <span className="mt-3 text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 py-1 px-3 rounded-full">Signed In</span>
                                   <Button variant="ghost" size="sm" onClick={onSignOutClick} className="gap-2 mt-3">
                                       Sign out
                                       <LogOut className="w-4 h-4" />
                                   </Button>
                               </div>
                           ) : (
                               <div className="flex flex-col items-center text-center p-6 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl">
                                    <h2 className="font-bold text-xl text-zinc-900 dark:text-white">Not Signed In</h2>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">Sign in to sync your data and unlock features.</p>
                                    <Button onClick={() => setActiveTab('Account')} className="mt-4">
                                      Go to Account Tab
                                    </Button>
                                </div>
                           )}

                           <div className="p-6 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl">
                               <div>
                                   <div className="flex items-center mb-2">
                                        <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">Usage</h3>
                                   </div>
                                    {isLoadingUsage ? (
                                        <div className="h-50 flex items-center justify-center py-8">
                                            <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    ) : (
                                        <motion.div 
                                            className="space-y-4"
                                            initial={settings.animationsDisabled ? {} : { opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: settings.animationsDisabled ? 0 : 0.3 }}
                                        >
                                            <div>
                                                <div className="flex justify-between text-xs font-medium mb-1">
                                                     <span className="text-zinc-600 dark:text-zinc-300">Conversations</span>
                                                     <span className="text-zinc-500 dark:text-zinc-400">{totalConversations}</span>
                                                </div>
                                                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5">
                                                     <motion.div 
                                                         className="bg-gradient-to-r from-blue-400 to-blue-500 h-1.5 rounded-full" 
                                                         initial={settings.animationsDisabled ? {} : { width: 0 }}
                                                         animate={{ width: `${Math.min(Math.max((totalConversations / 30) * 70 + 30, 20), 100)}%` }}
                                                         transition={{ duration: settings.animationsDisabled ? 0 : 0.8, ease: "easeOut" }}
                                                     />
                                                </div>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{totalConversations} total conversations</p>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-xs font-medium mb-1">
                                                     <span className="text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                                                         Backed by Us
                                                         <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 px-1.5 py-0.5 rounded-full font-medium">
                                                             Unlimited
                                                         </span>
                                                     </span>
                                                     <span className="text-zinc-500 dark:text-zinc-400">{backedByServerCount}</span>
                                                </div>
                                                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5">
                                                     <motion.div 
                                                         className="bg-gradient-to-r from-green-400 to-green-500 h-1.5 rounded-full" 
                                                         initial={settings.animationsDisabled ? {} : { width: 0 }}
                                                         animate={{ width: `${Math.min(Math.max((backedByServerCount / 50) * 70 + 30, 20), 100)}%` }}
                                                         transition={{ duration: settings.animationsDisabled ? 0 : 0.8, ease: "easeOut", delay: settings.animationsDisabled ? 0 : 0.1 }}
                                                     />
                                                </div>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{backedByServerCount} messages sent</p>
                                            </div>
                                             <div>
                                                <div className="flex justify-between text-xs font-medium mb-1">
                                                     <span className="text-zinc-600 dark:text-zinc-300 flex items-center gap-1">
                                                         Your Own API
                                                         <Info className="w-3.5 h-3.5 text-pink-500" />
                                                     </span>
                                                     <span className="text-zinc-500 dark:text-zinc-400">{byokCount}</span>
                                                </div>
                                                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5">
                                                     <motion.div 
                                                         className="bg-gradient-to-r from-pink-400 to-pink-500 h-1.5 rounded-full" 
                                                         initial={settings.animationsDisabled ? {} : { width: 0 }}
                                                         animate={{ width: `${Math.min(Math.max((byokCount / 80) * 70 + 30, 20), 100)}%` }}
                                                         transition={{ duration: settings.animationsDisabled ? 0 : 0.8, ease: "easeOut", delay: settings.animationsDisabled ? 0 : 0.2 }}
                                                     />
                                                </div>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{byokCount} messages sent</p>
                                            </div>
                                            <div className="bg-zinc-200/50 dark:bg-zinc-900/50 rounded-lg p-3 flex items-start gap-2.5">
                                                 <Info className="w-4 h-4 text-zinc-500 dark:text-zinc-400 mt-0.5 flex-shrink-0" />
                                                 <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                                     Server-backed messages are unlimited and free. Messages using your own API key are billed directly to you - please monitor your API usage and costs.
                                                 </p>
                                             </div>
                                        </motion.div>
                                    )}
                               </div>
                           </div>
                        </div>
                    </aside>
                    <main className="lg:col-span-9">
                       <div className="flex border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto mb-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                            {tabs.map(tab => (
                                <TabButton key={tab} label={tab} isActive={activeTab === tab} onClick={() => setActiveTab(tab)} animationsDisabled={settings.animationsDisabled} />
                            ))}
                       </div>
                       <AnimatePresence mode="wait">
                         {renderContent()}
                       </AnimatePresence>
                       <div className="hidden lg:block h-24" />
                    </main>
                </div>
            </div>
        </div>
    );
}

export default SettingsPage;