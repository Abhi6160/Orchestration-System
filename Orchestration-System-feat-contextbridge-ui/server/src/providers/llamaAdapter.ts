import 'dotenv/config';
import { ProviderAdapter, ChatMessage, ProviderResponse, HandoffPayload } from './types.js';

// Llama 3.1 is served through Groq's OpenAI-compatible chat completions endpoint,
// which offers a free/fast inference tier - no separate SDK required.
export class LlamaAdapter implements ProviderAdapter {
  name: 'llama' = 'llama';
  displayName = 'Llama 3.1 405B';
  model = 'llama-3.1-405b-reasoning';
  contextWindow = 131072;
  accentColor = '#7c3aed'; // Meta Purple
  hasApiKey = false;

  private apiKey: string | null = null;

  constructor() {
    this.refreshClient();
  }

  public refreshClient() {
    const key = (process.env.GROQ_API_KEY || '').trim();
    this.hasApiKey = Boolean(key && key !== '');
    this.apiKey = this.hasApiKey ? key : null;
  }

  estimateTokens(text: string): number {
    return Math.max(1, Math.ceil(text.length / 4));
  }

  async generateResponse(
    messages: ChatMessage[],
    systemPrompt?: string,
    handoffContext?: HandoffPayload
  ): Promise<ProviderResponse> {
    this.refreshClient();
    const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
    const promptText = lastUserMessage?.content || '';

    // If a real API key is available, call Groq's Llama endpoint
    if (this.apiKey) {
      try {
        let fullSystemPrompt =
          systemPrompt ||
          'You are Llama 3.1, an open-weight engineering assistant in ContextBridge.';
        if (handoffContext) {
          fullSystemPrompt += `\n\n[CONTEXT DIGEST]:\nUser Goal: ${handoffContext.userGoal}\nKey Decisions: ${handoffContext.keyDecisions.join('; ')}\nCurrent State: ${handoffContext.currentState}\nUnresolved: ${handoffContext.unresolvedQuestions.join('; ')}\nDirective: ${handoffContext.instructionsForNextAi}`;
        }

        const formattedMessages = [
          { role: 'system', content: fullSystemPrompt },
          ...messages
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .map((m) => ({ role: m.role, content: m.content }))
        ];

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: this.model,
            max_tokens: 2048,
            messages: formattedMessages
          })
        });

        if (!response.ok) {
          throw new Error(`Groq API returned ${response.status}`);
        }

        const data: any = await response.json();
        const textContent = data.choices?.[0]?.message?.content || '';
        const inputTokens = data.usage?.prompt_tokens || this.estimateTokens(promptText);
        const outputTokens = data.usage?.completion_tokens || this.estimateTokens(textContent);

        return {
          content: textContent,
          provider: 'llama',
          model: this.model,
          tokens: inputTokens + outputTokens,
          metadata: {
            usage: data.usage,
            liveApi: true
          },
          isMock: false
        };
      } catch (err) {
        console.warn('Groq (Llama) API request failed, falling back to simulated response:', err);
      }
    }

    // Demo Mode: context-aware simulated responses, mirroring the other adapters
    await new Promise((resolve) => setTimeout(resolve, 600));

    let content = '';
    const lowerPrompt = promptText.toLowerCase();

    if (handoffContext || lowerPrompt.includes('security audit') || lowerPrompt.includes('endpoint') || lowerPrompt.includes('scrutiny')) {
      content = `Context received. Continuing the security pass on the flagged endpoints:

- \`/api/v2/auth/token/refresh\` — rotate refresh tokens on every use, invalidate the prior token immediately.
- \`/api/v2/dashboard/analytics/export\` — scope every query to the requesting tenant before it touches storage.
- \`/api/v2/webhooks/billing\` — require signed, timestamped payloads to block replay attacks.

\`\`\`typescript llama-audit.ts
export const riskyEndpoints = [
  '/api/v2/auth/token/refresh',
  '/api/v2/dashboard/analytics/export',
  '/api/v2/webhooks/billing'
];
\`\`\`

I can turn this into a test plan next if that's useful.`;
    } else if (lowerPrompt.includes('timeline') || lowerPrompt.includes('launch')) {
      content = `Timeline summary, kept lean:

- **Now → T-3 weeks**: freeze features, run integration tests.
- **T-3 → T-1 weeks**: beta on staging, bug bashes on new endpoints.
- **T-1 week → launch**: final review, go/no-go call.

\`\`\`yaml plan.yml
milestones:
  - freeze
  - beta
  - final_review
\`\`\``;
    } else {
      content = `Thinking through **${promptText.slice(0, 50)}...**:

- Keep the core logic modular so components stay independently testable.
- Favor declarative config over scattered conditionals for rollout safety.

\`\`\`typescript notes.ts
export const config = {
  service: "ContextBridge Core",
  maxConcurrency: 10
};
\`\`\`

Let me know if you want this expanded into an implementation plan.`;
    }

    const calculatedTokens = this.estimateTokens(promptText) + this.estimateTokens(content) + 800;

    return {
      content,
      provider: 'llama',
      model: this.model,
      tokens: calculatedTokens,
      metadata: {
        simulated: !this.hasApiKey
      },
      isMock: !this.hasApiKey
    };
  }
}
