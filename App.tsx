import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import SettingsPage, { Tab as SettingsTab } from './components/SettingsPage';
import AuthModal from './components/auth/AuthModal';
import ConfirmationDialog from './components/ui/ConfirmationDialog';
import { app, auth, db } from './firebase.ts'; // Import the initialized Firebase app and db
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { useChat } from './hooks/useChat';

export type Theme = 'light' | 'dark' | 'system';

export interface AppSettings {
  theme: Theme;
  mainFont: string;
  codeFont: string;
  fontSize: number;
  animationsDisabled: boolean;
  customInstruction: string;
  hidePersonalInfo: boolean;
  disableLinkWarning: boolean;
}

const defaultConfirmDialogProps = {
  title: '',
  description: '',
  onConfirm: () => {},
  confirmText: 'Confirm',
  confirmVariant: 'primary' as 'primary' | 'destructive',
  cancelText: 'Cancel',
  onCancel: undefined as (() => void) | undefined,
};

const App: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [initialSettingsTab, setInitialSettingsTab] = useState<SettingsTab>('Customization');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmDialogProps, setConfirmDialogProps] = useState(defaultConfirmDialogProps);
  const [settingsUnsubscribe, setSettingsUnsubscribe] = useState<(() => void) | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const loadGuestSettings = (): AppSettings => ({
    theme: (localStorage.getItem('theme') as Theme) || 'system',
    mainFont: localStorage.getItem('mainFont') || 'Montserrat',
    codeFont: localStorage.getItem('codeFont') || 'JetBrains Mono (default)',
    fontSize: parseInt(localStorage.getItem('fontSize') || '1'),
    animationsDisabled: localStorage.getItem('animationsDisabled') === 'true',
    customInstruction: localStorage.getItem('customInstruction') || '',
    hidePersonalInfo: localStorage.getItem('hidePersonalInfo') === 'true',
    disableLinkWarning: localStorage.getItem('disableLinkWarning') === 'true',
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const initialSettings = loadGuestSettings();
    return initialSettings;
  });

  const chat = useChat(settingsLoaded ? settings : undefined);
  
  const clearLocalSettings = () => {
    const guestSettingsKeys: Array<keyof AppSettings> = ['theme', 'mainFont', 'codeFont', 'fontSize', 'animationsDisabled', 'customInstruction', 'hidePersonalInfo', 'disableLinkWarning'];
    guestSettingsKeys.forEach(key => localStorage.removeItem(key));
  };


  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    if (auth.currentUser) {
      const settingsRef = doc(db, 'settings', auth.currentUser.uid);
      await setDoc(settingsRef, newSettings, { merge: true });
    } else {
      Object.entries(newSettings).forEach(([key, value]) => {
        localStorage.setItem(key, String(value));
      });
    }
  };

  useEffect(() => {
    if (settingsUnsubscribe) {
      settingsUnsubscribe();
      setSettingsUnsubscribe(null);
    }
    
    const authUnsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (settingsUnsubscribe) {
          settingsUnsubscribe();
          setSettingsUnsubscribe(null);
      }

      if (currentUser) {
        setIsAuthModalOpen(false);

        const localSettings = loadGuestSettings();
        const guestSettingsKeys: Array<keyof AppSettings> = ['theme', 'mainFont', 'codeFont', 'fontSize', 'animationsDisabled', 'customInstruction', 'hidePersonalInfo', 'disableLinkWarning'];
        const hasLocalSettings = guestSettingsKeys.some(key => localStorage.getItem(key) !== null);

        const settingsRef = doc(db, 'settings', currentUser.uid);

        const setupFirestoreListener = () => {
            const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
                if (snapshot.exists()) {
                    const firestoreSettings = snapshot.data() as Partial<AppSettings>;
                    setSettings(prev => ({ ...prev, ...firestoreSettings }));
                    setSettingsLoaded(true);
                }
            });
            setSettingsUnsubscribe(() => unsubscribe);
        };

        try {
            const docSnap = await getDoc(settingsRef);
            
            if (docSnap.exists() && hasLocalSettings) {
                const cloudSettings = { ...loadGuestSettings(), ...docSnap.data() as Partial<AppSettings>};
                
                if (JSON.stringify(localSettings) !== JSON.stringify(cloudSettings)) {
                    openConfirmationDialog({
                        title: "Choose Your Settings",
                        description: "You have settings saved on this device and in the cloud. Which version would you like to use?",
                        onConfirm: () => { // Use Cloud
                            setSettings(cloudSettings);
                            setSettingsLoaded(true);
                            clearLocalSettings();
                            setIsConfirmDialogOpen(false);
                            setupFirestoreListener();
                        },
                        confirmText: 'Use Cloud',
                        confirmVariant: 'primary',
                        cancelText: 'Use Local',
                        onCancel: async () => { // Use Local
                            setSettings(localSettings);
                            setSettingsLoaded(true);
                            await setDoc(settingsRef, localSettings);
                            clearLocalSettings();
                            setIsConfirmDialogOpen(false);
                            setupFirestoreListener();
                        }
                    });
                } else {
                    setSettings(localSettings);
                    setSettingsLoaded(true);
                    setupFirestoreListener();
                }
            } else if (docSnap.exists()) {
                const cloudSettings = { ...loadGuestSettings(), ...docSnap.data() as Partial<AppSettings> };
                setSettings(cloudSettings);
                setSettingsLoaded(true);
                setupFirestoreListener();
            } else if (hasLocalSettings) {
                await setDoc(settingsRef, localSettings);
                setSettings(localSettings);
                setSettingsLoaded(true);
                clearLocalSettings();
                setupFirestoreListener();
            } else {
                setSettings(loadGuestSettings());
                setSettingsLoaded(true);
                setupFirestoreListener();
            }
        } catch (error) {
            console.error("Error handling user settings sync:", error);
            setSettings(loadGuestSettings());
            setSettingsLoaded(true);
        }

      } else {
        setSettings(loadGuestSettings());
        setSettingsLoaded(true);
      }
    });

    return () => {
        authUnsubscribe();
        if (settingsUnsubscribe) {
            settingsUnsubscribe();
        }
    };
  }, []);

  const openSettings = (tab: SettingsTab = 'Customization') => {
    setInitialSettingsTab(tab);
    setIsSettingsOpen(true);
  };

  const closeSettings = () => {
    setIsSettingsOpen(false);
  };

  useEffect(() => {
    console.log("Firebase Initialized:", app.name);
  }, []);

  const toggleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(settings.theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    updateSettings({ theme: nextTheme });
  };

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    root.classList.remove(isDark ? 'light' : 'dark');
    root.classList.add(isDark ? 'dark' : 'light');
  }, [settings.theme]);

  useEffect(() => {
      document.documentElement.style.setProperty('--font-main', settings.mainFont);
      document.documentElement.style.setProperty('--font-size-scale', settings.fontSize.toString());
  }, [settings.mainFont, settings.fontSize]);

  const handleSignOut = async () => {
      try {
        await signOut(auth);
        // Clear current conversation to show welcome page
        chat.selectConversation(null);
        setIsConfirmDialogOpen(false);
        closeSettings();
      } catch (error) {
        console.error("Error signing out:", error);
      }
  };

  const openConfirmationDialog = (props: Partial<typeof confirmDialogProps>) => {
      setConfirmDialogProps({ ...defaultConfirmDialogProps, ...props });
      setIsConfirmDialogOpen(true);
  };
  
  const onSignOutClick = () => {
      openConfirmationDialog({
          title: "Confirm Sign Out",
          description: "Are you sure you want to sign out? Your session will be ended.",
          onConfirm: handleSignOut,
          confirmText: "Sign Out",
          confirmVariant: 'destructive'
      });
  };
  
  return (
    <>
      <div className="flex h-screen w-full bg-white dark:bg-[#1c1c1c] text-zinc-900 dark:text-zinc-200 font-sans overflow-hidden">
        <Sidebar 
          isMobileMenuOpen={isMobileMenuOpen} 
          setIsMobileMenuOpen={setIsMobileMenuOpen} 
          isCollapsed={isSidebarCollapsed}
          user={user}
          onLoginClick={() => openSettings('Account')}
          onSignOutClick={onSignOutClick}
          chat={chat}
        />
        <ChatView 
          onMenuClick={() => setIsMobileMenuOpen(true)}
          toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isSidebarCollapsed={isSidebarCollapsed}
          onOpenSettings={openSettings}
          theme={settings.theme}
          toggleTheme={toggleTheme}
          user={user}
          animationsDisabled={settings.animationsDisabled}
          chat={chat}
        />
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-30 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          ></div>
        )}
      </div>
      {isSettingsOpen && <SettingsPage 
        onClose={closeSettings} 
        user={user} 
        initialTab={initialSettingsTab}
        settings={settings}
        updateSettings={updateSettings}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOutClick={onSignOutClick}
      />}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <ConfirmationDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={confirmDialogProps.onConfirm}
        title={confirmDialogProps.title}
        confirmText={confirmDialogProps.confirmText}
        confirmVariant={confirmDialogProps.confirmVariant}
        onCancel={confirmDialogProps.onCancel}
        cancelText={confirmDialogProps.cancelText}
      >
          {confirmDialogProps.description}
      </ConfirmationDialog>
    </>
  );
};

export default App;