// Central list of supported providers. Add a new id here (and a matching
// adapter + registry entry) to plug in another model.
export type ProviderId = 'claude' | 'gemini' | 'openai' | 'llama' | 'mistral' | 'grok' | 'deepseek' | 'cohere';

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  provider?: ProviderId | 'user' | 'system';
  tokens?: number;
  metadata?: any;
}

export interface ProviderResponse {
  content: string;
  provider: ProviderId;
  model: string;
  tokens: number;
  metadata?: Record<string, any>;
  isMock?: boolean;
}

export interface HandoffPayload {
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
}

export interface ProviderAdapter {
  name: ProviderId;
  displayName: string;
  model: string;
  contextWindow: number;
  accentColor: string;
  hasApiKey: boolean;
  
  estimateTokens(text: string): number;
  generateResponse(
    messages: ChatMessage[],
    systemPrompt?: string,
    handoffContext?: HandoffPayload
  ): Promise<ProviderResponse>;
}
