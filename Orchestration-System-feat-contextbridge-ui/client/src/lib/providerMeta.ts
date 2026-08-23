import { BrainCircuit, Sparkles, Atom, Flame, Wind, Zap, Telescope, Link2, type LucideIcon } from 'lucide-react';
import type { ProviderId } from '../types';

export interface ProviderMeta {
  id: ProviderId;
  displayName: string;
  shortContext: string; // e.g. '200k', '2M'
  contextWindow: number;
  icon: LucideIcon;
  accent: string; // hex, matches server adapter.accentColor
  // Tailwind class groups so components don't need per-provider if/else chains
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  iconBg: string;
  iconText: string;
  dot: string;
  barColor: string; // solid bg class used for progress bars
  ring: string; // focus-within border+ring classes for the composer input
  sendBg: string; // send-button background classes
}

// Single source of truth for how each provider looks in the UI.
// Adding a new provider on the backend? Add its metadata here and every
// component (TopAppBar, EmptyState, MessageBubble, Composer, HandoffModal...)
// picks it up automatically.
export const PROVIDER_META: Record<ProviderId, ProviderMeta> = {
  claude: {
    id: 'claude',
    displayName: 'Claude 3.5 Sonnet',
    shortContext: '200k',
    contextWindow: 200000,
    icon: BrainCircuit,
    accent: '#f97316',
    badgeBg: 'bg-secondary-fixed/20',
    badgeBorder: 'border-secondary-fixed-dim/40',
    badgeText: 'text-secondary',
    iconBg: 'bg-secondary-container',
    iconText: 'text-on-secondary-container',
    dot: 'bg-secondary',
    barColor: 'bg-secondary/80',
    ring: 'focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20',
    sendBg: 'bg-primary hover:bg-neutral-800 text-on-primary'
  },
  gemini: {
    id: 'gemini',
    displayName: 'Gemini 1.5 Pro',
    shortContext: '2M',
    contextWindow: 2000000,
    icon: Sparkles,
    accent: '#3b82f6',
    badgeBg: 'bg-blue-50/80',
    badgeBorder: 'border-blue-200/80',
    badgeText: 'text-blue-700',
    iconBg: 'bg-blue-600',
    iconText: 'text-white',
    dot: 'bg-gemini-blue',
    barColor: 'bg-blue-600',
    ring: 'focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20',
    sendBg: 'bg-blue-600 hover:bg-blue-700 text-white'
  },
  openai: {
    id: 'openai',
    displayName: 'GPT-4o',
    shortContext: '128k',
    contextWindow: 128000,
    icon: Atom,
    accent: '#10a37f',
    badgeBg: 'bg-emerald-50/80',
    badgeBorder: 'border-emerald-200/80',
    badgeText: 'text-emerald-700',
    iconBg: 'bg-emerald-600',
    iconText: 'text-white',
    dot: 'bg-emerald-600',
    barColor: 'bg-emerald-600',
    ring: 'focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20',
    sendBg: 'bg-emerald-600 hover:bg-emerald-700 text-white'
  },
  llama: {
    id: 'llama',
    displayName: 'Llama 3.1 405B',
    shortContext: '128k',
    contextWindow: 131072,
    icon: Flame,
    accent: '#7c3aed',
    badgeBg: 'bg-violet-50/80',
    badgeBorder: 'border-violet-200/80',
    badgeText: 'text-violet-700',
    iconBg: 'bg-violet-600',
    iconText: 'text-white',
    dot: 'bg-violet-600',
    barColor: 'bg-violet-600',
    ring: 'focus-within:border-violet-600 focus-within:ring-2 focus-within:ring-violet-600/20',
    sendBg: 'bg-violet-600 hover:bg-violet-700 text-white'
  },
  mistral: {
    id: 'mistral',
    displayName: 'Mistral Large',
    shortContext: '128k',
    contextWindow: 128000,
    icon: Wind,
    accent: '#fa5b0f',
    badgeBg: 'bg-amber-50/80',
    badgeBorder: 'border-amber-200/80',
    badgeText: 'text-amber-700',
    iconBg: 'bg-amber-600',
    iconText: 'text-white',
    dot: 'bg-amber-600',
    barColor: 'bg-amber-600',
    ring: 'focus-within:border-amber-600 focus-within:ring-2 focus-within:ring-amber-600/20',
    sendBg: 'bg-amber-600 hover:bg-amber-700 text-white'
  },
  grok: {
    id: 'grok',
    displayName: 'Grok 2',
    shortContext: '128k',
    contextWindow: 131072,
    icon: Zap,
    accent: '#18181b',
    badgeBg: 'bg-zinc-100/80',
    badgeBorder: 'border-zinc-300/80',
    badgeText: 'text-zinc-800',
    iconBg: 'bg-zinc-800',
    iconText: 'text-white',
    dot: 'bg-zinc-800',
    barColor: 'bg-zinc-800',
    ring: 'focus-within:border-zinc-800 focus-within:ring-2 focus-within:ring-zinc-800/20',
    sendBg: 'bg-zinc-800 hover:bg-zinc-900 text-white'
  },
  deepseek: {
    id: 'deepseek',
    displayName: 'DeepSeek V3',
    shortContext: '64k',
    contextWindow: 64000,
    icon: Telescope,
    accent: '#4d6bfe',
    badgeBg: 'bg-indigo-50/80',
    badgeBorder: 'border-indigo-200/80',
    badgeText: 'text-indigo-700',
    iconBg: 'bg-indigo-600',
    iconText: 'text-white',
    dot: 'bg-indigo-600',
    barColor: 'bg-indigo-600',
    ring: 'focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600/20',
    sendBg: 'bg-indigo-600 hover:bg-indigo-700 text-white'
  },
  cohere: {
    id: 'cohere',
    displayName: 'Command R+',
    shortContext: '128k',
    contextWindow: 128000,
    icon: Link2,
    accent: '#39594d',
    badgeBg: 'bg-teal-50/80',
    badgeBorder: 'border-teal-200/80',
    badgeText: 'text-teal-800',
    iconBg: 'bg-teal-700',
    iconText: 'text-white',
    dot: 'bg-teal-700',
    barColor: 'bg-teal-700',
    ring: 'focus-within:border-teal-700 focus-within:ring-2 focus-within:ring-teal-700/20',
    sendBg: 'bg-teal-700 hover:bg-teal-800 text-white'
  }
};

export const PROVIDER_ORDER: ProviderId[] = ['claude', 'gemini', 'openai', 'llama', 'mistral', 'grok', 'deepseek', 'cohere'];

export function getProviderMeta(id: ProviderId | string | undefined): ProviderMeta {
  return PROVIDER_META[id as ProviderId] || PROVIDER_META.claude;
}
