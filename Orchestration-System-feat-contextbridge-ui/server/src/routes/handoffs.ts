import { Router, Request, Response } from 'express';
import { dbService } from '../db/database.js';
import { HandoffEngine } from '../providers/handoffEngine.js';
import { getAdapter, defaultTargetFor } from '../providers/registry.js';
import { ChatMessage, HandoffPayload, ProviderId } from '../providers/types.js';

const router = Router();

function getParamId(req: Request): string {
  const { id } = req.params;
  return Array.isArray(id) ? id[0] : id;
}

// Generate Handoff Preview
router.post('/:id/handoff/preview', async (req: Request, res: Response) => {
  try {
    const id = getParamId(req);

    const conversation = dbService.getConversationById(id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const { to_provider = defaultTargetFor(conversation.current_provider) } = req.body;

    const messages = dbService.getMessages(id);
    const chatMessages: ChatMessage[] = messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      provider: m.provider,
      tokens: m.tokens
    }));

    const preview = HandoffEngine.generateHandoff(
      id,
      chatMessages,
      conversation.current_provider as ProviderId,
      to_provider as ProviderId,
      conversation.total_tokens
    );

    const tokenSavings = Math.max(0, preview.originalTokenCount - preview.compressedTokenEstimate);
    const compressionRatio = preview.originalTokenCount > 0 
      ? Math.round(((preview.originalTokenCount - preview.compressedTokenEstimate) / preview.originalTokenCount) * 100)
      : 95;

    res.json({
      preview: {
        ...preview,
        tokenSavings,
        compressionRatio
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Confirm & Execute Handoff
router.post('/:id/handoff/confirm', async (req: Request, res: Response) => {
  try {
    const id = getParamId(req);
    const {
      from_provider = 'claude',
      to_provider = 'gemini',
      user_goal,
      key_decisions = [],
      current_state,
      unresolved_questions = [],
      instructions_for_next_ai,
      original_token_count,
      compressed_token_estimate,
      auto_continue = true
    } = req.body;

    const conversation = dbService.getConversationById(id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = dbService.getMessages(id);

    // 1. Create Handoff Record
    const handoffRecord = dbService.createHandoff({
      conversation_id: id,
      from_provider: from_provider,
      to_provider: to_provider,
      user_goal: user_goal || 'Project Apollo launch planning and security audit.',
      key_decisions: JSON.stringify(key_decisions),
      current_state: current_state || 'Reviewing critical security endpoints.',
      unresolved_questions: JSON.stringify(unresolved_questions),
      instructions_for_next_ai: instructions_for_next_ai || 'Continue security analysis on high-risk endpoints.',
      recent_messages: JSON.stringify(messages.slice(-3).map((m) => ({ role: m.role, content: m.content }))),
      original_message_count: messages.length,
      original_token_count: original_token_count || conversation.total_tokens,
      compressed_token_estimate: compressed_token_estimate || 1850,
      status: 'completed'
    });

    // 2. Update Conversation state
    const targetAdapterForLimit = getAdapter(to_provider);
    const newContextLimit = targetAdapterForLimit.contextWindow;
    const newTokens = compressed_token_estimate || 1850;

    dbService.updateConversation(id, {
      current_provider: to_provider as ProviderId,
      context_limit: newContextLimit,
      total_tokens: newTokens
    });

    // 3. Inject Transition Handoff Anchor Message
    const fromDisplayName = getAdapter(from_provider).displayName;
    const toDisplayName = getAdapter(to_provider).displayName;
    const transitionContent = `[ContextBridge Handoff Complete: Context transferred from ${fromDisplayName} to ${toDisplayName}. Reduced ${(original_token_count || conversation.total_tokens).toLocaleString()} tokens to ${(compressed_token_estimate || 1850).toLocaleString()} token structured context digest.]`;

    const systemMsg = dbService.addMessage({
      conversation_id: id,
      role: 'system',
      provider: 'system',
      content: transitionContent,
      tokens: compressed_token_estimate || 1850,
      metadata: JSON.stringify({
        type: 'handoff_transition',
        handoffId: handoffRecord.id,
        fromProvider: from_provider,
        toProvider: to_provider,
        originalTokens: original_token_count || conversation.total_tokens,
        condensedTokens: compressed_token_estimate || 1850,
        userGoal: user_goal,
        keyDecisions: key_decisions
      })
    });

    // 4. Optionally generate Gemini continuation response if auto_continue is true
    let continuationMessage = null;
    if (auto_continue) {
      const adapter = getAdapter(to_provider);
      const handoffPayload: HandoffPayload = {
        conversationId: id,
        fromProvider: from_provider as ProviderId,
        toProvider: to_provider as ProviderId,
        userGoal: user_goal || '',
        keyDecisions: Array.isArray(key_decisions) ? key_decisions : [],
        currentState: current_state || '',
        unresolvedQuestions: Array.isArray(unresolved_questions) ? unresolved_questions : [],
        instructionsForNextAi: instructions_for_next_ai || '',
        recentMessages: messages.slice(-3).map((m) => ({ role: m.role, content: m.content })),
        originalMessageCount: messages.length,
        originalTokenCount: original_token_count || conversation.total_tokens,
        compressedTokenEstimate: compressed_token_estimate || 1850
      };

      const systemPrompt = HandoffEngine.formatContinuationPrompt(handoffPayload);
      const chatMessages: ChatMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
        provider: m.provider
      }));

      const response = await adapter.generateResponse(chatMessages, systemPrompt, handoffPayload);

      continuationMessage = dbService.addMessage({
        conversation_id: id,
        role: 'assistant',
        provider: to_provider,
        content: response.content,
        tokens: response.tokens,
        metadata: JSON.stringify({
          ...response.metadata,
          handoffSource: from_provider
        })
      });
    }

    const finalConversation = dbService.getConversationById(id);
    const allMessages = dbService.getMessages(id);

    res.json({
      success: true,
      handoff: handoffRecord,
      conversation: finalConversation,
      messages: allMessages,
      systemMessage: systemMsg,
      continuationMessage
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List handoffs for conversation
router.get('/:id/handoffs', (req: Request, res: Response) => {
  try {
    const id = getParamId(req);
    const handoffs = dbService.getHandoffs(id);
    res.json({ handoffs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
