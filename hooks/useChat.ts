import React from 'react';
import { useState, useCallback, useRef } from 'react';
import { NavigateFunction } from 'react-router-dom';
import { ChatMessage, ChatConversation, StreamingState, MessageContent, MessageAttachment, TextContent, ImageContent } from '../types/chat';
import { ChatService } from '../services/chatService';
import { ChatMessage as ServiceChatMessage } from '../services/chatService';
import { ChatStorageService } from '../services/chatStorageService';
import { ImageGenerationService } from '../services/imageGenerationService';
import { ImageGenerationJobService } from '../services/imageGenerationJobService';
import { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { AppSettings } from '../hooks/useSettings';
import { getSystemModels } from '../services/modelService';
import { DEFAULT_SYSTEM_MODELS, DEFAULT_MODEL_ID } from '../constants/models';
import { buildSystemPrompt } from '../constants/systemPrompt';


// Add conversation cache interface
interface ConversationCache {
  [conversationId: string]: {
    conversation: ChatConversation;
    timestamp: number;
  };
}


// Cache configuration
const CACHE_MAX_SIZE = 50; // Maximum number of conversations to cache
const CACHE_EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes in milliseconds

export const useChat = (settings?: AppSettings | undefined, navigate?: NavigateFunction) => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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

  // Add conversation cache state
  const [conversationCache, setConversationCache] = useState<ConversationCache>({});
  const cacheRef = useRef<ConversationCache>({});

  // Track background loading to prevent duplicate requests
  const isLoadingAllConversationsRef = useRef(false);
  const isLoadingConversationsRef = useRef(false);

  const streamingMessageRef = useRef<string>('');
  const streamingReasoningRef = useRef<string>('');

  // Debounced save refs for stream optimization
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveTimeRef = useRef<number>(0);
  const pendingConversationRef = useRef<ChatConversation | null>(null);

  // Configuration for batched saves
  const SAVE_DEBOUNCE_DELAY = 2000; // 2 seconds delay
  const MIN_SAVE_INTERVAL = 5000; // Minimum 5 seconds between saves

  // State to track system model IDs
  const [systemModelIds, setSystemModelIds] = useState<string[]>(DEFAULT_SYSTEM_MODELS.map(model => model.id));

  const currentConversation = React.useMemo(() => {
    if (!currentConversationId) return null;
    return conversations.find(c => c.id === currentConversationId) ?? null;
  }, [conversations, currentConversationId]);

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

  // Debounced save function for streaming optimization
  const debouncedSaveConversation = useCallback((conversation: ChatConversation, isForceImmediate: boolean = false) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    // Store the conversation to be saved
    pendingConversationRef.current = conversation;

    // If force immediate or enough time has passed since last save, save immediately
    const now = Date.now();
    const timeSinceLastSave = now - lastSaveTimeRef.current;

    if (isForceImmediate || timeSinceLastSave >= MIN_SAVE_INTERVAL) {
      lastSaveTimeRef.current = now;
      ChatStorageService.saveConversation(conversation, user).catch(error => {
        console.error('Error saving conversation during streaming:', error);
      });
      pendingConversationRef.current = null;
      return;
    }

    // Otherwise, debounce the save
    saveTimeoutRef.current = setTimeout(() => {
      if (pendingConversationRef.current) {
        lastSaveTimeRef.current = Date.now();
        ChatStorageService.saveConversation(pendingConversationRef.current, user).catch(error => {
          console.error('Error saving debounced conversation:', error);
        });
        pendingConversationRef.current = null;
      }
      saveTimeoutRef.current = null;
    }, SAVE_DEBOUNCE_DELAY);
  }, [user]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Check for timed-out non-async image generation messages
  React.useEffect(() => {
    if (!user) return;

    const checkTimeouts = () => {
      const oneHourInMs = 60 * 60 * 1000; // 1 hour in milliseconds
      const now = Date.now();

      setConversations(prev => {
        let hasChanges = false;
        const updatedConversations = prev.map(conv => {
          const updatedMessages = conv.messages.map(msg => {
            // Check if message is a non-async image generation that's been loading for more than 1 hour
            if (
              msg.messageType === 'image_generation' &&
              msg.isGeneratingImage &&
              !msg.isAsyncImageGeneration &&
              msg.role === 'assistant' &&
              now - msg.timestamp.getTime() > oneHourInMs
            ) {
              hasChanges = true;
              console.log(`⏰ Timing out image generation message ${msg.id} in conversation ${conv.id} - ${Math.round((now - msg.timestamp.getTime()) / (60 * 1000))} minutes old`);
              
              return {
                ...msg,
                isGeneratingImage: false,
                content: 'Image generation timed out after 1 hour',
                isError: true,
              };
            }
            return msg;
          });

          if (hasChanges && updatedMessages !== conv.messages) {
            const updatedConv = {
              ...conv,
              messages: updatedMessages,
              updatedAt: new Date(),
            };

            // Save the updated conversation to database
            ChatStorageService.saveConversation(updatedConv, user).catch(error => {
              console.error('Error saving timed-out conversation:', error);
            });

            return updatedConv;
          }
          return conv;
        });

        return hasChanges ? updatedConversations : prev;
      });
    };

    // Check immediately, then every 5 minutes
    checkTimeouts();
    const interval = setInterval(checkTimeouts, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user]);

  // Listen to auth state changes
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // If user signs out, clear current conversation to show welcome page
      if (!currentUser && user) {
        setCurrentConversationId(null);
      }
    });
    return unsubscribe;
  }, [user]);

  // Load conversations on mount and user change
  const loadConversations = useCallback(async () => {
    // Prevent multiple simultaneous loads using only the ref
    if (isLoadingConversationsRef.current) {
      console.log('⏸️ Skipping loadConversations - already in progress');
      return;
    }

    try {
      isLoadingConversationsRef.current = true;
      setIsLoading(true);

      // Add timeout as safety net
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Conversation loading timeout')), 15000)
      );

      const loadPromise = ChatStorageService.loadConversationsPaginated(user, 20);
      const result = await Promise.race([loadPromise, timeoutPromise]) as any;

      setConversations(result.conversations);
      setHasMoreConversations(result.hasMore);
      setConversationsLastDoc(result.lastDoc);
    } catch (error) {
      console.error('Error loading conversations:', error);
      // Ensure we don't stay in loading state on error
      setConversations([]);
      setHasMoreConversations(false);
    } finally {
      setIsLoading(false);
      isLoadingConversationsRef.current = false;
    }
  }, [user]);

  // Load conversations when user changes
  React.useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Clear search cache when user changes (login/logout/switch users)
  React.useEffect(() => {
    // Clear search cache whenever user changes to ensure user isolation
    setAllConversationsForSearch([]);
    setFilteredConversations([]);
    if (searchQuery) {
      setSearchQuery('');
    }
    setIsSearching(false);

    // Reset ALL loading flags immediately when user changes
    isLoadingAllConversationsRef.current = false;
    isLoadingConversationsRef.current = false;

    // Also reset loading state to prevent stuck loading
    setIsLoading(false);
  }, [user?.uid]); // Only trigger when actual user ID changes

  // Re-search when more comprehensive conversation data becomes available
  React.useEffect(() => {
    // If we have an active search query and more conversations just became available, re-search
    if (searchQuery && searchQuery.trim() && allConversationsForSearch.length > conversations.length) {
      console.log(`🔄 Re-searching with ${allConversationsForSearch.length} conversations (was ${conversations.length})`);

      // Re-run the search with the complete data - ONLY search titles
      const searchLower = searchQuery.toLowerCase();
      const results = allConversationsForSearch.filter(conv => {
        // Only check title - no message searching
        return conv.title.toLowerCase().includes(searchLower);
      });

      console.log(`🔍 Enhanced search complete: ${results.length} results found (was ${filteredConversations.length})`);
      setFilteredConversations(results);
    }
  }, [allConversationsForSearch.length, searchQuery, conversations.length]); // Re-search when more conversations become available

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
        setCurrentConversationId(newOrExisting.id);

        // Navigate to new conversation route
        if (navigate) {
          navigate(`/c/${newOrExisting.id}`, { replace: true });
        }
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
    setCurrentConversationId(newConversation.id);

    // Save to storage
    ChatStorageService.saveConversation(newConversation, user).catch(error => {
      console.error('Error saving new conversation:', error);
    }).finally(() => {
      setIsCreatingNewChat(false);
    });

    // Navigate to the new conversation
    if (navigate) {
      navigate(`/c/${newConversation.id}`, { replace: true });
    }

    return newConversation;
  }, [user, isCreatingNewChat, currentConversation, systemModelIds, getModelSource, navigate]);

  const updateMessage = useCallback((conversationId: string, messageId: string, content: string) => {
    let updatedConversation: ChatConversation | null = null;

    setConversations(prev => {
      const newConversations = prev.map(conv => {
        if (conv.id === conversationId) {
          updatedConversation = {
            ...conv,
            messages: conv.messages.map(msg =>
              msg.id === messageId ? { ...msg, content } : msg
            ),
            updatedAt: new Date()
          };
          return updatedConversation;
        }
        return conv;
      });

      // Use debounced save instead of immediate save during streaming
      if (updatedConversation) {
        debouncedSaveConversation(updatedConversation);
      }
      return newConversations;
    });
  }, [user, debouncedSaveConversation]);

  const updateMessageReasoning = useCallback((conversationId: string, messageId: string, reasoning: string) => {
    let updatedConversation: ChatConversation | null = null;

    setConversations(prev => {
      const newConversations = prev.map(conv => {
        if (conv.id === conversationId) {
          updatedConversation = {
            ...conv,
            messages: conv.messages.map(msg =>
              msg.id === messageId ? { ...msg, reasoning } : msg
            ),
            updatedAt: new Date()
          };
          return updatedConversation;
        }
        return conv;
      });

      // Use debounced save instead of immediate save during streaming
      if (updatedConversation) {
        debouncedSaveConversation(updatedConversation);
      }
      return newConversations;
    });
  }, [user, debouncedSaveConversation]);

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

    // If there's no currentConversationId (i.e., we're on welcome screen) or no conversation exists,
    // create a new conversation regardless of currentConversation object state
    if (!currentConversationId || !conversation) {
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
      setCurrentConversationId(conversation.id);

      // Navigate to the new conversation immediately
      if (navigate) {
        navigate(`/c/${conversation.id}`, { replace: true });
      }
    } else if (conversation.messages.length === 0 && conversation.title === 'New Chat') {
      // Update existing empty conversation title with the message content
      const messageTitle = createSmartTitle(extractTextFromContent(messageContent));
      conversation = {
        ...conversation,
        title: messageTitle,
        updatedAt: new Date()
      };

      // Update the conversation in state immediately
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

      // Add system message with default prompt and custom instruction combined
      let messagesToSend: ServiceChatMessage[] = historyMessages;

      // Always add system prompt - combines default prompt with user custom instruction
      const systemPrompt = buildSystemPrompt(settings?.customInstruction);
      messagesToSend = [
        { role: 'system', content: systemPrompt },
        ...historyMessages
      ];

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
        let finalConversation: ChatConversation | null = null;

        setConversations(prev => {
          const updatedConversations = prev.map(conv =>
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
          );

          // Store the final conversation for immediate save
          finalConversation = updatedConversations.find(conv => conv.id === updatedConversation.id) || null;
          return updatedConversations;
        });

        // Force immediate save of final conversation (bypassing debounce)
        if (finalConversation) {
          debouncedSaveConversation(finalConversation, true);
        }

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

        let errorConversation: ChatConversation | null = null;

        setConversations(prev => {
          const updatedConversations = prev.map(conv =>
            conv.id === updatedConversation.id
              ? {
                ...conv,
                messages: conv.messages.map(msg =>
                  msg.id === aiMessage.id ? { ...msg, isError: true, isStreaming: false } : msg
                )
              }
              : conv
          );

          // Store the error conversation for immediate save
          errorConversation = updatedConversations.find(conv => conv.id === updatedConversation.id) || null;
          return updatedConversations;
        });

        // Force immediate save of error conversation (bypassing debounce)
        if (errorConversation) {
          debouncedSaveConversation(errorConversation, true);
        }

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

      let catchErrorConversation: ChatConversation | null = null;

      setConversations(prev => {
        const updatedConversations = prev.map(conv =>
          conv.id === updatedConversation.id
            ? {
              ...conv,
              messages: conv.messages.map(msg =>
                msg.id === aiMessage.id ? { ...msg, isError: true, isStreaming: false } : msg
              )
            }
            : conv
        );

        // Store the error conversation for immediate save
        catchErrorConversation = updatedConversations.find(conv => conv.id === updatedConversation.id) || null;
        return updatedConversations;
      });

      // Force immediate save of error conversation (bypassing debounce)
      if (catchErrorConversation) {
        debouncedSaveConversation(catchErrorConversation, true);
      }

      setStreamingState({
        isStreaming: false,
        currentMessageId: null,
        controller: null
      });
      streamingMessageRef.current = '';
      streamingReasoningRef.current = '';
    }
  }, [currentConversation, createNewConversation, updateMessage, updateMessageReasoning, user, settings, debouncedSaveConversation]);

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
                                    isGeneratingImage: false, // Mark as completed
                                  } as ChatMessage;
                                }
                                return msg;
                              }),
                              updatedAt: new Date(),
                            };

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
                                    isGeneratingImage: false,
                                  } as ChatMessage;
                                }
                                return msg;
                              }),
                              updatedAt: new Date(),
                            };

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
                                  isGeneratingImage: false,
                                } as ChatMessage;
                              }
                              return msg;
                            }),
                            updatedAt: new Date(),
                          };

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

      // Save to storage
      try {
        await ChatStorageService.saveConversation(conversationWithLoading, user);
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
      let foundActiveJobs = 0;

      // Find active jobs only in the current conversation
      conversation.messages.forEach(msg => {
        // Look for messages that are image generation jobs
        if (msg.messageType === 'image_generation' && msg.imageGenerationJob) {
          const job = msg.imageGenerationJob;

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
            if (job.status === 'SUCCESS' && (!msg.attachments || msg.attachments.length === 0)) {
              // Will download image
            } else if (job.status === 'SUCCESS' && msg.attachments && msg.attachments.length > 0 && (msg.isGeneratingImage || msg.isAsyncImageGeneration)) {
              // Will fix state
            } else {
              // Continue with status
            }

            // Get original provider info from imageGenerationParams
            const originalSource = msg.imageGenerationParams?.originalSource || 'system';
            const originalProviderId = msg.imageGenerationParams?.originalProviderId;

            // Handle SUCCESS jobs that are stuck in generating state with attachments already present
            if (job.status === 'SUCCESS' && msg.attachments && msg.attachments.length > 0 && (msg.isGeneratingImage || msg.isAsyncImageGeneration)) {
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

            // Resume polling for in-progress jobs only if not already being polled
            if (!ImageGenerationJobService.isJobBeingPolled(job.id)) {
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
                  } else if (completedJob.status !== 'SUCCESS') {
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
                  console.error('Error polling job status:', error);
                  // Update the message with error state
                  setConversations(prevConversations => {
                    const updatedConversations = prevConversations.map(conv => {
                      if (conv.id === conversation.id) {
                        const updatedConv = {
                          ...conv,
                          messages: conv.messages.map(convMsg => {
                            if (convMsg.id === msg.id) {
                              return {
                                ...convMsg,
                                content: 'Error checking image generation status',
                                isAsyncImageGeneration: false,
                                isGeneratingImage: false,
                              } as ChatMessage;
                            }
                            return convMsg;
                          }),
                          updatedAt: new Date(),
                        };

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
              );
            }
          }
        }
      });

      if (foundActiveJobs > 0) {
        console.log(`Resumed ${foundActiveJobs} active jobs in conversation ${conversation.id}`);
      }
    } catch (error) {
      console.error('Error resuming active jobs for conversation:', error);
    }
  }, [user]);

  React.useEffect(() => {
    // This effect runs when currentConversation changes, and its messages are populated.
    if (currentConversation && currentConversation.messages && currentConversation.messages.length > 0 && !isLoadingMessages) {
      // Check if this conversation has active jobs to resume.
      const hasActiveJobs = currentConversation.messages.some(m => m.isGeneratingImage || m.isAsyncImageGeneration);
      if (hasActiveJobs) {
        resumeActiveJobsForConversation(currentConversation);
      }
    }
  }, [currentConversation, isLoadingMessages, resumeActiveJobsForConversation]);

  // Cache management functions
  const addToCache = useCallback((conversation: ChatConversation) => {
    const now = Date.now();

    setConversationCache(prev => {
      const newCache = { ...prev };

      // Add/update conversation in cache
      newCache[conversation.id] = {
        conversation,
        timestamp: now
      };

      // Remove expired entries and enforce size limit
      const entries = Object.entries(newCache);
      const validEntries = entries.filter(([_, data]) =>
        now - data.timestamp < CACHE_EXPIRY_TIME
      );

      // Sort by timestamp (most recent first) and limit size
      const limitedEntries = validEntries
        .sort(([, a], [, b]) => b.timestamp - a.timestamp)
        .slice(0, CACHE_MAX_SIZE);

      const cleanCache: ConversationCache = {};
      limitedEntries.forEach(([id, data]) => {
        cleanCache[id] = data;
      });

      cacheRef.current = cleanCache;
      return cleanCache;
    });
  }, []);

  // Load messages for a conversation
  const loadConversationMessages = useCallback(async (conversationId: string) => {
    setIsLoadingMessages(true);
    try {
      const result = await ChatStorageService.loadMessagesPaginated(conversationId, user, 100);

      let loadedConversation: ChatConversation | null = null;
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv.id === conversationId) {
            loadedConversation = { ...conv, messages: result.messages };
            return loadedConversation;
          }
          return conv;
        });
        return updated;
      });

      // Add to cache after loading
      if (loadedConversation) {
        addToCache(loadedConversation);
      }

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
  }, [user, addToCache]);

  const getFromCache = useCallback((conversationId: string): ChatConversation | null => {
    const cached = cacheRef.current[conversationId];
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > CACHE_EXPIRY_TIME) {
      // Remove expired entry
      setConversationCache(prev => {
        const newCache = { ...prev };
        delete newCache[conversationId];
        cacheRef.current = newCache;
        return newCache;
      });
      return null;
    }

    return cached.conversation;
  }, []);

  const clearCache = useCallback(() => {
    setConversationCache({});
    cacheRef.current = {};
  }, []);

  const selectConversation = useCallback(async (conversationId: string | null) => {
    if (currentConversationId === conversationId) {
      return;
    }

    // Before switching conversations, force save any pending changes for current conversation
    if (currentConversationId && pendingConversationRef.current && pendingConversationRef.current.id === currentConversationId) {
      // Clear the timeout and save immediately
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      try {
        await ChatStorageService.saveConversation(pendingConversationRef.current, user);
        console.log('Flushed pending save for conversation:', currentConversationId);
      } catch (error) {
        console.error('Error flushing pending save:', error);
      }

      pendingConversationRef.current = null;
      lastSaveTimeRef.current = Date.now();
    }

    ImageGenerationJobService.stopAllPolling();

    if (!conversationId) {
      setCurrentConversationId(null);
      if (navigate) {
        navigate('/', { replace: true });
      }
      return;
    }

    // Set the conversation ID immediately for proper routing
    setCurrentConversationId(conversationId);

    setHasMoreMessages(true);
    setMessagesLastDoc(null);

    if (navigate) {
      navigate(`/c/${conversationId}`, { replace: true });
    }

    // First, check if we have the conversation in current state with messages
    const currentStateConversation = conversations.find(c => c.id === conversationId);
    if (currentStateConversation && currentStateConversation.messages && currentStateConversation.messages.length > 0) {
      // We have the full conversation in current state, use it
      addToCache(currentStateConversation);
      resumeActiveJobsForConversation(currentStateConversation);
      return;
    }

    // Check cache second (only if not found in current state or if it's just a stub)
    const cachedConversation = getFromCache(conversationId);
    if (cachedConversation) {
      // Update state with cached conversation
      setConversations(prev => {
        const existingIndex = prev.findIndex(c => c.id === conversationId);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = cachedConversation;
          return updated;
        } else {
          return [cachedConversation, ...prev];
        }
      });

      // Resume any active jobs in this newly selected conversation
      resumeActiveJobsForConversation(cachedConversation);
      return;
    }

    // Find the conversation stub from the list
    const conversationStub = conversations.find(c => c.id === conversationId);

    // If we need to load messages (stub exists but no messages), set loading state
    if (conversationStub && (!conversationStub.messages || conversationStub.messages.length === 0)) {
      setIsLoadingMessages(true);
    }

    // If conversation doesn't exist in list (direct URL access), try to load it directly
    if (!conversationStub) {
      setIsLoadingMessages(true);
      try {
        // Try to load the conversation directly from storage
        const result = await ChatStorageService.loadConversation(conversationId, user);
        if (result) {
          // Add the loaded conversation to the conversations list (check for duplicates first)
          setConversations(prev => {
            // Check if conversation already exists
            const existingIndex = prev.findIndex(c => c.id === conversationId);
            if (existingIndex >= 0) {
              // Update existing conversation
              const updated = [...prev];
              updated[existingIndex] = result;
              return updated;
            } else {
              // Add new conversation to the front
              const combined = [result, ...prev];
              return combined;
            }
          });
          addToCache(result);
          resumeActiveJobsForConversation(result);
          setIsLoadingMessages(false);
          return;
        } else {
          // Conversation not found, but don't redirect immediately if user is not authenticated
          if (!user) {
            setIsLoadingMessages(false);
            return;
          }

          console.warn(`Conversation ${conversationId} not found`);
          if (navigate) {
            navigate('/', { replace: true });
          }
          setCurrentConversationId(null);
          setIsLoadingMessages(false);
          return;
        }
      } catch (error) {
        console.error('Error loading conversation directly:', error);
        // If we can't load the conversation, redirect to home
        if (navigate) {
          navigate('/', { replace: true });
        }
        setCurrentConversationId(null);
        setIsLoadingMessages(false);
        return;
      }
    }

    // At this point, we have a conversation stub from the list
    if (!conversationStub.messages || conversationStub.messages.length === 0) {
      const result = await loadConversationMessages(conversationId);

      // Add loaded conversation to cache
      if (result) {
        setConversations(current => {
          const fullConversation = current.find(c => c.id === conversationId);
          if (fullConversation && fullConversation.messages.length > 0) {
            addToCache(fullConversation);
            // Resume jobs after loading is complete
            resumeActiveJobsForConversation(fullConversation);
          }
          return current;
        });
      }
    } else {
      // Restore the existing full conversation
      setConversations(prev => {
        const existingIndex = prev.findIndex(c => c.id === conversationId);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = conversationStub;
          return updated;
        }
        return prev;
      });

      // Add existing full conversation to cache
      addToCache(conversationStub);
      resumeActiveJobsForConversation(conversationStub);
    }
  }, [currentConversationId, conversations, loadConversationMessages, navigate, getFromCache, addToCache, resumeActiveJobsForConversation, user]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    // Remove from conversations
    setConversations(prev => prev.filter(conv => conv.id !== conversationId));

    // Remove from cache
    setConversationCache(prev => {
      const newCache = { ...prev };
      delete newCache[conversationId];
      cacheRef.current = newCache;
      return newCache;
    });

    // If this is the current conversation, clear it and navigate to home
    if (currentConversationId === conversationId) {
      setCurrentConversationId(null);
      if (navigate) {
        navigate('/', { replace: true });
      }
    }

    // Delete from storage
    try {
      await ChatStorageService.deleteConversation(conversationId, user);
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  }, [currentConversationId, user, navigate]);

  // Clear cache when user logs out
  React.useEffect(() => {
    if (!user) {
      clearCache();
      ImageGenerationJobService.stopAllPolling();

      // Also clear search cache when user changes
      setAllConversationsForSearch([]);
      setFilteredConversations([]);
      setSearchQuery('');
      setIsSearching(false);

      // Flush any pending saves before clearing
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      if (pendingConversationRef.current) {
        // Don't save if user is logged out
        pendingConversationRef.current = null;
      }
    }
  }, [user, clearCache]);

  // Search functionality
  const searchConversations = useCallback(async (query: string) => {
    if (!query.trim()) {
      setFilteredConversations([]);
      setIsSearching(false);
      return;
    }

    console.log(`🔍 Starting search for: "${query}"`);
    setIsSearching(true);
    try {
      // Get current search data - use smart caching strategy
      let searchableConversations = allConversationsForSearch;

      if (searchableConversations.length === 0) {
        // First search: Start with currently loaded conversations for immediate results
        if (conversations.length > 0) {
          console.log(`⚡ Fast search: Using ${conversations.length} loaded conversations`);
          searchableConversations = conversations;

          // Cache the current conversations for immediate use
          setAllConversationsForSearch(conversations);

          // Load all conversations in the background for future searches (don't wait for it)
          if (hasMoreConversations) {
            console.log('� Background loading: Fetching all conversations for future searches...');
            ChatStorageService.loadConversations(user, false).then(allConversations => {
              console.log(`📦 Background complete: ${allConversations.length} total conversations cached`);
              setAllConversationsForSearch(allConversations);

              // If the user is still searching the same query, update results with complete data
              // This is handled by the React state update triggering a re-search
            }).catch(error => {
              console.warn('Background conversation loading failed:', error);
            });
          }
        } else {
          // No conversations loaded yet, need to load them
          console.log('📥 Loading conversations for title search...');
          const allConversations = await ChatStorageService.loadConversations(user, false);
          console.log(`� Loaded ${allConversations.length} total conversations`);
          searchableConversations = allConversations;
          setAllConversationsForSearch(allConversations);
        }
      } else {
        console.log(`⚡ Using cached ${searchableConversations.length} conversations for search`);
      }

      // Optimized text search - ONLY search titles, no message content
      const searchLower = query.toLowerCase();
      const results = searchableConversations.filter(conv => {
        // Only check title - no message searching needed
        return conv.title.toLowerCase().includes(searchLower);
      });

      console.log(`✅ Search complete: ${results.length} results found`);
      setFilteredConversations(results);
    } catch (error) {
      console.error('❌ Error searching conversations:', error);
      setFilteredConversations([]);
    } finally {
      setIsSearching(false);
    }
  }, [user, conversations, hasMoreConversations]); // Add conversations and hasMoreConversations to optimize

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setFilteredConversations([]);
    setIsSearching(false);
  }, []);

  return {
    conversations,
    currentConversation,
    currentConversationId,
    isLoading,
    isLoadingMore,
    hasMoreConversations,
    isLoadingMessages,
    isLoadingMoreMessages,
    hasMoreMessages,
    isCreatingNewChat,
    streamingState,
    searchQuery,
    filteredConversations,
    isSearching,
    selectConversation,
    createNewConversation,
    sendMessage,
    generateImage,
    stopStreaming,
    deleteConversation,
    loadMoreConversations,
    loadMoreMessages,
    setSearchQuery,
    searchConversations,
    clearSearch,
    conversationCache: Object.keys(conversationCache).length,
    clearCache,
  };
};