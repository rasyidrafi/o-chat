import React, { useState, useEffect } from 'react';
import { ArrowLeft, LogOut, Google, Info, LogIn } from './Icons';
import TabButton from './settings/TabButton';
import SettingsTextarea from './settings/SettingsTextarea';
import SettingsToggle from './settings/SettingsToggle';
import CustomDropdown from './ui/CustomDropdown';
import FontPreview from './settings/FontPreview';
import ApiKeysTab from './settings/ApiKeysTab';
import { auth, provider } from '../firebase';
import { signInWithPopup, User } from 'firebase/auth';
import Button from './ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSettings } from '../App';


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
    
    // Local state for text area to only save on button click
    const [customInstruction, setCustomInstruction] = useState(settings.customInstruction);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        setCustomInstruction(settings.customInstruction);
    }, [settings.customInstruction]);

    const handleSaveCustomInstruction = () => {
        updateSettings({ customInstruction });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const mainFontOptions = ['Montserrat', 'Lato', 'Open Sans', 'Roboto', 'Source Sans Pro'];
    const codeFontOptions = ['Berkeley Mono (default)', 'Intel One Mono', 'Atkinson Hyperlegible Mono', 'System Monospace Font'];

    const tabs: Tab[] = ['Account', 'Customization', 'History & Sync', 'Models', 'API Keys', 'Attachments', 'Contact Us'];
    
    const handleSignIn = async () => {
      try {
        await signInWithPopup(auth, provider);
      } catch (error) {
        console.error("Error signing in with Google:", error);
      }
    };

    const renderContent = () => {
        let content;
        switch(activeTab) {
            case 'Customization':
                content = (
                    <div>
                        {/* Customization Section */}
                        <div>
                            <h2 className="text-2xl font-bold mb-1 text-zinc-900 dark:text-white">Customize O-Chat</h2>
                            <div className="space-y-6 mt-6">
                                <SettingsTextarea label="Custom Instruction" value={customInstruction} onChange={setCustomInstruction} maxLength={3000} placeholder="You are a helpful assistant..." />
                            </div>
                             <div className="flex justify-start items-center gap-3 mt-8">
                                 <Button onClick={handleSaveCustomInstruction}>{isSaved ? 'Saved!' : 'Save Preferences'}</Button>
                             </div>
                        </div>

                        <div className="my-10 border-t border-zinc-200 dark:border-zinc-800"></div>
                        
                        {/* Visual Options Section */}
                        <div>
                            <h2 className="text-2xl font-bold mb-1 text-zinc-900 dark:text-white">Visual Options</h2>
                            <div className="space-y-6 mt-6">
                               <SettingsToggle 
                                    label="Hide Personal Information"
                                    description="Hides your name and email from the UI."
                                    isOn={settings.hidePersonalInfo}
                                    onToggle={() => updateSettings({hidePersonalInfo: !settings.hidePersonalInfo})}
                               />
                                <SettingsToggle 
                                    label="Disable External Link Warning"
                                    description="Skip the confirmation dialog when clicking external links. Note: We cannot guarantee the safety of external links, use this option at your own risk."
                                    isOn={settings.disableLinkWarning}
                                    onToggle={() => updateSettings({disableLinkWarning: !settings.disableLinkWarning})}
                               />
                               <SettingsToggle 
                                    label="Disable Animation"
                                    description="Disables all animations throughout the app for a simpler experience."
                                    isOn={settings.animationsDisabled}
                                    onToggle={() => updateSettings({animationsDisabled: !settings.animationsDisabled})}
                               />
                               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start pt-2">
                                    <div className="space-y-6">
                                        <CustomDropdown 
                                            label="Main Text Font"
                                            description="Used in general text throughout the app."
                                            options={mainFontOptions.map(f => f === 'Montserrat' ? `${f} (default)` : f)}
                                            selected={settings.mainFont === 'Montserrat' ? `${settings.mainFont} (default)` : settings.mainFont}
                                            onSelect={(option) => updateSettings({mainFont: option.replace(' (default)', '')})}
                                            animationsDisabled={settings.animationsDisabled}
                                        />
                                        <CustomDropdown 
                                            label="Code Font"
                                            description="Used in code blocks and inline code in chat messages."
                                            options={codeFontOptions}
                                            selected={settings.codeFont}
                                            onSelect={(option) => updateSettings({codeFont: option})}
                                            animationsDisabled={settings.animationsDisabled}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-zinc-900 dark:text-white">Fonts Preview</h4>
                                        <FontPreview
                                            mainFont={settings.mainFont}
                                            codeFont={settings.codeFont}
                                        />
                                    </div>
                               </div>
                            </div>
                        </div>
                    </div>
                );
                break;
            case 'Account':
                 content = (
                    <div>
                        <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-white">Account</h2>
                        {user ? (
                           <div className="space-y-4">
                             <p>You are signed in as <span className="font-semibold">{user.email}</span>.</p>
                             <Button onClick={onSignOutClick} variant="destructive">
                                Sign Out
                             </Button>
                           </div>
                        ) : (
                           <div className="space-y-4">
                             <p>Sign in to sync your history and preferences across devices.</p>
                             <div className="flex flex-col sm:flex-row gap-4">
                                <Button onClick={handleSignIn} className="gap-2 flex-1">
                                    <Google className="w-5 h-5" />
                                    Sign in with Google
                                </Button>
                                <Button variant="secondary" className="gap-2 flex-1" onClick={onOpenAuthModal}>
                                    <LogIn className="w-5 h-5" />
                                    Sign in with Email
                                </Button>
                             </div>
                           </div>
                        )}
                    </div>
                 );
                 break;
            case 'API Keys':
                content = <ApiKeysTab />;
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
        <div className="fixed inset-0 z-50 bg-white dark:bg-[#1c1c1c] text-zinc-900 dark:text-zinc-200 font-sans overflow-y-auto">
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
                                                <span className="text-zinc-500 dark:text-zinc-400">20 / unlimited</span>
                                           </div>
                                           <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5">
                                                <div className="bg-zinc-400 dark:bg-zinc-500 h-1.5 rounded-full" style={{width: `${(20/1000)*100}%`}}></div>
                                           </div>
                                           <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">20 messages usage</p>
                                       </div>
                                        <div>
                                           <div className="flex justify-between text-xs font-medium mb-1">
                                                <span className="text-zinc-600 dark:text-zinc-300 flex items-center gap-1">
                                                    Your Own Api
                                                    <Info className="w-3.5 h-3.5 text-pink-500" />
                                                </span>
                                                <span className="text-zinc-500 dark:text-zinc-400">23</span>
                                           </div>
                                           <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5">
                                                <div className="bg-pink-500 h-1.5 rounded-full" style={{width: `${(23/1000)*100}%`}}></div>
                                           </div>
                                           <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">23 messages usage</p>
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