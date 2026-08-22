export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  provider?: 'claude' | 'gemini' | 'user' | 'system';
  tokens?: number;
  metadata?: any;
}

export interface ProviderResponse {
  content: string;
  provider: 'claude' | 'gemini';
  model: string;
  tokens: number;
  metadata?: Record<string, any>;
  isMock?: boolean;
}

export interface HandoffPayload {
  conversationId: string;
  fromProvider: 'claude' | 'gemini';
  toProvider: 'claude' | 'gemini';
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
  name: 'claude' | 'gemini';
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
