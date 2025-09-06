import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Routes,
  Route,
  useParams,
  useNavigate,
} from "react-router-dom";
import Sidebar from "./components/Sidebar";
import ChatView from "./components/ChatView";
import SettingsPage, { Tab as SettingsTab } from "./components/SettingsPage";
import AuthModal from "./components/auth/AuthModal";
import ConfirmationDialog from "./components/ui/ConfirmationDialog";
import SearchCenter from "./components/SearchCenter";
import AuthLoadingScreen from "./components/AuthLoadingScreen";
import { useChat } from "./hooks/useChat";
import { useAuth } from "./contexts/AuthContext";
import {
  SettingsProvider,
  useSettingsContext,
} from "./contexts/SettingsContext";
import { initializeThemeProperties } from "./utils/themeUtils";

const defaultConfirmDialogProps = {
  title: "",
  description: "",
  onConfirm: () => {},
  confirmText: "Confirm",
  confirmVariant: "primary" as "primary" | "destructive",
  cancelText: "Cancel",
  onCancel: undefined as (() => void) | undefined,
};

// Component to handle conversation routing
const ConversationRoute: React.FC<{
  chat: ReturnType<typeof useChat>;
}> = ({ chat }) => {
  const { conversationId } = useParams<{ conversationId: string }>();

  if (chat.isLoading) {
    console.log("Still loading conversations, waiting...");
    return null;
  }

  React.useEffect(() => {
    if (conversationId && chat.currentConversationId !== conversationId && chat.currentConversationId == null) {
      chat.selectConversation(conversationId);
    }
  }, []);
  
  return null; // This component just handles routing logic
};

