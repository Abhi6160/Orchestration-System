export type ProviderId = 'claude' | 'gemini';

export interface Conversation {
  id: string;
  title: string;
  project_tag: string;
  current_provider: ProviderId;
  context_limit: number;
  total_tokens: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  provider: ProviderId | 'user' | 'system';
  content: string;
  tokens: number;
  metadata?: string | Record<string, any>;
  created_at: string;
}

export interface HandoffPreview {
  conversationId: string;
  fromProvider: ProviderId;
  toProvider: ProviderId;
  userGoal: string;
  keyDecisions: string[];
  currentState: string;
  unresolvedQuestions: string[];
  instructionsForNextAi: string;
  recentMessages: { role: string; content: string }[];
  originalMessageCount: number;
  originalTokenCount: number;
  compressedTokenEstimate: number;
  tokenSavings: number;
  compressionRatio: number;
}

export interface HandoffRecord {
  id: string;
  conversation_id: string;
  from_provider: string;
  to_provider: string;
  user_goal: string;
  key_decisions: string; // JSON string
  current_state: string;
  unresolved_questions: string; // JSON string
  instructions_for_next_ai: string;
  recent_messages?: string;
  original_message_count: number;
  original_token_count: number;
  compressed_token_estimate: number;
  status: string;
  created_at: string;
}

export interface ProviderInfo {
  id: ProviderId;
  name: string;
  model: string;
  contextWindow: number;
  accentColor: string;
  hasApiKey: boolean;
  mode: 'live' | 'demo';
}

export type DemoStateId = 
  | 'empty' 
  | 'active_claude' 
  | 'context_warning' 
  | 'handoff_preview' 
  | 'gemini_continuation';
