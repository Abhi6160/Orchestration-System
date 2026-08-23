import { db, dbService } from './database.js';

export function resetDatabaseToStitchState() {
  db.exec('DELETE FROM messages');
  db.exec('DELETE FROM handoffs');
  db.exec('DELETE FROM conversations');

  const convId = 'apollo-launch-planning';
  const now = new Date('2023-10-12T14:32:00Z').toISOString();

  // Create Apollo conversation
  dbService.createConversation({
    id: convId,
    title: 'Planning a product launch',
    project_tag: 'Apollo',
    current_provider: 'claude',
    context_limit: 200000,
    total_tokens: 164000
  });

  // Message 1: User
  dbService.addMessage({
    id: 'msg-1',
    conversation_id: convId,
    role: 'user',
    provider: 'user',
    content: "We need to finalize the launch checklist for Project Apollo. The target date is Nov 15th. We're launching the new dashboard feature and the updated API endpoints simultaneously. Can you outline a high-level timeline starting from T-4 weeks?",
    tokens: 65000
  });

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

  dbService.addMessage({
    id: 'msg-2',
    conversation_id: convId,
    role: 'assistant',
    provider: 'claude',
    content: claudeContent,
    tokens: 72000
  });

  // Message 3: User
  dbService.addMessage({
    id: 'msg-3',
    conversation_id: convId,
    role: 'user',
    provider: 'user',
    content: "Let's dive deeper into the security audit task in T-2 weeks. What specific endpoints need the most scrutiny?",
    tokens: 27000
  });

  // Also create an empty chat conversation for demonstration
  dbService.createConversation({
    id: 'empty-starter-chat',
    title: 'New Conversation',
    project_tag: 'General',
    current_provider: 'claude',
    context_limit: 200000,
    total_tokens: 0
  });

  // Ensure total tokens is accurate for 82% threshold demo
  dbService.updateConversation(convId, { total_tokens: 164000 });

  console.log('Database reset to pristine starting state.');
}

if (process.argv[1]?.includes('seed')) {
  resetDatabaseToStitchState();
}
