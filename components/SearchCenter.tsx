import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Chat, Clear } from "./Icons";
import { useChat } from "../hooks/useChat";
import { ChatConversation } from "../types/chat";
import { useSettingsContext } from "../contexts/SettingsContext";
import { themes } from "@/constants/themes";
import LoadingState from "./ui/LoadingState";

interface SearchCenterProps {
  isOpen: boolean;
  onClose: () => void;
  chat: ReturnType<typeof useChat>;
  onCloseMobileSidebar?: () => void;
}

interface GroupedConversations {
  [key: string]: ChatConversation[];
}

const SearchCenter: React.FC<SearchCenterProps> = ({
  isOpen,
  onClose,
  chat,
  onCloseMobileSidebar,
}) => {
  const { settings, isMobile } = useSettingsContext();
  const animationsDisabled = settings.animationsDisabled;

  const {
    conversations,
    currentConversation,
    setSearchQuery,
    filteredConversations,
    isSearching,
    searchConversations,
    clearSearch,
    selectConversation,
  } = chat;

  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Clear local search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setLocalSearchQuery("");
    }
  }, [isOpen]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  // Memoized function to highlight search terms
  const highlightText = useCallback((text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(
      `(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    return text.replace(
      regex,
      '<mark class="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded text-zinc-900 dark:text-zinc-100">$1</mark>'
    );
  }, []);

  // Debounced search function - memoized
  const debouncedSearch = useCallback(
    (query: string) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        setSearchQuery(query);
        searchConversations(query);
      }, 300);
    },
    [setSearchQuery, searchConversations]
  );

  // Handle search input change
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setLocalSearchQuery(query);
      debouncedSearch(query);
    },
    [debouncedSearch]
  );

  // Clear search
  const handleClearSearch = useCallback(() => {
    setLocalSearchQuery("");
    clearSearch();
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, [clearSearch]);

  // Handle conversation selection
  const handleConversationSelect = useCallback(
    (conversation: ChatConversation) => {
      selectConversation(conversation.id);
      onClose();

      // Close mobile sidebar when on mobile
      if (isMobile && onCloseMobileSidebar) {
        onCloseMobileSidebar();
      }
    },
    [selectConversation, onClose, isMobile, onCloseMobileSidebar]
  );

  // Memoized date formatting function
  const formatDate = useCallback((date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const conversationDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    if (conversationDate.getTime() === today.getTime()) {
      return "Today";
    } else if (conversationDate.getTime() === yesterday.getTime()) {
      return "Yesterday";
    } else if (conversationDate >= weekAgo) {
      return "Last 7 days";
    } else if (conversationDate >= monthAgo) {
      return "Last 30 days";
    } else {
      return "Older";
    }
  }, []);

  // Memoized display conversations
  const displayConversations = useMemo(() => {
    return localSearchQuery.trim()
      ? filteredConversations
      : conversations.slice(0, 20);
  }, [localSearchQuery, filteredConversations, conversations]);

  // Memoized grouped conversations
  const groupedConversations = useMemo((): GroupedConversations => {
    return displayConversations.reduce(
      (groups: GroupedConversations, conversation) => {
        const dateKey = formatDate(conversation.updatedAt);
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(conversation);
        return groups;
      },
      {}
    );
  }, [displayConversations, formatDate]);

  // Memoized ordered groups
  const orderedGroups = useMemo(() => {
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
          groupedConversations[group] && groupedConversations[group].length > 0
      )
      .map(
        (group) =>
          [group, groupedConversations[group]] as [string, ChatConversation[]]
      );
  }, [groupedConversations]);

  // Memoized conversation item component to prevent unnecessary re-renders
  const ConversationItem = React.memo<{
    conversation: ChatConversation;
    isActive: boolean;
    searchQuery: string;
    onSelect: (conversation: ChatConversation) => void;
    highlightText: (text: string, query: string) => string;
  }>(({ conversation, isActive, searchQuery, onSelect, highlightText }) => {
    const handleClick = useCallback(() => {
      onSelect(conversation);
    }, [conversation, onSelect]);

    return (
      <button
        onClick={handleClick}
        className={`cursor-pointer w-full text-left px-4 py-2 transition-colors group ${
          themes.sidebar.bgHover
        } ${
          isActive
            ? `${themes.sidebar.fgHoverAsFg} ${themes.sidebar.bgHoverAsBg}`
            : themes.sidebar.fg
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0">
            <Chat className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div
              className={`font-light text-sm truncate capitalize`}
            >
              {searchQuery.trim() ? (
                <span
                  dangerouslySetInnerHTML={{
                    __html: highlightText(
                      conversation.title || "Untitled Conversation",
                      searchQuery
                    ),
                  }}
                />
              ) : (
                conversation.title || "Untitled Conversation"
              )}
            </div>
            <div className={`text-xs ${themes.sidebar.fgSecondary}`}>
              {conversation.updatedAt.toLocaleDateString()} •{" "}
              {conversation.updatedAt.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      </button>
    );
  });

  const hasSearchQuery = localSearchQuery.trim();
  const hasResults = orderedGroups.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: animationsDisabled ? 0 : 0.2 }}
          onClick={onClose}
          className={`fixed inset-0 z-[100] flex justify-center ${
            isMobile ? "" : "pt-16 px-4 bg-black/50"
          }`}
        >
          <motion.div
            initial={{ scale: 0.95, y: -20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: -20, opacity: 0 }}
            transition={{
              duration: animationsDisabled ? 0 : 0.2,
              ease: "easeOut",
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            className={`${themes.sidebar.bg} ${
              themes.sidebar.border
            } border-1 w-full flex flex-col overflow-hidden ${
              isMobile
                ? "h-full"
                : "rounded-lg shadow-md max-w-lg h-fit max-h-[calc(100vh-8rem)]"
            }`}
            tabIndex={-1}
          >
            {/* Simplified Header */}
            <div className={`px-2 ${themes.sidebar.border} border-b py-2`}>
              <div className={`relative`}>
                <Search
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${themes.sidebar.fg}`}
                />
                <input
                  type="text"
                  value={localSearchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search conversations..."
                  className={`w-full bg-transparent border-0 py-3 pl-10 pr-10 ${themes.sidebar.fgRaw(
                    "placeholder:"
                  )} ${themes.sidebar.fgHoverAsFg} focus:outline-none text-sm`}
                  autoFocus={!isMobile}
                />
                <button
                  onClick={localSearchQuery ? handleClearSearch : onClose}
                  className={`cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 ${themes.sidebar.fg} transition-colors`}
                  aria-label={
                    localSearchQuery ? "Clear search" : "Close search"
                  }
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Results */}
            <div
              ref={scrollContainerRef}
              className="flex flex-col overflow-y-auto thin-scrollbar scroll-fade min-h-64"
            >
              {isSearching ? (
                <div
                  className={`flex-1 flex flex-col items-center justify-center ${themes.sidebar.fg}`}
                >
                  <LoadingState message="Searching..." />
                </div>
              ) : hasResults ? (
                orderedGroups.map(([dateGroup, convs]) => (
                  <div key={dateGroup}>
                    <div
                      className={`sticky top-0 px-4 py-2 text-xs font-medium z-10 ${themes.sidebar.bg} ${themes.sidebar.fgSecondary}`}
                    >
                      {hasSearchQuery
                        ? `${dateGroup} (${convs.length} result${
                            convs.length !== 1 ? "s" : ""
                          })`
                        : dateGroup}
                    </div>
                    <div>
                      {convs.map((conversation) => (
                        <ConversationItem
                          key={conversation.id}
                          conversation={conversation}
                          isActive={currentConversation?.id === conversation.id}
                          searchQuery={localSearchQuery}
                          onSelect={handleConversationSelect}
                          highlightText={highlightText}
                        />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div
                  className={`flex-1 flex flex-col items-center justify-center text-center text-sm ${themes.sidebar.fg}`}
                >
                  {hasSearchQuery ? "No results found" : "No conversations yet"}
                </div>
              )}
            </div>

            {/* Mobile buttons - bottom right */}
            {isMobile && (
              <div
                className={`absolute bottom-4 right-4 flex text-sm ${themes.sidebar.fg}`}
              >
                <button
                  onClick={onClose}
                  className={`flex items-center justify-center bg-red-500 text-white rounded-lg transition-all duration-200 cursor-pointer w-9 h-9`}
                  aria-label="Close search"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchCenter;
