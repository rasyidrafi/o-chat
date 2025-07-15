import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Search, User, X, LogIn, Plus, Check } from './Icons';
import { User as FirebaseUser } from 'firebase/auth';
import Button from './ui/Button';
import { useChat } from '../hooks/useChat';

interface SidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  user: FirebaseUser | null;
  onLoginClick: () => void;
  onSignOutClick: () => void;
  chat: ReturnType<typeof useChat>;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileMenuOpen, setIsMobileMenuOpen, isCollapsed, user, onLoginClick, onSignOutClick, chat }) => {
  const { 
    conversations, 
    currentConversation, 
    selectConversation, 
    createNewConversation, 
    deleteConversation, 
    isCreatingNewChat, 
    isLoading,
    isLoadingMore,
    hasMoreConversations,
    loadMoreConversations
  } = chat;
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Handle scroll to load more conversations
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px threshold
      
      if (isNearBottom && hasMoreConversations && !isLoadingMore && !isLoading) {
        loadMoreConversations();
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [hasMoreConversations, isLoadingMore, isLoading, loadMoreConversations]);

  const handleNewChat = () => {
    // Only redirect to welcome page by clearing current conversation
    selectConversation(null);
    setIsMobileMenuOpen(false);
  };

  const handleConversationSelect = (conversation: any) => {
    console.log('Sidebar: handleConversationSelect called with:', conversation.id, conversation.title);
    selectConversation(conversation);
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

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return 'Today';
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'long' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Group conversations by date
  const groupedConversations = conversations.reduce((groups: { [key: string]: typeof conversations }, conversation) => {
    const dateKey = formatDate(conversation.updatedAt);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(conversation);
    return groups;
  }, {});

  return (
    <aside className={`fixed md:relative top-0 left-0 h-full flex flex-col bg-zinc-100 dark:bg-[#111111] text-zinc-600 dark:text-zinc-400 p-4 z-40
                       transition-all duration-300 ease-in-out
                       md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                       w-64 ${isCollapsed ? 'md:w-20' : ''}`}>

      <div className={`flex items-center justify-between ${isCollapsed ? 'mb-0' : 'mb-4'}`}>
        <div className={`flex items-center justify-center gap-2 w-full ${isCollapsed ? 'md:hidden' : 'flex'}`}>
          <span className="font-bold text-lg text-zinc-900 dark:text-white text-center w-full">O-Chat</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded md:hidden" aria-label="Close menu">
          <X className="w-5 h-5" />
        </button>
      </div>

      <Button 
        onClick={handleNewChat}
        disabled={isCreatingNewChat}
        className={`w-full mb-4 ${isCollapsed ? 'md:px-2.5' : ''}`}
      >
        {isCollapsed ? <Plus className="w-5 h-5" /> : (isCreatingNewChat ? 'Creating...' : 'New Chat')}
      </Button>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder={isCollapsed ? '' : "Search your threads..."}
          className="w-full bg-white dark:bg-[#1c1c1c] border border-zinc-300 dark:border-zinc-700 rounded-md py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
      </div>

      <div 
        ref={scrollContainerRef}
        className={`flex-grow overflow-y-auto block thin-scrollbar ${isCollapsed ? 'md:hidden' : ''}`}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-zinc-500 dark:text-zinc-400">
            <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <div className="text-sm">Loading conversations...</div>
          </div>
        ) : (
          <>
            {Object.entries(groupedConversations).map(([dateGroup, convs]) => (
              <div key={dateGroup} className="mb-4">
                <div className="text-xs font-semibold text-zinc-500 mb-2">{dateGroup}</div>
                <ul className="space-y-1">
                  {convs.map((conversation) => (
                    <li 
                      key={conversation.id}
                      onClick={() => handleConversationSelect(conversation)}
                      className={`py-2 px-3 text-sm rounded-md cursor-pointer transition-colors group relative ${
                        currentConversation?.id === conversation.id
                          ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      <div className="truncate pr-6">{conversation.title}</div>
                      
                      {/* Delete confirmation buttons */}
                      {confirmingDelete === conversation.id ? (
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-zinc-200 dark:bg-zinc-700 rounded p-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCancel();
                            }}
                            className="p-1 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded transition-colors"
                            aria-label="Cancel delete"
                          >
                            <X className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConfirm(conversation.id);
                            }}
                            className="p-1 hover:bg-red-500 hover:text-white rounded transition-colors"
                            aria-label="Confirm delete"
                          >
                            <Check className="w-3 h-3 text-red-500 hover:text-white" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => handleDeleteClick(e, conversation)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded transition-all"
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
            
            {/* Loading more indicator */}
            {isLoadingMore && (
              <div className="flex flex-col items-center justify-center py-4 text-zinc-500 dark:text-zinc-400">
                <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                <div className="text-xs">Loading more...</div>
              </div>
            )}
            
            {conversations.length === 0 && (
              <div className="text-center text-zinc-500 dark:text-zinc-400 text-sm py-8">
                No conversations yet.<br />
                Start a new chat to begin!
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-auto">
        {user ? (
          <div className="flex flex-col">
            <div className="flex items-center p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer">
              <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email?.charAt(0).toUpperCase() || 'U'}&background=random`} alt={user.displayName || user.email || 'User avatar'} className="w-8 h-8 rounded-full" />
              <div className={`ml-3 flex-grow block overflow-hidden ${isCollapsed ? 'md:hidden' : ''}`}>
                <div className="font-semibold text-zinc-900 dark:text-white truncate">{user.displayName || user.email}</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Signed In</div>
              </div>
            </div>
             <div className={`mt-2 ${isCollapsed ? 'md:hidden' : ''}`}>
               <Button variant="secondary" size="sm" className="w-full" onClick={onSignOutClick}>
                  Sign Out
               </Button>
            </div>
          </div>
        ) : (
          <button onClick={onLoginClick} className={`flex items-center justify-center w-full text-zinc-900 dark:text-white font-semibold py-3.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors ${isCollapsed ? 'px-2.5' : 'px-4 gap-2'}`}>
            {isCollapsed ? <User className="w-5 h-5" /> : (
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
};

export default Sidebar;