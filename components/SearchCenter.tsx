import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X } from './Icons';
import { useChat } from '../hooks/useChat';

interface SearchCenterProps {
  isOpen: boolean;
  onClose: () => void;
  chat: ReturnType<typeof useChat>;
}

const SearchCenter: React.FC<SearchCenterProps> = ({ isOpen, onClose, chat }) => {
  const {
    conversations,
    currentConversation,
    selectConversation,
    setSearchQuery,
    filteredConversations,
    isSearching,
    searchConversations,
    clearSearch
  } = chat;

  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Clear local search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setLocalSearchQuery('');
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Function to highlight search terms
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded text-zinc-900 dark:text-zinc-100">$1</mark>');
  };

  // Debounced search function
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
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setLocalSearchQuery(query);
    debouncedSearch(query);
  };

  // Clear search
  const handleClearSearch = () => {
    setLocalSearchQuery('');
    clearSearch();
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  // Handle conversation selection
  const handleConversationSelect = (conversation: any) => {
    selectConversation(conversation);
    onClose();
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const formatDate = (date: Date) => {
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
  };

  // Determine which conversations to display
  const displayConversations = localSearchQuery.trim() ? filteredConversations : conversations.slice(0, 20); // Show recent 20 when no search

  // Group conversations by date
  const groupedConversations = displayConversations.reduce((groups: { [key: string]: typeof displayConversations }, conversation) => {
    const dateKey = formatDate(conversation.updatedAt);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(conversation);
    return groups;
  }, {});

  // Define the order of groups
  const groupOrder = ['Today', 'Yesterday', 'Last 7 days', 'Last 30 days', 'Older'];
  
  // Sort the grouped conversations by the defined order
  const orderedGroups = groupOrder
    .filter(group => groupedConversations[group] && groupedConversations[group].length > 0)
    .map(group => [group, groupedConversations[group]] as [string, typeof displayConversations]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] transition-opacity duration-300 ease-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Search Center Modal */}
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 px-4">
        <div 
          className={`bg-white dark:bg-[#1c1c1c] rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden transition-all duration-300 ease-out ${
            isOpen 
              ? 'opacity-100 scale-100 translate-y-0' 
              : 'opacity-0 scale-95 translate-y-4'
          }`}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
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
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <div className="text-sm">Searching conversations...</div>
              </div>
            ) : (
              <>
                {/* Show search results or recent conversations */}
                {orderedGroups.length > 0 ? (
                  orderedGroups.map(([dateGroup, convs]) => (
                    <div key={dateGroup} className="mb-6 last:mb-2">
                      <div className="px-6 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider sticky top-0 bg-white dark:bg-[#1c1c1c]">
                        {localSearchQuery.trim() ? `${dateGroup} (${convs.length} result${convs.length !== 1 ? 's' : ''})` : dateGroup}
                      </div>
                      <div className="space-y-1">
                        {convs.map((conversation) => (
                          <button
                            key={conversation.id}
                            onClick={() => handleConversationSelect(conversation)}
                            className={`w-full text-left px-6 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group ${
                              currentConversation?.id === conversation.id
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
                                  {localSearchQuery.trim() ? (
                                    <span 
                                      dangerouslySetInnerHTML={{
                                        __html: highlightText(conversation.title || 'Untitled Conversation', localSearchQuery)
                                      }}
                                    />
                                  ) : (
                                    conversation.title || 'Untitled Conversation'
                                  )}
                                </div>
                                {conversation.messages?.[0]?.content && (
                                  <div className="text-sm text-zinc-500 dark:text-zinc-400 overflow-hidden">
                                    <div 
                                      className="overflow-hidden"
                                      style={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        lineHeight: '1.4'
                                      }}
                                    >
                                      {localSearchQuery.trim() ? (
                                        <span 
                                          dangerouslySetInnerHTML={{
                                            __html: highlightText(
                                              (() => {
                                                const content = conversation.messages[0].content;
                                                const text = typeof content === 'string' 
                                                  ? content 
                                                  : content.filter(item => item.type === 'text').map(item => item.text).join(' ');
                                                return text.substring(0, 150) + (text.length > 150 ? '...' : '');
                                              })(),
                                              localSearchQuery
                                            )
                                          }}
                                        />
                                      ) : (
                                        <>
                                          {(() => {
                                            const content = conversation.messages[0].content;
                                            const text = typeof content === 'string' 
                                              ? content 
                                              : content.filter(item => item.type === 'text').map(item => item.text).join(' ');
                                            return text.substring(0, 150);
                                          })()}
                                          {(() => {
                                            const content = conversation.messages[0].content;
                                            const text = typeof content === 'string' 
                                              ? content 
                                              : content.filter(item => item.type === 'text').map(item => item.text).join(' ');
                                            return text.length > 150 && '...';
                                          })()}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                )}
                                <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                                  {conversation.updatedAt.toLocaleDateString()} at {conversation.updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-zinc-500 dark:text-zinc-400 py-12">
                    {localSearchQuery.trim() ? (
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
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchCenter;
