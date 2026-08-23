import Database from 'better-sqlite3';
import { ProviderId } from '../providers/types.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path
const dbDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'contextbridge.sqlite');
export const db = new Database(dbPath);

// Enable WAL mode & foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  // 1. Conversations Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      project_tag TEXT DEFAULT 'General',
      current_provider TEXT NOT NULL DEFAULT 'claude',
      context_limit INTEGER NOT NULL DEFAULT 200000,
      total_tokens INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 2. Messages Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL, -- 'user' | 'assistant' | 'system'
      provider TEXT NOT NULL, -- 'claude' | 'gemini' | 'system'
      content TEXT NOT NULL,
      tokens INTEGER NOT NULL DEFAULT 0,
      metadata TEXT, -- JSON string for code snippets, handoff links, etc.
      created_at TEXT NOT NULL,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );
  `);

  // 3. Handoffs Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS handoffs (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      from_provider TEXT NOT NULL,
      to_provider TEXT NOT NULL,
      user_goal TEXT NOT NULL,
      key_decisions TEXT NOT NULL, -- JSON array
      current_state TEXT NOT NULL,
      unresolved_questions TEXT NOT NULL, -- JSON array
      instructions_for_next_ai TEXT NOT NULL,
      recent_messages TEXT, -- JSON array
      original_message_count INTEGER NOT NULL DEFAULT 0,
      original_token_count INTEGER NOT NULL DEFAULT 0,
      compressed_token_estimate INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'completed', -- 'preview' | 'completed' | 'cancelled'
      created_at TEXT NOT NULL,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );
  `);

  // Seed sample data if table is empty
  seedInitialData();
}

