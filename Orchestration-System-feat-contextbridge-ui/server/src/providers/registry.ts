import { ProviderAdapter, ProviderId } from './types.js';
import { ClaudeAdapter } from './claudeAdapter.js';
import { GeminiAdapter } from './geminiAdapter.js';
import { OpenAIAdapter } from './openaiAdapter.js';
import { LlamaAdapter } from './llamaAdapter.js';
import { MistralAdapter } from './mistralAdapter.js';
import { GrokAdapter } from './grokAdapter.js';
import { DeepSeekAdapter } from './deepseekAdapter.js';
import { CohereAdapter } from './cohereAdapter.js';

// Single source of truth for which providers ContextBridge knows about.
// To add another model: write an adapter implementing ProviderAdapter,
// then register it here - every route, the handoff engine, and the
// /api/providers endpoint all pick it up automatically.
const adapters: Record<ProviderId, ProviderAdapter> = {
  claude: new ClaudeAdapter(),
  gemini: new GeminiAdapter(),
  openai: new OpenAIAdapter(),
  llama: new LlamaAdapter(),
  mistral: new MistralAdapter(),
  grok: new GrokAdapter(),
  deepseek: new DeepSeekAdapter(),
  cohere: new CohereAdapter()
};

export const providerIds: ProviderId[] = ['claude', 'gemini', 'openai', 'llama', 'mistral', 'grok', 'deepseek', 'cohere'];

export function getAdapter(id: ProviderId | string): ProviderAdapter {
  const adapter = adapters[id as ProviderId];
  if (!adapter) {
    // Fall back to Claude if an unknown/legacy provider id shows up (defensive default)
    return adapters.claude;
  }
  return adapter;
}

export function listAdapters(): ProviderAdapter[] {
  return providerIds.map((id) => adapters[id]);
}

export function defaultTargetFor(current: ProviderId | string): ProviderId {
  const next = providerIds.find((id) => id !== current);
  return next || 'claude';
}
