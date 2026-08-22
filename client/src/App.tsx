import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopAppBar } from './components/TopAppBar';
import { MessageBubble } from './components/MessageBubble';
import { GeminiTransition } from './components/GeminiTransition';
import { ContextWarning } from './components/ContextWarning';
import { HandoffModal } from './components/HandoffModal';
import { Composer } from './components/Composer';
import { EmptyState } from './components/EmptyState';
import { StateSwitcher } from './components/StateSwitcher';
import { api } from './api/client';
import type { Conversation, Message, HandoffPreview, ProviderId, DemoStateId } from './types';
import { Folder, Calendar, BrainCircuit, Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  // Application Data State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>('apollo-launch-planning');
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // UI States
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isHandoffModalOpen, setIsHandoffModalOpen] = useState(false);
  const [handoffPreview, setHandoffPreview] = useState<HandoffPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [activeDemoState, setActiveDemoState] = useState<DemoStateId>('active_claude');
  const [isWarningDismissed, setIsWarningDismissed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSendingMessage]);

  // Initial Data Fetch
  const loadConversations = async () => {
    try {
      const list = await api.getConversations();
      setConversations(list);
      if (list.length > 0 && !activeConversationId) {
        setActiveConversationId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Fetch active conversation details
  const loadActiveConversation = async (id: string) => {
    try {
      setIsLoadingMessages(true);
      const data = await api.getConversation(id);
      setCurrentConversation(data.conversation);
      setMessages(data.messages);
      setIsWarningDismissed(false);

      // Determine initial demo state
      if (data.messages.length === 0) {
        setActiveDemoState('empty');
      } else if (data.conversation.current_provider === 'gemini') {
        setActiveDemoState('gemini_continuation');
      } else if (data.conversation.total_tokens >= 160000) {
        setActiveDemoState('context_warning');
      } else {
        setActiveDemoState('active_claude');
      }
    } catch (err) {
      console.error('Failed to load conversation details:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (activeConversationId) {
      loadActiveConversation(activeConversationId);
    }
  }, [activeConversationId]);

  // Handler: Select Conversation
  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
  };

  // Handler: New Chat
  const handleNewChat = async () => {
    try {
      const newConv = await api.createConversation({
        title: 'New Conversation',
        project_tag: 'General',
        current_provider: 'claude',
        context_limit: 200000
      });
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      setActiveDemoState('empty');
    } catch (err) {
      console.error('Failed to create new chat:', err);
    }
  };

  // Handler: Delete Conversation
  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteConversation(id);
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);
      if (activeConversationId === id) {
        setActiveConversationId(remaining[0]?.id || null);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  // Handler: Send Message
  const handleSendMessage = async (content: string) => {
    if (!activeConversationId || !currentConversation) return;

    try {
      setIsSendingMessage(true);

      // Optimistic user message update
      const tempUserMsg: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: activeConversationId,
        role: 'user',
        provider: 'user',
        content,
        tokens: Math.max(10, Math.ceil(content.length / 4)),
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, tempUserMsg]);

      // API request to backend
      const result = await api.sendMessage(
        activeConversationId,
        content,
        currentConversation.current_provider
      );

      // Update state with actual saved messages and updated conversation
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempUserMsg.id);
        return [...withoutTemp, result.userMessage, result.assistantMessage];
      });

      setCurrentConversation(result.conversation);
      setConversations((prev) =>
        prev.map((c) => (c.id === result.conversation.id ? result.conversation : c))
      );

      if (result.conversation.total_tokens >= 160000 && result.conversation.current_provider === 'claude') {
        setActiveDemoState('context_warning');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Handler: Trigger Handoff
  const handleTriggerHandoff = async () => {
    if (!activeConversationId) return;
    try {
      setIsHandoffModalOpen(true);
      setIsLoadingPreview(true);
      const preview = await api.generateHandoffPreview(activeConversationId, 'gemini');
      setHandoffPreview(preview);
    } catch (err) {
      console.error('Failed to generate handoff preview:', err);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Handler: Confirm Handoff
  const handleConfirmHandoff = async (payload: {
    from_provider: ProviderId;
    to_provider: ProviderId;
    user_goal: string;
    key_decisions: string[];
    current_state: string;
    unresolved_questions: string[];
    instructions_for_next_ai: string;
    original_token_count: number;
    compressed_token_estimate: number;
  }) => {
    if (!activeConversationId) return;

    const result = await api.confirmHandoff(activeConversationId, {
      ...payload,
      auto_continue: true
    });

    if (result.success) {
      setCurrentConversation(result.conversation);
      setMessages(result.messages);
      setConversations((prev) =>
        prev.map((c) => (c.id === result.conversation.id ? result.conversation : c))
      );
      setActiveDemoState('gemini_continuation');
    }
  };

  // Handler: Simulate Token Count (for demonstration)
  const handleSimulateTokens = async (tokens: number) => {
    if (!activeConversationId) return;
    try {
      const updated = await api.simulateTokens(activeConversationId, tokens);
      setCurrentConversation(updated);
      setConversations((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      if (tokens >= 160000 && updated.current_provider === 'claude') {
        setActiveDemoState('context_warning');
        setIsWarningDismissed(false);
      } else {
        setActiveDemoState('active_claude');
      }
    } catch (err) {
      console.error('Failed to simulate tokens:', err);
    }
  };

  // Handler: Quick Demo State Selection
  const handleDemoStateSelect = async (stateId: DemoStateId) => {
    setActiveDemoState(stateId);

    if (stateId === 'empty') {
      // Find or create empty conversation
      const emptyConv = conversations.find((c) => c.id === 'empty-starter-chat');
      if (emptyConv) {
        setActiveConversationId(emptyConv.id);
      } else {
        handleNewChat();
      }
    } else if (stateId === 'active_claude') {
      setActiveConversationId('apollo-launch-planning');
      setIsHandoffModalOpen(false);
      await handleSimulateTokens(75000);
      if (currentConversation?.current_provider !== 'claude') {
        await api.updateConversation('apollo-launch-planning', {
          current_provider: 'claude',
          context_limit: 200000,
          total_tokens: 75000
        });
        loadActiveConversation('apollo-launch-planning');
      }
    } else if (stateId === 'context_warning') {
      setActiveConversationId('apollo-launch-planning');
      setIsHandoffModalOpen(false);
      setIsWarningDismissed(false);
      await handleSimulateTokens(164000);
      if (currentConversation?.current_provider !== 'claude') {
        await api.updateConversation('apollo-launch-planning', {
          current_provider: 'claude',
          context_limit: 200000,
          total_tokens: 164000
        });
        loadActiveConversation('apollo-launch-planning');
      }
    } else if (stateId === 'handoff_preview') {
      setActiveConversationId('apollo-launch-planning');
      handleTriggerHandoff();
    } else if (stateId === 'gemini_continuation') {
      setActiveConversationId('apollo-launch-planning');
      setIsHandoffModalOpen(false);
      // If not already in gemini, execute confirm
      if (currentConversation?.current_provider !== 'gemini' || !messages.some(m => m.provider === 'system')) {
        await api.generateHandoffPreview('apollo-launch-planning', 'gemini').then(async (preview) => {
          await api.confirmHandoff('apollo-launch-planning', {
            from_provider: 'claude',
            to_provider: 'gemini',
            user_goal: preview.userGoal,
            key_decisions: preview.keyDecisions,
            current_state: preview.currentState,
            unresolved_questions: preview.unresolvedQuestions,
            instructions_for_next_ai: preview.instructionsForNextAi,
            original_token_count: preview.originalTokenCount,
            compressed_token_estimate: preview.compressedTokenEstimate,
            auto_continue: true
          });
          loadActiveConversation('apollo-launch-planning');
        });
      }
    }
  };

  const currentProvider = currentConversation?.current_provider || 'claude';
  const totalTokens = currentConversation?.total_tokens || 0;
  const contextLimit = currentConversation?.context_limit || 200000;
  const usagePercent = Math.min(100, Math.round((totalTokens / contextLimit) * 100));
  const showWarning = (activeDemoState === 'context_warning' || (usagePercent >= 80 && currentProvider === 'claude')) && !isWarningDismissed;
  const isEmptyChat = messages.length === 0;

  return (
    <div className="flex h-screen w-full bg-background text-on-background font-sans antialiased overflow-hidden selection:bg-secondary-fixed selection:text-on-secondary-fixed">
      {/* Demo UI State Switcher Bar */}
      <StateSwitcher
        currentState={activeDemoState}
        onSelectState={handleDemoStateSelect}
      />

      {/* Left Navigation Sidebar */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        isDemoMode={true}
      />

      {/* Main Workspace Area (offset by 280px sidebar) */}
      <div className="ml-[280px] w-[calc(100%-280px)] h-screen flex flex-col relative">
        {/* Top App Header */}
        <TopAppBar
          currentProvider={currentProvider}
          totalTokens={totalTokens}
          contextLimit={contextLimit}
          onTriggerHandoff={handleTriggerHandoff}
        />

        {/* Scrollable Chat Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar pt-20 pb-[150px] px-6 flex justify-center">
          <div className="w-full max-w-[800px] flex flex-col gap-5">
            {isLoadingMessages ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
                <Loader2 className="w-7 h-7 text-primary animate-spin" />
                <p className="text-xs font-medium">Loading workspace...</p>
              </div>
            ) : isEmptyChat ? (
              /* State 1: Empty Chat */
              <EmptyState
                currentProvider={currentProvider}
                onChangeProvider={(p) => {
                  if (activeConversationId) {
                    api.updateConversation(activeConversationId, { current_provider: p });
                    setCurrentConversation((prev) => (prev ? { ...prev, current_provider: p } : null));
                  }
                }}
                onSelectPrompt={(prompt, projectTag) => {
                  if (activeConversationId) {
                    api.updateConversation(activeConversationId, {
                      title: prompt.slice(0, 32),
                      project_tag: projectTag
                    });
                    handleSendMessage(prompt);
                  }
                }}
              />
            ) : (
              <>
                {/* Conversation Title & Project Context Block */}
                <div className="border-b border-outline-variant pb-3 mb-1">
                  <h2 className="font-semibold text-xl text-primary tracking-tight">
                    {currentConversation?.title || 'Planning a product launch'}
                  </h2>
                  <div className="flex gap-2 mt-2">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-[11px] font-medium border border-outline-variant/40">
                      <Folder className="w-3 h-3 text-on-surface-variant" />
                      <span>Project: {currentConversation?.project_tag || 'Apollo'}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-[11px] font-medium border border-outline-variant/40">
                      <Calendar className="w-3 h-3 text-on-surface-variant" />
                      <span>Oct 12, 2023</span>
                    </span>
                  </div>
                </div>

                {/* State 3: Context Warning Banner (Docked in chat if active) */}
                {showWarning && (
                  <ContextWarning
                    totalTokens={totalTokens}
                    contextLimit={contextLimit}
                    onTriggerHandoff={handleTriggerHandoff}
                    onDismiss={() => setIsWarningDismissed(true)}
                  />
                )}

                {/* Message Thread */}
                {messages.map((msg) => {
                  if (msg.role === 'system' || msg.provider === 'system') {
                    // State 5 Anchor: Gemini Transition Divider
                    return <GeminiTransition key={msg.id} message={msg} />;
                  }
                  return (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      currentProvider={currentProvider}
                    />
                  );
                })}

                {/* Assistant Pending / Streaming Indicator */}
                {isSendingMessage && (
                  <div className="flex items-start gap-2.5 max-w-[90%] opacity-80 animate-pulse">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        currentProvider === 'gemini'
                          ? 'bg-blue-600 text-white'
                          : 'bg-secondary-container text-on-secondary-container'
                      }`}
                    >
                      <BrainCircuit className="w-3.5 h-3.5" />
                    </div>
                    <div className="bg-surface-container-lowest px-4 py-3 rounded-xl rounded-tl-xs border border-outline-variant shadow-2xs flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full animate-bounce ${
                          currentProvider === 'gemini' ? 'bg-blue-600' : 'bg-secondary'
                        }`}
                        style={{ animationDelay: '0ms' }}
                      />
                      <div
                        className={`w-2 h-2 rounded-full animate-bounce ${
                          currentProvider === 'gemini' ? 'bg-blue-600' : 'bg-secondary'
                        }`}
                        style={{ animationDelay: '150ms' }}
                      />
                      <div
                        className={`w-2 h-2 rounded-full animate-bounce ${
                          currentProvider === 'gemini' ? 'bg-blue-600' : 'bg-secondary'
                        }`}
                        style={{ animationDelay: '300ms' }}
                      />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </main>

        {/* State 4: Handoff Preview Modal */}
        <HandoffModal
          isOpen={isHandoffModalOpen}
          onClose={() => setIsHandoffModalOpen(false)}
          preview={handoffPreview}
          isLoading={isLoadingPreview}
          onConfirm={handleConfirmHandoff}
        />

        {/* Bottom Composer & Context Bar */}
        <Composer
          currentProvider={currentProvider}
          totalTokens={totalTokens}
          contextLimit={contextLimit}
          onSendMessage={handleSendMessage}
          isLoading={isSendingMessage}
          onSimulateTokens={handleSimulateTokens}
        />
      </div>
    </div>
  );
};

export default App;
