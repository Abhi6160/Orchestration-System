import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  HelpCircle, 
  Compass, 
  Layers, 
  Zap,
  Loader2,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import type { HandoffPreview, ProviderId } from '../types';
import { PROVIDER_ORDER, getProviderMeta } from '../lib/providerMeta';

interface HandoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  preview: HandoffPreview | null;
  isLoading: boolean;
  onConfirm: (customData: {
    from_provider: ProviderId;
    to_provider: ProviderId;
    user_goal: string;
    key_decisions: string[];
    current_state: string;
    unresolved_questions: string[];
    instructions_for_next_ai: string;
    original_token_count: number;
    compressed_token_estimate: number;
  }) => Promise<void>;
  /** Called when the user picks a different target model, so the parent can
   *  regenerate the preview against that provider. */
  onChangeTarget?: (provider: ProviderId) => void;
}

export const HandoffModal: React.FC<HandoffModalProps> = ({
  isOpen,
  onClose,
  preview,
  isLoading,
  onConfirm,
  onChangeTarget
}) => {
  const [selectedTargetModel, setSelectedTargetModel] = useState<ProviderId>('gemini');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTargetMenuOpen, setIsTargetMenuOpen] = useState(false);

  // Editable local state for user customization
  const [userGoal, setUserGoal] = useState('');
  const [keyDecisions, setKeyDecisions] = useState<string[]>([]);
  const [currentState, setCurrentState] = useState('');
  const [unresolvedQuestions, setUnresolvedQuestions] = useState<string[]>([]);
  const [instructionsForNextAi, setInstructionsForNextAi] = useState('');
  const [newDecisionInput, setNewDecisionInput] = useState('');

  useEffect(() => {
    if (preview) {
      setUserGoal(preview.userGoal || '');
      setKeyDecisions(preview.keyDecisions || []);
      setCurrentState(preview.currentState || '');
      setUnresolvedQuestions(preview.unresolvedQuestions || []);
      setInstructionsForNextAi(preview.instructionsForNextAi || '');
      setSelectedTargetModel(preview.toProvider || 'gemini');
    }
  }, [preview]);

  if (!isOpen) return null;

  const fromProvider: ProviderId = preview?.fromProvider || 'claude';
  const fromMeta = getProviderMeta(fromProvider);
  const toMeta = getProviderMeta(selectedTargetModel);
  const FromIcon = fromMeta.icon;
  const ToIcon = toMeta.icon;
  const availableTargets = PROVIDER_ORDER.filter((id) => id !== fromProvider);

  const handleAddDecision = () => {
    if (newDecisionInput.trim()) {
      setKeyDecisions([...keyDecisions, newDecisionInput.trim()]);
      setNewDecisionInput('');
    }
  };

  const handleRemoveDecision = (idx: number) => {
    setKeyDecisions(keyDecisions.filter((_, i) => i !== idx));
  };

  const handleSelectTarget = (provider: ProviderId) => {
    setSelectedTargetModel(provider);
    setIsTargetMenuOpen(false);
    if (provider !== preview?.toProvider) {
      onChangeTarget?.(provider);
    }
  };

  const handleConfirm = async () => {
    if (!preview) return;
    try {
      setIsSubmitting(true);
      await onConfirm({
        from_provider: preview.fromProvider,
        to_provider: selectedTargetModel,
        user_goal: userGoal,
        key_decisions: keyDecisions,
        current_state: currentState,
        unresolved_questions: unresolvedQuestions,
        instructions_for_next_ai: instructionsForNextAi,
        original_token_count: preview.originalTokenCount,
        compressed_token_estimate: preview.compressedTokenEstimate
      });
      onClose();
    } catch (err) {
      console.error('Failed to confirm handoff:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const originalTokens = preview?.originalTokenCount || 164000;
  const compressedTokens = preview?.compressedTokenEstimate || 1450;
  const savingsPct = preview?.compressionRatio || 99;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-outline-variant bg-surface flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-xs">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-primary leading-tight">
                ContextBridge Handoff Review
              </h3>
              <p className="text-xs text-on-surface-variant">
                Intelligent context compression & zero-loss memory transfer
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary p-1.5 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5 text-xs">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
              <Loader2 className="w-7 h-7 text-primary animate-spin" />
              <p className="text-xs font-medium">Analyzing conversation & synthesizing structured handoff digest...</p>
            </div>
          ) : (
            <>
              {/* Transfer Flow & Token Compression Card */}
              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-outline-variant/60">
                  {/* From Provider */}
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full ${fromMeta.iconBg} ${fromMeta.iconText} flex items-center justify-center`}>
                      <FromIcon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-on-surface-variant font-medium block">Source Model</span>
                      <span className={`font-semibold text-xs ${fromMeta.badgeText}`}>{fromMeta.displayName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <span className="text-[11px] font-mono">{originalTokens.toLocaleString()} tokens</span>
                    <ArrowRight className="w-4 h-4 text-primary" />
                    <span className="text-[11px] font-mono text-blue-700 font-semibold">{compressedTokens.toLocaleString()} tokens</span>
                  </div>

                  {/* To Provider - selectable */}
                  <div className="flex items-center gap-2.5 relative">
                    <div className={`w-7 h-7 rounded-full ${toMeta.iconBg} ${toMeta.iconText} flex items-center justify-center`}>
                      <ToIcon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-on-surface-variant font-medium block">Target Model</span>
                      <button
                        type="button"
                        onClick={() => setIsTargetMenuOpen((v) => !v)}
                        className={`font-semibold text-xs ${toMeta.badgeText} flex items-center gap-1 cursor-pointer hover:opacity-80`}
                      >
                        <span>{toMeta.displayName}</span>
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>

                    {isTargetMenuOpen && (
                      <div className="absolute top-full right-0 mt-2 w-52 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg z-10 overflow-hidden">
                        {availableTargets.map((id) => {
                          const optMeta = getProviderMeta(id);
                          const OptIcon = optMeta.icon;
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => handleSelectTarget(id)}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-surface-container transition-colors cursor-pointer ${
                                selectedTargetModel === id ? 'bg-surface-container font-semibold' : ''
                              }`}
                            >
                              <OptIcon className={`w-3.5 h-3.5 ${optMeta.badgeText}`} />
                              <span className="text-primary">{optMeta.displayName}</span>
                              <span className="ml-auto text-[10px] text-on-surface-variant font-mono">{optMeta.shortContext}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Compression Metrics */}
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold font-mono">
                      {savingsPct}% Token Savings
                    </span>
                    <span className="text-on-surface-variant">
                      Compressed {originalTokens.toLocaleString()} tokens into {compressedTokens.toLocaleString()} tokens
                    </span>
                  </div>
                  <div className="text-on-surface-variant font-mono text-[10px]">
                    {toMeta.shortContext} Buffer Ready
                  </div>
                </div>
              </div>

              {/* 1. Core User Goal */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 font-semibold text-primary">
                  <Compass className="w-3.5 h-3.5 text-primary" />
                  <span>1. User Goal & Core Objective</span>
                </label>
                <input
                  type="text"
                  value={userGoal}
                  onChange={(e) => setUserGoal(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30"
                  placeholder="Primary user goal..."
                />
              </div>

              {/* 2. Key Decisions Established */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 font-semibold text-primary">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>2. Key Architectural Decisions Established ({keyDecisions.length})</span>
                </label>
                <div className="space-y-1.5">
                  {keyDecisions.map((decision, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/60 group"
                    >
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-primary font-mono text-[10px] shrink-0 mt-0.5">
                          {idx + 1}.
                        </span>
                        <span className="text-xs text-primary">{decision}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDecision(idx)}
                        className="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-error transition-opacity p-0.5 cursor-pointer"
                        title="Remove decision"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* Add Decision Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newDecisionInput}
                      onChange={(e) => setNewDecisionInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddDecision()}
                      placeholder="Add an additional architectural decision..."
                      className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-1.5 text-xs text-primary focus:outline-none focus:border-blue-600"
                    />
                    <button
                      type="button"
                      onClick={handleAddDecision}
                      className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant text-primary font-medium transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Current Workspace State */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 font-semibold text-primary">
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  <span>3. Current Workspace State & Active Code Artifacts</span>
                </label>
                <textarea
                  value={currentState}
                  onChange={(e) => setCurrentState(e.target.value)}
                  rows={2}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 text-xs text-primary focus:outline-none focus:border-blue-600 resize-none font-mono"
                  placeholder="State of active files and milestones..."
                />
              </div>

              {/* 4. Unresolved Questions */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 font-semibold text-primary">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>4. Unresolved Focus Items & Open Questions</span>
                </label>
                <div className="space-y-1">
                  {unresolvedQuestions.map((q, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-surface-container/70 text-on-surface-variant">
                      <ChevronRight className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>{q}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Directives for Next AI */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 font-semibold text-primary">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>5. Directive Instructions for {toMeta.displayName}</span>
                </label>
                <textarea
                  value={instructionsForNextAi}
                  onChange={(e) => setInstructionsForNextAi(e.target.value)}
                  rows={2}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 text-xs text-primary focus:outline-none focus:border-blue-600 resize-none"
                  placeholder="Directives for receiving model..."
                />
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-outline-variant bg-surface flex items-center justify-between gap-3">
          <div className="text-[11px] text-on-surface-variant">
            Target: <strong className="text-primary font-medium">{toMeta.displayName} ({toMeta.shortContext} Context)</strong>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-outline-variant hover:bg-surface-container text-primary font-medium text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleConfirm}
              disabled={isSubmitting || isLoading}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50 ${toMeta.sendBg}`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Transferring Context...</span>
                </>
              ) : (
                <>
                  <ToIcon className="w-3.5 h-3.5" />
                  <span>Confirm & Continue in {toMeta.displayName}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
