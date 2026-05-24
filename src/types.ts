/**
 * AI Client Hunter Types & Interfaces
 */

export interface BusinessAnalysis {
  summary: string;
  digitalPresenceSummary: string;
  presenceStrength: 'low' | 'medium' | 'high';
  operationalPainPoints: string[];
  systemsNeeded: string[];
  aiOpportunities: string[];
  digitalMaturityScore: number;
}

export interface WebDesignStructureSection {
  sectionName: string;
  purpose: string;
  contentHint: string;
}

export interface WebDesignProposal {
  needDetectedReason: string;
  suggestedType: string;
  structure: WebDesignStructureSection[];
  heroHeadline: string;
  heroSubheadline: string;
  selectedCta: string;
  estimatedValue: string;
  readyToSellOffer: string;
}

export interface OutreachPitch {
  email: string;
  linkedin: string;
  whatsapp: string;
}

export interface Lead {
  id: string;
  name: string;
  category: string;
  phone: string | null;
  address: string;
  rating: number | null;
  reviewsCount: number | null;
  website: string | null;
  mapsUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  status: 'new' | 'contacted' | 'replied' | 'interested' | 'closed';
  notes: string;
  tags: string[];
  serviceType: 'ai_automation' | 'web_design' | 'hybrid';
  digitalPresenceScore: number;
  createdAt: string;
  aiAnalysis?: BusinessAnalysis | null;
  webDesignProposal?: WebDesignProposal | null;
  outreachPitch?: OutreachPitch | null;
}

export interface DashboardStats {
  totalLeads: number;
  noWebsite: number;
  contactedLeads: number;
  repliesReceived: number;
  meetingsBooked: number;
  conversionRate: number;
  estimatedPipelineRevenue: number;
}

export interface SearchQueryConfig {
  query: string;
  location?: string;
  industry?: string;
  hasNoWebsiteOnly?: boolean;
}

// ============================================================
// AI Integration Types (Agent Mesh / Trace System)
// ============================================================

export type AIAgentName = 'Discovery' | 'Analyzer' | 'ProposalWriter' | 'PitchCraft' | 'Companion' | 'LLM Router' | 'Memory' | 'CRM Optimizer';

export interface AgentTrace {
  id: string;
  agent: AIAgentName;
  task: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  costUsd: number;
  result: 'success' | 'failure';
  timestamp: string;
  leadName?: string;
}

export interface AIMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  model?: string;
  latencyMs?: number;
  costUsd?: number;
}

export interface AIModelRoute {
  task: string;
  model: string;
  provider: string;
}

export const DEFAULT_MODEL_ROUTES: AIModelRoute[] = [
  { task: 'conversation_chat', model: 'llama-3.1-8b-instruct', provider: 'Groq (Free Tier)' },
  { task: 'analyze_lead', model: 'gemini-3.5-flash', provider: 'Google Gemini (Free Tier)' },
  { task: 'search_leads', model: 'gemini-3.5-flash', provider: 'Google Gemini (Free Tier)' },
  { task: 'generate_proposal', model: 'gemini-3.5-flash', provider: 'Google Gemini (Free Tier)' },
  { task: 'generate_pitch', model: 'gemini-3.5-flash', provider: 'Google Gemini (Free Tier)' },
  { task: 'summarize_lead', model: 'llama-3.1-8b-instruct', provider: 'Groq (Free Tier)' },
];

export const MODEL_OPTIONS = [
  { id: 'llama-3.1-8b-instruct',  name: 'LLaMA 3.1 8B',        provider: 'Groq (Free Tier)',            tier: 'Fast',         apiProvider: 'groq' },
  { id: 'llama-3.3-70b-instruct', name: 'LLaMA 3.3 70B',       provider: 'Groq (Free Tier)',            tier: 'Deep Reasoning', apiProvider: 'groq' },
  { id: 'mistral-7b-instruct',    name: 'Mistral 7B',           provider: 'Groq (Free Tier)',            tier: 'Fast',         apiProvider: 'groq' },
  { id: 'qwen-2.5-72b-instruct',  name: 'Qwen 2.5 72B',        provider: 'OpenRouter (Free Models)',     tier: 'Deep Reasoning', apiProvider: 'openrouter' },
  { id: 'deepseek-coder-v2',      name: 'DeepSeek Coder v2',    provider: 'OpenRouter (Free Models)',     tier: 'Medium',       apiProvider: 'openrouter' },
  { id: 'gemini-3.5-flash',       name: 'Gemini 3.5 Flash',    provider: 'Google Gemini (Free Tier)',    tier: 'Fast',         apiProvider: 'gemini' },
];

// Provider badge color map for the UI
export const PROVIDER_COLORS: Record<string, string> = {
  'Groq': 'bg-purple-100 text-purple-700 border-purple-200',
  'Google Gemini': 'bg-blue-100 text-blue-700 border-blue-200',
  'OpenRouter': 'bg-emerald-100 text-emerald-700 border-emerald-200',
};
