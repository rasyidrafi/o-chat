import React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Search, User, X, LogIn, Plus, Check, CommandK } from "./Icons";
import { User as FirebaseUser } from "firebase/auth";
import { useChat } from "../hooks/useChat";
import { useAuth } from "../contexts/AuthContext";
import { Tab as SettingsTab } from "./SettingsPage";
import { useSettingsContext } from "../contexts/SettingsContext";
import { themes } from "../constants/themes";

interface SidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  onLoginClick: () => void;
  onSignOutClick: () => void;
  onOpenSearchCenter: () => void;
  onOpenSettings?: (tab?: SettingsTab) => void;
  chat: ReturnType<typeof useChat>;
}

// Avatar component with fallback handling
const UserAvatar: React.FC<{
  user: FirebaseUser;
  className?: string;
  size?: number;
}> = ({ user, className = "", size = 32 }) => {
  // Generate initials from display name or email
  const getInitials = () => {
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
  };

  // Always show initials to avoid Google's rate limiting issues
  // This provides a consistent, professional look without API dependency
  return (
    <div
      className={`${className} ${themes.special.bgGradient} ${themes.special.fg} flex items-center justify-center font-semibold rounded-full`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      title={`${user.displayName || user.email}`}
    >
      {getInitials()}
    </div>
  );
};

const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  (
    {
      isMobileMenuOpen,
      setIsMobileMenuOpen,
      isCollapsed,
      onLoginClick,
      // onSignOutClick,
      onOpenSearchCenter,
      onOpenSettings,
      chat,
    },
    ref
  ) => {
    const location = useLocation();
    const { user, isSignedIn } = useAuth();
    const { isMobile } = useSettingsContext();

    const {
      conversations,
      deleteConversation,
      isCreatingNewChat,
      isLoading,
      isLoadingMore,
      hasMoreConversations,
      loadMoreConversations,
    } = chat;
    const [confirmingDelete, setConfirmingDelete] = useState<string | null>(
      null
    );
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Keyboard shortcut handler for Command/Ctrl + K and Ctrl + Shift + O
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
        if ((event.metaKey || event.ctrlKey) && event.key === "k") {
          event.preventDefault();
          onOpenSearchCenter();
        }
        
        // Check for Ctrl + Shift + O to navigate to root
        if (event.ctrlKey && event.shiftKey && event.key === "O") {
          event.preventDefault();
          handleNewChat();
        }
      };

      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, [onOpenSearchCenter]);

    // Determine which conversations to display (memoized)
    const displayConversations = React.useMemo(() => {
      return conversations;
    }, [conversations]);

    // Platform detection for keyboard shortcut display
    const [isMac, setIsMac] = React.useState(false);

    React.useEffect(() => {
      setIsMac(navigator?.platform?.toLowerCase().includes("mac") || false);
    }, []);

    // Handle scroll to load more conversations
    useEffect(() => {
      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) return;

      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px threshold

        if (
          isNearBottom &&
          hasMoreConversations &&
          !isLoadingMore &&
          !isLoading
        ) {
          loadMoreConversations();
        }
      };

      scrollContainer.addEventListener("scroll", handleScroll);
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }, [hasMoreConversations, isLoadingMore, isLoading, loadMoreConversations]);

    const handleNewChat = () => {
      // Navigate to root path to show welcome screen
      console.log("open empty conversation");
      chat.selectConversation(null);
      setIsMobileMenuOpen(false);
    };

    const handleConversationSelect = (conversation: any) => {
      chat.selectConversation(conversation.id);
      setIsMobileMenuOpen(false);
    };

    const handleDeleteClick = (e: React.MouseEvent, conversation: any) => {
      e.stopPropagation();
      setConfirmingDelete(conversation.id);
    };

    const handleDeleteConfirm = (conversationId: string) => {
      deleteConversation(conversationId);
      setConfirmingDelete(null);
    };

    const handleDeleteCancel = () => {
      setConfirmingDelete(null);
    };

    const formatDate = useCallback((date: Date) => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Today at 00:00
      const messageDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      ); // Message date at 00:00

      const diffInMs = today.getTime() - messageDate.getTime();
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

      if (diffInDays === 0) {
        return "Today";
      } else if (diffInDays === 1) {
        return "Yesterday";
      } else if (diffInDays < 7) {
        return "Last 7 days";
      } else if (diffInDays < 30) {
        return "Last 30 days";
      } else {
        return "Older";
      }
    }, []);

    // Group conversations by date with proper ordering (memoized)
    const groupedConversations = React.useMemo(() => {
      return displayConversations.reduce(
        (
          groups: { [key: string]: typeof displayConversations },
          conversation
        ) => {
          const dateKey = formatDate(conversation.updatedAt);
          if (!groups[dateKey]) {
            groups[dateKey] = [];
          }
          groups[dateKey].push(conversation);
          return groups;
        },
        {}
      );
    }, [displayConversations]);

    // Sort the grouped conversations by the defined order (memoized)
    const orderedGroups = React.useMemo(() => {
      // Define the order of groups
      const groupOrder = [
        "Today",
        "Yesterday",
        "Last 7 days",
        "Last 30 days",
        "Older",
      ];

      return groupOrder
        .filter(
          (group) =>
            groupedConversations[group] &&
            groupedConversations[group].length > 0
        )
        .map(
          (group) =>
            [group, groupedConversations[group]] as [
              string,
              typeof displayConversations
            ]
        );
    }, [groupedConversations]);

    // Determine active conversation from URL
    const activeConversationId = location.pathname.startsWith("/c/")
      ? location.pathname.split("/c/")[1]
      : null;

    return (
      <aside
        ref={ref}
        className={`shadow-sm ${
          isMobile ? "p-1" : "p-2"
        } fixed md:relative top-0 left-0 h-full flex flex-col ${
          themes.sidebar.backdrop
        } z-60 transition-all duration-300 ease-in-out md:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } w-64 ${isCollapsed ? "md:w-20" : ""}`}
      >
        <div className="flex-shrink-0 flex flex-col mb-2">
          <button
            onClick={handleNewChat}
            disabled={isCreatingNewChat}
            className={`flex items-center justify-center truncate py-2 mx-2 my-2 px-2 ${themes.special.bgGradient} ${themes.special.fg} ${themes.special.bgHover} rounded-lg cursor-pointer`}
          >
            {isCollapsed ? (
              <Plus className="w-4 h-4" />
            ) : (
              <div className="text-sm font-medium flex items-center justify-center gap-4 w-full">
                <span>New Chat</span>
              </div>
            )}
          </button>
          <button
            onClick={onOpenSearchCenter}
            className={`${themes.sidebar.fg} ${themes.sidebar.fgHover} ${themes.sidebar.bg} ${themes.sidebar.bgHover} rounded-lg shadow-sm truncate font-medium text-sm py-2 mx-2 border-1 px-4 ${themes.sidebar.border} cursor-pointer`}
          >
            {isCollapsed ? (
              <Search className="w-4 h-4" />
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 flex-shrink-0" />
                  <span>Search chats</span>
                </div>
                <div className="flex items-center gap-1">
                  <CommandK
                    isMac={isMac}
                    eachClass={`${themes.card.bg} border-1 ${themes.sidebar.border}`}
                  />
                </div>
              </div>
            )}
          </button>
        </div>

        <div
          ref={scrollContainerRef}
          className={`py-2 flex-grow overflow-y-auto overflow-x-hidden block thin-scrollbar scroll-fade relative ${
            isCollapsed ? "md:hidden" : ""
          }`}
        >
          {!isLoading && (
            <>
              {/* Show search results or all conversations */}
              {orderedGroups.map(([dateGroup, convs]) => (
                <div key={dateGroup} className="mb-4 last:mb-0">
                  <div
                    className={`${themes.sidebar.fgSecondary} font-medium text-xs mb-1.5 px-4`}
                  >
                    {dateGroup}
                  </div>
                  <ul className="space-y-0 px-2">
                    {convs.map((conversation) => (
                      <li
                        key={conversation.id}
                        onClick={() => handleConversationSelect(conversation)}
                        className={`mb-[4px] last:mb-0 font-light text-sm capitalize py-[6px] px-[8px] leading-[20px] rounded-lg cursor-pointer transition-colors group relative ${
                          themes.sidebar.bgHover
                        } ${themes.sidebar.fgHover}  ${
                          activeConversationId === conversation.id
                            ? `${themes.sidebar.fgHoverAsFg} ${themes.sidebar.bgHoverAsBg}`
                            : themes.sidebar.fg
                        }`}
                      >
                        <div className="truncate">
                          {conversation.title || "Untitled Conversation"}
                        </div>

                        {/* Delete confirmation buttons */}
                        {confirmingDelete === conversation.id ? (
                          <div className={`absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 ${themes.sidebar.bg} rounded-lg p-1`}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCancel();
                              }}
                              className={`p-1 rounded transition-colors cursor-pointer ${themes.card.bgAsHover}`}
                              aria-label="Cancel delete"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteConfirm(conversation.id);
                              }}
                              className="p-1 hover:bg-red-500 hover:text-white rounded transition-colors cursor-pointer text-red-500 hover:text-white"
                              aria-label="Confirm delete"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => handleDeleteClick(e, conversation)}
                            className={`absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 ${themes.sidebar.bg} ${themes.card.bgAsHover} rounded-lg transition-all shadow-sm cursor-pointer`}
                            aria-label="Delete conversation"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {conversations.length === 0 && (
                <div className={`text-sm flex font-light items-center justify-center px-4 h-full text-center py-8 ${themes.sidebar.fg}`}>
                  No conversations yet.
                  <br />
                  Start a new chat to begin!
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-auto pt-2 mx-2 mb-2">
          {isSignedIn ? (
            <div className="flex flex-col">
              <div
                className={`flex truncate justify-center px-2 py-1 items-center rounded-lg cursor-pointer ${themes.sidebar.bgHover}`}
                onClick={() => onOpenSettings?.("Account")}
              >
                <UserAvatar user={user!} size={32} />
                <div
                  className={`ml-3 flex-grow block overflow-hidden ${
                    isCollapsed ? "md:hidden" : ""
                  }`}
                >
                  <div className={`${themes.sidebar.fgHoverAsFg} font-medium text-sm truncate`}>
                    {user!.displayName || user!.email}
                  </div>
                  <div className={`${themes.sidebar.fg} text-xs truncate`}>
                    Signed In
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className={`${themes.sidebar.fgHoverAsFg} ${themes.sidebar.bgHover} text-sm font-medium truncate flex items-center justify-center w-full py-3.5 rounded-lg transition-colors cursor-pointer ${
                isCollapsed ? "px-2.5" : "px-4 gap-2"
              }`}
            >
              {isCollapsed ? (
                <User className="w-4 h-4" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </>
              )}
            </button>
          )}
        </div>
      </aside>
    );
  }
);

Sidebar.displayName = "Sidebar";
export default Sidebar;
