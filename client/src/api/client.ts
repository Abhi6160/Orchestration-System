import type { Conversation, Message, HandoffPreview, HandoffRecord, ProviderInfo, ProviderId } from '../types';

const API_BASE = '/api';

export const api = {
  async getConversations(): Promise<Conversation[]> {
    const res = await fetch(`${API_BASE}/conversations`);
    if (!res.ok) throw new Error('Failed to fetch conversations');
    const data = await res.json();
    return data.conversations;
  },

  async getConversation(id: string): Promise<{
    conversation: Conversation;
    messages: Message[];
    handoffs: HandoffRecord[];
    latestHandoff: HandoffRecord | null;
  }> {
    const res = await fetch(`${API_BASE}/conversations/${id}`);
    if (!res.ok) throw new Error('Failed to fetch conversation details');
    return res.json();
  },

  async createConversation(data: {
    title: string;
    project_tag?: string;
    current_provider?: ProviderId;
    context_limit?: number;
  }): Promise<Conversation> {
    const res = await fetch(`${API_BASE}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    const json = await res.json();
    return json.conversation;
  },

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation> {
    const res = await fetch(`${API_BASE}/conversations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update conversation');
    const json = await res.json();
    return json.conversation;
  },

  async deleteConversation(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/conversations/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete conversation');
    const json = await res.json();
    return json.success;
  },

  async sendMessage(
    conversationId: string,
    content: string,
    provider?: ProviderId
  ): Promise<{
    userMessage: Message;
    assistantMessage: Message;
    conversation: Conversation;
  }> {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, provider })
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
  },

  async generateHandoffPreview(
    conversationId: string,
    toProvider: ProviderId = 'gemini'
  ): Promise<HandoffPreview> {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}/handoff/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to_provider: toProvider })
    });
    if (!res.ok) throw new Error('Failed to generate handoff preview');
    const json = await res.json();
    return json.preview;
  },

  async confirmHandoff(
    conversationId: string,
    payload: {
      from_provider: ProviderId;
      to_provider: ProviderId;
      user_goal: string;
      key_decisions: string[];
      current_state: string;
      unresolved_questions: string[];
      instructions_for_next_ai: string;
      original_token_count: number;
      compressed_token_estimate: number;
      auto_continue?: boolean;
    }
  ): Promise<{
    success: boolean;
    handoff: HandoffRecord;
    conversation: Conversation;
    messages: Message[];
    systemMessage: Message;
    continuationMessage: Message | null;
  }> {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}/handoff/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to confirm handoff');
    return res.json();
  },

  async getProviders(): Promise<{
    providers: ProviderInfo[];
    demoNotice: string;
  }> {
    const res = await fetch(`${API_BASE}/providers`);
    if (!res.ok) throw new Error('Failed to fetch providers');
    return res.json();
  },

  async simulateTokens(conversationId: string, tokens: number): Promise<Conversation> {
    const res = await fetch(`${API_BASE}/providers/simulate-tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, tokens })
    });
    if (!res.ok) throw new Error('Failed to simulate tokens');
    const json = await res.json();
    return json.conversation;
  }
};
