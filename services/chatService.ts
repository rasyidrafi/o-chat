// Chat service for handling AI model interactions
// Supports multiple response formats with streaming by default:
// - First attempts streaming for real-time response delivery (DEFAULT BEHAVIOR)
// - Falls back to direct fetch for content-type detection if streaming fails
// - Falls back to non-streaming OpenAI SDK as last resort
// - Automatically detects plain text responses (content-type: text/plain)
// - Automatically detects and handles OpenAI JSON format with/without streaming
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
      images?: Array<{
        type: 'image_url';
        image_url: {
          url: string;
        };
      }>;
    };
  }[];
}

export interface NonStreamingChatResponse {
  choices: {
    message: {
      content?: string;
      reasoning?: string;
      role: string;
      images?: Array<{
        type: 'image_url';
        image_url: {
          url: string;
        };
      }>;
    };
  }[];
}

export class ChatService {
  private static createOpenAIInstance(idToken?: string, baseURL?: string, apiKey?: string) {
    const headers: Record<string, string> = {};

    // Add Authorization header - prioritize idToken for system providers, apiKey for custom providers
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    } else if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
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
    onReasoningChunk?: (reasoning: string) => void,
    onImageGenerated?: (imageUrl: string) => void,
    hasImageGenerationChat?: boolean,
    onStreamingError?: (errorMessage: string) => void
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

      // ALWAYS START WITH STREAMING - Use direct fetch to intercept headers
      const openai = this.createOpenAIInstance(idToken, config.baseURL, config.apiKey);
      const openAIMessages = messages.map(convertToOpenAIMessage);
      
      console.log('🚀 Attempting streaming request with header detection...');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Set authorization header based on provider type
      if (source === 'system' && idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      } else if (source === 'custom' && config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }

      // Prepare request body with conditional modalities
      const requestBody: any = {
        model,
        messages: openAIMessages,
        stream: true  // ALWAYS START WITH STREAMING
      };

      // Add modalities only if explicitly requested and supported
      if (hasImageGenerationChat) {
        requestBody.modalities = ["text", "image"];
        console.log('🖼️ Including image modality for model:', model);
      }
      
      // Sanitize the base URL to avoid double slashes
      const sanitizedBaseURL = config.baseURL.replace(/\/+$/, '');
      const completionsURL = `${sanitizedBaseURL}/chat/completions`;
      
      const response = await fetch(completionsURL, {
        method: 'POST',
        headers,
        signal: abortController?.signal,
        body: JSON.stringify(requestBody)
      });

      const contentType = response.headers.get('content-type');
      console.log('📦 Response Content-Type:', contentType);

      // Check if it's Server-Sent Events (streaming)
      if (contentType && contentType.includes('text/event-stream')) {
        console.log('✅ Detected streaming response (text/event-stream)');
        
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        if (!reader) {
          throw new Error('Unable to get response reader');
        }

        try {
          let currentEvent = '';
          
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              // Handle event lines
              if (line.startsWith('event: ')) {
                currentEvent = line.slice(7); // 7 = 'event: '.length
                continue;
              }
              
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                
                if (data === '[DONE]') {
                  onComplete();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  
                  // Handle error events
                  if (currentEvent === 'error' && parsed.error && onStreamingError) {
                    const errorMessage = parsed.error.message || 'An error occurred during streaming';
                    onStreamingError(errorMessage);
                    continue;
                  }
                  
                  // Reset event after processing
                  currentEvent = '';
                  
                  // Check for completion before processing content
                  const choice = parsed.choices?.[0];
                  if (choice?.finish_reason === 'stop' || choice?.finish_reason === 'length' || choice?.finish_reason === 'tool_calls') {
                    // Handle any final content before completing
                    if (choice.delta?.content) {
                      onChunk(choice.delta.content);
                    }
                    if (choice.delta?.reasoning && onReasoningChunk) {
                      onReasoningChunk(choice.delta.reasoning);
                    }
                    // Don't call onComplete here - wait for [DONE] marker
                    continue;
                  }
                  
                  // Handle reasoning chunks
                  if (choice?.delta?.reasoning && onReasoningChunk) {
                    onReasoningChunk(choice.delta.reasoning);
                  }
                  
                  // Handle content chunks (including empty content which can be valid)
                  if (choice?.delta?.content !== undefined) {
                    onChunk(choice.delta.content);
                  }
                  
                  // Handle image chunks
                  if (choice?.delta?.images && onImageGenerated) {
                    const images = choice.delta.images;
                    images.forEach((image: any) => {
                      if (image.image_url && image.image_url.url) {
                        onImageGenerated(image.image_url.url);
                      }
                    });
                  }
                } catch (parseError) {
                  console.warn('Failed to parse SSE data:', data, 'Error:', parseError);
                }
              }
            }
          }
          
          onComplete();
          return;
          
        } finally {
          reader.releaseLock();
        }
      }
      
      // If response is plain text, handle it directly
      else if (contentType && contentType.includes('text/plain')) {
        console.log('✅ Detected plain text response, handling directly');
        const textContent = await response.text();
        onChunk(textContent);
        onComplete();
        return;
      }
      
      // If it's JSON (non-streaming), parse and handle
      else if (contentType && contentType.includes('application/json')) {
        console.log('✅ Detected JSON response (non-streaming)');
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
          
          // Handle images if present 
          const images = jsonResponse.choices[0].message.images;
          if (images && images.length > 0 && onImageGenerated) {
            images.forEach((image: any) => {
              if (image.image_url && image.image_url.url) {
                onImageGenerated(image.image_url.url);
              }
            });
          }
          
          onComplete();
          return;
        } else {
          throw new Error('Invalid JSON response structure');
        }
      }
      
      // If we get here, try OpenAI SDK as fallback
      else {
        console.log('❌ Unexpected content type, trying OpenAI SDK fallback:', contentType);
        
        try {
          const completion = await openai.chat.completions.create(requestBody, {
            signal: abortController?.signal
          });

          // Check if it's a streaming response (has Symbol.asyncIterator)
          if (Symbol.asyncIterator in completion) {
            console.log('✅ OpenAI SDK streaming fallback successful');
            
            for await (const chunk of completion as any) {
              // Handle reasoning chunks
              if (chunk.choices?.[0]?.delta?.reasoning && onReasoningChunk) {
                onReasoningChunk(chunk.choices[0].delta.reasoning);
              }
              
              // Handle content chunks
              if (chunk.choices?.[0]?.delta?.content) {
                onChunk(chunk.choices[0].delta.content);
              }
              
              // Handle image chunks
              if (chunk.choices?.[0]?.delta?.images && onImageGenerated) {
                const images = chunk.choices[0].delta.images;
                images.forEach((image: any) => {
                  if (image.image_url && image.image_url.url) {
                    onImageGenerated(image.image_url.url);
                  }
                });
              }
            }
            
            onComplete();
            return;
          } else {
            // This is a non-streaming response that came back as a complete object
            console.log('✅ OpenAI SDK returned complete response');
            // @ts-ignore
            const content = completion.choices?.[0]?.message?.content;
            // @ts-ignore
            const reasoning = completion.choices?.[0]?.message?.reasoning;
            // @ts-ignore
            const images = completion.choices?.[0]?.message?.images;
            
            if (content) {
              onChunk(content);
            }
            if (reasoning && onReasoningChunk) {
              onReasoningChunk(reasoning);
            }
            if (images && images.length > 0 && onImageGenerated) {
              images.forEach((image: any) => {
                if (image.image_url && image.image_url.url) {
                  onImageGenerated(image.image_url.url);
                }
              });
            }
            onComplete();
            return;
          }
          
        } catch (sdkError: any) {
          console.log('❌ OpenAI SDK also failed, trying non-streaming as last resort:', sdkError);
          
          try {
            const completion = await openai.chat.completions.create({
              model,
              messages: openAIMessages,
              stream: false
            }, {
              signal: abortController?.signal
            });

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

            // Handle images if present in non-streaming response
            // @ts-ignore
            const images = completion.choices[0]?.message?.images;
            if (images && images.length > 0 && onImageGenerated) {
              images.forEach((image: any) => {
                if (image.image_url && image.image_url.url) {
                  onImageGenerated(image.image_url.url);
                }
              });
            }

            onComplete();
          } catch (nonStreamError) {
            console.error('💥 All methods failed:', nonStreamError);
            throw nonStreamError;
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