import 'dotenv/config';
import { ProviderAdapter, ChatMessage, ProviderResponse, HandoffPayload } from './types.js';

export class OpenAIAdapter implements ProviderAdapter {
  name: 'openai' = 'openai';
  displayName = 'GPT-4o';
  model = 'gpt-4o';
  contextWindow = 128000;
  accentColor = '#10a37f'; // OpenAI Green
  hasApiKey = false;

  private apiKey: string | null = null;

  constructor() {
    this.refreshClient();
  }

  public refreshClient() {
    const key = (process.env.OPENAI_API_KEY || '').trim();
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

    // If a real API key is available, call the OpenAI Chat Completions API directly
    if (this.apiKey) {
      try {
        let fullSystemPrompt =
          systemPrompt ||
          'You are GPT-4o, a senior engineering and product architecture AI assistant in ContextBridge.';
        if (handoffContext) {
          fullSystemPrompt += `\n\n[CONTEXT DIGEST]:\nUser Goal: ${handoffContext.userGoal}\nKey Decisions: ${handoffContext.keyDecisions.join('; ')}\nCurrent State: ${handoffContext.currentState}\nUnresolved: ${handoffContext.unresolvedQuestions.join('; ')}\nDirective: ${handoffContext.instructionsForNextAi}`;
        }

        const formattedMessages = [
          { role: 'system', content: fullSystemPrompt },
          ...messages
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .map((m) => ({ role: m.role, content: m.content }))
        ];

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
          throw new Error(`OpenAI API returned ${response.status}`);
        }

        const data: any = await response.json();
        const textContent = data.choices?.[0]?.message?.content || '';
        const inputTokens = data.usage?.prompt_tokens || this.estimateTokens(promptText);
        const outputTokens = data.usage?.completion_tokens || this.estimateTokens(textContent);

        return {
          content: textContent,
          provider: 'openai',
          model: this.model,
          tokens: inputTokens + outputTokens,
          metadata: {
            usage: data.usage,
            liveApi: true
          },
          isMock: false
        };
      } catch (err) {
        console.warn('OpenAI API request failed, falling back to simulated response:', err);
      }
    }

    // Demo Mode: context-aware simulated responses, mirroring the other adapters
    await new Promise((resolve) => setTimeout(resolve, 600));

    let content = '';
    const lowerPrompt = promptText.toLowerCase();

    if (handoffContext || lowerPrompt.includes('security audit') || lowerPrompt.includes('endpoint') || lowerPrompt.includes('scrutiny')) {
      content = `Picking up the ContextBridge handoff. Here's the security review for the high-risk API surface:

### Endpoint Risk Review
- **\`/api/v2/auth/token/refresh\`**: Prioritize single-use refresh token rotation to close the replay window.
- **\`/api/v2/dashboard/analytics/export\`**: Add tenant-scoped rate limiting before the bulk export path ships.
- **\`/api/v2/webhooks/billing\`**: Verify HMAC signatures with a constant-time comparison to prevent forged payloads.

\`\`\`typescript openai-checklist.ts
export const AUDIT_CHECKLIST = [
  { path: '/api/v2/auth/token/refresh', action: 'rotate-refresh-tokens' },
  { path: '/api/v2/dashboard/analytics/export', action: 'rate-limit-by-tenant' },
  { path: '/api/v2/webhooks/billing', action: 'verify-hmac-signature' }
];
\`\`\`

Want me to draft the test cases for these next?`;
    } else if (lowerPrompt.includes('timeline') || lowerPrompt.includes('launch')) {
      content = `Here's a launch-readiness pass on the timeline:

### Near-Term Checklist
- Confirm feature-freeze and integration-test coverage before beta.
- Line up bug-bash cycles against the riskiest edge cases first.
- Keep release notes and API docs updated alongside code, not after.

\`\`\`typescript launch-plan.ts
export const launchPlan = {
  freeze: '2023-10-18',
  beta: '2023-10-25',
  launch: '2023-11-15'
};
\`\`\``;
    } else {
      content = `Here's my take on **${promptText.slice(0, 50)}...**:

1. **Design for modularity** — keep clear service boundaries so pieces can evolve independently.
2. **Make configuration declarative** — reduces surprises during rollout.

\`\`\`typescript config.ts
export const config = {
  service: "ContextBridge Core",
  maxConcurrency: 10,
  telemetryEnabled: true
};
\`\`\`

Next: verify environment compatibility and run integration tests before staging.`;
    }

    const calculatedTokens = this.estimateTokens(promptText) + this.estimateTokens(content) + 900;

    return {
      content,
      provider: 'openai',
      model: this.model,
      tokens: calculatedTokens,
      metadata: {
        simulated: !this.hasApiKey
      },
      isMock: !this.hasApiKey
    };
  }
}
