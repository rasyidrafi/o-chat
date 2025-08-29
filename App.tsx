import React, { useState, useEffect, useRef, useCallback } from "react";
import { Routes, Route, useParams, useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import ChatView from "./components/ChatView";
import SettingsPage, { Tab as SettingsTab } from "./components/SettingsPage";
import AuthModal from "./components/auth/AuthModal";
import ConfirmationDialog from "./components/ui/ConfirmationDialog";
import SearchCenter from "./components/SearchCenter";
import { useChat } from "./hooks/useChat";
import { useAuth } from "./hooks/useAuth";
import { useSettings } from "./hooks/useSettings";

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
  const navigate = useNavigate();

  React.useEffect(() => {
    if (conversationId && conversationId !== chat.currentConversation?.id) {
      chat.selectConversation(conversationId);
    } else if (!conversationId && chat.currentConversation) {
      // If we're at root but have a current conversation, redirect to it
      navigate(`/c/${chat.currentConversation.id}`, { replace: true });
    }
  }, [conversationId, chat, navigate]);

  return null; // This component just handles routing logic
};

const AppContent: React.FC = () => {
  // UI state
  const [ui, setUi] = useState({
    isMobileMenuOpen: false,
    isSidebarCollapsed: false,
    isSettingsOpen: false,
    isAuthModalOpen: false,
    isConfirmDialogOpen: false,
    isSearchCenterOpen: false
  });

  // Modal state
  const [modal, setModal] = useState({
    initialSettingsTab: "Customization" as SettingsTab,
    confirmDialogProps: defaultConfirmDialogProps
  });

  const sidebarRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  // Custom hooks
  const { user, signOut } = useAuth();
  
  const openConfirmationDialog = useCallback((
    props: Partial<typeof modal.confirmDialogProps>
  ) => {
    setModal(prev => ({ 
      ...prev, 
      confirmDialogProps: { ...defaultConfirmDialogProps, ...props }
    }));
    setUi(prev => ({ ...prev, isConfirmDialogOpen: true }));
  }, []);

  const { settings, settingsLoaded, updateSettings, toggleTheme } = useSettings(
    user,
    openConfirmationDialog
  );

  const chat = useChat(settingsLoaded ? settings : undefined, navigate);

  const openSettings = (tab: SettingsTab = "Customization") => {
    setModal(prev => ({ ...prev, initialSettingsTab: tab }));
    setUi(prev => ({ ...prev, isSettingsOpen: true }));
  };

  const closeSettings = () => {
    setUi(prev => ({ ...prev, isSettingsOpen: false }));
  };

  // Close auth modal when user logs in
  useEffect(() => {
    if (user) {
      setUi(prev => ({ ...prev, isAuthModalOpen: false }));
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
  }, [settings.mainFont, settings.fontSize]);

  const handleSignOut = async () => {
    try {
      await signOut();
      // Clear current conversation to show welcome page
      chat.selectConversation(null);
      setUi(prev => ({ ...prev, isConfirmDialogOpen: false }));
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

  return (
    <>
      <div className="flex h-screen w-full bg-white dark:bg-[#1c1c1c] text-zinc-900 dark:text-zinc-200 font-sans overflow-hidden">
        <Sidebar
          ref={sidebarRef}
          isMobileMenuOpen={ui.isMobileMenuOpen}
          setIsMobileMenuOpen={(open) => setUi(prev => ({ ...prev, isMobileMenuOpen: open }))}
          isCollapsed={ui.isSidebarCollapsed}
          user={user}
          onLoginClick={() => openSettings("Account")}
          onSignOutClick={onSignOutClick}
          onOpenSearchCenter={() => setUi(prev => ({ ...prev, isSearchCenterOpen: true }))}
          chat={chat}
        />
        
        <Routes>
          <Route path="/" element={
            <ChatView
              onMenuClick={() => setUi(prev => ({ ...prev, isMobileMenuOpen: true }))}
              toggleSidebar={() => setUi(prev => ({ ...prev, isSidebarCollapsed: !prev.isSidebarCollapsed }))}
              isSidebarCollapsed={ui.isSidebarCollapsed}
              onOpenSettings={openSettings}
              theme={settings.theme}
              toggleTheme={toggleTheme}
              user={user}
              animationsDisabled={settings.animationsDisabled}
              chat={chat}
            />
          } />
          <Route path="/c/:conversationId" element={
            <>
              <ConversationRoute 
                chat={chat} 
              />
              <ChatView
                onMenuClick={() => setUi(prev => ({ ...prev, isMobileMenuOpen: true }))}
                toggleSidebar={() => setUi(prev => ({ ...prev, isSidebarCollapsed: !prev.isSidebarCollapsed }))}
                isSidebarCollapsed={ui.isSidebarCollapsed}
                onOpenSettings={openSettings}
                theme={settings.theme}
                toggleTheme={toggleTheme}
                user={user}
                animationsDisabled={settings.animationsDisabled}
                chat={chat}
              />
            </>
          } />
        </Routes>

        {ui.isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-30 md:hidden"
            onClick={() => setUi(prev => ({ ...prev, isMobileMenuOpen: false }))}
            aria-hidden="true"
          ></div>
        )}
      </div>
      
      {ui.isSettingsOpen && (
        <SettingsPage
          onClose={closeSettings}
          user={user}
          initialTab={modal.initialSettingsTab}
          settings={settings}
          updateSettings={updateSettings}
          onOpenAuthModal={() => setUi(prev => ({ ...prev, isAuthModalOpen: true }))}
          onSignOutClick={onSignOutClick}
        />
      )}
      <AuthModal
        isOpen={ui.isAuthModalOpen}
        onClose={() => setUi(prev => ({ ...prev, isAuthModalOpen: false }))}
        animationsDisabled={settings.animationsDisabled}
      />
      <ConfirmationDialog
        isOpen={ui.isConfirmDialogOpen}
        onClose={() => setUi(prev => ({ ...prev, isConfirmDialogOpen: false }))}
        onConfirm={modal.confirmDialogProps.onConfirm}
        title={modal.confirmDialogProps.title}
        confirmText={modal.confirmDialogProps.confirmText}
        confirmVariant={modal.confirmDialogProps.confirmVariant}
        onCancel={modal.confirmDialogProps.onCancel}
        cancelText={modal.confirmDialogProps.cancelText}
        animationsDisabled={settings.animationsDisabled}
      >
        {modal.confirmDialogProps.description}
      </ConfirmationDialog>
      <SearchCenter
        isOpen={ui.isSearchCenterOpen}
        onClose={() => setUi(prev => ({ ...prev, isSearchCenterOpen: false }))}
        chat={chat}
        animationsDisabled={settings.animationsDisabled}
      />
    </>
  );
};

const App: React.FC = () => {
  return <AppContent />;
};

export default App;
