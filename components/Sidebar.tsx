import React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Search, User, X, LogIn, Plus, Check, CommandK } from "./Icons";
import { User as FirebaseUser } from "firebase/auth";
import Button from "./ui/Button";
import { useChat } from "../hooks/useChat";
import { useAuth } from "../contexts/AuthContext";
import { Tab as SettingsTab } from "./SettingsPage";
import { useSettingsContext } from "../contexts/SettingsContext";

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

  // Generate a consistent background color based on user info using theme colors
  const getBackgroundColor = () => {
    const userString = user.displayName || user.email || user.uid;
    const hash = userString.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    // Use a deterministic hue based on user data
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  // Always show initials to avoid Google's rate limiting issues
  // This provides a consistent, professional look without API dependency
  return (
    <div
      className={`${className} flex items-center justify-center text-white font-semibold rounded-full`}
      style={{ 
        width: size, 
        height: size, 
        fontSize: size * 0.4,
        backgroundColor: getBackgroundColor()
      }}
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
    ref // <-- forwarded ref
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
      // Search functionality
      // setSearchQuery,
      filteredConversations,
      // isSearching,
      // searchConversations,
    } = chat;
    const [confirmingDelete, setConfirmingDelete] = useState<string | null>(
      null
    );
    const [localSearchQuery] = useState("");
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Debounced search function
    // const debouncedSearch = useCallback(
    //   (query: string) => {
    //     if (searchTimeoutRef.current) {
    //       clearTimeout(searchTimeoutRef.current);
    //     }

    //     searchTimeoutRef.current = setTimeout(() => {
    //       // Only update search query state, let searchConversations handle the actual search
    //       setSearchQuery(query);
    //       if (query.trim()) {
    //         searchConversations(query);
    //       } else {
    //         // If query is empty, clear search immediately
    //         clearSearch();
    //       }
    //     }, 300); // 300ms debounce
    //   },
    //   [setSearchQuery, searchConversations, clearSearch]
    // );

    // Handle search input change
    // const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //   const query = e.target.value;
    //   setLocalSearchQuery(query);
    //   debouncedSearch(query);
    // };

    // Clear search
    // const handleClearSearch = () => {
    //   setLocalSearchQuery("");
    //   clearSearch();
    //   if (searchTimeoutRef.current) {
    //     clearTimeout(searchTimeoutRef.current);
    //   }
    // };

    // Cleanup timeouts on unmount
    useEffect(() => {
      return () => {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
      };
    }, []);

    // Keyboard shortcut handler for Command/Ctrl + K
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
        if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
          event.preventDefault();
          onOpenSearchCenter();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [onOpenSearchCenter]);

    // Determine which conversations to display (memoized)
    const displayConversations = React.useMemo(() => {
      return localSearchQuery.trim() ? filteredConversations : conversations;
    }, [localSearchQuery, filteredConversations, conversations]);

    // Platform detection for keyboard shortcut display
    const [isMac, setIsMac] = React.useState(false);
    
    React.useEffect(() => {
      setIsMac(navigator?.platform?.toLowerCase().includes('mac') || false);
    }, []);

    // Handle scroll to load more conversations
    useEffect(() => {
      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) return;

      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px threshold

        // If searching, don't load more on scroll - search will handle loading more
        if (localSearchQuery.trim()) return;

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
    }, [
      hasMoreConversations,
      isLoadingMore,
      isLoading,
      loadMoreConversations,
      localSearchQuery,
    ]);

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
        className={`shadow-sm ${isMobile ? "p-1" : "p-2"} fixed md:relative top-0 left-0 h-full flex flex-col bg-[var(--color-background)] z-60 transition-all duration-300 ease-in-out md:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } w-64 ${isCollapsed ? "md:w-20" : ""}`}
      >
        <div className="flex-shrink-0 flex flex-col mb-2">
          <Button
            variant="primary"
            onClick={handleNewChat}
            disabled={isCreatingNewChat}
            className={`truncate py-2 mx-2 my-2 px-2 text-white`}
            size="none"
          >
            {isCollapsed ? (
              <Plus className="w-4 h-4" />
            ) : (
              <div className="text-[.875rem] font-[500] flex items-center justify-center gap-4 w-full">
                <span>New Chat</span>
              </div>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={onOpenSearchCenter}
            className={`shadow-sm text-[var(--color-foreground)]/70 hover:text-[var(--color-foreground)] bg-[var(--color-background)] hover:bg-[var(--color-muted)] truncate text-sm py-2 mx-2 px-4 border border-[var(--color-border)]`}
            size="none"
          >
            {isCollapsed ? (
              <Search className="w-4 h-4" />
            ) : (
              <div className="text-[.875rem] font-[500] flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 flex-shrink-0" />
                  <span>Search chats</span>
                </div>
                <div className="flex items-center gap-1 text-[.75rem]">
                  <CommandK isMac={isMac} />
                </div>
              </div>
            )}
          </Button>
        </div>

        <div
          ref={scrollContainerRef}
          className={`py-2 flex-grow overflow-y-auto overflow-x-hidden block thin-scrollbar relative ${
            isCollapsed ? "md:hidden" : ""
          }`}
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent 0px, black 16px, black calc(100% - 16px), transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0px, black 16px, black calc(100% - 16px), transparent 100%)",
          }}
        >
          {isLoading ? (
            <div className="px-2 py-2">
            </div>
          ) : (
            <>
              {/* Show search loading indicator */}
              {/* {isSearching && (
                <div className="px-2">
                  <SkeletonConversationGroup title="Searching..." count={3} />
                </div>
              )} */}

              {/* Show search results or all conversations */}
              {orderedGroups.map(([dateGroup, convs]) => (
                <div key={dateGroup} className="mb-4 last:mb-0">
                  <div className="font-[500] text-[var(--color-foreground)]/60 text-[.75rem] mb-1.5 px-4">
                    {localSearchQuery.trim()
                      ? `${dateGroup} (${convs.length} result${
                          convs.length !== 1 ? "s" : ""
                        })`
                      : dateGroup}
                  </div>
                  <ul className="space-y-0 px-2">
                    {convs.map((conversation) => (
                      <li
                        key={conversation.id}
                        onClick={() => handleConversationSelect(conversation)}
                        className={`mb-[4px] last:mb-0 text-[.875rem] hover:text-[var(--color-foreground)] capitalize py-[6px] px-[8px] leading-[20px] rounded-[var(--radius)] cursor-pointer transition-colors group relative hover:bg-[var(--color-muted)] ${
                          activeConversationId === conversation.id
                            ? "text-[var(--color-foreground)] bg-[var(--color-muted)]"
                            : "text-[var(--color-foreground)]/70"
                        }`}
                      >
                        <div className="truncate">
                          {localSearchQuery.trim() ? (
                            // Highlight search terms in results - safer innerHTML approach
                            <span
                              dangerouslySetInnerHTML={{
                                __html: conversation.title.replace(
                                  new RegExp(
                                    `(${localSearchQuery
                                      .trim()
                                      .replace(
                                        /[.*+?^${}()|[\]\\]/g,
                                        "\\$&"
                                      )})`,
                                    "gi"
                                  ),
                                  '<mark class="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">$1</mark>'
                                ),
                              }}
                            />
                          ) : (
                            conversation.title
                          )}
                        </div>

                        {/* Delete confirmation buttons */}
                        {confirmingDelete === conversation.id ? (
                          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-zinc-200 dark:bg-zinc-700 rounded-lg p-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCancel();
                              }}
                              className="p-1 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded transition-colors cursor-pointer"
                              aria-label="Cancel delete"
                            >
                              <X className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteConfirm(conversation.id);
                              }}
                              className="p-1 hover:bg-red-500 hover:text-white rounded-[var(--radius)] transition-colors cursor-pointer text-red-500 hover:text-white"
                              aria-label="Confirm delete"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => handleDeleteClick(e, conversation)}
                            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 bg-[var(--color-muted)] hover:bg-[var(--color-muted)]/80 rounded-[var(--radius)] transition-all shadow-[var(--shadow-sm)] cursor-pointer"
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

              {/* Loading more indicator - only show when not searching */}
              {/* {!localSearchQuery.trim() && isLoadingMore && (
                <div className="px-2">
                  <SkeletonConversationGroup count={2} />
                </div>
              )} */}

              {/* No results messages */}
              {/* {localSearchQuery.trim() &&
                filteredConversations.length === 0 &&
                !isSearching && (
                  <div className="flex items-center justify-center h-full text-center text-zinc-500 dark:text-zinc-400 text-sm py-8 px-4">
                    No conversations found for "
                    <span className="font-medium">{localSearchQuery}</span>".
                    <br />
                    <button
                      onClick={handleClearSearch}
                      className="text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 underline mt-2"
                    >
                      Clear search
                    </button>
                  </div>
                )} */}

              {!localSearchQuery.trim() && conversations.length === 0 && (
                <div className="text-[.875rem] font-[500] flex items-center justify-center px-4 h-full text-center text-[var(--color-foreground)]/60 py-8">
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
                className="flex truncate justify-center px-2 py-1 items-center rounded-[var(--radius)] hover:bg-[var(--color-muted)] cursor-pointer"
                onClick={() => onOpenSettings?.("Account")}
              >
                <UserAvatar user={user!} size={32} />
                <div
                  className={`ml-3 flex-grow block overflow-hidden ${
                    isCollapsed ? "md:hidden" : ""
                  }`}
                >
                  <div className="text-[var(--color-foreground)] text-[.875rem] truncate">
                    {user!.displayName || user!.email}
                  </div>
                  <div className="text-[var(--color-foreground)]/70 text-[.75rem] truncate">
                    Signed In
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className={`text-[var(--color-foreground)] truncate flex items-center justify-center w-full py-3.5 rounded-[var(--radius)] transition-colors hover:bg-[var(--color-muted)] cursor-pointer ${
                isCollapsed ? "px-2.5" : "px-4 gap-2"
              }`}
            >
              {isCollapsed ? (
                <User className="w-4 h-4" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span className="text-[.875rem] font-[500]">Login</span>
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
