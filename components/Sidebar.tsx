import React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Search, User, X, LogIn, Plus, Check, Edit } from "./Icons";
import { User as FirebaseUser } from "firebase/auth";
import Button from "./ui/Button";
import { useChat } from "../hooks/useChat";
import { useAuth } from "../contexts/AuthContext";
import { SkeletonConversationGroup } from "./ui/Skeleton";
import { Tab as SettingsTab } from "./SettingsPage";

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

  // Generate a consistent background color based on user info
  const getBackgroundColor = () => {
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
    ];
    const userString = user.displayName || user.email || user.uid;
    const hash = userString.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  // Always show initials to avoid Google's rate limiting issues
  // This provides a consistent, professional look without API dependency
  return (
    <div
      className={`${className} ${getBackgroundColor()} flex items-center justify-center text-white font-semibold rounded-full`}
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
    ref // <-- forwarded ref
  ) => {
    const location = useLocation();
    const { user, isSignedIn } = useAuth();

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
      clearSearch,
    } = chat;
    const [confirmingDelete, setConfirmingDelete] = useState<string | null>(
      null
    );
    const [localSearchQuery, setLocalSearchQuery] = useState("");
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

    // Determine which conversations to display (memoized)
    const displayConversations = React.useMemo(() => {
      return localSearchQuery.trim() ? filteredConversations : conversations;
    }, [localSearchQuery, filteredConversations, conversations]);

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
        className={`fixed md:relative top-0 left-0 h-full flex flex-col bg-[#efeae7] dark:bg-[#181818] text-zinc-600 dark:text-zinc-400 z-60 transition-all duration-300 ease-in-out md:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } w-64 ${isCollapsed ? "md:w-20" : ""}`}
      >
        <div className="flex-shrink-0 flex flex-col">
          <Button
            variant="ghost"
            onClick={handleNewChat}
            disabled={isCreatingNewChat}
            className={`truncate text-sm py-2 mx-2 mt-2 px-2 text-zinc-700 dark:text-zinc-300 hover:bg-[#e3dedb]`}
            size="none"
          >
            {isCollapsed ? (
              <Plus className="w-4 h-4" />
            ) : (
              <div className="flex items-center justify-start gap-2 w-full">
                <Edit className="w-4 h-4 flex-shrink-0" />
                <span>New chat</span>
              </div>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={onOpenSearchCenter}
            className={`truncate text-sm py-2 mx-2 px-2 text-zinc-700 dark:text-zinc-300 hover:bg-[#e3dedb]`}
            size="none"
          >
            {isCollapsed ? (
              <Search className="w-4 h-4" />
            ) : (
              <div className="flex items-center justify-start gap-2 w-full">
                <Search className="w-4 h-4 flex-shrink-0" />
                <span>Search chat</span>
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
                  <div className="text-xs text-zinc-700 dark:text-zinc-300/50 mb-2 px-4">
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
                        className={`p-2 text-zinc-700 dark:text-zinc-300 text-sm rounded-lg cursor-pointer transition-colors group relative hover:bg-[#e3dedb] dark:hover:bg-zinc-800/50 ${
                          activeConversationId === conversation.id
                            ? "bg-[#e3dedb] dark:bg-zinc-800"
                            : ""
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
                              className="p-1 hover:bg-red-500 hover:text-white rounded transition-colors cursor-pointer text-red-500 hover:text-white"
                              aria-label="Confirm delete"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => handleDeleteClick(e, conversation)}
                            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-lg transition-all shadow-sm cursor-pointer"
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
                <div className="flex items-center justify-center px-4 h-full text-center text-zinc-500 dark:text-zinc-400 text-sm py-8">
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
                className="flex truncate justify-center px-2 py-1 items-center rounded-lg hover:bg-[#e3dedb] dark:hover:bg-zinc-800 cursor-pointer"
                onClick={() => onOpenSettings?.("Account")}
              >
                <UserAvatar user={user!} size={32} />
                <div
                  className={`ml-3 flex-grow block overflow-hidden ${
                    isCollapsed ? "md:hidden" : ""
                  }`}
                >
                  <div className="text-zinc-900 text-sm dark:text-white truncate">
                    {user!.displayName || user!.email}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Signed In
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className={`truncate flex items-center justify-center w-full text-zinc-900 dark:text-white font-semibold py-3.5 rounded-lg hover:bg-[#e3dedb] dark:hover:bg-zinc-700 transition-colors ${
                isCollapsed ? "px-2.5" : "px-4 gap-2"
              }`}
            >
              {isCollapsed ? (
                <User className="w-5 h-5" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Login
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
