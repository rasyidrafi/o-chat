import { useMemo } from 'react';

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

/**
 * Custom hook for localStorage operations with memoization
 * Provides optimized functions for accessing chat data from localStorage
 */
export const useLocalStorageData = () => {
  return useMemo(() => {
    const getConversationsFromLocal = (): Conversation[] => {
      try {
        const stored = localStorage.getItem('chat_conversations');
        if (!stored) return [];
        
        const conversations = JSON.parse(stored);
        return conversations.map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
        }));
      } catch (error) {
        console.error('Error loading conversations from localStorage:', error);
        return [];
      }
    };

    const getMessagesFromLocal = (conversationId: string): Message[] => {
      try {
        const stored = localStorage.getItem(`chat_messages_${conversationId}`);
        if (!stored) return [];
        
        const messages = JSON.parse(stored);
        return messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
          source: msg.source || 'server' // Default to server for existing messages
        }));
      } catch (error) {
        console.error('Error loading messages from localStorage:', error);
        return [];
      }
    };

    const getConversationById = (conversationId: string): Conversation | null => {
      try {
        const conversations = getConversationsFromLocal();
        return conversations.find(conv => conv.id === conversationId) || null;
      } catch (error) {
        console.error('Error loading conversation by ID:', error);
        return null;
      }
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

    return { 
      getConversationsFromLocal, 
      getMessagesFromLocal, 
      getConversationById, 
      getUserMessagesBySource 
    };
  }, []);
};
