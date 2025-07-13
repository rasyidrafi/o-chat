import { useState, useCallback, useRef } from 'react';
import { ChatMessage, ChatConversation, StreamingState } from '../types/chat';
import { ChatService } from '../services/chatService';
import { ChatMessage as ServiceChatMessage } from '../services/chatService';
import { User } from 'firebase/auth';

export const useChat = (user?: User | null) => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null);
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    currentMessageId: null,
    controller: null
  });

  const streamingMessageRef = useRef<string>('');

  const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  const createNewConversation = useCallback((title: string = 'New Chat', model: string = 'gemini-1.5-flash') => {
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
    return newConversation;
  }, []);

  const addMessage = useCallback((conversationId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: generateId(),
      timestamp: new Date()
    };

    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { 
            ...conv, 
            messages: [...conv.messages, newMessage],
            updatedAt: new Date()
          }
        : conv
    ));

    if (currentConversation?.id === conversationId) {
      setCurrentConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages, newMessage],
        updatedAt: new Date()
      } : null);
    }

    return newMessage;
  }, [currentConversation]);

  const updateMessage = useCallback((conversationId: string, messageId: string, content: string) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? {
            ...conv,
            messages: conv.messages.map(msg => 
              msg.id === messageId ? { ...msg, content } : msg
            ),
            updatedAt: new Date()
          }
        : conv
    ));

    if (currentConversation?.id === conversationId) {
      setCurrentConversation(prev => prev ? {
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === messageId ? { ...msg, content } : msg
        ),
        updatedAt: new Date()
      } : null);
    }
  }, [currentConversation]);

  const sendMessage = useCallback(async (
    content: string, 
    model: string, 
    source: string = 'system'
  ) => {
    if (!content.trim()) return;

    // Create or get current conversation
    let conversation = currentConversation;
    if (!conversation) {
      const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
      conversation = createNewConversation(title, model);
    }

    // Add user message
    const userMessage = addMessage(conversation.id, {
      role: 'user',
      content: content.trim()
    });

    // For system models, make API call
    if (source === 'system') {
      // Create AI response message
      const aiMessage = addMessage(conversation.id, {
        role: 'assistant',
        content: '',
        model,
        isStreaming: true
      });

      // Set up streaming
      const controller = new AbortController();
      setStreamingState({
        isStreaming: true,
        currentMessageId: aiMessage.id,
        controller
      });

      streamingMessageRef.current = '';

      try {
        // Prepare messages for API
        const apiMessages: ServiceChatMessage[] = conversation.messages
          .concat([userMessage])
          .filter(msg => msg.role !== 'system') // Filter out system messages if any
          .map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          }));

        // Log the exact parameters being passed
        console.log('ChatService.sendMessage parameters:', {
          model,
          apiMessagesLength: apiMessages.length,
          userUid: user?.uid,
          controllerExists: !!controller
        });

        await ChatService.sendMessage(
          model,
          apiMessages,
          (chunk: string) => {
            // Handle streaming chunk
            streamingMessageRef.current += chunk;
            updateMessage(conversation!.id, aiMessage.id, streamingMessageRef.current);
          },
          () => {
            // Handle completion
            setStreamingState({
              isStreaming: false,
              currentMessageId: null,
              controller: null
            });
            streamingMessageRef.current = '';
          },
          (error: Error) => {
            // Handle error
            console.error('Chat error:', error);
            console.log('Error callback, user:', user);
            updateMessage(conversation!.id, aiMessage.id, `Error: ${error.message}`);
            
            // Mark message as error
            setConversations(prev => prev.map(conv => 
              conv.id === conversation!.id 
                ? {
                    ...conv,
                    messages: conv.messages.map(msg => 
                      msg.id === aiMessage.id ? { ...msg, isError: true, isStreaming: false } : msg
                    ),
                  }
                : conv
            ));

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
        console.error('Failed to send message:', error);
        console.log('Catch block, user:', user);
        setStreamingState({
          isStreaming: false,
          currentMessageId: null,
          controller: null
        });
        streamingMessageRef.current = '';
      }
    } else {
      console.log('Non-system model not implemented yet');
    }
  }, [currentConversation, createNewConversation, addMessage, updateMessage, user]);

  const stopStreaming = useCallback(() => {
    if (streamingState.controller) {
      streamingState.controller.abort();
      setStreamingState({
        isStreaming: false,
        currentMessageId: null,
        controller: null
      });
      streamingMessageRef.current = '';
    }
  }, [streamingState]);

  const selectConversation = useCallback((conversation: ChatConversation) => {
    setCurrentConversation(conversation);
  }, []);

  const deleteConversation = useCallback((conversationId: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(null);
    }
  }, [currentConversation]);

  return {
    conversations,
    currentConversation,
    streamingState,
    sendMessage,
    stopStreaming,
    createNewConversation,
    selectConversation,
    deleteConversation
  };
};
