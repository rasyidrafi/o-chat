import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { ArrowLeft, LogOut } from "./Icons";
import TabButton from "./settings/TabButton";
import ApiKeysTab from "./settings/Tab/ApiKeysTab";
import AccountTab from "./settings/Tab/AccountTab";
import CustomizationTab from "./settings/Tab/CustomizationTab";
import ModelsTab from "./settings/Tab/ModelsTab";
import AttachmentsTab from "./settings/Tab/AttachmentsTab";
import ContactUsTab from "./settings/Tab/ContactUsTab";
import { User } from "firebase/auth";
import Button from "./ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { AppSettings } from "../hooks/useSettings";
import { useAuth } from "../contexts/AuthContext";
import { 
  AVATAR_COLORS, 
  TABS, 
  MOBILE_TABS,
  KEYBOARD_SHORTCUTS,
  CONTENT_ANIMATION_DURATION
} from "../constants/settingsPageConstants";

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
      className={`${className} ${backgroundColor} flex items-center justify-center text-white font-semibold rounded-full ring-4 ring-white dark:ring-zinc-700`}
      style={{ width: size, height: size, fontSize: size * 0.3 }}
      title={`${user.displayName || user.email}`}
    >
      {initials}
    </div>
  );
});

export type Tab =
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

  // Mobile detection hook
  const [isMobile, setIsMobile] = useState(false);

  // Set global flags for settings page open/close
  useEffect(() => {
    // Mobile detection
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Set global flags for shortcut handling
    (window as any).__settingsPageOpen = true;
    (window as any).__closeSettingsPage = onClose;

    return () => {
      window.removeEventListener('resize', checkMobile);
      (window as any).__settingsPageOpen = false;
      (window as any).__closeSettingsPage = undefined;
    };
  }, [onClose]);

  // Memoize tabs configuration to prevent unnecessary re-renders using constants
  const tabs = useMemo(() => isMobile ? MOBILE_TABS : TABS, [isMobile]);

  // Memoized content rendering to prevent unnecessary re-renders
  const renderContent = useCallback(() => {
    const contentMap = {
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
          <h2 className="text-2xl font-bold mb-1 text-zinc-900 dark:text-white">
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
  ]);

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
              {isSignedIn ? (
                <div className="flex flex-col items-center p-6 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl text-center">
                  <UserAvatar user={user!} size={96} className="mb-4" />
                  <h2 className="font-bold text-xl text-zinc-900 dark:text-white truncate max-w-full">
                    {user!.displayName || user!.email}
                  </h2>
                  {user!.displayName && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate max-w-full">
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
                <div className="flex flex-col items-center text-center p-6 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl">
                  <h2 className="font-bold text-xl text-zinc-900 dark:text-white">
                    Not Signed In
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
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

              {/* Keyboard shortcuts section - hide on mobile */}
              {!isMobile && (
                <div className="p-6 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl">
                  <div className="flex items-center mb-4">
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">
                      Keyboard Shortcuts
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {/* Existing shortcuts */}
                    {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-zinc-900 dark:text-white">
                            {shortcut.label}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            {shortcut.description}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, keyIndex) => (
                            <React.Fragment key={keyIndex}>
                              <div className="px-1 py-0.5 text-xs font-semibold text-zinc-800 bg-zinc-200 border border-zinc-300 rounded dark:bg-zinc-700 dark:text-zinc-200 dark:border-zinc-600 flex items-center justify-center">
                                {key}
                              </div>
                              {keyIndex < shortcut.keys.length - 1 && (
                                <span className="text-zinc-400 dark:text-zinc-500 text-xs">+</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
          <main className="lg:col-span-9">
            <div className="flex border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto mb-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