function seedInitialData() {
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM conversations');
  const result = countStmt.get() as { count: number };

  if (result.count === 0) {
    const convId = 'apollo-launch-planning';
    const now = new Date('2023-10-12T14:32:00Z').toISOString();

    const insertConv = db.prepare(`
      INSERT INTO conversations (id, title, project_tag, current_provider, context_limit, total_tokens, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // We set total tokens to ~164,000 to represent the 82% context warning scenario
    insertConv.run(
      convId,
      'Planning a product launch',
      'Apollo',
      'claude',
      200000,
      164000,
      now,
      now
    );

    const insertMsg = db.prepare(`
      INSERT INTO messages (id, conversation_id, role, provider, content, tokens, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Message 1: User
    insertMsg.run(
      'msg-1',
      convId,
      'user',
      'user',
      "We need to finalize the launch checklist for Project Apollo. The target date is Nov 15th. We're launching the new dashboard feature and the updated API endpoints simultaneously. Can you outline a high-level timeline starting from T-4 weeks?",
      65000,
      JSON.stringify({ tags: ['timeline', 'project-apollo'] }),
      new Date('2023-10-12T14:32:10Z').toISOString()
    );

    // Message 2: Assistant (Claude)
    const claudeContent = `Certainly. Based on a target launch date of Nov 15th, here is a high-level timeline for Project Apollo, focusing on both the dashboard and API deliverables.

### T-4 Weeks (Oct 18 - Oct 24) : Code Freeze & QA Phase 1
- Feature Complete milestone achieved for both Dashboard and API.
- Initiate comprehensive integration testing.
- Draft initial release notes and API documentation updates.

### T-3 Weeks (Oct 25 - Oct 31) : Beta Testing & Bug Bashes
- Release to internal staging for dogfooding.
- Conduct targeted bug bashes focused on edge cases in the new API endpoints.
- Finalize marketing assets and launch communications.

\`\`\`yaml timeline.yml
phases:
  - name: Code Freeze
    start: 2023-10-18
    tasks: [integration_tests, draft_docs]
  - name: Beta Testing
    start: 2023-10-25
    tasks: [dogfooding, bug_bash]
  - name: Launch Prep
    start: 2023-11-01
    tasks: [security_audit, final_review]
\`\`\``;

    insertMsg.run(
      'msg-2',
      convId,
      'assistant',
      'claude',
      claudeContent,
      72000,
      JSON.stringify({ model: 'claude-3-5-sonnet-20241022', language: 'yaml', filename: 'timeline.yml' }),
      new Date('2023-10-12T14:32:45Z').toISOString()
    );

    // Message 3: User
    insertMsg.run(
      'msg-3',
      convId,
      'user',
      'user',
      "Let's dive deeper into the security audit task in T-2 weeks. What specific endpoints need the most scrutiny?",
      27000,
      JSON.stringify({ focus: 'security-audit' }),
      new Date('2023-10-12T14:33:20Z').toISOString()
    );

    // Also create an empty chat conversation for demonstration
    const emptyConvId = 'empty-starter-chat';
    insertConv.run(
      emptyConvId,
      'New Conversation',
      'General',
      'claude',
      200000,
      0,
      new Date().toISOString(),
      new Date().toISOString()
    );
  }
}

// Conversation repository functions
export interface ConversationRecord {
  id: string;
  title: string;
  project_tag: string;
  current_provider: ProviderId;
  context_limit: number;
  total_tokens: number;
  created_at: string;
  updated_at: string;
}

export interface MessageRecord {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  provider: ProviderId | 'user' | 'system';
  content: string;
  tokens: number;
  metadata?: string;
  created_at: string;
}

export interface HandoffRecord {
  id: string;
  conversation_id: string;
  from_provider: string;
  to_provider: string;
  user_goal: string;
  key_decisions: string; // JSON string
  current_state: string;
  unresolved_questions: string; // JSON string
  instructions_for_next_ai: string;
  recent_messages?: string; // JSON string
  original_message_count: number;
  original_token_count: number;
  compressed_token_estimate: number;
  status: string;
  created_at: string;
}

export const dbService = {
  getConversations(): ConversationRecord[] {
    return db.prepare('SELECT * FROM conversations ORDER BY updated_at DESC').all() as ConversationRecord[];
  },

  getConversationById(id: string): ConversationRecord | undefined {
    return db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) as ConversationRecord | undefined;
  },

  createConversation(data: Partial<ConversationRecord> & { title: string; project_tag?: string; current_provider?: ProviderId }): ConversationRecord {
    const id = data.id || `conv-${Date.now()}`;
    const now = new Date().toISOString();
    const provider = data.current_provider || 'claude';
    const limit = data.context_limit || 200000;
    const tokens = data.total_tokens || 0;
    const project = data.project_tag || 'General';

    db.prepare(`
      INSERT INTO conversations (id, title, project_tag, current_provider, context_limit, total_tokens, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.title, project, provider, limit, tokens, now, now);

    return db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) as ConversationRecord;
  },

  updateConversation(id: string, updates: Partial<ConversationRecord>): ConversationRecord | undefined {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, val]) => {
      if (key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(val);
      }
    });

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    db.prepare(`UPDATE conversations SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return dbService.getConversationById(id);
  },

  deleteConversation(id: string): boolean {
    const res = db.prepare('DELETE FROM conversations WHERE id = ?').run(id);
    return res.changes > 0;
  },

  getMessages(conversationId: string): MessageRecord[] {
    return db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(conversationId) as MessageRecord[];
  },

  addMessage(message: Partial<MessageRecord> & { conversation_id: string; role: 'user' | 'assistant' | 'system'; content: string; provider: ProviderId | 'user' | 'system' }): MessageRecord {
    const id = message.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const now = new Date().toISOString();
    const tokens = message.tokens || Math.max(15, Math.ceil(message.content.length / 4));
    const metadata = message.metadata || null;

    db.prepare(`
      INSERT INTO messages (id, conversation_id, role, provider, content, tokens, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, message.conversation_id, message.role, message.provider, message.content, tokens, metadata, now);

    // Update conversation token count and timestamp
    const conv = dbService.getConversationById(message.conversation_id);
    if (conv) {
      const newTotal = conv.total_tokens + tokens;
      dbService.updateConversation(message.conversation_id, { total_tokens: newTotal });
    }

    return db.prepare('SELECT * FROM messages WHERE id = ?').get(id) as MessageRecord;
  },

  createHandoff(handoff: Partial<HandoffRecord> & { conversation_id: string; from_provider: string; to_provider: string; user_goal: string; key_decisions: string; current_state: string; unresolved_questions: string; instructions_for_next_ai: string }): HandoffRecord {
    const id = handoff.id || `handoff-${Date.now()}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO handoffs (
        id, conversation_id, from_provider, to_provider, user_goal, key_decisions,
        current_state, unresolved_questions, instructions_for_next_ai, recent_messages,
        original_message_count, original_token_count, compressed_token_estimate, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      handoff.conversation_id,
      handoff.from_provider,
      handoff.to_provider,
      handoff.user_goal,
      handoff.key_decisions,
      handoff.current_state,
      handoff.unresolved_questions,
      handoff.instructions_for_next_ai,
      handoff.recent_messages || '[]',
      handoff.original_message_count || 0,
      handoff.original_token_count || 0,
      handoff.compressed_token_estimate || 0,
      handoff.status || 'completed',
      now
    );

    return db.prepare('SELECT * FROM handoffs WHERE id = ?').get(id) as HandoffRecord;
  },

  getHandoffs(conversationId: string): HandoffRecord[] {
    return db.prepare('SELECT * FROM handoffs WHERE conversation_id = ? ORDER BY created_at DESC').all(conversationId) as HandoffRecord[];
  },

  getLatestHandoff(conversationId: string): HandoffRecord | undefined {
    return db.prepare('SELECT * FROM handoffs WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1').get(conversationId) as HandoffRecord | undefined;
  }
};