const AppContent: React.FC<{
  modal: {
    initialSettingsTab: SettingsTab;
    confirmDialogProps: typeof defaultConfirmDialogProps;
  };
  setModal: React.Dispatch<
    React.SetStateAction<{
      initialSettingsTab: SettingsTab;
      confirmDialogProps: typeof defaultConfirmDialogProps;
    }>
  >;
  isConfirmDialogOpen: boolean;
  setIsConfirmDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openConfirmationDialog: (
    props: Partial<typeof defaultConfirmDialogProps>
  ) => void;
}> = ({
  modal,
  setModal,
  isConfirmDialogOpen,
  setIsConfirmDialogOpen,
  openConfirmationDialog,
}) => {
  // UI state
  const [ui, setUi] = useState({
    isMobileMenuOpen: false,
    isSidebarCollapsed: false,
    isSettingsOpen: false,
    isAuthModalOpen: false,
    isSearchCenterOpen: false,
  });

  const sidebarRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  // Custom hooks
  const { user, signOut, authLoaded, isLoading: authIsLoading } = useAuth();

  const { settings, settingsLoaded, updateSettings, toggleTheme } =
    useSettingsContext();

  const chat = useChat(settingsLoaded ? settings : undefined, navigate);

  const openSettings = (tab: SettingsTab = "Customization") => {
    setModal((prev) => ({ ...prev, initialSettingsTab: tab }));
    setUi((prev) => ({ ...prev, isSettingsOpen: true }));
  };

  const closeSettings = () => {
    setUi((prev) => ({ ...prev, isSettingsOpen: false }));
  };

  // Close auth modal when user logs in
  useEffect(() => {
    if (user) {
      setUi((prev) => ({ ...prev, isAuthModalOpen: false }));
    }
  }, [user]);

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark =
      settings.theme === "dark" ||
      (settings.theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    root.classList.remove(isDark ? "light" : "dark");
    root.classList.add(isDark ? "dark" : "light");
  }, [settings.theme]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--font-main",
      settings.mainFont
    );
    document.documentElement.style.setProperty(
      "--font-size-scale",
      settings.fontSize.toString()
    );
    // Initialize theme properties
    initializeThemeProperties(settings);
  }, [settings.mainFont, settings.fontSize, settings.themePalette, settings.borderRadius]);

  const handleSignOut = async () => {
    try {
      await signOut();
      // Clear current conversation to show welcome page
      chat.selectConversation(null);
      setIsConfirmDialogOpen(false);
      closeSettings();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const onSignOutClick = () => {
    openConfirmationDialog({
      title: "Confirm Sign Out",
      description:
        "Are you sure you want to sign out? Your session will be ended.",
      onConfirm: handleSignOut,
      confirmText: "Sign Out",
      confirmVariant: "destructive",
    });
  };

  // Show global loading screen while auth or settings are initializing
  // This ensures all core app state is ready before rendering the main UI
  if (authIsLoading || !authLoaded || !settingsLoaded) {
    return <AuthLoadingScreen />;
  }

  return (
    <>
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar
          ref={sidebarRef}
          isMobileMenuOpen={ui.isMobileMenuOpen}
          setIsMobileMenuOpen={(open) =>
            setUi((prev) => ({ ...prev, isMobileMenuOpen: open }))
          }
          isCollapsed={ui.isSidebarCollapsed}
          onLoginClick={() => openSettings("Account")}
          onSignOutClick={onSignOutClick}
          onOpenSearchCenter={() =>
            setUi((prev) => ({ ...prev, isSearchCenterOpen: true }))
          }
          onOpenSettings={openSettings}
          chat={chat}
        />

        <Routes>
          <Route
            path="/"
            element={
              <ChatView
                onMenuClick={() =>
                  setUi((prev) => ({ ...prev, isMobileMenuOpen: true }))
                }
                toggleSidebar={() =>
                  setUi((prev) => ({
                    ...prev,
                    isSidebarCollapsed: !prev.isSidebarCollapsed,
                  }))
                }
                isSidebarCollapsed={ui.isSidebarCollapsed}
                onOpenSettings={openSettings}
                onOpenSearchCenter={() =>
                  setUi((prev) => ({ ...prev, isSearchCenterOpen: true }))
                }
                theme={settings.theme}
                toggleTheme={toggleTheme}
                chat={chat}
              />
            }
          />
          <Route
            path="/c/:conversationId"
            element={
              <>
                <ConversationRoute chat={chat} />
                <ChatView
                  onMenuClick={() =>
                    setUi((prev) => ({ ...prev, isMobileMenuOpen: true }))
                  }
                  toggleSidebar={() =>
                    setUi((prev) => ({
                      ...prev,
                      isSidebarCollapsed: !prev.isSidebarCollapsed,
                    }))
                  }
                  isSidebarCollapsed={ui.isSidebarCollapsed}
                  onOpenSettings={openSettings}
                  onOpenSearchCenter={() =>
                    setUi((prev) => ({ ...prev, isSearchCenterOpen: true }))
                  }
                  theme={settings.theme}
                  toggleTheme={toggleTheme}
                  chat={chat}
                />
              </>
            }
          />
        </Routes>

        {ui.isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-30 md:hidden"
            onClick={() =>
              setUi((prev) => ({ ...prev, isMobileMenuOpen: false }))
            }
            aria-hidden="true"
          ></div>
        )}
      </div>

      {ui.isSettingsOpen && (
        <SettingsPage
          onClose={closeSettings}
          initialTab={modal.initialSettingsTab}
          settings={settings}
          updateSettings={updateSettings}
          onOpenAuthModal={() =>
            setUi((prev) => ({ ...prev, isAuthModalOpen: true }))
          }
          onSignOutClick={onSignOutClick}
        />
      )}
      <AuthModal
        isOpen={ui.isAuthModalOpen}
        onClose={() => setUi((prev) => ({ ...prev, isAuthModalOpen: false }))}
      />
      <ConfirmationDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={modal.confirmDialogProps.onConfirm}
        title={modal.confirmDialogProps.title}
        confirmText={modal.confirmDialogProps.confirmText}
        confirmVariant={modal.confirmDialogProps.confirmVariant}
        onCancel={modal.confirmDialogProps.onCancel}
        cancelText={modal.confirmDialogProps.cancelText}
      >
        {modal.confirmDialogProps.description}
      </ConfirmationDialog>
      <SearchCenter
        isOpen={ui.isSearchCenterOpen}
        onClose={() =>
          setUi((prev) => ({ ...prev, isSearchCenterOpen: false }))
        }
        onCloseMobileSidebar={() =>
          setUi((prev) => ({ ...prev, isMobileMenuOpen: false }))
        }
        chat={chat}
      />
    </>
  );
};

const App: React.FC = () => {
  const { user } = useAuth();

  // Move confirmation dialog state to App level so it can be shared
  const [modal, setModal] = useState({
    initialSettingsTab: "Customization" as SettingsTab,
    confirmDialogProps: defaultConfirmDialogProps,
  });

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const openConfirmationDialog = useCallback(
    (props: Partial<typeof defaultConfirmDialogProps>) => {
      setModal((prev) => ({
        ...prev,
        confirmDialogProps: { ...defaultConfirmDialogProps, ...props },
      }));
      setIsConfirmDialogOpen(true);
    },
    []
  );

  return (
    <SettingsProvider user={user} onConfirmationDialog={openConfirmationDialog}>
      <AppContent
        modal={modal}
        setModal={setModal}
        isConfirmDialogOpen={isConfirmDialogOpen}
        setIsConfirmDialogOpen={setIsConfirmDialogOpen}
        openConfirmationDialog={openConfirmationDialog}
      />
    </SettingsProvider>
  );
};

export default App;
