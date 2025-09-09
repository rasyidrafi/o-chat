// Chat service for handling AI model interactions
// Supports multiple response formats:
// - Plain text responses (content-type: text/plain)
// - OpenAI JSON format with streaming support
// - OpenAI JSON format without streaming
// Automatically detects and handles the appropriate format
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

    // Sanitize base URL to avoid double slashes
    const sanitizedBaseURL = baseURL ? baseURL.replace(/\/+$/, '') : baseURL;

    return new OpenAI({
      apiKey: apiKey || "",
      baseURL: sanitizedBaseURL || "",
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

      // Check if this might be a text-only API first
      try {
        // Try direct fetch to see response content type
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (idToken) {
          headers['Authorization'] = `Bearer ${idToken}`;
        }

        const openAIMessages = messages.map(convertToOpenAIMessage);
        
        // Sanitize the base URL to avoid double slashes
        const sanitizedBaseURL = config.baseURL.replace(/\/+$/, ''); // Remove trailing slashes
        const completionsURL = `${sanitizedBaseURL}/chat/completions`;
        
        const response = await fetch(completionsURL, {
          method: 'POST',
          headers,
          signal: abortController?.signal,
          body: JSON.stringify({
            model,
            messages: openAIMessages,
            stream: false
          })
        });

        const contentType = response.headers.get('content-type');
        
        // If response is plain text, handle it directly
        if (contentType && contentType.includes('text/plain')) {
          console.log('Detected plain text response, handling directly');
          const textContent = await response.text();
          onChunk(textContent);
          onComplete();
          return;
        }

        // If it's JSON, try to parse it as OpenAI format
        if (contentType && contentType.includes('application/json')) {
          const jsonResponse = await response.json();
          
          // Handle standard OpenAI format
          if (jsonResponse.choices && jsonResponse.choices[0] && jsonResponse.choices[0].message) {
            const content = jsonResponse.choices[0].message.content;
            if (content) {
              onChunk(content);
            }
            
            // Handle reasoning if present
            const reasoning = jsonResponse.choices[0].message.reasoning;
            if (reasoning && onReasoningChunk) {
              onReasoningChunk(reasoning);
            }
            
            onComplete();
            return;
          }
        }

        // If we get here, the response format is unexpected
        throw new Error(`Unexpected response format. Content-Type: ${contentType}`);

      } catch (directFetchError) {
        console.log('Direct fetch failed, trying OpenAI SDK approach:', directFetchError);
        
        // Fallback to OpenAI SDK approach
        const openai = this.createOpenAIInstance(idToken, config.baseURL, config.apiKey);
        const openAIMessages = messages.map(convertToOpenAIMessage);

        // Try streaming first
        let hasAttemptedFallback = false;
        
        try {
          const completion = await openai.chat.completions.create({
            model,
            messages: openAIMessages,
            stream: true
          }, {
            signal: abortController?.signal
          });

          let receivedAnyChunk = false;
          
          for await (const chunk of completion) {
            receivedAnyChunk = true;
            
            // Check if this is actually a complete response (non-streaming) disguised as a chunk
            // @ts-ignore - Some APIs return the complete message in a streaming format
            if (chunk.choices?.[0]?.message?.content) {
              console.log('Received complete message response in streaming format');
              // @ts-ignore
              const content = chunk.choices[0].message.content;
              // @ts-ignore
              const reasoning = chunk.choices[0].message.reasoning;
              
              onChunk(content);
              if (reasoning && onReasoningChunk) {
                onReasoningChunk(reasoning);
              }
              onComplete();
              return; // Exit early as we have the complete response
            }

            // Handle normal streaming chunks
            // @ts-ignore
            if (chunk.choices?.[0]?.delta?.reasoning && onReasoningChunk) {
              // @ts-ignore
              onReasoningChunk(chunk.choices[0].delta.reasoning);
            }
            
            if (chunk.choices?.[0]?.delta?.content) {
              onChunk(chunk.choices[0].delta.content);
            }
          }

          // If we didn't receive any chunks, this might indicate a non-streaming response
          if (!receivedAnyChunk && !hasAttemptedFallback) {
            console.log('No streaming chunks received, trying non-streaming mode');
            hasAttemptedFallback = true;
            throw new Error('No streaming chunks received');
          }

          onComplete();
        } catch (streamError: any) {
          // Only attempt fallback once
          if (hasAttemptedFallback) {
            throw streamError;
          }

          // Check if the error indicates streaming is not supported or no chunks received
          const isStreamingNotSupported = 
            streamError?.message?.toLowerCase().includes('stream') ||
            streamError?.message?.toLowerCase().includes('sse') ||
            streamError?.message?.toLowerCase().includes('event-stream') ||
            streamError?.message?.includes('No streaming chunks received') ||
            streamError?.status === 400 ||
            streamError?.status === 422;

          if (isStreamingNotSupported) {
            console.log('Streaming not supported or failed, falling back to non-streaming mode');
            
            try {
              const completion = await openai.chat.completions.create({
                model,
                messages: openAIMessages,
                stream: false
              }, {
                signal: abortController?.signal
              });

              console.log('Non-streaming response:', JSON.stringify(completion, null, 2));

              // Check if we have a valid response structure
              if (!completion.choices || !completion.choices[0]) {
                throw new Error('Invalid response structure: no choices found');
              }

              // For non-streaming response, send the complete content at once
              const content = completion.choices[0]?.message?.content;
              if (content) {
                onChunk(content);
              } else {
                throw new Error('No content found in response');
              }

              // Handle reasoning if present in non-streaming response
              // @ts-ignore
              const reasoning = completion.choices[0]?.message?.reasoning;
              if (reasoning && onReasoningChunk) {
                onReasoningChunk(reasoning);
              }

              onComplete();
            } catch (nonStreamError) {
              console.error('Non-streaming request also failed:', nonStreamError);
              // If both streaming and non-streaming fail, throw the non-streaming error
              throw nonStreamError;
            }
          } else {
            // If it's not a streaming-related error, rethrow the original error
            throw streamError;
          }
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