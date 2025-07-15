import React from 'react';
import { useState, useCallback, useRef } from 'react';
import { ChatMessage, ChatConversation, StreamingState } from '../types/chat';
import { ChatService } from '../services/chatService';
import { ChatMessage as ServiceChatMessage } from '../services/chatService';
import { ChatStorageService } from '../services/chatStorageService';
import { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { AppSettings } from '../App';

export const useChat = (settings?: AppSettings | undefined) => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null);
  const [newlyCreatedConversations, setNewlyCreatedConversations] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreConversations, setHasMoreConversations] = useState(true);
  const [conversationsLastDoc, setConversationsLastDoc] = useState<any>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [messagesLastDoc, setMessagesLastDoc] = useState<any>(null);
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    currentMessageId: null,
    controller: null
  });

  const streamingMessageRef = useRef<string>('');
  const streamingReasoningRef = useRef<string>('');

  // Helper function to determine model source
  const getModelSource = (model: string): 'server' | 'byok' => {
    const serverModels = ['gemini-1.5-flash', 'gemini-1.5-flash-8b'];
    return serverModels.includes(model) ? 'server' : 'byok';
  };
  // Listen to auth state changes
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // If user signs out, clear current conversation to show welcome page
      if (!currentUser && user) {
        setCurrentConversation(null);
      }
    });
    return unsubscribe;
  }, [user]);

  // Load conversations on mount and user change
  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await ChatStorageService.loadConversationsPaginated(user, 20);
      setConversations(result.conversations);
      setHasMoreConversations(result.hasMore);
      setConversationsLastDoc(result.lastDoc);
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
      ChatStorageService.handleUserLogin(user).then(() => {
        // Reload conversations after migration
        loadConversations();
      });
    } else {
      ChatStorageService.handleUserLogout();
    }
  }, [user, loadConversations]);

  // Load more conversations
  const loadMoreConversations = useCallback(async () => {
    if (!hasMoreConversations || isLoadingMore) return;
    
    try {
      setIsLoadingMore(true);
      const result = await ChatStorageService.loadConversationsPaginated(user, 20, conversationsLastDoc);
      setConversations(prev => [...prev, ...result.conversations]);
      setHasMoreConversations(result.hasMore);
      setConversationsLastDoc(result.lastDoc);
    } catch (error) {
      console.error('Error loading more conversations:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [user, hasMoreConversations, isLoadingMore, conversationsLastDoc]);

  // Load messages for a conversation
  const loadConversationMessages = useCallback(async (conversationId: string) => {
    console.log('loadConversationMessages called for:', conversationId);
    try {
      setIsLoadingMessages(true);
      console.log('About to call ChatStorageService.loadMessagesPaginated');
      const result = await ChatStorageService.loadMessagesPaginated(conversationId, user, 30);
      console.log('ChatStorageService.loadMessagesPaginated result:', result);
      
      // Update conversations array
      setConversations(prev => {
        const updated = prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, messages: result.messages }
            : conv
        );
        console.log('Updated conversations with messages for:', conversationId, 'message count:', result.messages.length);
        return updated;
      });
      
      setCurrentConversation(prev => {
        if (prev && prev.id === conversationId) {
          const updatedCurrent = { ...prev, messages: result.messages };
          return updatedCurrent;
        }
        return prev;
      });
      
      setHasMoreMessages(result.hasMore);
      setMessagesLastDoc(result.lastDoc);
    } catch (error) {
      console.error('Error loading conversation messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [user]);

  // Load more messages for current conversation
  const loadMoreMessages = useCallback(async () => {
    if (!currentConversation || !hasMoreMessages || isLoadingMoreMessages) return;
    
    try {
      setIsLoadingMoreMessages(true);
      const result = await ChatStorageService.loadMessagesPaginated(currentConversation.id, user, 30, messagesLastDoc);
      
      // Prepend older messages to the beginning
      setConversations(prev => prev.map(conv => 
        conv.id === currentConversation.id 
          ? { ...conv, messages: [...result.messages, ...conv.messages] }
          : conv
      ));
      
      setCurrentConversation(prev => prev ? {
        ...prev,
        messages: [...result.messages, ...prev.messages]
      } : null);
      
      setHasMoreMessages(result.hasMore);
      setMessagesLastDoc(result.lastDoc);
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoadingMoreMessages(false);
    }
  }, [currentConversation, user, hasMoreMessages, isLoadingMoreMessages, messagesLastDoc]);

  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  // Enhanced ID generation to ensure uniqueness
  const generateUniqueId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const counter = Math.floor(Math.random() * 1000);
    return `${timestamp}_${random}_${counter}`;
  };

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
        model,
        source: getModelSource(model)
      };
    }
    
    setIsCreatingNewChat(true);
    
    const newConversation: ChatConversation = {
      id: generateUniqueId(),
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      model,
      source: getModelSource(model)
    };

    // Mark this conversation as newly created
    setNewlyCreatedConversations(prev => new Set(prev).add(newConversation.id));

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
    setConversations(prev => {
      return prev.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            messages: conv.messages.map(msg =>
              msg.id === messageId ? { ...msg, content } : msg
            ),
            updatedAt: new Date()
          };
        }
        return conv;
      });
    });

    setCurrentConversation(prev => {
      if (prev && prev.id === conversationId) {
        return {
          ...prev,
          messages: prev.messages.map(msg =>
            msg.id === messageId ? { ...msg, content } : msg
          ),
          updatedAt: new Date()
        };
      }
      return prev;
    });
  }, [user]);

  const updateMessageReasoning = useCallback((conversationId: string, messageId: string, reasoning: string) => {
    setConversations(prev => {
      return prev.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            messages: conv.messages.map(msg =>
              msg.id === messageId ? { ...msg, reasoning } : msg
            ),
            updatedAt: new Date()
          };
        }
        return conv;
      });
    });

    setCurrentConversation(prev => {
      if (prev && prev.id === conversationId) {
        return {
          ...prev,
          messages: prev.messages.map(msg =>
            msg.id === messageId ? { ...msg, reasoning } : msg
          ),
          updatedAt: new Date()
        };
      }
      return prev;
    });
  }, [user]);

  const sendMessage = useCallback(async (content: string, model: string, source: string = 'system', providerId?: string) => {
    if (!content.trim()) return;

    // Prevent multiple sends if already streaming
    if (streamingState.isStreaming) return;

    // Additional check to prevent rapid duplicate sends
    const trimmedContent = content.trim();
    if (currentConversation && currentConversation.messages.length > 0) {
      const lastMessage = currentConversation.messages[currentConversation.messages.length - 1];
      if (lastMessage.role === 'user' && lastMessage.content === trimmedContent) {
        return; // Prevent duplicate user messages
      }
    }
    // Create or get current conversation
    let conversation = currentConversation;
    if (!conversation) {
      // Create new conversation with message content as title
      const title = trimmedContent.slice(0, 50) + (trimmedContent.length > 50 ? '...' : '');
      conversation = {
        id: generateUniqueId(),
        title,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        model,
        source: getModelSource(model)
      };
      setCurrentConversation(conversation);
    } else if (conversation.messages.length === 0 && conversation.title === 'New Chat') {
      // Update existing empty conversation title with the message content
      const messageTitle = trimmedContent.slice(0, 50) + (trimmedContent.length > 50 ? '...' : '');
      conversation = {
        ...conversation,
        title: messageTitle,
        updatedAt: new Date()
      };
      
      // Update the conversation in state immediately
      setCurrentConversation(conversation);
    }

    // Create unique timestamps to ensure different keys
    const userTimestamp = new Date();
    const aiTimestamp = new Date(userTimestamp.getTime() + 1);

    // Create user message
    const userMessage: ChatMessage = {
      id: generateUniqueId(),
      role: 'user',
      content: trimmedContent,
      timestamp: userTimestamp,
      source: getModelSource(model)
    };

    // Create AI message
    const aiMessage: ChatMessage = {
      id: generateUniqueId(),
      role: 'assistant',
      content: '',
      model,
      isStreaming: true,
      timestamp: aiTimestamp,
      source: getModelSource(model),
      reasoning: '',
      isReasoningComplete: false
    };

    // Update conversation with both messages
    const updatedConversation = {
      ...conversation,
      messages: [...conversation.messages, userMessage, aiMessage],
      updatedAt: new Date()
    };

    // Update conversations state atomically
    setConversations(prev => {
      const existingIndex = prev.findIndex(conv => conv.id === conversation!.id);
      if (existingIndex >= 0) {
        // Replace existing conversation and move to top
        const filtered = prev.filter((_, index) => index !== existingIndex);
        return [updatedConversation, ...filtered];
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

    // Remove the early return that was blocking API calls for non-system sources
    // if (source !== 'system') return;

    // Start streaming for all sources
    const controller = new AbortController();
    setStreamingState({
      isStreaming: true,
      currentMessageId: aiMessage.id,
      controller
    });

    streamingMessageRef.current = '';
    streamingReasoningRef.current = '';

    try {
      // Build conversation history
      const historyMessages: ServiceChatMessage[] = [...conversation.messages, userMessage].map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

      // Add custom instruction as system message if it exists
      let messagesToSend: ServiceChatMessage[] = historyMessages;
      
      if (settings && settings.customInstruction && settings.customInstruction.trim()) {
        messagesToSend = [
          { role: 'system', content: settings.customInstruction.trim() },
          ...historyMessages
        ];
      }

      // Define callback functions separately
      const onChunkCallback = (chunk: string) => {
        streamingMessageRef.current += chunk;
        updateMessage(updatedConversation.id, aiMessage.id, streamingMessageRef.current);
      };

      const onReasoningChunkCallback = (reasoning: string) => {
        streamingReasoningRef.current += reasoning;
        updateMessageReasoning(updatedConversation.id, aiMessage.id, streamingReasoningRef.current);
      };

      const onCompleteCallback = () => {
        // Mark message as complete including reasoning
        setConversations(prev => {
          return prev.map(conv => {
            if (conv.id === updatedConversation.id) {
              return {
                ...conv,
                messages: conv.messages.map(msg =>
                  msg.id === aiMessage.id ? { 
                    ...msg, 
                    isStreaming: false, 
                    isReasoningComplete: true 
                  } : msg
                )
              };
            }
            return conv;
          });
        });

        setCurrentConversation(prev => {
          if (prev && prev.id === updatedConversation.id) {
            return {
              ...prev,
              messages: prev.messages.map(msg =>
                msg.id === aiMessage.id ? { 
                  ...msg, 
                  isStreaming: false, 
                  isReasoningComplete: true 
                } : msg
              )
            };
          }
          return prev;
        });

        // Save final conversation with complete AI message including reasoning
        setConversations(current => {
          const finalConv = current.find(conv => conv.id === updatedConversation.id);
          if (finalConv) {
            console.log('Saving final conversation:', updatedConversation.id);
            
            ChatStorageService.saveConversation(finalConv, user).catch(error => {
              console.error('Error saving final conversation:', error);
            }).finally(() => {
              // Only remove from newly created set after successful save AND after a delay
              setTimeout(() => {
                console.log('Removing from newly created set:', updatedConversation.id);
                setNewlyCreatedConversations(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(updatedConversation.id);
                  return newSet;
                });
              }, 1000); // 1 second delay to ensure no race conditions
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
        streamingReasoningRef.current = '';
      };

      const onErrorCallback = (error: Error) => {
        // Handle error
        const errorMessage = `Error: ${error.message}`;
        updateMessage(updatedConversation.id, aiMessage.id, errorMessage);

        setConversations(prev => {
          return prev.map(conv => {
            if (conv.id === updatedConversation.id) {
              return {
                ...conv,
                messages: conv.messages.map(msg =>
                  msg.id === aiMessage.id ? { ...msg, isError: true, isStreaming: false } : msg
                )
              };
            }
            return conv;
          });
        });

        setCurrentConversation(prev => {
          if (prev && prev.id === updatedConversation.id) {
            return {
              ...prev,
              messages: prev.messages.map(msg =>
                msg.id === aiMessage.id ? { ...msg, isError: true, isStreaming: false } : msg
              )
            };
          }
          return prev;
        });

        // Save error conversation
        setConversations(current => {
          const errorConv = current.find(conv => conv.id === updatedConversation.id);
          if (errorConv) {
            console.log('Saving error conversation (catch block):', updatedConversation.id);
              setTimeout(() => {
                console.log('Removing from newly created set (error case):', updatedConversation.id);
                setNewlyCreatedConversations(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(updatedConversation.id);
                  return newSet;
                });
              }, 1000);
            }).finally(() => {
              setTimeout(() => {
                console.log('Removing from newly created set (catch case):', updatedConversation.id);
                setNewlyCreatedConversations(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(updatedConversation.id);
                  return newSet;
                });
              }, 1000);
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
        streamingReasoningRef.current = '';
      };

      await ChatService.sendMessage(
        model,
        messagesToSend,
        onChunkCallback,
        onCompleteCallback,
        onErrorCallback,
        user,
        controller,
        source,
        providerId,
        onReasoningChunkCallback
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateMessage(updatedConversation.id, aiMessage.id, `Error: ${errorMessage}`);

      setConversations(prev => {
        return prev.map(conv => {
          if (conv.id === updatedConversation.id) {
            return {
              ...conv,
              messages: conv.messages.map(msg =>
                msg.id === aiMessage.id ? { ...msg, isError: true, isStreaming: false } : msg
              )
            };
          }
          return conv;
        });
      });

      setCurrentConversation(prev => {
        if (prev && prev.id === updatedConversation.id) {
          return {
            ...prev,
            messages: prev.messages.map(msg =>
              msg.id === aiMessage.id ? { ...msg, isError: true, isStreaming: false } : msg
            )
          };
        }
        return prev;
      });

      // Save error conversation
      setConversations(current => {
        const errorConv = current.find(conv => conv.id === updatedConversation.id);
        if (errorConv) {
          // Remove from newly created set even on error
          setNewlyCreatedConversations(prev => {
            const newSet = new Set(prev);
            newSet.delete(updatedConversation.id);
            return newSet;
          });
          
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
      streamingReasoningRef.current = '';
    }
  }, [currentConversation, createNewConversation, updateMessage, updateMessageReasoning, user, settings]);

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
    streamingReasoningRef.current = '';
  }, [streamingState]);

  const selectConversation = useCallback((conversation: ChatConversation | null) => {
    console.log('selectConversation called with:', conversation?.id, 'isNewlyCreated:', conversation ? newlyCreatedConversations.has(conversation.id) : false);
    
    // Always set the current conversation first so UI updates immediately
    setCurrentConversation(conversation);
    
    // Reset message pagination state when selecting a new conversation
    setHasMoreMessages(true);
    setMessagesLastDoc(null);
    
    if (conversation) {
      // Check if this is a newly created conversation
      if (newlyCreatedConversations.has(conversation.id)) {
        console.log('Skipping message loading for newly created conversation:', conversation.id);
        // Don't load messages from storage for newly created conversations
        // They already have their messages in memory
        setIsLoadingMessages(false);
      } else {
        console.log('Loading messages for existing conversation:', conversation.id);
        // Set loading state immediately when selecting a conversation
        setIsLoadingMessages(true);
        
        // Load messages for this conversation
        loadConversationMessages(conversation.id);
      }
    }
  }, [loadConversationMessages, newlyCreatedConversations]);

  const deleteConversation = useCallback((conversationId: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    
    // Remove from newly created set if it exists
    setNewlyCreatedConversations(prev => {
      const newSet = new Set(prev);
      newSet.delete(conversationId);
      return newSet;
    });
    
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
    isLoadingMore,
    hasMoreConversations,
    isLoadingMessages,
    isLoadingMoreMessages,
    hasMoreMessages,
    isCreatingNewChat,
    user,
    sendMessage,
    stopStreaming,
    createNewConversation,
    selectConversation,
    deleteConversation,
    loadConversations,
    loadMoreConversations,
    loadMoreMessages
  };
};