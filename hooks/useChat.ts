import React from 'react';
import { useState, useCallback, useRef } from 'react';
import { ChatMessage, ChatConversation, StreamingState } from '../types/chat';
import { ChatService } from '../services/chatService';
import { ChatMessage as ServiceChatMessage } from '../services/chatService';
import { ChatStorageService } from '../services/chatStorageService';
import { User } from 'firebase/auth';

export const useChat = (user?: User | null) => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false);
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    currentMessageId: null,
    controller: null
  });

  const streamingMessageRef = useRef<string>('');

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
    if (isCreatingNewChat) return currentConversation!;
    
    setIsCreatingNewChat(true);
    
    const newConversation: ChatConversation = {
      id: generateId(),
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      model
    };

    setConversations(prev => [newConversation, ...prev]);
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
      const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
      conversation = createNewConversation(title, model);
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
      timestamp: new Date()
    };

    // Update conversation with both messages
    const updatedConversation = {
      ...conversation,
      messages: [...conversation.messages, userMessage, aiMessage],
      updatedAt: new Date()
    };

    // Update both states at once
    setConversations(prev => prev.map(conv =>
      conv.id === conversation!.id ? updatedConversation : conv
    ));
    setCurrentConversation(updatedConversation);
    
    // Save conversation with new messages
    ChatStorageService.saveConversation(updatedConversation, user).catch(error => {
      console.error('Error saving conversation with new messages:', error);
    });

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

      await ChatService.sendMessage(
        model,
        historyMessages,
        (chunk: string) => {
          streamingMessageRef.current += chunk;
          updateMessage(updatedConversation.id, aiMessage.id, streamingMessageRef.current);
        },
        () => {
          let finalConversation: ChatConversation | null = null;
          
          // Mark message as complete
          setConversations(prev => prev.map(conv =>
            conv.id === updatedConversation.id
              ? (finalConversation = {
                  ...conv,
                  messages: conv.messages.map(msg =>
                    msg.id === aiMessage.id ? { ...msg, isStreaming: false } : msg
                  )
                })
              : conv
          ));

          setCurrentConversation(prev => 
            prev && prev.id === updatedConversation.id
              ? (finalConversation = {
                  ...prev,
                  messages: prev.messages.map(msg =>
                    msg.id === aiMessage.id ? { ...msg, isStreaming: false } : msg
                  )
                })
              : prev
          );

          // Save final conversation
          if (finalConversation) {
            ChatStorageService.saveConversation(finalConversation, user).catch(error => {
              console.error('Error saving final conversation:', error);
            });
          }

          setStreamingState({
            isStreaming: false,
            currentMessageId: null,
            controller: null
          });
          streamingMessageRef.current = '';
        },
        (error: Error) => {
          let errorConversation: ChatConversation | null = null;
          
          // Handle error
          const errorMessage = `Error: ${error.message}`;
          updateMessage(updatedConversation.id, aiMessage.id, errorMessage);

          setConversations(prev => prev.map(conv =>
            conv.id === updatedConversation.id
              ? (errorConversation = {
                  ...conv,
                  messages: conv.messages.map(msg =>
                    msg.id === aiMessage.id ? { ...msg, isError: true, isStreaming: false } : msg
                  )
                })
              : conv
          ));

          setCurrentConversation(prev => 
            prev && prev.id === updatedConversation.id
              ? (errorConversation = {
                  ...prev,
                  messages: prev.messages.map(msg =>
                    msg.id === aiMessage.id ? { ...msg, isError: true, isStreaming: false } : msg
                  )
                })
              : prev
          );

          // Save error conversation
          if (errorConversation) {
            ChatStorageService.saveConversation(errorConversation, user).catch(error => {
              console.error('Error saving error conversation:', error);
            });
          }

          setStreamingState({
            isStreaming: false,
            currentMessageId: null,
            controller: null
          });
          streamingMessageRef.current = '';
        },
        user,
        controller
      );
    } catch (error) {
      let errorConversation: ChatConversation | null = null;
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateMessage(updatedConversation.id, aiMessage.id, `Error: ${errorMessage}`);

      setConversations(prev => prev.map(conv =>
        conv.id === updatedConversation.id
          ? (errorConversation = {
              ...conv,
              messages: conv.messages.map(msg =>
                msg.id === aiMessage.id ? { ...msg, isError: true, isStreaming: false } : msg
              )
            })
          : conv
      ));

      setCurrentConversation(prev => 
        prev && prev.id === updatedConversation.id
          ? (errorConversation = {
              ...prev,
              messages: prev.messages.map(msg =>
                msg.id === aiMessage.id ? { ...msg, isError: true, isStreaming: false } : msg
              )
            })
          : prev
      );

      // Save error conversation
      if (errorConversation) {
        ChatStorageService.saveConversation(errorConversation, user).catch(error => {
          console.error('Error saving error conversation:', error);
        });
      }

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

  const selectConversation = useCallback((conversation: ChatConversation) => {
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
    sendMessage,
    stopStreaming,
    createNewConversation,
    selectConversation,
    deleteConversation,
    loadConversations
  };
};