import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from './Icons';
import { useChat } from '../hooks/useChat';
import { ChatConversation } from '../types/chat';
import { useNavigate } from 'react-router-dom';

interface SearchCenterProps {
  isOpen: boolean;
  onClose: () => void;
  chat: ReturnType<typeof useChat>;
  animationsDisabled?: boolean;
}

interface GroupedConversations {
  [key: string]: ChatConversation[];
}

const SearchCenter: React.FC<SearchCenterProps> = ({ isOpen, onClose, chat, animationsDisabled = false }) => {
  const {
    conversations,
    currentConversation,
    setSearchQuery,
    filteredConversations,
    isSearching,
    searchConversations,
    clearSearch
  } = chat;

  const navigate = useNavigate();
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      const timeoutId = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  // Clear local search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setLocalSearchQuery('');
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
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  // Memoized function to highlight search terms
  const highlightText = useCallback((text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded text-zinc-900 dark:text-zinc-100">$1</mark>');
  }, []);

  // Debounced search function - memoized
  const debouncedSearch = useCallback((query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(query);
      searchConversations(query);
    }, 300);
  }, [setSearchQuery, searchConversations]);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setLocalSearchQuery(query);
    debouncedSearch(query);
  }, [debouncedSearch]);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setLocalSearchQuery('');
    clearSearch();
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, [clearSearch]);

  // Handle conversation selection
  const handleConversationSelect = useCallback((conversation: ChatConversation) => {
    navigate(`/c/${conversation.id}`);
    onClose();
  }, [onClose]);

  // Memoized date formatting function
  const formatDate = useCallback((date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const conversationDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (conversationDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (conversationDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else if (conversationDate >= weekAgo) {
      return 'Last 7 days';
    } else if (conversationDate >= monthAgo) {
      return 'Last 30 days';
    } else {
      return 'Older';
    }
  }, []);

  // Memoized display conversations
  const displayConversations = useMemo(() => {
    return localSearchQuery.trim() ? filteredConversations : conversations.slice(0, 20);
  }, [localSearchQuery, filteredConversations, conversations]);

  // Memoized grouped conversations
  const groupedConversations = useMemo((): GroupedConversations => {
    return displayConversations.reduce((groups: GroupedConversations, conversation) => {
      const dateKey = formatDate(conversation.updatedAt);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(conversation);
      return groups;
    }, {});
  }, [displayConversations, formatDate]);

  // Memoized ordered groups
  const orderedGroups = useMemo(() => {
    const groupOrder = ['Today', 'Yesterday', 'Last 7 days', 'Last 30 days', 'Older'];
    
    return groupOrder
      .filter(group => groupedConversations[group] && groupedConversations[group].length > 0)
      .map(group => [group, groupedConversations[group]] as [string, ChatConversation[]]);
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
        className={`w-full text-left px-6 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group ${
          isActive
            ? 'bg-purple-50 dark:bg-purple-900/20 border-r-2 border-purple-500'
            : ''
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs font-medium">
              {conversation.title?.charAt(0).toUpperCase() || 'C'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-zinc-900 dark:text-white truncate mb-1">
              {searchQuery.trim() ? (
                <span 
                  dangerouslySetInnerHTML={{
                    __html: highlightText(conversation.title || 'Untitled Conversation', searchQuery)
                  }}
                />
              ) : (
                conversation.title || 'Untitled Conversation'
              )}
            </div>
            <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              {conversation.updatedAt.toLocaleDateString()} at {conversation.updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
          className="fixed inset-0 z-[100] flex items-start justify-center pt-16 px-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ duration: animationsDisabled ? 0 : 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            className="bg-white dark:bg-[#1c1c1c] rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
            tabIndex={-1}
          >
            {/* Header with search */}
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                  Search conversations...
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  aria-label="Close search"
                >
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>
              
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={localSearchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search your threads..."
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-3 pl-10 pr-10 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {localSearchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Results */}
            <div 
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto thin-scrollbar"
              style={{
                maskImage: 'linear-gradient(to bottom, transparent 0px, black 16px, black calc(100% - 16px), transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, black 16px, black calc(100% - 16px), transparent 100%)'
              }}
            >
              {isSearching ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-500 dark:text-zinc-400">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-3" />
                  <div className="text-sm">Searching conversations...</div>
                </div>
              ) : hasResults ? (
                orderedGroups.map(([dateGroup, convs]) => (
                  <div key={dateGroup} className="mb-6 last:mb-2">
                    <div className="px-6 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider sticky top-0 bg-white dark:bg-[#1c1c1c]">
                      {hasSearchQuery ? `${dateGroup} (${convs.length} result${convs.length !== 1 ? 's' : ''})` : dateGroup}
                    </div>
                    <div className="space-y-1">
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
                <div className="text-center text-zinc-500 dark:text-zinc-400 py-12">
                  {hasSearchQuery ? (
                    <>
                      <div className="text-lg mb-2">No conversations found</div>
                      <div className="text-sm">
                        No conversations found for "<span className="font-medium">{localSearchQuery}</span>"
                      </div>
                      <button
                        onClick={handleClearSearch}
                        className="text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 underline mt-3 text-sm"
                      >
                        Clear search
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="text-lg mb-2">No conversations yet</div>
                      <div className="text-sm">Start a new chat to begin!</div>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchCenter;