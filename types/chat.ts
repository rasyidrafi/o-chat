// Types for the chat system

export interface ImageContent {
  type: 'image_url';
  image_url: {
    url: string;
    detail?: 'low' | 'high' | 'auto';
    format?: string;
  };
}

export interface TextContent {
  type: 'text';
  text: string;
}

export type MessageContent = string | Array<TextContent | ImageContent>;

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: MessageContent;
  model?: string;
  modelName?: string;
  isStreaming?: boolean;
  isError?: boolean;
  isGeneratingImage?: boolean;
  timestamp: Date;
  source: 'server' | 'byok';
  reasoning?: string;
  isReasoningComplete?: boolean;
  attachments?: MessageAttachment[];
  messageType?: 'chat' | 'image_generation';
  generatedImageUrl?: string;
  imageGenerationParams?: {
    prompt: string;
    size: string;
    response_format: 'url' | 'b64_json';
    seed?: number;
    guidance_scale?: number;
    watermark?: boolean;
    originalSource?: string; // Store original source for job resumption
    originalProviderId?: string; // Store original providerId for job resumption
  };
  imageGenerationJob?: ImageGenerationJob;
  isAsyncImageGeneration?: boolean;
}

export interface MessageAttachment {
  id: string;
  type: 'image';
  url: string;
  gcsPath?: string; // For Firebase Storage path
  filename: string;
  size: number;
  mimeType: string;
  isDirectUrl?: boolean; // Flag to indicate this is a direct URL (not uploaded to Firebase)
  isForEditing?: boolean; // Flag to indicate this image is for editing (not vision attachment)
}

export interface ImageGenerationJob {
  id: string;
  model: string;
  created: number;
  status: 'CREATED' | 'WAITING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  prompt: string;
  size: string;
  data?: Array<{ url: string }>;
  info?: {
    queueRank?: string;
    queueLen?: string;
    error?: string;
    details?: any;
    code?: string;
  };
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  model: string;
  source: string;
  conversationContext?: string; // For Messages Mode conversation context
}

export interface StreamingState {
  isStreaming: boolean;
  currentMessageId: string | null;
  controller: AbortController | null;
}
