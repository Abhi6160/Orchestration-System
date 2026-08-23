import React from 'react';
import { 
  GitFork, 
  Rocket, 
  ShieldCheck, 
  Database, 
  ArrowRight 
} from 'lucide-react';
import type { ProviderId } from '../types';
import { PROVIDER_ORDER, getProviderMeta } from '../lib/providerMeta';

interface EmptyStateProps {
  currentProvider: ProviderId;
  onSelectPrompt: (prompt: string, projectTag: string) => void;
  onChangeProvider: (provider: ProviderId) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  currentProvider,
  onSelectPrompt,
  onChangeProvider
}) => {
  const starters = [
    {
      title: 'Planning a product launch',
      project: 'Apollo',
      icon: Rocket,
      prompt: "We need to finalize the launch checklist for Project Apollo. The target date is Nov 15th. We're launching the new dashboard feature and the updated API endpoints simultaneously. Can you outline a high-level timeline starting from T-4 weeks?",
      desc: 'Multi-week timeline, milestone checklists, and phase breakdown.'
    },
    {
      title: 'API Security & Audit Review',
      project: 'Security',
      icon: ShieldCheck,
      prompt: "Perform a comprehensive security audit on our v2 API endpoints. Focus specifically on auth token refresh rotation, bulk analytics data export, and webhook HMAC signature validation.",
      desc: 'Critical vulnerability vectors, pen-testing strategy, and middleware code.'
    },
    {
      title: 'Database Schema & State Sync',
      project: 'Backend',
      icon: Database,
      prompt: "Design the SQLite schema and provider adapter architecture for a context-aware LLM switching engine with token tracking.",
      desc: 'Conversations, messages, and structured handoff schemas.'
    }
  ];

  return (
    <div className="w-full max-w-[800px] py-8 flex flex-col items-center text-center animate-in fade-in duration-300">
      {/* Brand Icon */}
      <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center mb-4 shadow-sm">
        <GitFork className="w-6 h-6 rotate-90" />
      </div>

      <h2 className="text-xl font-bold text-primary tracking-tight mb-1">
        ContextBridge AI Workspace
      </h2>
      <p className="text-xs text-on-surface-variant max-w-md mb-6 leading-relaxed">
        Seamlessly switch between AI models without losing conversation context. ContextBridge synthesizes and compresses your workspace state across model boundaries.
      </p>

      {/* Provider Selector Switcher */}
      <div className="flex items-center flex-wrap justify-center gap-2 p-1 bg-surface-container rounded-xl border border-outline-variant/60 mb-8 shadow-2xs">
        {PROVIDER_ORDER.map((providerId) => {
          const meta = getProviderMeta(providerId);
          const Icon = meta.icon;
          const isActive = currentProvider === providerId;
          return (
            <button
              key={providerId}
              onClick={() => onChangeProvider(providerId)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? `bg-surface-container-lowest ${meta.badgeText} shadow-xs border ${meta.badgeBorder}`
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{meta.displayName}</span>
              <span className="text-[10px] opacity-75 font-mono">{meta.shortContext}</span>
            </button>
          );
        })}
      </div>

      {/* Starter Prompt Cards */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
        {starters.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectPrompt(item.prompt, item.project)}
              className="bg-surface-container-lowest hover:bg-surface-container-low border border-outline-variant hover:border-primary/40 rounded-xl p-3.5 transition-all flex flex-col justify-between group text-left cursor-pointer shadow-2xs hover:shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="w-7 h-7 rounded-lg bg-surface-container text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant/80 font-mono">
                    {item.project}
                  </span>
                </div>
                <h4 className="font-semibold text-xs text-primary mb-1 group-hover:text-primary transition-colors">
                  {item.title}
                </h4>
                <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-outline-variant/40 flex items-center justify-between text-[10px] text-on-surface-variant font-medium group-hover:text-primary">
                <span>Start conversation</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
