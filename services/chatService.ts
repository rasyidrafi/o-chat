// Chat service for handling AI model interactions
// Supports both streaming and non-streaming responses:
// - First attempts streaming for real-time response delivery
// - Falls back to non-streaming if streaming is not supported by the provider
import OpenAI from "openai";
import { User } from 'firebase/auth';
import { MessageContent } from '../types/chat';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: MessageContent;
}

// Helper function to convert our MessageContent to OpenAI format
function convertToOpenAIMessage(message: ChatMessage): OpenAI.Chat.Completions.ChatCompletionMessageParam {
  if (typeof message.content === 'string') {
    // Simple text message
    return {
      role: message.role,
      content: message.content
    } as OpenAI.Chat.Completions.ChatCompletionMessageParam;
  } else {
    // Complex content with images/text
    const content = message.content.map(item => {
      if (item.type === 'text') {
        return {
          type: 'text' as const,
          text: item.text
        };
      } else if (item.type === 'image_url') {
        return {
          type: 'image_url' as const,
          image_url: {
            url: item.image_url.url,
            detail: item.image_url.detail || 'auto'
          }
        };
      }
      return item;
    });

    return {
      role: message.role,
      content: content
    } as OpenAI.Chat.Completions.ChatCompletionMessageParam;
  }
}

export interface ChatResponse {
  choices: {
    delta: {
      content?: string;
      reasoning?: string;
      reasoning_details?: any[];
    };
  }[];
}

export interface NonStreamingChatResponse {
  choices: {
    message: {
      content?: string;
      reasoning?: string;
      role: string;
    };
  }[];
}

export class ChatService {
  private static createOpenAIInstance(idToken?: string, baseURL?: string, apiKey?: string) {
    const headers: Record<string, string> = {};

    // Add Firebase ID token as Authorization header if available
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }

    return new OpenAI({
      apiKey: apiKey || "",
      baseURL: baseURL || "",
      defaultHeaders: headers,
      dangerouslyAllowBrowser: true // Allow browser usage
    });
  }

  private static getProviderConfig(source: string, providerId?: string) {
    if (source === 'system') {
      return {
        baseURL: import.meta.env.VITE_FIREBASE_FUNC_BASE_API,
        apiKey: "",
        requiresAuth: true
      };
    }

    if (source === 'custom' && providerId) {
      try {
        const customProviders = localStorage.getItem('custom_api_providers');
        if (customProviders) {
          const providers = JSON.parse(customProviders);
          const provider = providers.find((p: any) => p.id === providerId);
          if (provider && provider.value && provider.base_url) {
            return {
              baseURL: provider.base_url,
              apiKey: provider.value,
              requiresAuth: false
            };
          }
        }
      } catch (error) {
        console.error('Error loading custom provider config:', error);
      }
    }

    // return error
    throw new Error('No valid provider configuration found');
  }

  static async sendMessage(
    model: string,
    messages: ChatMessage[],
    onChunk: (content: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
    user?: User | null,
    abortController?: AbortController,
    source: string = 'system',
    providerId?: string,
    onReasoningChunk?: (reasoning: string) => void
  ): Promise<void> {

    try {
      const config = this.getProviderConfig(source, providerId);
      let idToken: string | undefined;

      // Get Firebase ID token if required and user is authenticated
      if (config.requiresAuth && user) {
        try {
          idToken = await user.getIdToken();
        } catch (tokenError) {
          console.warn('Failed to get Firebase ID token:', tokenError);
          if (source === 'system') {
            throw new Error('Authentication required for system models');
          }
        }
      }

      // Create OpenAI instance with the appropriate configuration
      const openai = this.createOpenAIInstance(idToken, config.baseURL, config.apiKey);

      // Convert our message format to OpenAI format
      const openAIMessages = messages.map(convertToOpenAIMessage);

      // Try streaming first
      try {
        const completion = await openai.chat.completions.create({
          model,
          messages: openAIMessages,
          stream: true
        }, {
          signal: abortController?.signal
        });

        for await (const chunk of completion) {
          // Handle reasoning chunks
          // @ts-ignore
          if (chunk.choices[0]?.delta?.reasoning && onReasoningChunk) {
            // @ts-ignore
            onReasoningChunk(chunk.choices[0].delta.reasoning);
          }
          
          // Handle content chunks
          if (chunk.choices[0]?.delta?.content) {
            onChunk(chunk.choices[0].delta.content);
          }
        }

        onComplete();
      } catch (streamError: any) {
        // Check if the error indicates streaming is not supported
        const isStreamingNotSupported = 
          streamError?.message?.toLowerCase().includes('stream') ||
          streamError?.message?.toLowerCase().includes('sse') ||
          streamError?.message?.toLowerCase().includes('event-stream') ||
          streamError?.status === 400 ||
          streamError?.status === 422;

        if (isStreamingNotSupported) {
          console.log('Streaming not supported, falling back to non-streaming mode');
          
          try {
            const completion = await openai.chat.completions.create({
              model,
              messages: openAIMessages,
              stream: false
            }, {
              signal: abortController?.signal
            });

            // For non-streaming response, send the complete content at once
            const content = completion.choices[0]?.message?.content;
            if (content) {
              onChunk(content);
            }

            // Handle reasoning if present in non-streaming response
            // @ts-ignore
            const reasoning = completion.choices[0]?.message?.reasoning;
            if (reasoning && onReasoningChunk) {
              onReasoningChunk(reasoning);
            }

            onComplete();
          } catch (nonStreamError) {
            // If both streaming and non-streaming fail, throw the non-streaming error
            throw nonStreamError;
          }
        } else {
          // If it's not a streaming-related error, rethrow the original error
          throw streamError;
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, don't call onError
        return;
      }
      onError(error as Error);
    }
  }
}