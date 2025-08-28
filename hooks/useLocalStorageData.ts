import { useMemo, useCallback } from 'react';
import { Provider } from '../types/providers';

// Types for better type safety
export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  // Add other conversation properties as needed
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  source: 'server' | 'byok';
  // Add other message properties as needed
}

// Cache for localStorage operations to prevent redundant parsing
const localStorageCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds cache

/**
 * Custom hook for localStorage operations with memoization and caching
 * Provides optimized functions for accessing chat data from localStorage
 */
export const useLocalStorageData = () => {
  // Generic localStorage operations with caching
  const getCachedItem = useCallback(<T>(key: string, parser?: (value: string) => T): T | null => {
    try {
      // Check cache first
      const cached = localStorageCache.get(key);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }

      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const parsed = parser ? parser(stored) : JSON.parse(stored);
      
      // Update cache
      localStorageCache.set(key, { data: parsed, timestamp: Date.now() });
      
      return parsed;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return null;
    }
  }, []);

  const setCachedItem = useCallback((key: string, value: any) => {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      
      // Update cache
      localStorageCache.set(key, { data: value, timestamp: Date.now() });
      
      // Dispatch event for cross-component communication
      window.dispatchEvent(
        new CustomEvent("localStorageChange", {
          detail: { key, value },
        })
      );
      
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
      return false;
    }
  }, []);

  // Clear cache for specific key
  const clearCache = useCallback((key?: string) => {
    if (key) {
      localStorageCache.delete(key);
    } else {
      localStorageCache.clear();
    }
  }, []);

  return useMemo(() => {
    const getConversationsFromLocal = (): Conversation[] => {
      const conversations = getCachedItem<any[]>('chat_conversations');
      if (!conversations) return [];
      
      return conversations.map((conv: any) => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
      }));
    };

    const getMessagesFromLocal = (conversationId: string): Message[] => {
      const messages = getCachedItem<any[]>(`chat_messages_${conversationId}`);
      if (!messages) return [];
      
      return messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
        source: msg.source || 'server' // Default to server for existing messages
      }));
    };

    const getConversationById = (conversationId: string): Conversation | null => {
      const conversations = getConversationsFromLocal();
      return conversations.find(conv => conv.id === conversationId) || null;
    };

    const getUserMessagesBySource = () => {
      try {
        const conversations = getConversationsFromLocal();
        let serverMessageCount = 0;
        let byokMessageCount = 0;

        // Count user messages by source from localStorage
        conversations.forEach((conv: Conversation) => {
          const messages = getMessagesFromLocal(conv.id);
          const userMessages = messages.filter((msg: Message) => msg.role === 'user');
          userMessages.forEach((msg: Message) => {
            if (msg.source === 'server') {
              serverMessageCount++;
            } else if (msg.source === 'byok') {
              byokMessageCount++;
            }
          });
        });

        return {
          serverMessages: serverMessageCount,
          byokMessages: byokMessageCount,
          totalConversations: conversations.length
        };
      } catch (error) {
        console.error('Error counting user messages by source:', error);
        return {
          serverMessages: 0,
          byokMessages: 0,
          totalConversations: 0
        };
      }
    };

    // Provider-specific localStorage operations with improved error handling
    const loadProvidersFromStorage = (key: string, defaultValue: any = []) => {
      const providers = getCachedItem<Provider[]>(key);
      return providers || defaultValue;
    };

    const saveProvidersToStorage = (key: string, providers: Provider[]) => {
      return setCachedItem(key, providers);
    };

    // Bulk operations for better performance
    const bulkLoadFromStorage = (keys: string[]) => {
      const results: Record<string, any> = {};
      keys.forEach(key => {
        results[key] = getCachedItem(key);
      });
      return results;
    };

    const bulkSaveToStorage = (items: Record<string, any>) => {
      const results: Record<string, boolean> = {};
      Object.entries(items).forEach(([key, value]) => {
        results[key] = setCachedItem(key, value);
      });
      return results;
    };

    return { 
      // Original methods
      getConversationsFromLocal, 
      getMessagesFromLocal, 
      getConversationById, 
      getUserMessagesBySource,
      loadProvidersFromStorage,
      saveProvidersToStorage,
      
      // New optimized methods
      getCachedItem,
      setCachedItem,
      clearCache,
      bulkLoadFromStorage,
      bulkSaveToStorage,
    };
  }, [getCachedItem, setCachedItem, clearCache]);
};
