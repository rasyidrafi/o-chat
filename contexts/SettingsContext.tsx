import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { User } from "firebase/auth";
import { useSettings, AppSettings } from "../hooks/useSettings";

interface SettingsContextType {
  settings: AppSettings;
  settingsLoaded: boolean;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  toggleTheme: () => void;
  isMobile: boolean;
  isDark: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

interface SettingsProviderProps {
  children: React.ReactNode;
  user: User | null;
  onConfirmationDialog?: (props: {
    title: string;
    description: string;
    onConfirm: () => void;
    confirmText: string;
    confirmVariant: "primary" | "destructive";
    cancelText: string;
    onCancel?: () => void;
  }) => void;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({
  children,
  user,
  onConfirmationDialog,
}) => {
  // Mobile detection state
  const [windowWidth, setWindowWidth] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth;
    }
    return 1024; // Default to desktop width on server-side
  });

  // Mobile detection effect
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    // Set initial value
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Memoize mobile calculation to prevent unnecessary re-renders
  const isMobile = useMemo(() => windowWidth < 768, [windowWidth]);

  // Use the existing useSettings hook
  const { settings, settingsLoaded, updateSettings, toggleTheme } = useSettings(
    user,
    onConfirmationDialog
  );

  const isDark = useMemo(() => {
    return (
      settings.theme === "dark" ||
      (settings.theme === "system" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  }, [settings.theme]);

  const contextValue = useMemo(
    () => ({
      settings,
      settingsLoaded,
      updateSettings,
      toggleTheme,
      isMobile,
      isDark,
    }),
    [settings, settingsLoaded, updateSettings, toggleTheme, isMobile, isDark]
  );

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error(
      "useSettingsContext must be used within a SettingsProvider"
    );
  }
  return context;
};
