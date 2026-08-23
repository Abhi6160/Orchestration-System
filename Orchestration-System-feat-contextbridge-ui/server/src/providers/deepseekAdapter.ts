import 'dotenv/config';
import { ProviderAdapter, ChatMessage, ProviderResponse, HandoffPayload } from './types.js';

export class DeepSeekAdapter implements ProviderAdapter {
  name: 'deepseek' = 'deepseek';
  displayName = 'DeepSeek V3';
  model = 'deepseek-chat';
  contextWindow = 64000;
  accentColor = '#4d6bfe'; // DeepSeek Blue
  hasApiKey = false;

  private apiKey: string | null = null;

  constructor() {
    this.refreshClient();
  }

  public refreshClient() {
    const key = (process.env.DEEPSEEK_API_KEY || '').trim();
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

    if (this.apiKey) {
      try {
        let fullSystemPrompt =
          systemPrompt || 'You are DeepSeek V3, a rigorous reasoning-focused engineering assistant in ContextBridge.';
        if (handoffContext) {
          fullSystemPrompt += `\n\n[CONTEXT DIGEST]:\nUser Goal: ${handoffContext.userGoal}\nKey Decisions: ${handoffContext.keyDecisions.join('; ')}\nCurrent State: ${handoffContext.currentState}\nUnresolved: ${handoffContext.unresolvedQuestions.join('; ')}\nDirective: ${handoffContext.instructionsForNextAi}`;
        }

        const formattedMessages = [
          { role: 'system', content: fullSystemPrompt },
          ...messages
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .map((m) => ({ role: m.role, content: m.content }))
        ];

        const response = await fetch('https://api.deepseek.com/chat/completions', {
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
          throw new Error(`DeepSeek API returned ${response.status}`);
        }

        const data: any = await response.json();
        const textContent = data.choices?.[0]?.message?.content || '';
        const inputTokens = data.usage?.prompt_tokens || this.estimateTokens(promptText);
        const outputTokens = data.usage?.completion_tokens || this.estimateTokens(textContent);

        return {
          content: textContent,
          provider: 'deepseek',
          model: this.model,
          tokens: inputTokens + outputTokens,
          metadata: { usage: data.usage, liveApi: true },
          isMock: false
        };
      } catch (err) {
        console.warn('DeepSeek API request failed, falling back to simulated response:', err);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 600));

    let content = '';
    const lowerPrompt = promptText.toLowerCase();

    if (handoffContext || lowerPrompt.includes('security audit') || lowerPrompt.includes('endpoint') || lowerPrompt.includes('scrutiny')) {
      content = `Reviewing the handoff context. Working through the flagged endpoints methodically:

1. \`/api/v2/auth/token/refresh\` — single-use rotation; invalidate the previous token the instant a new one issues.
2. \`/api/v2/dashboard/analytics/export\` — every query must be scoped to the authenticated tenant before touching storage.
3. \`/api/v2/webhooks/billing\` — constant-time HMAC verification to prevent both forgery and timing attacks.

\`\`\`typescript deepseek-audit.ts
export const auditPlan = [
  { path: '/api/v2/auth/token/refresh', fix: 'rotate-on-use' },
  { path: '/api/v2/dashboard/analytics/export', fix: 'tenant-scope' },
  { path: '/api/v2/webhooks/billing', fix: 'hmac-constant-time' }
];
\`\`\`

I can lay out the test cases for each fix next.`;
    } else if (lowerPrompt.includes('timeline') || lowerPrompt.includes('launch')) {
      content = `Breaking the timeline down step by step:

- **T-4 weeks**: code freeze, integration test suite runs.
- **T-3 weeks**: internal beta, edge-case bug bashes on new endpoints.
- **T-1 week**: docs finalized, go/no-go decision.

\`\`\`yaml plan.yml
milestones: [freeze, beta, decision]
\`\`\``;
    } else {
      content = `Reasoning through **${promptText.slice(0, 50)}...**:

- Favor modular boundaries so each piece can be tested in isolation.
- Make rollout behavior explicit and declarative rather than scattered across conditionals.

\`\`\`typescript notes.ts
export const config = { service: "ContextBridge Core", maxConcurrency: 10 };
\`\`\`

Let me know if you'd like this broken into concrete implementation steps.`;
    }

    const calculatedTokens = this.estimateTokens(promptText) + this.estimateTokens(content) + 700;

    return {
      content,
      provider: 'deepseek',
      model: this.model,
      tokens: calculatedTokens,
      metadata: { simulated: !this.hasApiKey },
      isMock: !this.hasApiKey
    };
  }
}
