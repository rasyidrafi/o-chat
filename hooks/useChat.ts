import React from 'react';
import { useState, useCallback, useRef } from 'react';
import { ChatMessage, ChatConversation, StreamingState } from '../types/chat';
import { ChatService } from '../services/chatService';
import { ChatMessage as ServiceChatMessage } from '../services/chatService';
import { ChatStorageService } from '../services/chatStorageService';
import { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

export const useChat = () => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    currentMessageId: null,
    controller: null
  });

  const streamingMessageRef = useRef<string>('');

  // Listen to auth state changes
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  // Load conversations on mount and user change
  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      const loadedConversations = await ChatStorageService.loadConversations(user);
      setConversations(loadedConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load conversations when user changes
  React.useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Handle user login - migrate data if needed
  React.useEffect(() => {
    if (user) {
      ChatStorageService.handleUserLogin(user);
    } else {
      ChatStorageService.handleUserLogout();
    }
  }, [user]);

  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  const createNewConversation = useCallback((title: string = 'New Chat', model: string = 'gemini-1.5-flash'): ChatConversation => {
    // Prevent creating new conversation if already creating one
    if (isCreatingNewChat) return currentConversation!;
    
    // Check if we're already on the welcome page (no current conversation or empty conversation)
    if (!currentConversation || currentConversation.messages.length === 0) {
      return currentConversation || {
        id: generateId(),
        title,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        model
      };
    }
    
    setIsCreatingNewChat(true);
    
    const newConversation: ChatConversation = {
      id: generateId(),
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      model
    };

    // Update conversations state immediately
    setConversations(prev => {
      // Check if conversation already exists to prevent duplicates
      const exists = prev.some(conv => conv.id === newConversation.id);
      if (exists) return prev;
      return [newConversation, ...prev];
    });
    setCurrentConversation(newConversation);
    
    // Save to storage
    ChatStorageService.saveConversation(newConversation, user).catch(error => {
      console.error('Error saving new conversation:', error);
    }).finally(() => {
      setIsCreatingNewChat(false);
    });
    
    return newConversation;
  }, [user, isCreatingNewChat, currentConversation]);

  const updateMessage = useCallback((conversationId: string, messageId: string, content: string) => {
    let updatedConversation: ChatConversation | null = null;
    
    setConversations(prev => prev.map(conv =>
      conv.id === conversationId
        ? (updatedConversation = {
            ...conv,
            messages: conv.messages.map(msg =>
              msg.id === messageId ? { ...msg, content } : msg
            ),
            updatedAt: new Date()
          })
        : conv
    ));

    setCurrentConversation(prev => 
      prev && prev.id === conversationId 
        ? (updatedConversation = {
            ...prev,
            messages: prev.messages.map(msg =>
              msg.id === messageId ? { ...msg, content } : msg
            ),
            updatedAt: new Date()
          })
        : prev
    );
    
    // Save updated conversation to storage
    if (updatedConversation) {
      ChatStorageService.saveConversation(updatedConversation, user).catch(error => {
        console.error('Error saving updated conversation:', error);
      });
    }
  }, [user]);

  const sendMessage = useCallback(async (content: string, model: string, source: string = 'system') => {
    if (!content.trim()) return;

    // Create or get current conversation
    let conversation = currentConversation;
    if (!conversation) {
      // Create new conversation with message content as title
      const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
      conversation = {
        id: generateId(),
        title,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        model
      };
      setCurrentConversation(conversation);
    } else if (conversation.messages.length === 0 && conversation.title === 'New Chat') {
      // Update existing empty conversation title with the message content
      const messageTitle = content.slice(0, 50) + (content.length > 50 ? '...' : '');
      conversation = {
        ...conversation,
        title: messageTitle,
        updatedAt: new Date()
      };
      
      // Update the conversation in state immediately
      setCurrentConversation(conversation);
      setConversations(prev => prev.map(conv => 
        conv.id === conversation!.id ? conversation! : conv
      ));
    }

    // Create user message
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    // Create AI message
    const aiMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: '',
      model,
      isStreaming: true,
      timestamp: new Date(Date.now() + 1) // Ensure AI message has slightly later timestamp
    };

    // Update conversation with both messages
    const updatedConversation = {
      ...conversation,
      messages: [...conversation.messages, userMessage, aiMessage],
      updatedAt: new Date()
    };

    // Update conversations state - handle both existing and new conversations
    setConversations(prev => {
      const existingIndex = prev.findIndex(conv => conv.id === conversation!.id);
      if (existingIndex >= 0) {
        // Update existing conversation
        const newConversations = [...prev];
        newConversations[existingIndex] = updatedConversation;
        return newConversations;
      } else {
        // Add new conversation to the beginning
        return [updatedConversation, ...prev];
      }
    });
    setCurrentConversation(updatedConversation);

    // Save conversation with user message immediately
    try {
      await ChatStorageService.saveConversation({
        ...updatedConversation,
        messages: [...conversation.messages, userMessage] // Only save user message initially
      }, user);
    } catch (error) {
      console.error('Error saving user message:', error);
    }

    if (source !== 'system') return;

    // Start streaming
    const controller = new AbortController();
    setStreamingState({
      isStreaming: true,
      currentMessageId: aiMessage.id,
      controller
    });

    streamingMessageRef.current = '';

    try {
      // Build conversation history
      const historyMessages: ServiceChatMessage[] = [...conversation.messages, userMessage].map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

      // Define callback functions separately
      const onChunkCallback = (chunk: string) => {
        streamingMessageRef.current += chunk;
        updateMessage(updatedConversation.id, aiMessage.id, streamingMessageRef.current);
      };

      const onCompleteCallback = () => {
        // Mark message as complete
        setConversations(prev => prev.map(conv =>
          conv.id === updatedConversation.id
            ? {
                ...conv,
                messages: conv.messages.map(msg =>
                  msg.id === aiMessage.id ? { ...msg, isStreaming: false } : msg
                )
              }
            : conv
        ));

        setCurrentConversation(prev => 
          prev && prev.id === updatedConversation.id
            ? {
                ...prev,
                messages: prev.messages.map(msg =>
                  msg.id === aiMessage.id ? { ...msg, isStreaming: false } : msg
                )
              }
            : prev
        );

        // Save final conversation with complete AI message
        setConversations(current => {
          const finalConv = current.find(conv => conv.id === updatedConversation.id);
          if (finalConv) {
            ChatStorageService.saveConversation(finalConv, user).catch(error => {
              console.error('Error saving final conversation:', error);
            });
          }
          return current;
        });

        setStreamingState({
          isStreaming: false,
          currentMessageId: null,
          controller: null
        });
        streamingMessageRef.current = '';
      };

      const onErrorCallback = (error: Error) => {
        // Handle error
        const errorMessage = `Error: ${error.message}`;
        updateMessage(updatedConversation.id, aiMessage.id, errorMessage);

        setConversations(prev => prev.map(conv =>
          conv.id === updatedConversation.id
            ? {
                ...conv,
                messages: conv.messages.map(msg =>
                  msg.id === aiMessage.id ? { ...msg, isError: true, isStreaming: false } : msg
                )
              }
            : conv
        ));

        setCurrentConversation(prev => 
          prev && prev.id === updatedConversation.id
            ? {
                ...prev,
                messages: prev.messages.map(msg =>
                  msg.id === aiMessage.id ? { ...msg, isError: true, isStreaming: false } : msg
                )
              }
            : prev
        );

        // Save error conversation
        setConversations(current => {
          const errorConv = current.find(conv => conv.id === updatedConversation.id);
          if (errorConv) {
            ChatStorageService.saveConversation(errorConv, user).catch(error => {
              console.error('Error saving error conversation:', error);
            });
          }
          return current;
        });

        setStreamingState({
          isStreaming: false,
          currentMessageId: null,
          controller: null
        });
        streamingMessageRef.current = '';
      };

      await ChatService.sendMessage(
        model,
        historyMessages,
        onChunkCallback,
        onCompleteCallback,
        onErrorCallback,
        user,
        controller
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateMessage(updatedConversation.id, aiMessage.id, `Error: ${errorMessage}`);

      setConversations(prev => prev.map(conv =>
        conv.id === updatedConversation.id
          ? {
              ...conv,
              messages: conv.messages.map(msg =>
                msg.id === aiMessage.id ? { ...msg, isError: true, isStreaming: false } : msg
              )
            }
          : conv
      ));

      setCurrentConversation(prev => 
        prev && prev.id === updatedConversation.id
          ? {
              ...prev,
              messages: prev.messages.map(msg =>
                msg.id === aiMessage.id ? { ...msg, isError: true, isStreaming: false } : msg
              )
            }
          : prev
      );

      // Save error conversation
      setConversations(current => {
        const errorConv = current.find(conv => conv.id === updatedConversation.id);
        if (errorConv) {
          ChatStorageService.saveConversation(errorConv, user).catch(error => {
            console.error('Error saving error conversation:', error);
          });
        }
        return current;
      });

      setStreamingState({
        isStreaming: false,
        currentMessageId: null,
        controller: null
      });
      streamingMessageRef.current = '';
    }
  }, [currentConversation, createNewConversation, updateMessage, user]);

  const stopStreaming = useCallback(() => {
    if (streamingState.controller) {
      streamingState.controller.abort();
    }
    setStreamingState({
      isStreaming: false,
      currentMessageId: null,
      controller: null
    });
    streamingMessageRef.current = '';
  }, [streamingState]);

  const selectConversation = useCallback((conversation: ChatConversation | null) => {
    setCurrentConversation(conversation);
  }, []);

  const deleteConversation = useCallback((conversationId: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(null);
    }
    
    // Delete from storage
    ChatStorageService.deleteConversation(conversationId, user).catch(error => {
      console.error('Error deleting conversation:', error);
    });
  }, [currentConversation, user]);

  return {
    conversations,
    currentConversation,
    streamingState,
    isLoading,
    isCreatingNewChat,
    user,
    sendMessage,
    stopStreaming,
    createNewConversation,
    selectConversation,
    deleteConversation,
    loadConversations
  };
}