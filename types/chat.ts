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
  timestamp: Date;
  source: 'server' | 'byok';
  reasoning?: string;
  isReasoningComplete?: boolean;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  type: 'image';
  url: string;
  gcsPath?: string; // For Firebase Storage path
  filename: string;
  size: number;
  mimeType: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  model: string;
  source: string;
}

export interface StreamingState {
  isStreaming: boolean;
  currentMessageId: string | null;
  controller: AbortController | null;
}
