import React from 'react';
import { ArrowLeftRight, Share2, MoreVertical, AlertTriangle } from 'lucide-react';
import type { ProviderId } from '../types';
import { getProviderMeta } from '../lib/providerMeta';

interface TopAppBarProps {
  currentProvider: ProviderId;
  totalTokens: number;
  contextLimit: number;
  onTriggerHandoff: () => void;
  onToggleProviderDirectly?: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  currentProvider,
  totalTokens,
  contextLimit,
  onTriggerHandoff
}) => {
  const meta = getProviderMeta(currentProvider);
  const Icon = meta.icon;
  const usagePercent = Math.min(100, Math.round((totalTokens / (contextLimit || meta.contextWindow)) * 100));
  const isHighContext = usagePercent >= 80;

  return (
    <header className="fixed top-0 right-0 h-16 bg-surface-container-lowest border-b border-outline-variant flex items-center justify-between px-6 w-[calc(100%-280px)] z-10 select-none">
      {/* Model Selector Badge */}
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 ${meta.badgeBg} px-3 py-1.5 rounded-full border ${meta.badgeBorder} shadow-2xs`}>
          <div className={`w-5 h-5 rounded-full ${meta.iconBg} ${meta.iconText} flex items-center justify-center shrink-0`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className={`text-xs font-semibold ${meta.badgeText}`}>{meta.displayName}</span>
          <span className="text-[10px] text-on-surface-variant font-mono bg-surface-container-lowest/80 px-1.5 py-0.2 rounded border border-outline-variant/40">
            {meta.shortContext}
          </span>
        </div>

        {/* Warning Indicator Pill if context > 80% */}
        {isHighContext && (
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
          className="text-on-surface-variant hover:text-primary hover:bg-surface-container-high p-2 rounded-md transition-colors cursor-pointer"
          title="Share conversation"
        >
          <Share2 className="w-4 h-4" />
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
