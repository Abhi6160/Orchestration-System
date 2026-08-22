import React from "react";
import {
  ArrowLeftRight,
  Share2,
  MoreVertical,
  BrainCircuit,
  Sparkles,
  AlertTriangle,
  Check,
} from "lucide-react";
import type { ProviderId } from "../types";
import { api } from "../api/client";

interface TopAppBarProps {
  currentProvider: ProviderId;
  totalTokens: number;
  contextLimit: number;
  conversationId?: string | null;
  onTriggerHandoff: () => void;
  onToggleProviderDirectly?: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  currentProvider,
  totalTokens,
  contextLimit,
  conversationId,
  onTriggerHandoff,
}) => {
  const isClaude = currentProvider === "claude";
  const usagePercent = Math.min(
    100,
    Math.round((totalTokens / (contextLimit || 200000)) * 100),
  );
  const isHighContext = usagePercent >= 80;
  const [justShared, setJustShared] = React.useState(false);

  const handleShare = async () => {
    if (!conversationId) return;
    try {
      const { shareUrl } = await api.shareConversation(conversationId);
      const absoluteUrl = `${window.location.origin}${shareUrl}`;
      await navigator.clipboard.writeText(absoluteUrl);
      setJustShared(true);
      setTimeout(() => setJustShared(false), 2000);
    } catch (err) {
      console.error("Failed to share conversation:", err);
    }
  };

  return (
    <header className="fixed top-0 right-0 h-16 bg-surface-container-lowest border-b border-outline-variant flex items-center justify-between px-6 w-[calc(100%-280px)] z-10 select-none">
      {/* Model Selector Badge */}
      <div className="flex items-center gap-3">
        {isClaude ? (
          <div className="flex items-center gap-2 bg-secondary-fixed/20 px-3 py-1.5 rounded-full border border-secondary-fixed-dim/40 shadow-2xs">
            <div className="w-5 h-5 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
              <BrainCircuit className="w-3.5 h-3.5 text-on-secondary-container" />
            </div>
            <span className="text-xs font-semibold text-secondary">
              Claude 3.5 Sonnet
            </span>
            <span className="text-[10px] text-on-surface-variant font-mono bg-surface-container-lowest/80 px-1.5 py-0.2 rounded border border-outline-variant/40">
              200k
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-blue-50/80 px-3 py-1.5 rounded-full border border-blue-200/80 shadow-2xs">
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-semibold text-blue-700">
              Gemini 1.5 Pro
            </span>
            <span className="text-[10px] text-blue-600 font-mono bg-white px-1.5 py-0.2 rounded border border-blue-200">
              2M Context
            </span>
          </div>
        )}

        {/* Warning Indicator Pill if context > 80% */}
        {isHighContext && isClaude && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>High Context Load ({usagePercent}%)</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Switch AI Button -> Triggers ContextBridge Handoff */}
        <button
          onClick={onTriggerHandoff}
          className="bg-surface-container hover:bg-surface-container-high active:bg-surface-container-highest border border-outline-variant text-primary px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-2xs group"
          title="Transfer context to another model"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-primary transition-colors" />
          <span>Switch AI</span>
        </button>

        {/* Utility buttons */}
        <button
          onClick={handleShare}
          className="text-on-surface-variant hover:text-primary hover:bg-surface-container-high p-2 rounded-md transition-colors cursor-pointer"
          title={justShared ? "Link copied!" : "Share conversation"}
        >
          {justShared ? (
            <Check className="w-4 h-4 text-emerald-600" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
        </button>

        <button
          className="text-on-surface-variant hover:text-primary hover:bg-surface-container-high p-2 rounded-md transition-colors cursor-pointer"
          title="More options"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
