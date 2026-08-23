import { Router, Request, Response } from 'express';
import { dbService } from '../db/database.js';
import { getAdapter } from '../providers/registry.js';
import { ChatMessage } from '../providers/types.js';

const router = Router();

function getParamId(req: Request): string {
  const { id } = req.params;
  return Array.isArray(id) ? id[0] : id;
}

// List all conversations
router.get('/', (_req: Request, res: Response) => {
  try {
    const conversations = dbService.getConversations();
    res.json({ conversations });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create new conversation
router.post('/', (req: Request, res: Response) => {
  try {
    const { title, project_tag, current_provider, context_limit } = req.body;
    const conversation = dbService.createConversation({
      title: title || 'New Conversation',
      project_tag: project_tag || 'General',
      current_provider: current_provider || 'claude',
      context_limit: context_limit || 200000,
      total_tokens: 0
    });
    res.status(201).json({ conversation });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get single conversation with messages and handoff
router.get('/:id', (req: Request, res: Response) => {
  try {
    const id = getParamId(req);
    const conversation = dbService.getConversationById(id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    const messages = dbService.getMessages(id);
    const handoffs = dbService.getHandoffs(id);
    const latestHandoff = handoffs[0] || null;

    res.json({
      conversation,
      messages,
      handoffs,
      latestHandoff
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update conversation
router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = getParamId(req);
    const updated = dbService.updateConversation(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json({ conversation: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete conversation
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = getParamId(req);
    const deleted = dbService.deleteConversation(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Send a message in a conversation and get provider response
router.post('/:id/messages', async (req: Request, res: Response) => {
  try {
    const id = getParamId(req);
    const { content, role = 'user', provider } = req.body;

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const conversation = dbService.getConversationById(id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const activeProvider = provider || conversation.current_provider || 'claude';
    const adapter = getAdapter(activeProvider);

    // 1. Save user message
    const userTokens = adapter.estimateTokens(content);
    const userMsg = dbService.addMessage({
      conversation_id: id,
      role: 'user',
      provider: 'user',
      content,
      tokens: userTokens
    });

    // 2. Fetch recent conversation history
    const allMessages = dbService.getMessages(id);
    const history: ChatMessage[] = allMessages.map((m) => ({
      role: m.role,
      content: m.content,
      provider: m.provider
    }));

    // 3. Generate Provider Response
    const response = await adapter.generateResponse(history);

    // 4. Save Assistant Response
    const assistantMsg = dbService.addMessage({
      conversation_id: id,
      role: 'assistant',
      provider: activeProvider,
      content: response.content,
      tokens: response.tokens,
      metadata: JSON.stringify(response.metadata || {})
    });

    const updatedConv = dbService.getConversationById(id);

    res.json({
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      conversation: updatedConv
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
