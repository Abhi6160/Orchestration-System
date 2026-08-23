import React from 'react';
import { AlertTriangle, ArrowRight, ShieldAlert, Zap, X } from 'lucide-react';

interface ContextWarningProps {
  totalTokens: number;
  contextLimit: number;
  onTriggerHandoff: () => void;
  onDismiss?: () => void;
}

export const ContextWarning: React.FC<ContextWarningProps> = ({
  totalTokens,
  contextLimit,
  onTriggerHandoff,
  onDismiss
}) => {
  const percent = Math.min(100, Math.round((totalTokens / (contextLimit || 200000)) * 100));

  return (
    <div className="w-full max-w-[800px] mb-3 bg-amber-50/95 border border-amber-300/80 rounded-xl p-3.5 shadow-xs transition-all animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs font-semibold text-amber-950">
                Approaching Context Limit ({percent}% — {totalTokens.toLocaleString()} / {contextLimit.toLocaleString()} tokens)
              </h4>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-200/80 text-amber-900 font-medium">
                Simulated Hackathon Threshold
              </span>
            </div>

            <p className="text-[11px] text-amber-900/85 leading-relaxed max-w-[620px]">
              Claude 3.5 Sonnet context capacity is reaching high density. To avoid reasoning degradation or context truncation, use <strong>ContextBridge</strong> to compress and hand off your conversation into Gemini 1.5 Pro&apos;s 2M token context window.
            </p>

            {/* Quick Metrics */}
            <div className="flex items-center gap-4 pt-1 text-[10px] text-amber-800 font-medium">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-600" />
                <span>Estimated Compression: ~99% token reduction</span>
              </span>
              <span className="flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-amber-600" />
                <span>Zero lost architecture decisions</span>
              </span>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onTriggerHandoff}
            className="bg-amber-900 hover:bg-amber-950 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span>Trigger Handoff</span>
            <ArrowRight className="w-3 h-3" />
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-amber-700 hover:text-amber-950 p-1 rounded-md transition-colors"
              title="Dismiss warning"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
