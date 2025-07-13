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

  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  const createNewConversation = useCallback((title: string = 'New Chat', model: string = 'gemini-1.5-flash'): ChatConversation => {
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

    setCurrentConversation(prev => 
      prev && prev.id === conversationId 
        ? {
            ...prev,
            messages: prev.messages.map(msg =>
              msg.id === messageId ? { ...msg, content } : msg
            ),
            updatedAt: new Date()
          }
        : prev
    );
  }, []);

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

          setStreamingState({
            isStreaming: false,
            currentMessageId: null,
            controller: null
          });
          streamingMessageRef.current = '';
        },
        (error: Error) => {
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