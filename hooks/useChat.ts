import React from 'react';
import { useState, useCallback, useRef } from 'react';
import { ChatMessage, ChatConversation, StreamingState, MessageContent, MessageAttachment, TextContent, ImageContent } from '../types/chat';
import { ChatService } from '../services/chatService';
import { ChatMessage as ServiceChatMessage } from '../services/chatService';
import { ChatStorageService } from '../services/chatStorageService';
import { ImageGenerationService } from '../services/imageGenerationService';
import { ImageGenerationJobService } from '../services/imageGenerationJobService';
import { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { AppSettings } from '../App';
import { getSystemModels } from '../services/modelService';
import { DEFAULT_SYSTEM_MODELS, DEFAULT_MODEL_ID } from '../constants/models';

export const useChat = (settings?: AppSettings | undefined) => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null);
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

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState<ChatConversation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allConversationsForSearch, setAllConversationsForSearch] = useState<ChatConversation[]>([]);

  const streamingMessageRef = useRef<string>('');
  const streamingReasoningRef = useRef<string>('');

  // State to track system model IDs
  const [systemModelIds, setSystemModelIds] = useState<string[]>(DEFAULT_SYSTEM_MODELS.map(model => model.id));

  // Load system models and cache their IDs
  React.useEffect(() => {
    const loadSystemModelIds = async () => {
      try {
        const models = await getSystemModels();
        setSystemModelIds(models.map(model => model.id));
      } catch (error) {
        console.error('Error loading system model IDs:', error);
        // Keep fallback models
      }
    };
    loadSystemModelIds();
  }, []);

  // Helper function to determine model source
  const getModelSource = (model: string): 'server' | 'byok' => {
    return systemModelIds.includes(model) ? 'server' : 'byok';
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
      // Stop all polling when user logs out
      ImageGenerationJobService.stopAllPolling();
    }
  }, [user, loadConversations]);

  // Load more conversations
  const loadMoreConversations = useCallback(async () => {
    if (!hasMoreConversations || isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      const result = await ChatStorageService.loadConversationsPaginated(user, 20, conversationsLastDoc);

      // Prevent duplicates by checking existing conversation IDs
      setConversations(prev => {
        const existingIds = new Set(prev.map(conv => conv.id));
        const newConversations = result.conversations.filter(conv => !existingIds.has(conv.id));
        return [...prev, ...newConversations];
      });

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
    try {
      setIsLoadingMessages(true);
      const result = await ChatStorageService.loadMessagesPaginated(conversationId, user, 100);

      // Update conversations array
      setConversations(prev => {
        const updated = prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, messages: result.messages }
            : conv
        );
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
      
      // Return the loaded conversation for job resumption
      return { conversationId, messages: result.messages };
    } catch (error) {
      console.error('Error loading conversation messages:', error);
      return null;
    } finally {
      setIsLoadingMessages(false);
    }
  }, [user]);

  // Load more messages for current conversation
  const loadMoreMessages = useCallback(async () => {
    if (!currentConversation || !hasMoreMessages || isLoadingMoreMessages) return;

    try {
      setIsLoadingMoreMessages(true);
      const result = await ChatStorageService.loadMessagesPaginated(currentConversation.id, user, 100, messagesLastDoc);

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

  // Smart title truncation that cuts at word boundaries
  const createSmartTitle = (text: string, maxLength: number = 50): string => {
    // Clean the text first (remove extra whitespace)
    const cleanText = text.trim().replace(/\s+/g, ' ');

    if (cleanText.length <= maxLength) {
      return cleanText;
    }

    // Find the last space before the character limit
    const truncated = cleanText.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');

    // If there's a space within reasonable distance (not too short), cut there
    if (lastSpaceIndex > maxLength * 0.6) { // Don't cut if it makes title too short (less than 60% of limit)
      return truncated.substring(0, lastSpaceIndex) + '...';
    }

    // If no good word boundary found, try to extend to complete the current word
    const nextSpaceIndex = cleanText.indexOf(' ', maxLength);
    if (nextSpaceIndex !== -1 && nextSpaceIndex - maxLength < 10) { // Allow up to 10 extra chars to complete word
      return cleanText.substring(0, nextSpaceIndex) + '...';
    }

    // If extending would make it too long, try to find a better breaking point
    // Look for punctuation marks near the limit
    const punctuationPattern = /[.!?;:,]/;
    for (let i = maxLength - 1; i >= maxLength * 0.7; i--) {
      if (punctuationPattern.test(truncated[i])) {
        return truncated.substring(0, i + 1) + '..';
      }
    }

    // Last resort: cut at character limit but avoid breaking mid-word
    if (lastSpaceIndex > maxLength * 0.4) { // Accept shorter title if it's not too short
      return truncated.substring(0, lastSpaceIndex) + '...';
    }

    // Very last resort: cut at character limit
    return truncated + '...';
  };

  const createNewConversation = useCallback((title: string = 'New Chat', model?: string): ChatConversation => {
    // Prevent creating new conversation if already creating one
    if (isCreatingNewChat) return currentConversation!;

    // Use the first available system model if no model is provided
    const defaultModel = model || systemModelIds[0] || DEFAULT_MODEL_ID;

    // Check if we're already on the welcome page (no current conversation or empty conversation)
    if (!currentConversation || currentConversation.messages.length === 0) {
      const newOrExisting = currentConversation || {
        id: generateId(),
        title,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        model: defaultModel,
        source: getModelSource(defaultModel)
      };

      // For new conversations, set hasMoreMessages to false
      if (!currentConversation) {
        setHasMoreMessages(false);
        setMessagesLastDoc(null);
      }

      return newOrExisting;
    }

    setIsCreatingNewChat(true);

    const newConversation: ChatConversation = {
      id: generateId(),
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      model: defaultModel,
      source: getModelSource(defaultModel)
    };

    // For new conversations, set hasMoreMessages to false
    setHasMoreMessages(false);
    setMessagesLastDoc(null);

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
  }, [user, isCreatingNewChat, currentConversation, systemModelIds, getModelSource]);

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

  const updateMessageReasoning = useCallback((conversationId: string, messageId: string, reasoning: string) => {
    let updatedConversation: ChatConversation | null = null;

    setConversations(prev => prev.map(conv =>
      conv.id === conversationId
        ? (updatedConversation = {
          ...conv,
          messages: conv.messages.map(msg =>
            msg.id === messageId ? { ...msg, reasoning } : msg
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
            msg.id === messageId ? { ...msg, reasoning } : msg
          ),
          updatedAt: new Date()
        })
        : prev
    );

    // Save updated conversation with reasoning to storage
    if (updatedConversation) {
      ChatStorageService.saveConversation(updatedConversation, user).catch(error => {
        console.error('Error saving conversation with reasoning:', error);
      });
    }
  }, [user]);

  // Helper function to extract text from MessageContent for title generation
  const extractTextFromContent = (content: MessageContent): string => {
    if (typeof content === 'string') {
      return content;
    }

    const textParts = content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join(' ');

    return textParts || 'Message with attachments';
  };

  // Helper function to check if content is empty
  const isContentEmpty = (content: MessageContent): boolean => {
    if (typeof content === 'string') {
      return !content.trim();
    }

    return content.length === 0 || content.every(item =>
      item.type === 'text' ? !item.text.trim() : false
    );
  };

  const sendMessage = useCallback(async (
    content: string | MessageContent,
    model: string,
    source: string = 'system',
    providerId?: string,
    attachments?: MessageAttachment[]
  ) => {
    // Build the message content
    let messageContent: MessageContent;

    if (typeof content === 'string') {
      // If we have attachments, build complex content
      if (attachments && attachments.length > 0) {
        const contentParts: Array<TextContent | ImageContent> = [];

        // Add text content if present
        if (content.trim()) {
          contentParts.push({
            type: 'text',
            text: content.trim()
          });
        }

        // Add image content
        attachments.forEach(attachment => {
          if (attachment.type === 'image') {
            contentParts.push({
              type: 'image_url',
              image_url: {
                url: attachment.url,
                detail: 'auto',
                format: attachment.mimeType
              }
            });
          }
        });

        messageContent = contentParts;
      } else {
        messageContent = content;
      }
    } else {
      messageContent = content;
    }

    if (isContentEmpty(messageContent)) return;

    // Get model name for BYOK models
    let modelName = model;
    if (source === 'custom' && providerId) {
      try {
        const customProviders = localStorage.getItem('custom_api_providers');
        if (customProviders) {
          const providers = JSON.parse(customProviders);
          const provider = providers.find((p: any) => p.id === providerId);
          if (provider) {
            const providerModelsKey = `models_${providerId}`;
            const selectedModels = localStorage.getItem(providerModelsKey);
            if (selectedModels) {
              const models = JSON.parse(selectedModels);
              const modelArray = models.length > 0 && typeof models[0] === 'string'
                ? models.map((id: string) => ({ id, name: id }))
                : models;
              const foundModel = modelArray.find((m: { id: string, name: string }) => m.id === model);
              if (foundModel) {
                modelName = foundModel.name;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error getting model name:', error);
      }
    }

    // Create or get current conversation
    let conversation = currentConversation;
    if (!conversation) {
      // Create new conversation with message content as title
      const title = createSmartTitle(extractTextFromContent(messageContent));
      conversation = {
        id: generateId(),
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
      const messageTitle = createSmartTitle(extractTextFromContent(messageContent));
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
      content: messageContent,
      timestamp: new Date(),
      source: getModelSource(model),
      attachments: attachments
    };

    // Create AI message
    const aiMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: '',
      model,
      modelName: source === 'custom' ? modelName : undefined,
      isStreaming: true,
      timestamp: new Date(Date.now() + 1),
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
        setConversations(prev => prev.map(conv =>
          conv.id === updatedConversation.id
            ? {
              ...conv,
              messages: conv.messages.map(msg =>
                msg.id === aiMessage.id ? {
                  ...msg,
                  isStreaming: false,
                  isReasoningComplete: true
                } : msg
              )
            }
            : conv
        ));

        setCurrentConversation(prev =>
          prev && prev.id === updatedConversation.id
            ? {
              ...prev,
              messages: prev.messages.map(msg =>
                msg.id === aiMessage.id ? {
                  ...msg,
                  isStreaming: false,
                  isReasoningComplete: true
                } : msg
              )
            }
            : prev
        );

        // Save final conversation with complete AI message including reasoning
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
        streamingReasoningRef.current = '';
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
      streamingReasoningRef.current = '';
    }
  }, [currentConversation, createNewConversation, updateMessage, updateMessageReasoning, user, settings]);

  const generateImage = useCallback(async (
    prompt: string,
    imageUrl: string,
    model: string,
    source: string = 'system',
    providerId?: string,
    params?: any
  ) => {
    if (!prompt.trim()) return;

    const timestamp = new Date();
    const isLoadingCall = params?.isLoading === true;
    const isFinalizingCall = params?.isLoading === false && imageUrl;
    const isErrorCall = params?.error;
    const isAsyncJob = params?.isAsyncJob === true;
    const jobData = params?.job;
    const isJobUpdate = params?.isJobUpdate === true;

    // Handle job updates (when we get job data after initial loading message)
    if (isJobUpdate && isAsyncJob && jobData) {
      // Find and update the existing loading message with job data
      setConversations(prevConversations => {
        return prevConversations.map(conv => {
          // Find conversation with the loading message
          const hasLoadingMessage = conv.messages.some(msg => 
            msg.messageType === 'image_generation' &&
            msg.isAsyncImageGeneration === true &&
            msg.imageGenerationJob === null &&
            msg.imageGenerationParams?.prompt === prompt
          );

          if (hasLoadingMessage) {
            const updatedConv = {
              ...conv,
              messages: conv.messages.map(msg => {
                // Update the loading message with job data
                if (msg.messageType === 'image_generation' &&
                    msg.isAsyncImageGeneration === true &&
                    msg.imageGenerationJob === null &&
                    msg.imageGenerationParams?.prompt === prompt) {
                  return {
                    ...msg,
                    imageGenerationJob: jobData,
                  };
                }
                return msg;
              }),
              updatedAt: new Date(),
            };

            // Update current conversation if it's the same one
            setCurrentConversation(prevCurrent =>
              prevCurrent && prevCurrent.id === conv.id ? updatedConv : prevCurrent
            );

            // Save updated conversation
            if (user) {
              ChatStorageService.saveConversation(updatedConv, user).catch(error => {
                console.error('Error saving job update:', error);
              });
            }

            // Start job polling for this conversation
            const loadingMessage = updatedConv.messages.find(msg => 
              msg.messageType === 'image_generation' &&
              msg.isAsyncImageGeneration === true &&
              msg.imageGenerationJob?.id === jobData.id
            );

            if (loadingMessage && user) {
              const conversationId = updatedConv.id;
              const aiMessageId = loadingMessage.id;
              
              ImageGenerationJobService.startJobPolling(
                jobData.id,
                source,
                providerId,
                user,
                (updatedJob) => {
                  // Update the message with the latest job status
                  setConversations(prevConversations => {
                    const updatedConversations = prevConversations.map(conv => {
                      if (conv.id === conversationId) {
                        const updatedConv = {
                          ...conv,
                          messages: conv.messages.map(msg => {
                            if (msg.id === aiMessageId) {
                              return {
                                ...msg,
                                imageGenerationJob: updatedJob,
                              };
                            }
                            return msg;
                          }),
                          updatedAt: new Date(),
                        };
                        
                        // Update currentConversation if it's the same conversation
                        setCurrentConversation(prevCurrent =>
                          prevCurrent && prevCurrent.id === conversationId ? updatedConv : prevCurrent
                        );
                        
                        // Save updated conversation - job data is stored in the message
                        if (user) {
                          ChatStorageService.saveConversation(updatedConv, user).catch(error => {
                            console.error('Error saving job update:', error);
                          });
                        }
                        
                        return updatedConv;
                      }
                      return conv;
                    });
                    
                    return updatedConversations;
                  });
                },
                async (completedJob) => {
                  // Handle job completion - directly update the existing message
                  if (completedJob.status === 'SUCCESS' && completedJob.data && completedJob.data.length > 0) {
                    try {
                      // Download and upload the generated image to Firebase Storage
                      const generatedImageAttachment = await ImageGenerationService.downloadAndUploadImage(
                        completedJob.data[0].url,
                        prompt,
                        user?.uid || null,
                        params?.response_format
                      );

                      // Update the message with the completed image
                      setConversations(prevConversations => {
                        const updatedConversations = prevConversations.map(conv => {
                          if (conv.id === conversationId) {
                            const updatedConv = {
                              ...conv,
                              messages: conv.messages.map(msg => {
                                if (msg.id === aiMessageId) {
                                  return {
                                    ...msg,
                                    content: '', // Clear any status text
                                    attachments: generatedImageAttachment ? [generatedImageAttachment] : [],
                                    imageGenerationJob: completedJob,
                                    isAsyncImageGeneration: false, // Mark as completed
                                  } as ChatMessage;
                                }
                                return msg;
                              }),
                              updatedAt: new Date(),
                            };
                            
                            // Update currentConversation if it's the same conversation
                            setCurrentConversation(prevCurrent =>
                              prevCurrent && prevCurrent.id === conversationId ? updatedConv : prevCurrent
                            );
                            
                            // Save updated conversation
                            if (user) {
                              ChatStorageService.saveConversation(updatedConv, user).catch(error => {
                                console.error('Error saving completed job:', error);
                              });
                            }
                            
                            return updatedConv;
                          }
                          return conv;
                        });
                        
                        return updatedConversations;
                      });
                    } catch (error) {
                      console.error('Error downloading completed image:', error);
                      // Handle error case by updating message with error status
                      setConversations(prevConversations => {
                        const updatedConversations = prevConversations.map(conv => {
                          if (conv.id === conversationId) {
                            const updatedConv = {
                              ...conv,
                              messages: conv.messages.map(msg => {
                                if (msg.id === aiMessageId) {
                                  return {
                                    ...msg,
                                    content: 'Failed to download generated image',
                                    imageGenerationJob: { ...completedJob, status: 'FAILED' as const },
                                    isAsyncImageGeneration: false,
                                  } as ChatMessage;
                                }
                                return msg;
                              }),
                              updatedAt: new Date(),
                            };
                            
                            setCurrentConversation(prevCurrent =>
                              prevCurrent && prevCurrent.id === conversationId ? updatedConv : prevCurrent
                            );
                            
                            return updatedConv;
                          }
                          return conv;
                        });
                        
                        return updatedConversations;
                      });
                    }
                  } else if (completedJob.status === 'FAILED') {
                    // Job failed, update message with error
                    setConversations(prevConversations => {
                      const updatedConversations = prevConversations.map(conv => {
                        if (conv.id === conversationId) {
                          const updatedConv = {
                            ...conv,
                            messages: conv.messages.map(msg => {
                              if (msg.id === aiMessageId) {
                                return {
                                  ...msg,
                                  content: 'Failed to generate image',
                                  imageGenerationJob: completedJob,
                                  isAsyncImageGeneration: false,
                                } as ChatMessage;
                              }
                              return msg;
                            }),
                            updatedAt: new Date(),
                          };
                          
                          setCurrentConversation(prevCurrent =>
                            prevCurrent && prevCurrent.id === conversationId ? updatedConv : prevCurrent
                          );
                          
                          if (user) {
                            ChatStorageService.saveConversation(updatedConv, user).catch(error => {
                              console.error('Error saving failed job:', error);
                            });
                          }
                          
                          return updatedConv;
                        }
                        return conv;
                      });
                      
                      return updatedConversations;
                    });
                  }
                },
                (error) => {
                  console.error('Job polling error:', error);
                  // Continue polling on errors - don't fail the entire process
                }
              );
            }

            return updatedConv;
          }
          return conv;
        });
      });
      
      return; // Exit early, don't continue with normal flow
    }

    if (isLoadingCall) {
      // LOADING PHASE: Create new messages
      const messageId = generateId();
      
      console.log('DEBUG: isLoadingCall, jobData:', jobData);
      console.log('DEBUG: params:', params);

      // Build user message content - for image editing, include the image attachment
      let userAttachments: MessageAttachment[] | undefined = undefined;

      // Check if this is image editing (has input image)
      if (params?.image) {
        // For image editing, create an attachment for the input image
        userAttachments = [{
          id: Date.now().toString(),
          type: 'image',
          url: params.image,
          filename: 'input_image_for_editing.png',
          size: 0,
          mimeType: 'image/png',
          isForEditing: true
        }];
      }

      const userMessage: ChatMessage = {
        id: messageId + '_user',
        role: 'user',
        content: prompt,
        timestamp,
        source: getModelSource(model),
        messageType: 'image_generation',
        attachments: userAttachments,
        imageGenerationParams: {
          prompt,
          size: params?.size || '1024x1024',
          seed: params?.seed,
          response_format: "url",
          guidance_scale: params?.guidance_scale,
          watermark: false,
          originalSource: source, // Store for job resumption
          originalProviderId: providerId, // Store for job resumption
        }
      };

      const loadingAiMessage: ChatMessage = {
        id: messageId + '_ai',
        role: 'assistant',
        content: '', // No text content, just show loading indicator
        timestamp: new Date(timestamp.getTime() + 1),
        model,
        modelName: model,
        source: getModelSource(model),
        messageType: 'image_generation',
        isGeneratingImage: true,
        isAsyncImageGeneration: isAsyncJob,
        imageGenerationJob: jobData, // This should contain the job ID and status!
        imageGenerationParams: {
          prompt,
          size: params?.size || '1024x1024',
          response_format: "url",
          seed: params?.seed,
          guidance_scale: params?.guidance_scale,
          watermark: false,
          originalSource: source, // Store for job resumption
          originalProviderId: providerId, // Store for job resumption
        }
      };
      
      console.log('DEBUG: Created loadingAiMessage with job:', loadingAiMessage.imageGenerationJob);

      // Get or create conversation - for image generation, prefer using existing conversation
      let conversation = currentConversation;
      if (!conversation) {
        // Only create new conversation if there's no current conversation at all
        conversation = createNewConversation(createSmartTitle(prompt), model);
      }

      const conversationWithLoading = {
        ...conversation,
        messages: [...conversation.messages, userMessage, loadingAiMessage],
        updatedAt: timestamp,
      };

      // Update state
      setConversations(prev => {
        const existingIndex = prev.findIndex(c => c.id === conversation!.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = conversationWithLoading;
          return updated;
        } else {
          return [conversationWithLoading, ...prev];
        }
      });

      setCurrentConversation(conversationWithLoading);

      // Save to storage
      try {
        console.log('DEBUG: Saving conversation to DB with job data:', loadingAiMessage.imageGenerationJob);
        console.log('DEBUG: Message being saved:', {
          id: loadingAiMessage.id,
          isAsyncImageGeneration: loadingAiMessage.isAsyncImageGeneration,
          isGeneratingImage: loadingAiMessage.isGeneratingImage,
          jobData: loadingAiMessage.imageGenerationJob
        });
        await ChatStorageService.saveConversation(conversationWithLoading, user);
        console.log('DEBUG: Successfully saved conversation to DB');
      } catch (error) {
        console.error('Error saving loading conversation:', error);
      }

      // Note: For job-based generation with immediate loading, we don't start polling here
      // Polling will be started when we receive the job update with actual job data

      return;
    }

    // COMPLETION/ERROR PHASE: Update existing message
    if (isFinalizingCall || isErrorCall) {
      // For successful completion, download and save the generated image as attachment first
      const handleCompletion = async () => {
        let generatedImageAttachment: MessageAttachment | undefined = undefined;
        if (isFinalizingCall && imageUrl) {
          try {
            // Download and upload the generated image to Firebase Storage
            generatedImageAttachment = await ImageGenerationService.downloadAndUploadImage(
              imageUrl,
              prompt,
              user?.uid || null,
              params?.response_format
            );
          } catch (error) {
            console.error('Error saving generated image:', error);
            // Create fallback attachment with direct URL
            generatedImageAttachment = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              type: 'image',
              url: imageUrl,
              filename: `generated_image_${Date.now()}.jpeg`,
              size: 0,
              mimeType: 'image/jpeg',
              isDirectUrl: true
            };
          }
        }

        // Find the conversation and message to update using the conversations state
        let targetConversation: ChatConversation | null = null;
        let loadingMessageId: string | null = null;

        // Search through all conversations to find the loading message
        setConversations(prevConversations => {
          for (const conv of prevConversations) {
            const loadingMessage = conv.messages
              .slice()
              .reverse()
              .find(msg =>
                msg.messageType === 'image_generation' &&
                msg.isGeneratingImage === true &&
                msg.role === 'assistant' &&
                msg.imageGenerationParams?.prompt === prompt
              );

            if (loadingMessage) {
              targetConversation = conv;
              loadingMessageId = loadingMessage.id;
              break;
            }
          }

          // If we found the loading message, update it
          if (targetConversation && loadingMessageId) {
            let updatedMessage: ChatMessage;

            if (isErrorCall) {
              updatedMessage = {
                id: loadingMessageId,
                role: 'assistant',
                content: isAsyncJob ? '❌ Image generation job failed' : `❌ Image generation failed: ${params.error}`,
                timestamp: new Date(),
                model,
                modelName: model,
                source: getModelSource(model),
                messageType: 'image_generation',
                isGeneratingImage: false,
                isAsyncImageGeneration: isAsyncJob,
                isError: true,
                imageGenerationJob: params?.job,
                imageGenerationParams: {
                  prompt,
                  size: params?.size || '1024x1024',
                  response_format: "url",
                  seed: params?.seed,
                  guidance_scale: params?.guidance_scale,
                  watermark: false,
                  originalSource: source, // Store for job resumption
                  originalProviderId: providerId, // Store for job resumption
                }
              };
            } else {
              updatedMessage = {
                id: loadingMessageId,
                role: 'assistant',
                content: '',
                timestamp: new Date(),
                model,
                modelName: model,
                source: getModelSource(model),
                messageType: 'image_generation',
                isGeneratingImage: false,
                isAsyncImageGeneration: isAsyncJob,
                generatedImageUrl: imageUrl,
                attachments: generatedImageAttachment ? [generatedImageAttachment] : undefined,
                imageGenerationJob: params?.job,
                imageGenerationParams: {
                  prompt,
                  size: params?.size || '1024x1024',
                  response_format: "url",
                  seed: params?.seed,
                  guidance_scale: params?.guidance_scale,
                  watermark: false,
                  originalSource: source, // Store for job resumption
                  originalProviderId: providerId, // Store for job resumption
                }
              };
            }

            // Update the conversation with the finalized message
            const updatedConversation = {
              ...targetConversation,
              messages: targetConversation.messages.map(msg =>
                msg.id === loadingMessageId ? updatedMessage : msg
              ),
              updatedAt: new Date(),
            };

            // Update current conversation if it's the same one
            setCurrentConversation(prevCurrent =>
              prevCurrent && prevCurrent.id === targetConversation!.id
                ? updatedConversation
                : prevCurrent
            );

            // Save to storage
            ChatStorageService.saveConversation(updatedConversation, user).catch(error => {
              console.error('Error saving finalized conversation:', error);
            });

            // Return updated conversations array
            return prevConversations.map(conv =>
              conv.id === targetConversation!.id ? updatedConversation : conv
            );
          }

          // If no loading message found, don't update anything
          console.warn('No loading message found for completion/error');
          return prevConversations;
        });
      };

      // Execute the completion handler
      handleCompletion().catch(error => {
        console.error('Error in handleCompletion:', error);
      });

      return;
    }

    // This shouldn't happen with the new flow, but keep as fallback
    console.warn('Unexpected generateImage call - neither loading nor completion');
  }, [currentConversation, createNewConversation, user, getModelSource, conversations]);

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

  // Helper function to resume active image generation jobs for current conversation only
  const resumeActiveJobsForConversation = useCallback(async (conversation: ChatConversation) => {
    if (!user) return;

    try {
      console.log('DEBUG: Checking for active jobs in conversation:', conversation.id);
      let foundActiveJobs = 0;
      
      // Find active jobs only in the current conversation
      conversation.messages.forEach(msg => {
        console.log('DEBUG: Checking message:', {
          id: msg.id,
          messageType: msg.messageType,
          isAsyncImageGeneration: msg.isAsyncImageGeneration,
          isGeneratingImage: msg.isGeneratingImage,
          hasJob: !!msg.imageGenerationJob,
          jobStatus: msg.imageGenerationJob?.status,
          hasAttachments: !!msg.attachments?.length
        });
        
        // Look for messages that are image generation jobs
        if (msg.messageType === 'image_generation' && msg.imageGenerationJob) {
          const job = msg.imageGenerationJob;
          
          console.log('DEBUG: Found image generation message with job:', {
            jobId: job.id,
            status: job.status,
            hasAttachments: !!msg.attachments?.length,
            isAsyncJob: msg.isAsyncImageGeneration,
            hasJobData: !!job.data?.length
          });
          
          // Resume polling if job is not completed and doesn't have final result
          const shouldResume = (
            // Job is still in progress
            (job.status === 'CREATED' || job.status === 'WAITING' || job.status === 'RUNNING') ||
            // Or job is completed but we don't have the final image attachment
            (job.status === 'SUCCESS' && (!msg.attachments || msg.attachments.length === 0) && job.data && job.data.length > 0) ||
            // Or job is completed with attachments but message is still marked as generating (stuck state)
            (job.status === 'SUCCESS' && msg.attachments && msg.attachments.length > 0 && (msg.isGeneratingImage || msg.isAsyncImageGeneration))
          );
          
          if (shouldResume) {
            foundActiveJobs++;
            
            // Determine the reason for resuming
            let resumeReason = '';
            if (job.status === 'SUCCESS' && (!msg.attachments || msg.attachments.length === 0)) {
              resumeReason = 'SUCCESS but no attachments - will download image';
            } else if (job.status === 'SUCCESS' && msg.attachments && msg.attachments.length > 0 && (msg.isGeneratingImage || msg.isAsyncImageGeneration)) {
              resumeReason = 'SUCCESS with attachments but stuck in generating state - will fix state';
            } else {
              resumeReason = `status is ${job.status}`;
            }
            
            console.log('DEBUG: Resuming job for:', job.id, 'status:', job.status, 'reason:', resumeReason);
            
            // Get original provider info from imageGenerationParams
            const originalSource = msg.imageGenerationParams?.originalSource || 'system';
            const originalProviderId = msg.imageGenerationParams?.originalProviderId;
            
            // Handle SUCCESS jobs that are stuck in generating state with attachments already present
            if (job.status === 'SUCCESS' && msg.attachments && msg.attachments.length > 0 && (msg.isGeneratingImage || msg.isAsyncImageGeneration)) {
              console.log('DEBUG: Fixing stuck completed job immediately:', job.id);
              
              // Simply update the message state to mark it as completed (no need to download again)
              setConversations(prevConversations => {
                const updatedConversations = prevConversations.map(conv => {
                  if (conv.id === conversation.id) {
                    const updatedConv = {
                      ...conv,
                      messages: conv.messages.map(convMsg => {
                        if (convMsg.id === msg.id) {
                          return {
                            ...convMsg,
                            content: '',
                            isAsyncImageGeneration: false, // Mark as completed
                            isGeneratingImage: false, // Mark as completed
                          } as ChatMessage;
                        }
                        return convMsg;
                      }),
                      updatedAt: new Date(),
                    };
                    
                    // Update currentConversation if it's the same conversation
                    setCurrentConversation(prevCurrent =>
                      prevCurrent && prevCurrent.id === conversation.id ? updatedConv : prevCurrent
                    );
                    
                    // Save updated conversation
                    ChatStorageService.saveConversation(updatedConv, user).catch(error => {
                      console.error('Error saving fixed stuck job:', error);
                    });
                    
                    return updatedConv;
                  }
                  return conv;
                });
                
                return updatedConversations;
              });
              
              return; // Skip polling for this job
            }
            
            // For SUCCESS jobs without attachments, directly handle completion without polling
            if (job.status === 'SUCCESS' && job.data && job.data.length > 0 && (!msg.attachments || msg.attachments.length === 0)) {
              console.log('DEBUG: Handling completed job immediately without polling:', job.id);
              
              // Handle job completion directly
              (async () => {
                try {
                  // Download and upload the generated image to Firebase Storage
                  const generatedImageAttachment = await ImageGenerationService.downloadAndUploadImage(
                    job.data![0].url,
                    msg.imageGenerationParams!.prompt,
                    user?.uid || null,
                    msg.imageGenerationParams!.response_format
                  );

                  console.log('DEBUG: Successfully downloaded and uploaded image for job:', job.id);

                  // Update the message with the completed image
                  setConversations(prevConversations => {
                    const updatedConversations = prevConversations.map(conv => {
                      if (conv.id === conversation.id) {
                        const updatedConv = {
                          ...conv,
                          messages: conv.messages.map(convMsg => {
                            if (convMsg.id === msg.id) {
                              return {
                                ...convMsg,
                                content: '', // Clear any status text
                                attachments: generatedImageAttachment ? [generatedImageAttachment] : [],
                                imageGenerationJob: job,
                                isAsyncImageGeneration: false, // Mark as completed
                                isGeneratingImage: false,
                              } as ChatMessage;
                            }
                            return convMsg;
                          }),
                          updatedAt: new Date(),
                        };
                        
                        // Update currentConversation if it's the same conversation
                        setCurrentConversation(prevCurrent =>
                          prevCurrent && prevCurrent.id === conversation.id ? updatedConv : prevCurrent
                        );
                        
                        // Save updated conversation with completed job
                        ChatStorageService.saveConversation(updatedConv, user).catch(error => {
                          console.error('Error saving resumed job completion:', error);
                        });
                        
                        return updatedConv;
                      }
                      return conv;
                    });
                    
                    return updatedConversations;
                  });
                } catch (error) {
                  console.error('Error downloading resumed job image:', error);
                  // Handle error case
                  setConversations(prevConversations => {
                    const updatedConversations = prevConversations.map(conv => {
                      if (conv.id === conversation.id) {
                        const updatedConv = {
                          ...conv,
                          messages: conv.messages.map(convMsg => {
                            if (convMsg.id === msg.id) {
                              return {
                                ...convMsg,
                                content: 'Failed to download generated image',
                                imageGenerationJob: { ...job, status: 'FAILED' as const },
                                isAsyncImageGeneration: false,
                                isGeneratingImage: false,
                              } as ChatMessage;
                            }
                            return convMsg;
                          }),
                          updatedAt: new Date(),
                        };
                        
                        setCurrentConversation(prevCurrent =>
                          prevCurrent && prevCurrent.id === conversation.id ? updatedConv : prevCurrent
                        );
                        
                        // Save error state
                        ChatStorageService.saveConversation(updatedConv, user).catch(error => {
                          console.error('Error saving error state:', error);
                        });
                        
                        return updatedConv;
                      }
                      return conv;
                    });
                    
                    return updatedConversations;
                  });
                }
              })();
              
              return; // Skip polling for this completed job
            }
            
            // Resume polling for in-progress jobs
            ImageGenerationJobService.startJobPolling(
              job.id,
              originalSource,
              originalProviderId,
              user,
              (updatedJob) => {
                // Update the message with the latest job status
                setConversations(prevConversations => {
                const updatedConversations = prevConversations.map(conv => {
                  if (conv.id === conversation.id) {
                    const updatedConv = {
                      ...conv,
                      messages: conv.messages.map(convMsg => {
                        if (convMsg.id === msg.id) {
                          return {
                            ...convMsg,
                            imageGenerationJob: updatedJob,
                          };
                        }
                        return convMsg;
                      }),
                      updatedAt: new Date(),
                    };
                    
                    // Update currentConversation if it's the same conversation
                    setCurrentConversation(prevCurrent =>
                      prevCurrent && prevCurrent.id === conv.id ? updatedConv : prevCurrent
                    );
                    
                    // Save updated conversation with job status
                    ChatStorageService.saveConversation(updatedConv, user).catch(error => {
                      console.error('Error saving resumed job update:', error);
                    });
                    
                    return updatedConv;
                  }
                  return conv;
                });
                
                return updatedConversations;
              });
            },
            async (completedJob) => {
              // Handle job completion for resumed jobs - directly update the existing message
              if (completedJob.status === 'SUCCESS' && completedJob.data && completedJob.data.length > 0) {
                try {
                  // Download and upload the generated image to Firebase Storage
                  const generatedImageAttachment = await ImageGenerationService.downloadAndUploadImage(
                    completedJob.data[0].url,
                    msg.imageGenerationParams!.prompt,
                    user?.uid || null,
                    msg.imageGenerationParams!.response_format
                  );

                  // Update the message with the completed image
                  setConversations(prevConversations => {
                    const updatedConversations = prevConversations.map(conv => {
                      if (conv.id === conversation.id) {
                        const updatedConv = {
                          ...conv,
                          messages: conv.messages.map(convMsg => {
                            if (convMsg.id === msg.id) {
                              return {
                                ...convMsg,
                                content: '', // Clear any status text
                                attachments: generatedImageAttachment ? [generatedImageAttachment] : [],
                                imageGenerationJob: completedJob,
                                isAsyncImageGeneration: false, // Mark as completed
                                isGeneratingImage: false,
                              } as ChatMessage;
                            }
                            return convMsg;
                          }),
                          updatedAt: new Date(),
                        };
                        
                        // Update currentConversation if it's the same conversation
                        setCurrentConversation(prevCurrent =>
                          prevCurrent && prevCurrent.id === conversation.id ? updatedConv : prevCurrent
                        );
                        
                        // Save updated conversation with completed job
                        ChatStorageService.saveConversation(updatedConv, user).catch(error => {
                          console.error('Error saving resumed job completion:', error);
                        });
                        
                        return updatedConv;
                      }
                      return conv;
                    });
                    
                    return updatedConversations;
                  });
                } catch (error) {
                  console.error('Error downloading resumed job image:', error);
                  // Handle error case
                  setConversations(prevConversations => {
                    const updatedConversations = prevConversations.map(conv => {
                      if (conv.id === conversation.id) {
                        const updatedConv = {
                          ...conv,
                          messages: conv.messages.map(convMsg => {
                            if (convMsg.id === msg.id) {
                              return {
                                ...convMsg,
                                content: 'Failed to download generated image',
                                imageGenerationJob: { ...completedJob, status: 'FAILED' as const },
                                isAsyncImageGeneration: false,
                                isGeneratingImage: false,
                              } as ChatMessage;
                            }
                            return convMsg;
                          }),
                          updatedAt: new Date(),
                        };
                        
                        setCurrentConversation(prevCurrent =>
                          prevCurrent && prevCurrent.id === conversation.id ? updatedConv : prevCurrent
                        );
                        
                        // Save error state
                        ChatStorageService.saveConversation(updatedConv, user).catch(error => {
                          console.error('Error saving error state:', error);
                        });
                        
                        return updatedConv;
                      }
                      return conv;
                    });
                    
                    return updatedConversations;
                  });
                }
              } else if (completedJob.status === 'FAILED') {
                // Job failed, update message with error
                setConversations(prevConversations => {
                  const updatedConversations = prevConversations.map(conv => {
                    if (conv.id === conversation.id) {
                      const updatedConv = {
                        ...conv,
                        messages: conv.messages.map(convMsg => {
                          if (convMsg.id === msg.id) {
                            return {
                              ...convMsg,
                              content: 'Failed to generate image',
                              imageGenerationJob: completedJob,
                              isAsyncImageGeneration: false,
                              isGeneratingImage: false,
                            } as ChatMessage;
                          }
                          return convMsg;
                        }),
                        updatedAt: new Date(),
                      };
                      
                      setCurrentConversation(prevCurrent =>
                        prevCurrent && prevCurrent.id === conversation.id ? updatedConv : prevCurrent
                      );
                      
                      // Save failed state
                      ChatStorageService.saveConversation(updatedConv, user).catch(error => {
                        console.error('Error saving failed resumed job:', error);
                      });
                      
                      return updatedConv;
                    }
                    return conv;
                  });
                  
                  return updatedConversations;
                });
              }
            },
            (error) => {
              console.error('Job polling error during resume:', error);
            }
          );
        }
        }
      });
      
      if (foundActiveJobs > 0) {
        console.log(`Resumed ${foundActiveJobs} active jobs in conversation ${conversation.id}`);
      }
    } catch (error) {
      console.error('Error resuming active jobs for conversation:', error);
    }
  }, [user, setConversations, setCurrentConversation]);

  const selectConversation = useCallback(async (conversation: ChatConversation | null) => {
    // STOP ALL POLLING when switching conversations
    console.log('Stopping ALL job polling before switching conversation');
    ImageGenerationJobService.stopAllPolling();

    // Always set the current conversation first so UI updates immediately
    setCurrentConversation(conversation);

    // Reset message pagination state when selecting a new conversation
    setHasMoreMessages(true);
    setMessagesLastDoc(null);

    if (conversation) {
      // Set loading state immediately when selecting a conversation
      setIsLoadingMessages(true);

      // Load messages for this conversation and then resume jobs
      try {
        const loadResult = await loadConversationMessages(conversation.id);
        if (loadResult) {
          // Resume jobs after messages are loaded with small delay
          setTimeout(() => {
            const updatedConversation = { ...conversation, messages: loadResult.messages };
            resumeActiveJobsForConversation(updatedConversation);
          }, 100);
        }
      } catch (error) {
        console.error('Error in selectConversation:', error);
      }
    }
  }, [loadConversationMessages, resumeActiveJobsForConversation]);

  const deleteConversation = useCallback((conversationId: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    setFilteredConversations(prev => prev.filter(conv => conv.id !== conversationId));
    setAllConversationsForSearch(prev => prev.filter(conv => conv.id !== conversationId));
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(null);
    }

    // Delete from storage
    ChatStorageService.deleteConversation(conversationId, user).catch(error => {
      console.error('Error deleting conversation:', error);
    });
  }, [currentConversation, user]);

  // Search functionality
  const searchConversations = useCallback(async (query: string) => {
    if (!query.trim()) {
      setFilteredConversations([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const normalizedQuery = query.toLowerCase().trim();

    // Filter from all loaded conversations
    let filtered = allConversationsForSearch.filter(conv =>
      conv.title.toLowerCase().includes(normalizedQuery)
    );

    setFilteredConversations(filtered);

    // If we have few results and there are more conversations to load, keep loading more
    let attempts = 0;
    const maxAttempts = 5; // Prevent infinite loops

    while (filtered.length < 10 && hasMoreConversations && !isLoadingMore && attempts < maxAttempts) {
      attempts++;
      try {
        await loadMoreConversations();
        // Re-filter with updated conversations
        filtered = allConversationsForSearch.filter(conv =>
          conv.title.toLowerCase().includes(normalizedQuery)
        );
        setFilteredConversations(filtered);
      } catch (error) {
        console.error('Error loading more conversations during search:', error);
        break;
      }
    }

    setIsSearching(false);
  }, [allConversationsForSearch, hasMoreConversations, isLoadingMore, loadMoreConversations]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setFilteredConversations([]);
    setIsSearching(false);
  }, []);

  // Update allConversationsForSearch when conversations change
  React.useEffect(() => {
    setAllConversationsForSearch(conversations);
  }, [conversations]);

  // Cleanup polling on unmount and when user logs out
  React.useEffect(() => {
    return () => {
      // Stop all polling when component unmounts
      ImageGenerationJobService.stopAllPolling();
    };
  }, []);

  // Stop polling when user logs out
  React.useEffect(() => {
    if (!user) {
      // Stop all polling when user logs out
      ImageGenerationJobService.stopAllPolling();
    }
  }, [user]);

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
    sendMessage,
    generateImage,
    stopStreaming,
    createNewConversation,
    selectConversation,
    deleteConversation,
    loadConversations,
    loadMoreConversations,
    loadMoreMessages,
    // Search functionality
    searchQuery,
    setSearchQuery,
    filteredConversations,
    isSearching,
    searchConversations,
    clearSearch
  };
};