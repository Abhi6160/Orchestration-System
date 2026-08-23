import 'dotenv/config';
import { ProviderAdapter, ChatMessage, ProviderResponse, HandoffPayload } from './types.js';

export class CohereAdapter implements ProviderAdapter {
  name: 'cohere' = 'cohere';
  displayName = 'Command R+';
  model = 'command-r-plus-08-2024';
  contextWindow = 128000;
  accentColor = '#39594d'; // Cohere Forest
  hasApiKey = false;

  private apiKey: string | null = null;

  constructor() {
    this.refreshClient();
  }

  public refreshClient() {
    const key = (process.env.COHERE_API_KEY || '').trim();
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

    // Cohere's v2 Chat API accepts an OpenAI-style `messages` array
    if (this.apiKey) {
      try {
        let fullSystemPrompt =
          systemPrompt || 'You are Command R+, a retrieval-savvy enterprise assistant in ContextBridge.';
        if (handoffContext) {
          fullSystemPrompt += `\n\n[CONTEXT DIGEST]:\nUser Goal: ${handoffContext.userGoal}\nKey Decisions: ${handoffContext.keyDecisions.join('; ')}\nCurrent State: ${handoffContext.currentState}\nUnresolved: ${handoffContext.unresolvedQuestions.join('; ')}\nDirective: ${handoffContext.instructionsForNextAi}`;
        }

        const formattedMessages = [
          { role: 'system', content: fullSystemPrompt },
          ...messages
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .map((m) => ({ role: m.role, content: m.content }))
        ];

        const response = await fetch('https://api.cohere.com/v2/chat', {
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
          throw new Error(`Cohere API returned ${response.status}`);
        }

        const data: any = await response.json();
        // v2 responses nest text under message.content[0].text; fall back defensively
        const textContent =
          data.message?.content?.[0]?.text ||
          data.text ||
          data.choices?.[0]?.message?.content ||
          '';
        const inputTokens = data.usage?.billed_units?.input_tokens || this.estimateTokens(promptText);
        const outputTokens = data.usage?.billed_units?.output_tokens || this.estimateTokens(textContent);

        return {
          content: textContent,
          provider: 'cohere',
          model: this.model,
          tokens: inputTokens + outputTokens,
          metadata: { usage: data.usage, liveApi: true },
          isMock: false
        };
      } catch (err) {
        console.warn('Cohere API request failed, falling back to simulated response:', err);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 600));

    let content = '';
    const lowerPrompt = promptText.toLowerCase();

    if (handoffContext || lowerPrompt.includes('security audit') || lowerPrompt.includes('endpoint') || lowerPrompt.includes('scrutiny')) {
      content = `Handoff digested. Here's the endpoint review, prioritized:

- \`/api/v2/auth/token/refresh\` — rotate refresh tokens on every use.
- \`/api/v2/dashboard/analytics/export\` — enforce tenant scoping at the query layer.
- \`/api/v2/webhooks/billing\` — verify signatures with constant-time comparison.

\`\`\`typescript cohere-audit.ts
export const endpointsToHarden = [
  '/api/v2/auth/token/refresh',
  '/api/v2/dashboard/analytics/export',
  '/api/v2/webhooks/billing'
];
\`\`\`

Ready to draft the test coverage for these if you'd like.`;
    } else if (lowerPrompt.includes('timeline') || lowerPrompt.includes('launch')) {
      content = `Launch timeline summary:

- **T-4 weeks**: feature freeze, integration testing starts.
- **T-3 weeks**: staged beta, targeted bug bashes.
- **T-1 week**: docs finalized, launch review.

\`\`\`yaml plan.yml
milestones: [freeze, beta, review]
\`\`\``;
    } else {
      content = `On **${promptText.slice(0, 50)}...**:

- Keep service boundaries clear so each piece is independently verifiable.
- Prefer declarative configuration for anything touching deployment behavior.

\`\`\`typescript config.ts
export const config = { service: "ContextBridge Core", maxConcurrency: 10 };
\`\`\`

Happy to expand this further if useful.`;
    }

    const calculatedTokens = this.estimateTokens(promptText) + this.estimateTokens(content) + 700;

    return {
      content,
      provider: 'cohere',
      model: this.model,
      tokens: calculatedTokens,
      metadata: { simulated: !this.hasApiKey },
      isMock: !this.hasApiKey
    };
  }
}
