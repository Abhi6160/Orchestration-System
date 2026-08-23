import 'dotenv/config';
import { ProviderAdapter, ChatMessage, ProviderResponse, HandoffPayload } from './types.js';

export class MistralAdapter implements ProviderAdapter {
  name: 'mistral' = 'mistral';
  displayName = 'Mistral Large';
  model = 'mistral-large-latest';
  contextWindow = 128000;
  accentColor = '#fa5b0f'; // Mistral Orange
  hasApiKey = false;

  private apiKey: string | null = null;

  constructor() {
    this.refreshClient();
  }

  public refreshClient() {
    const key = (process.env.MISTRAL_API_KEY || '').trim();
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
          systemPrompt || 'You are Mistral Large, an efficient engineering assistant in ContextBridge.';
        if (handoffContext) {
          fullSystemPrompt += `\n\n[CONTEXT DIGEST]:\nUser Goal: ${handoffContext.userGoal}\nKey Decisions: ${handoffContext.keyDecisions.join('; ')}\nCurrent State: ${handoffContext.currentState}\nUnresolved: ${handoffContext.unresolvedQuestions.join('; ')}\nDirective: ${handoffContext.instructionsForNextAi}`;
        }

        const formattedMessages = [
          { role: 'system', content: fullSystemPrompt },
          ...messages
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .map((m) => ({ role: m.role, content: m.content }))
        ];

        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
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
          throw new Error(`Mistral API returned ${response.status}`);
        }

        const data: any = await response.json();
        const textContent = data.choices?.[0]?.message?.content || '';
        const inputTokens = data.usage?.prompt_tokens || this.estimateTokens(promptText);
        const outputTokens = data.usage?.completion_tokens || this.estimateTokens(textContent);

        return {
          content: textContent,
          provider: 'mistral',
          model: this.model,
          tokens: inputTokens + outputTokens,
          metadata: { usage: data.usage, liveApi: true },
          isMock: false
        };
      } catch (err) {
        console.warn('Mistral API request failed, falling back to simulated response:', err);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 600));

    let content = '';
    const lowerPrompt = promptText.toLowerCase();

    if (handoffContext || lowerPrompt.includes('security audit') || lowerPrompt.includes('endpoint') || lowerPrompt.includes('scrutiny')) {
      content = `Handoff received. Security pass on the flagged endpoints:

- \`/api/v2/auth/token/refresh\` — enforce single-use rotation on every refresh.
- \`/api/v2/dashboard/analytics/export\` — scope exports to the requesting tenant only.
- \`/api/v2/webhooks/billing\` — validate HMAC signatures with constant-time comparison.

\`\`\`typescript mistral-audit.ts
export const auditTargets = [
  '/api/v2/auth/token/refresh',
  '/api/v2/dashboard/analytics/export',
  '/api/v2/webhooks/billing'
];
\`\`\`

Want the accompanying test plan next?`;
    } else if (lowerPrompt.includes('timeline') || lowerPrompt.includes('launch')) {
      content = `Timeline review, efficiently:

- **T-4 weeks**: feature freeze, integration tests begin.
- **T-3 weeks**: staging beta, targeted bug bashes.
- **T-1 week**: final release-notes pass and go/no-go check.

\`\`\`yaml plan.yml
milestones: [freeze, beta, launch_review]
\`\`\``;
    } else {
      content = `On **${promptText.slice(0, 50)}...**:

- Keep interfaces small and composable.
- Prefer explicit config over implicit conditionals for anything touching rollout.

\`\`\`typescript notes.ts
export const config = { service: "ContextBridge Core", maxConcurrency: 10 };
\`\`\`

Happy to expand this into a concrete plan.`;
    }

    const calculatedTokens = this.estimateTokens(promptText) + this.estimateTokens(content) + 750;

    return {
      content,
      provider: 'mistral',
      model: this.model,
      tokens: calculatedTokens,
      metadata: { simulated: !this.hasApiKey },
      isMock: !this.hasApiKey
    };
  }
}
