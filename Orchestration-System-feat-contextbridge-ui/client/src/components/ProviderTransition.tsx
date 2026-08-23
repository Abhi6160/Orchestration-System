import React, { useState } from 'react';
import { 
  GitFork, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Sparkles
} from 'lucide-react';
import type { Message, ProviderId } from '../types';
import { getProviderMeta } from '../lib/providerMeta';

interface ProviderTransitionProps {
  message: Message;
}

export const ProviderTransition: React.FC<ProviderTransitionProps> = ({ message }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  let metadata: any = {};
  try {
    metadata = typeof message.metadata === 'string' ? JSON.parse(message.metadata) : (message.metadata || {});
  } catch (e) {
    metadata = {};
  }

  const fromProvider: ProviderId = metadata.fromProvider || 'claude';
  const toProvider: ProviderId = metadata.toProvider || 'gemini';
  const fromMeta = getProviderMeta(fromProvider);
  const toMeta = getProviderMeta(toProvider);

  const originalTokens = metadata.originalTokens || 164000;
  const condensedTokens = metadata.condensedTokens || 1450;
  const userGoal = metadata.userGoal || 'Finalize Project Apollo launch timeline and API security audit.';
  const keyDecisions = Array.isArray(metadata.keyDecisions) ? metadata.keyDecisions : [
    'Target launch date locked for Nov 15th.',
    'Simultaneous deployment of Dashboard UI and updated API endpoints.',
    'T-4 Weeks: Code Freeze & QA Phase 1.',
    'T-3 Weeks: Beta Testing & Bug Bashes.'
  ];

  return (
    <div className="w-full my-4 animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-gradient-to-r from-orange-50/70 via-surface-container-low to-blue-50/70 border border-outline-variant rounded-xl p-4 shadow-2xs">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-xs">
              <GitFork className="w-4 h-4 rotate-90" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-primary">ContextBridge Memory Transfer</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-semibold font-mono">
                  99% Compressed
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                <span className={`font-semibold ${fromMeta.badgeText}`}>{fromMeta.displayName}</span>
                <span>→</span>
                <span className={`font-semibold ${toMeta.badgeText}`}>{toMeta.displayName}</span>
                <span className="text-on-surface-variant/60">•</span>
                <span>{originalTokens.toLocaleString()} tokens condensed to {condensedTokens.toLocaleString()} tokens</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high border border-outline-variant text-xs text-primary font-medium transition-colors cursor-pointer"
          >
            <span>{isExpanded ? 'Hide Context Digest' : 'View Transferred Digest'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Expandable Digest Drawer */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-outline-variant/60 space-y-3 text-xs animate-in fade-in duration-200">
            {/* User Goal */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-primary text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Primary Objective</span>
              </div>
              <p className="text-on-surface-variant bg-surface-container-lowest p-2.5 rounded-lg border border-outline-variant/50">
                {userGoal}
              </p>
            </div>

            {/* Key Decisions */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-primary text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Transferred Decisions ({keyDecisions.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {keyDecisions.map((dec: string, i: number) => (
                  <div key={i} className="bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/40 flex items-start gap-1.5">
                    <span className="font-mono text-[10px] text-primary font-semibold shrink-0 mt-0.5">{i + 1}.</span>
                    <span className="text-[11px] text-on-surface-variant">{dec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Buffer & Capacity stats */}
            <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-mono pt-1">
              <span>Ingestion Buffer: {toMeta.shortContext} token ceiling</span>
              <span className={`font-semibold ${toMeta.badgeText}`}>{toMeta.displayName} Active Session</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
