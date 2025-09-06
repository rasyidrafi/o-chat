import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { ArrowLeft, LogOut, Info } from "./Icons";
import TabButton from "./settings/TabButton";
import ApiKeysTab from "./settings/Tab/ApiKeysTab";
import AccountTab from "./settings/Tab/AccountTab";
import CustomizationTab from "./settings/Tab/CustomizationTab";
import ModelsTab from "./settings/Tab/ModelsTab";
import AttachmentsTab from "./settings/Tab/AttachmentsTab";
import ContactUsTab from "./settings/Tab/ContactUsTab";
import UsageTab from "./settings/Tab/UsageTab";
import { User } from "firebase/auth";
import Button from "./ui/Button";
import LoadingState from "./ui/LoadingState";
import { motion, AnimatePresence } from "framer-motion";
import { AppSettings } from "../hooks/useSettings";
import { ChatStorageService } from "../services/chatStorageService";
import { useAuth } from "../contexts/AuthContext";
import { useLocalStorageData } from "../hooks/useLocalStorageData";
import { 
  AVATAR_COLORS, 
  TABS, 
  MOBILE_TABS,
  DEBOUNCE_DELAY,
  LOADING_ANIMATION_DURATION,
  CONTENT_ANIMATION_DURATION,
  BAR_ANIMATION_DURATION,
  calculateBarWidth 
} from "../constants/settingsPageConstants";

// Type definitions for better type safety
interface UsageData {
  backedByServerCount: number;
  byokCount: number;
  totalConversations: number;
}

interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// Avatar component with fallback handling (same as in Sidebar) - Memoized for performance
const UserAvatar = React.memo<{
  user: User;
  className?: string;
  size?: number;
}>(({ user, className = "", size = 96 }) => {
  // Generate initials from display name or email - memoized
  const initials = useMemo(() => {
    if (user.displayName) {
      return user.displayName
        .split(" ")
        .map((name) => name.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  }, [user.displayName, user.email]);

  // Generate a consistent background color based on user info - memoized
  const backgroundColor = useMemo(() => {
    const userString = user.displayName || user.email || user.uid;
    const hash = userString.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  }, [user.displayName, user.email, user.uid]);

  // Always show initials to avoid Google's rate limiting issues
  return (
    <div
      className={`${className} ${backgroundColor} flex items-center justify-center text-white font-semibold rounded-full ring-4`}
      style={{ 
        width: size, 
        height: size, 
        fontSize: size * 0.3,
        borderColor: 'var(--color-background)'
      }}
      title={`${user.displayName || user.email}`}
    >
      {initials}
    </div>
  );
});

export type Tab =
  | "Usage"
  | "Account"
  | "Customization"
  | "Models"
  | "API Keys"
  | "Attachments"
  | "Contact Us";

interface SettingsPageProps {
  onClose: () => void;
  initialTab?: Tab;
  onOpenAuthModal: () => void;
  onSignOutClick: () => void;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  onClose,
  initialTab,
  onOpenAuthModal,
  onSignOutClick,
  settings,
  updateSettings,
}) => {
  const { user } = useAuth();
  const isSignedIn = user ? !user.isAnonymous : false;
  const [activeTab, setActiveTab] = useState<Tab>(
    initialTab || "Customization"
  );
  const [usageData, setUsageData] = useState<UsageData>({
    backedByServerCount: 0,
    byokCount: 0,
    totalConversations: 0
  });
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    error: null
  });
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use custom hook for localStorage operations
  const { getUserMessagesBySource } = useLocalStorageData();

  // Mobile detection hook
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Memoize tabs configuration to prevent unnecessary re-renders using constants
  const tabs = useMemo(() => isMobile ? MOBILE_TABS : TABS, [isMobile]);

  // Enhanced debounced loading function with error handling
  const debouncedLoadUsageData = useCallback(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    loadingTimeoutRef.current = setTimeout(async () => {
      setLoadingState({ isLoading: true, error: null });
      
      try {
        if (user) {
          // Get message counts using collection group queries
          const chatStats = await ChatStorageService.getUserChatStats(user.uid);
          setUsageData({
            backedByServerCount: chatStats.serverMessages,
            byokCount: chatStats.byokMessages,
            totalConversations: chatStats.totalConversations
          });
        } else {
          // Get message count from localStorage using custom hook
          const localStats = getUserMessagesBySource();
          setUsageData({
            backedByServerCount: localStats.serverMessages,
            byokCount: localStats.byokMessages,
            totalConversations: localStats.totalConversations
          });
        }
        
        setLoadingState({ isLoading: false, error: null });
      } catch (error) {
        console.error('Error loading usage data:', error);
        setLoadingState({ 
          isLoading: false, 
          error: 'Failed to load usage data. Please try again.' 
        });
      }
    }, DEBOUNCE_DELAY);
  }, [user, getUserMessagesBySource]);

  // Load message usage data when component mounts or user changes
  useEffect(() => {
    debouncedLoadUsageData();

    // Cleanup function to cancel debounced calls
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [debouncedLoadUsageData]);

  // Memoized content rendering to prevent unnecessary re-renders
  const renderContent = useCallback(() => {
    const contentMap = {
      Usage: () => (
        <UsageTab
          usageData={usageData}
          loadingState={loadingState}
          onRetry={debouncedLoadUsageData}
          animationsDisabled={settings.animationsDisabled}
        />
      ),
      Account: () => (
        <AccountTab
          onOpenAuthModal={onOpenAuthModal}
          onSignOutClick={onSignOutClick}
        />
      ),
      Customization: () => (
        <CustomizationTab settings={settings} updateSettings={updateSettings} />
      ),
      Models: () => <ModelsTab settings={settings} />,
      "API Keys": () => <ApiKeysTab />,
      Attachments: () => <AttachmentsTab />,
      "Contact Us": () => <ContactUsTab />,
    };

    const ContentComponent = contentMap[activeTab];
    if (!ContentComponent) {
      return (
        <div>
          <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-foreground)' }}>
            {activeTab}
          </h2>
          <p className="mt-4">
            Settings for {activeTab} are not implemented yet.
          </p>
        </div>
      );
    }

    return (
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: settings.animationsDisabled ? 0 : CONTENT_ANIMATION_DURATION }}
      >
        <ContentComponent />
      </motion.div>
    );
  }, [
    activeTab,
    user,
    onOpenAuthModal,
    onSignOutClick,
    settings,
    updateSettings,
    usageData,
    loadingState,
    debouncedLoadUsageData,
  ]);

  return (
    <div className="fixed inset-0 z-70 font-sans overflow-y-auto custom-scrollbar" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-foreground)' }}>
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
              {isSignedIn ? (
                <div className="flex flex-col items-center p-6 text-center" style={{ backgroundColor: 'var(--color-muted)', borderRadius: 'var(--radius)' }}>
                  <UserAvatar user={user!} size={96} className="mb-4" />
                  <h2 className="font-bold text-xl truncate max-w-full" style={{ color: 'var(--color-foreground)' }}>
                    {user!.displayName || user!.email}
                  </h2>
                  {user!.displayName && (
                    <p className="text-sm opacity-70 truncate max-w-full">
                      {user!.email}
                    </p>
                  )}
                  <span className="mt-3 text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 py-1 px-3 rounded-full">
                    Signed In
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSignOutClick}
                    className="gap-2 mt-3"
                  >
                    Sign out
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center p-6" style={{ backgroundColor: 'var(--color-muted)', borderRadius: 'var(--radius)' }}>
                  <h2 className="font-bold text-xl" style={{ color: 'var(--color-foreground)' }}>
                    Not Signed In
                  </h2>
                  <p className="text-sm opacity-70 mt-2">
                    Sign in to sync your data and unlock features.
                  </p>
                  <Button
                    onClick={() => setActiveTab("Account")}
                    className="mt-4"
                  >
                    Go to Account Tab
                  </Button>
                </div>
              )}

              {/* Hide usage section on mobile since it's now in Usage tab */}
              {!isMobile && (
                <div className="p-6" style={{ backgroundColor: 'var(--color-muted)', borderRadius: 'var(--radius)' }}>
                <div>
                  <div className="flex items-center mb-2">
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--color-foreground)' }}>
                      Usage
                    </h3>
                  </div>
                  {loadingState.isLoading ? (
                    <div className="h-50 flex items-center justify-center py-8">
                      <LoadingState 
                        message="Loading usage data..." 
                        size="sm" 
                        centerContent={true}
                      />
                    </div>
                  ) : loadingState.error ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="text-red-500 text-sm mb-2">{loadingState.error}</div>
                      <button 
                        onClick={debouncedLoadUsageData}
                        className="text-xs text-blue-500 hover:text-blue-700 underline"
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <motion.div
                      className="space-y-4"
                      initial={
                        settings.animationsDisabled ? {} : { opacity: 0, y: 10 }
                      }
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: settings.animationsDisabled ? 0 : LOADING_ANIMATION_DURATION,
                      }}
                    >
                      <div>
                        <div className="flex justify-between text-xs font-medium mb-1">
                          <span className="opacity-80">
                            Conversations
                          </span>
                          <span className="opacity-60">
                            {usageData.totalConversations}
                          </span>
                        </div>
                        <div className="w-full rounded-full h-1.5" style={{ backgroundColor: 'var(--color-border)' }}>
                          <motion.div
                            className="bg-gradient-to-r from-blue-400 to-blue-500 h-1.5 rounded-full"
                            initial={
                              settings.animationsDisabled ? {} : { width: 0 }
                            }
                            animate={{
                              width: `${calculateBarWidth(usageData.totalConversations)}%`,
                            }}
                            transition={{
                              duration: settings.animationsDisabled ? 0 : BAR_ANIMATION_DURATION,
                              ease: "easeOut",
                            }}
                          />
                        </div>
                        <p className="text-xs opacity-60 mt-1">
                          {usageData.totalConversations} total conversations
                        </p>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-medium mb-1">
                          <span className="opacity-80 flex items-center gap-1.5">
                            Backed by Us
                            <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 px-1.5 py-0.5 rounded-full font-medium">
                              Unlimited
                            </span>
                          </span>
                          <span className="opacity-60">
                            {usageData.backedByServerCount}
                          </span>
                        </div>
                        <div className="w-full rounded-full h-1.5" style={{ backgroundColor: 'var(--color-border)' }}>
                          <motion.div
                            className="bg-gradient-to-r from-green-400 to-green-500 h-1.5 rounded-full"
                            initial={
                              settings.animationsDisabled ? {} : { width: 0 }
                            }
                            animate={{
                              width: `${calculateBarWidth(usageData.backedByServerCount)}%`,
                            }}
                            transition={{
                              duration: settings.animationsDisabled ? 0 : BAR_ANIMATION_DURATION,
                              ease: "easeOut",
                              delay: settings.animationsDisabled ? 0 : 0.1,
                            }}
                          />
                        </div>
                        <p className="text-xs opacity-60 mt-1">
                          {usageData.backedByServerCount} messages sent
                        </p>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-medium mb-1">
                          <span className="opacity-80 flex items-center gap-1">
                            Your Own API
                            <Info className="w-3.5 h-3.5 text-pink-500" />
                          </span>
                          <span className="opacity-60">
                            {usageData.byokCount}
                          </span>
                        </div>
                        <div className="w-full rounded-full h-1.5" style={{ backgroundColor: 'var(--color-border)' }}>
                          <motion.div
                            className="bg-gradient-to-r from-pink-400 to-pink-500 h-1.5 rounded-full"
                            initial={
                              settings.animationsDisabled ? {} : { width: 0 }
                            }
                            animate={{
                              width: `${calculateBarWidth(usageData.byokCount)}%`,
                            }}
                            transition={{
                              duration: settings.animationsDisabled ? 0 : BAR_ANIMATION_DURATION,
                              ease: "easeOut",
                              delay: settings.animationsDisabled ? 0 : 0.2,
                            }}
                          />
                        </div>
                        <p className="text-xs opacity-60 mt-1">
                          {usageData.byokCount} messages sent
                        </p>
                      </div>
                      <div className="rounded-lg p-3 flex items-start gap-2.5" style={{ backgroundColor: 'var(--color-secondary)' }}>
                        <Info className="w-4 h-4 opacity-60 mt-0.5 flex-shrink-0" />
                        <p className="text-xs opacity-80">
                          Server-backed messages are unlimited and free.
                          Messages using your own API key are billed directly to
                          you - please monitor your API usage and costs.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
              )}
            </div>
          </aside>
          <main className="lg:col-span-9">
            <div className="flex overflow-x-auto mb-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden" style={{ borderBottom: '1px solid var(--color-border)' }}>
              {tabs.map((tab) => (
                <TabButton
                  key={tab}
                  label={tab}
                  isActive={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                  animationsDisabled={settings.animationsDisabled}
                />
              ))}
            </div>
            <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
            <div className="block h-24" />
          </main>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
