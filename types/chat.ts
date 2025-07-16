// Types for the chat system

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  modelName?: string;
  isStreaming?: boolean;
  isError?: boolean;
  timestamp: Date;
  source: 'server' | 'byok';
  reasoning?: string;
  isReasoningComplete?: boolean;
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
