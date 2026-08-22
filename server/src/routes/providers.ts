import { Router, Request, Response } from 'express';
import { ClaudeAdapter } from '../providers/claudeAdapter.js';
import { GeminiAdapter } from '../providers/geminiAdapter.js';
import { dbService } from '../db/database.js';

const router = Router();
const claude = new ClaudeAdapter();
const gemini = new GeminiAdapter();

// Get provider metadata and system capabilities
router.get('/', (_req: Request, res: Response) => {
  res.json({
    providers: [
      {
        id: 'claude',
        name: claude.displayName,
        model: claude.model,
        contextWindow: claude.contextWindow,
        accentColor: claude.accentColor,
        hasApiKey: claude.hasApiKey,
        mode: claude.hasApiKey ? 'live' : 'demo'
      },
      {
        id: 'gemini',
        name: gemini.displayName,
        model: gemini.model,
        contextWindow: gemini.contextWindow,
        accentColor: gemini.accentColor,
        hasApiKey: gemini.hasApiKey,
        mode: gemini.hasApiKey ? 'live' : 'demo'
      }
    ],
    demoNotice: 'ContextBridge is running in demo-ready mode with intelligent mock providers if API keys are not supplied.'
  });
});

// Set simulated context usage for hackathon demo testing (e.g. force 82% context warning)
router.post('/simulate-tokens', (req: Request, res: Response) => {
  try {
    const { conversationId, tokens } = req.body;
    if (!conversationId || typeof tokens !== 'number') {
      return res.status(400).json({ error: 'conversationId and tokens (number) required' });
    }

    const conv = dbService.updateConversation(conversationId, { total_tokens: tokens });
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ conversation: conv });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reset database to initial seed state
router.post('/reset', async (_req: Request, res: Response) => {
  try {
    const { resetDatabaseToStitchState } = await import('../db/seed.js');
    resetDatabaseToStitchState();
    res.json({ success: true, message: 'Database reset to initial Stitch state' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
