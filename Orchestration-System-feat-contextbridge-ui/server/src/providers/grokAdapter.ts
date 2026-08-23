import 'dotenv/config';
import { ProviderAdapter, ChatMessage, ProviderResponse, HandoffPayload } from './types.js';

export class GrokAdapter implements ProviderAdapter {
  name: 'grok' = 'grok';
  displayName = 'Grok 2';
  model = 'grok-2-latest';
  contextWindow = 131072;
  accentColor = '#000000'; // xAI Black
  hasApiKey = false;

  private apiKey: string | null = null;

  constructor() {
    this.refreshClient();
  }

  public refreshClient() {
    const key = (process.env.XAI_API_KEY || '').trim();
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
          systemPrompt || 'You are Grok, a sharp and direct engineering assistant in ContextBridge.';
        if (handoffContext) {
          fullSystemPrompt += `\n\n[CONTEXT DIGEST]:\nUser Goal: ${handoffContext.userGoal}\nKey Decisions: ${handoffContext.keyDecisions.join('; ')}\nCurrent State: ${handoffContext.currentState}\nUnresolved: ${handoffContext.unresolvedQuestions.join('; ')}\nDirective: ${handoffContext.instructionsForNextAi}`;
        }

        const formattedMessages = [
          { role: 'system', content: fullSystemPrompt },
          ...messages
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .map((m) => ({ role: m.role, content: m.content }))
        ];

        const response = await fetch('https://api.x.ai/v1/chat/completions', {
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
          throw new Error(`xAI API returned ${response.status}`);
        }

        const data: any = await response.json();
        const textContent = data.choices?.[0]?.message?.content || '';
        const inputTokens = data.usage?.prompt_tokens || this.estimateTokens(promptText);
        const outputTokens = data.usage?.completion_tokens || this.estimateTokens(textContent);

        return {
          content: textContent,
          provider: 'grok',
          model: this.model,
          tokens: inputTokens + outputTokens,
          metadata: { usage: data.usage, liveApi: true },
          isMock: false
        };
      } catch (err) {
        console.warn('xAI (Grok) API request failed, falling back to simulated response:', err);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 600));

    let content = '';
    const lowerPrompt = promptText.toLowerCase();

    if (handoffContext || lowerPrompt.includes('security audit') || lowerPrompt.includes('endpoint') || lowerPrompt.includes('scrutiny')) {
      content = `Got the handoff. Straight to it on the risky endpoints:

- \`/api/v2/auth/token/refresh\` — rotate on every use, kill the old token immediately.
- \`/api/v2/dashboard/analytics/export\` — hard tenant scoping before this ships.
- \`/api/v2/webhooks/billing\` — signed + timestamped payloads only, reject anything else.

\`\`\`typescript grok-audit.ts
export const fixFirst = [
  '/api/v2/auth/token/refresh',
  '/api/v2/dashboard/analytics/export',
  '/api/v2/webhooks/billing'
];
\`\`\`

Say the word and I'll draft the test cases.`;
    } else if (lowerPrompt.includes('timeline') || lowerPrompt.includes('launch')) {
      content = `Launch timeline, no fluff:

- **T-4 weeks**: freeze features, start integration tests.
- **T-3 weeks**: beta on staging, bug bash the new endpoints hardest.
- **T-1 week**: final review, ship/no-ship call.

\`\`\`yaml plan.yml
milestones: [freeze, beta, review]
\`\`\``;
    } else {
      content = `Quick take on **${promptText.slice(0, 50)}...**:

- Keep the surface area small — fewer moving parts, fewer failure modes.
- Make rollout config declarative so nobody has to guess what changed.

\`\`\`typescript config.ts
export const config = { service: "ContextBridge Core", maxConcurrency: 10 };
\`\`\`

Want this turned into an actual implementation plan?`;
    }

    const calculatedTokens = this.estimateTokens(promptText) + this.estimateTokens(content) + 800;

    return {
      content,
      provider: 'grok',
      model: this.model,
      tokens: calculatedTokens,
      metadata: { simulated: !this.hasApiKey },
      isMock: !this.hasApiKey
    };
  }
}
