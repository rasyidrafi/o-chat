// Types for the chat system

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
  isStreaming?: boolean;
  isError?: boolean;
  source?: 'server' | 'byok';
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  model: string;
}

export interface StreamingState {
  isStreaming: boolean;
  currentMessageId: string | null;
  controller: AbortController | null;
}
