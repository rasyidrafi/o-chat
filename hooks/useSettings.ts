import { useState, useEffect, useRef, useCallback } from "react";
import { User } from "firebase/auth";
import { doc, setDoc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export type Theme = "light" | "dark" | "system";

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

const loadGuestSettings = (): AppSettings => ({
  theme: (localStorage.getItem("theme") as Theme) || "system",
  mainFont: localStorage.getItem("mainFont") || "Outfit",
  codeFont: localStorage.getItem("codeFont") || "JetBrains Mono (default)",
  fontSize: parseFloat(localStorage.getItem("fontSize") || "1"),
  animationsDisabled: localStorage.getItem("animationsDisabled") === "true",
  customInstruction: localStorage.getItem("customInstruction") || "",
  hidePersonalInfo: localStorage.getItem("hidePersonalInfo") === "true",
  disableLinkWarning: localStorage.getItem("disableLinkWarning") === "true",
});

const clearLocalSettings = () => {
  const guestSettingsKeys: Array<keyof AppSettings> = [
    "theme",
    "mainFont",
    "codeFont",
    "fontSize",
    "animationsDisabled",
    "customInstruction",
    "hidePersonalInfo",
    "disableLinkWarning",
  ];
  guestSettingsKeys.forEach((key) => localStorage.removeItem(key));
};

export const useSettings = (
  user: User | null,
  onConfirmationDialog?: (props: {
    title: string;
    description: string;
    onConfirm: () => void;
    confirmText: string;
    confirmVariant: "primary" | "destructive";
    cancelText: string;
    onCancel?: () => void;
  }) => void
) => {
  const [settings, setSettings] = useState<AppSettings>(loadGuestSettings);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [settingsUnsubscribe, setSettingsUnsubscribe] = useState<
    (() => void) | null
  >(null);

  // Use ref to store the callback to avoid dependency issues
  const confirmationDialogRef = useRef(onConfirmationDialog);
  
  // Update ref when callback changes
  useEffect(() => {
    confirmationDialogRef.current = onConfirmationDialog;
  }, [onConfirmationDialog]);

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));

    if (user) {
      const settingsRef = doc(db, "settings", user.uid);
      await setDoc(settingsRef, newSettings, { merge: true });
    } else {
      Object.entries(newSettings).forEach(([key, value]) => {
        localStorage.setItem(key, String(value));
      });
    }
  }, [user]);

  useEffect(() => {
    if (settingsUnsubscribe) {
      settingsUnsubscribe();
      setSettingsUnsubscribe(null);
    }

    if (user) {
      const localSettings = loadGuestSettings();
      const guestSettingsKeys: Array<keyof AppSettings> = [
        "theme",
        "mainFont",
        "codeFont",
        "fontSize",
        "animationsDisabled",
        "customInstruction",
        "hidePersonalInfo",
        "disableLinkWarning",
      ];
      const hasLocalSettings = guestSettingsKeys.some(
        (key) => localStorage.getItem(key) !== null
      );

      const settingsRef = doc(db, "settings", user.uid);

      const setupFirestoreListener = () => {
        const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
          if (snapshot.exists()) {
            const firestoreSettings = snapshot.data() as Partial<AppSettings>;
            setSettings((prev) => ({ ...prev, ...firestoreSettings }));
            setSettingsLoaded(true);
          }
        });
        setSettingsUnsubscribe(() => unsubscribe);
      };

      const initializeSettings = async () => {
        try {
          const docSnap = await getDoc(settingsRef);

          if (docSnap.exists() && hasLocalSettings) {
            const cloudSettings = {
              ...loadGuestSettings(),
              ...(docSnap.data() as Partial<AppSettings>),
            };

            if (
              JSON.stringify(localSettings) !== JSON.stringify(cloudSettings)
            ) {
              if (confirmationDialogRef.current) {
                confirmationDialogRef.current({
                  title: "Choose Your Settings",
                  description:
                    "You have settings saved on this device and in the cloud. Which version would you like to use?",
                  onConfirm: () => {
                    // Use Cloud
                    setSettings(cloudSettings);
                    setSettingsLoaded(true);
                    clearLocalSettings();
                    setupFirestoreListener();
                  },
                  confirmText: "Use Cloud",
                  confirmVariant: "primary",
                  cancelText: "Use Local",
                  onCancel: async () => {
                    // Use Local
                    setSettings(localSettings);
                    setSettingsLoaded(true);
                    await setDoc(settingsRef, localSettings);
                    clearLocalSettings();
                    setupFirestoreListener();
                  },
                });
              } else {
                // Fallback to cloud settings if no confirmation dialog handler
                setSettings(cloudSettings);
                setSettingsLoaded(true);
                setupFirestoreListener();
              }
            } else {
              setSettings(localSettings);
              setSettingsLoaded(true);
              setupFirestoreListener();
            }
          } else if (docSnap.exists()) {
            const cloudSettings = {
              ...loadGuestSettings(),
              ...(docSnap.data() as Partial<AppSettings>),
            };
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
      };

      initializeSettings();
    } else {
      setSettings(loadGuestSettings());
      setSettingsLoaded(true);
    }

    return () => {
      if (settingsUnsubscribe) {
        settingsUnsubscribe();
      }
    };
  }, [user]); // Remove onConfirmationDialog from dependencies

  const toggleTheme = useCallback(() => {
    const themes: Theme[] = ["light", "dark", "system"];
    setSettings(prev => {
      const currentIndex = themes.indexOf(prev.theme);
      const nextTheme = themes[(currentIndex + 1) % themes.length];
      const newSettings = { theme: nextTheme };
      
      if (user) {
        const settingsRef = doc(db, "settings", user.uid);
        setDoc(settingsRef, newSettings, { merge: true });
      } else {
        localStorage.setItem("theme", nextTheme);
      }
      
      return { ...prev, theme: nextTheme };
    });
  }, [user]);

  return {
    settings,
    settingsLoaded,
    updateSettings,
    toggleTheme,
  };
};
