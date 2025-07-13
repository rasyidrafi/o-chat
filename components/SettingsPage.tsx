import React, { useState } from 'react';
import React, { useState, useEffect } from 'react';
import { ArrowLeft, LogOut, Info } from './Icons';
import TabButton from './settings/TabButton';
import ApiKeysTab from './settings/Tab/ApiKeysTab';
import AccountTab from './settings/Tab/AccountTab';
import CustomizationTab from './settings/Tab/CustomizationTab';
import ModelsTab from './settings/Tab/ModelsTab';
import HistorySyncTab from './settings/Tab/HistorySyncTab';
import AttachmentsTab from './settings/Tab/AttachmentsTab';
import ContactUsTab from './settings/Tab/ContactUsTab';
import { User } from 'firebase/auth';
import Button from './ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSettings } from '../App';
import { collection, doc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';


export type Tab = 'Account' | 'Customization' | 'History & Sync' | 'Models' | 'API Keys' | 'Attachments' | 'Contact Us';

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
    const [systemMessageCount, setSystemMessageCount] = useState(0);
    const [totalConversations, setTotalConversations] = useState(0);

    const tabs: Tab[] = ['Account', 'Customization', 'History & Sync', 'Models', 'API Keys', 'Attachments', 'Contact Us'];

    // Load message usage data when component mounts
    useEffect(() => {
        loadUsageData();
    }, [user]);

    const loadUsageData = async () => {
        try {
            if (user) {
                // Get conversation count from Firestore
                const chatRef = doc(db, 'chats', user.uid);
                const conversationsRef = collection(chatRef, 'conversations');
                const snapshot = await getDocs(conversationsRef);
                setTotalConversations(snapshot.size);

                // Count system messages from all conversations
                let systemCount = 0;
                for (const conversationDoc of snapshot.docs) {
                    const messagesRef = collection(conversationDoc.ref, 'messages');
                    const messagesSnapshot = await getDocs(messagesRef);
                    messagesSnapshot.docs.forEach(messageDoc => {
                        const messageData = messageDoc.data();
                        // Count user messages that were sent to system models
                        if (messageData.role === 'user') {
                            systemCount++;
                        }
                    });
                }
                setSystemMessageCount(systemCount);
            } else {
                // Get conversation count from localStorage
                const conversations = getConversationsFromLocal();
                setTotalConversations(conversations.length);

                // Count system messages from localStorage
                let systemCount = 0;
                conversations.forEach(conv => {
                    const messages = getMessagesFromLocal(conv.id);
                    messages.forEach(msg => {
                        if (msg.role === 'user') {
                            systemCount++;
                        }
                    });
                });
                setSystemMessageCount(systemCount);
            }
        } catch (error) {
            console.error('Error loading usage data:', error);
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
                timestamp: new Date(msg.timestamp)
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
            case 'History & Sync':
                content = <HistorySyncTab />;
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
        <div className="fixed inset-0 z-50 bg-white dark:bg-[#1c1c1c] text-zinc-900 dark:text-zinc-200 font-sans overflow-y-auto custom-scrollbar">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="flex items-center justify-between mb-8">
                    <Button variant="ghost" size="sm" onClick={onClose} className="gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Chat
                    </Button>
                    {user && (
                        <Button variant="ghost" size="sm" onClick={onSignOutClick} className="gap-2">
                            Sign out
                            <LogOut className="w-4 h-4" />
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <aside className="lg:col-span-3">
                        <div className="space-y-6">
                           {user ? (
                               <div className="flex flex-col items-center p-6 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl text-center">
                                   <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email?.charAt(0).toUpperCase() || 'U'}&background=random`} alt={user.displayName || user.email || 'User'} className="w-24 h-24 rounded-full mb-4 ring-4 ring-white dark:ring-zinc-700"/>
                                   <h2 className="font-bold text-xl text-zinc-900 dark:text-white truncate max-w-full">{user.displayName || user.email}</h2>
                                   {user.displayName && (
                                       <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate max-w-full">{user.email}</p>
                                   )}
                                   <span className="mt-3 text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 py-1 px-3 rounded-full">Signed In</span>
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
                                       <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">Message Usage</h3>
                                   </div>
                                   <div className="space-y-4">
                                       <div>
                                           <div className="flex justify-between text-xs font-medium mb-1">
                                                <span className="text-zinc-600 dark:text-zinc-300">Backed by Us</span>
                                                <span className="text-zinc-500 dark:text-zinc-400">{systemMessageCount} / unlimited</span>
                                           </div>
                                           <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5">
                                                <div className="bg-zinc-400 dark:bg-zinc-500 h-1.5 rounded-full" style={{width: `${Math.min((systemMessageCount/1000)*100, 100)}%`}}></div>
                                           </div>
                                           <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{systemMessageCount} messages usage</p>
                                       </div>
                                        <div>
                                           <div className="flex justify-between text-xs font-medium mb-1">
                                                <span className="text-zinc-600 dark:text-zinc-300 flex items-center gap-1">
                                                    Your Own Api
                                                    <Info className="w-3.5 h-3.5 text-pink-500" />
                                                </span>
                                                <span className="text-zinc-500 dark:text-zinc-400">{totalConversations}</span>
                                           </div>
                                           <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5">
                                                <div className="bg-pink-500 h-1.5 rounded-full" style={{width: `${Math.min((totalConversations/1000)*100, 100)}%`}}></div>
                                           </div>
                                           <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{totalConversations} conversations</p>
                                       </div>
                                       <div className="bg-zinc-200/50 dark:bg-zinc-900/50 rounded-lg p-3 flex items-start gap-2.5">
                                            <Info className="w-4 h-4 text-zinc-500 dark:text-zinc-400 mt-0.5 flex-shrink-0" />
                                            <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                                Messages sent using your own API key are managed by you. Please be mindful of your billing as we are not responsible for any charges incurred.
                                            </p>
                                        </div>
                                   </div>
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