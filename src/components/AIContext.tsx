import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { AgentTrace, AIAgentName, AIMessage, AIModelRoute, DEFAULT_MODEL_ROUTES, MODEL_OPTIONS } from '../types';

interface ProviderHealthEntry {
  provider: string;
  available: boolean;
  latencyMs?: number;
  error?: string;
  model?: string;
}

interface ProviderUsageEntry {
  provider: string;
  promptTokens: number;
  completionTokens: number;
  requests: number;
  avgLatencyMs: number;
}

interface AIContextValue {
  // Agent traces
  traces: AgentTrace[];
  addTrace: (agent: AIAgentName, task: string, model: string, inputTokens: number, outputTokens: number, latencyMs: number, costUsd: number, result: 'success' | 'failure', leadName?: string) => void;
  clearTraces: () => void;

  // Model routing
  modelRoutes: AIModelRoute[];
  updateModelRoute: (task: string, model: string) => void;

  // Companion messages
  messages: AIMessage[];
  addMessage: (msg: AIMessage) => void;
  clearMessages: () => void;

  // Processing state — counter-based to support concurrent tasks
  isProcessing: boolean;
  startTask: (task: string) => void;
  endTask: () => void;
  currentTask: string;

  // Metrics aggregates
  totalCost: number;
  avgLatency: number;
  successRate: number;
  totalTraces: number;

  // Provider health & usage
  providerHealth: ProviderHealthEntry[];
  checkProviderHealth: () => Promise<void>;
  providerUsage: ProviderUsageEntry[];
  fetchProviderUsage: () => Promise<void>;
}

const AIContext = createContext<AIContextValue | null>(null);

const THOUGHT_STEPS = [
  "Ingesting data stream buffer...",
  "Routing via LLM Router node...",
  "Retrieving context indices...",
  "Analyzing lead profile vectors...",
  "Constructing response embedding...",
  "Synthesizing final output...",
];

export function AIProvider({ children }: { children: React.ReactNode }) {
  const [traces, setTraces] = useState<AgentTrace[]>([]);
  const [modelRoutes, setModelRoutes] = useState<AIModelRoute[]>(DEFAULT_MODEL_ROUTES);
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      sender: 'ai',
      text: "👋 Hey, I'm your Client Hunter AI companion. I can help analyze leads, craft outreach pitches, suggest web design proposals, or answer questions about your pipeline. What are we hunting today?",
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      model: 'llama-3.1-8b-instruct',
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTask, setCurrentTask] = useState('');
  const taskCountRef = useRef(0);

  // Provider health & usage tracking
  const [providerHealth, setProviderHealth] = useState<ProviderHealthEntry[]>([]);
  const [providerUsage, setProviderUsage] = useState<ProviderUsageEntry[]>([]);

  const checkProviderHealth = useCallback(async () => {
    try {
      addTrace('LLM Router', 'health_check:all_providers', 'n/a', 5, 2, 0, 0, 'success');
      const resp = await fetch('/api/ai/test', { method: 'POST' });
      if (resp.ok) {
        const data = await resp.json();
        setProviderHealth(data.results || []);
      }
    } catch (err) {
      console.warn('[AI] Provider health check failed:', err);
    }
  }, [addTrace]);

  const fetchProviderUsage = useCallback(async () => {
    try {
      const resp = await fetch('/api/ai/usage');
      if (resp.ok) {
        const data = await resp.json();
        setProviderUsage(data.usage || []);
      }
    } catch (err) {
      console.warn('[AI] Provider usage fetch failed:', err);
    }
  }, []);

  const startTask = useCallback((task: string) => {
    taskCountRef.current++;
    setCurrentTask(task);
    setIsProcessing(true);
  }, []);

  const endTask = useCallback(() => {
    taskCountRef.current = Math.max(0, taskCountRef.current - 1);
    if (taskCountRef.current === 0) {
      setIsProcessing(false);
      setCurrentTask('');
    }
  }, []);

  const addTrace = useCallback((
    agent: AIAgentName, task: string, model: string,
    inputTokens: number, outputTokens: number, latencyMs: number,
    costUsd: number, result: 'success' | 'failure', leadName?: string
  ) => {
    const trace: AgentTrace = {
      id: `tr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      agent, task, model,
      inputTokens, outputTokens, latencyMs, costUsd, result,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      leadName,
    };
    setTraces(prev => [trace, ...prev].slice(0, 100)); // keep last 100
  }, []);

  const clearTraces = useCallback(() => setTraces([]), []);

  const updateModelRoute = useCallback((task: string, model: string) => {
    setModelRoutes(prev =>
      prev.map(r => r.task === task ? { ...r, model, provider: MODEL_OPTIONS.find(m => m.id === model)?.provider || 'Unknown' } : r)
    );
  }, []);

  const addMessage = useCallback((msg: AIMessage) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([
      {
        sender: 'ai',
        text: "👋 Hey, I'm your Client Hunter AI companion. I can help analyze leads, craft outreach pitches, suggest web design proposals, or answer questions about your pipeline. What are we hunting today?",
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        model: 'llama-3.1-8b-instruct',
      }
    ]);
  }, []);

  // Compute aggregates
  const totalCost = traces.reduce((a, t) => a + t.costUsd, 0);
  const avgLatency = traces.length > 0
    ? Math.round(traces.reduce((a, t) => a + t.latencyMs, 0) / traces.length)
    : 0;
  const successCount = traces.filter(t => t.result === 'success').length;
  const successRate = traces.length > 0 ? Math.round((successCount / traces.length) * 100) : 100;
  const totalTraces = traces.length;

  return (
    <AIContext.Provider value={{
      traces, addTrace, clearTraces,
      modelRoutes, updateModelRoute,
      messages, addMessage, clearMessages,
      isProcessing, startTask, endTask, currentTask,
      totalCost, avgLatency, successRate, totalTraces,
      providerHealth, checkProviderHealth,
      providerUsage, fetchProviderUsage,
    }}>
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const ctx = useContext(AIContext);
  if (!ctx) throw new Error('useAI must be used within AIProvider');
  return ctx;
}

// Fallback simulated responses (used when the backend AI provider is unavailable)
const AI_RESPONSES: Record<string, string> = {
  lead: "Looking at this lead's profile, I'd recommend a **hybrid approach**: build a mobile-optimized landing page first (quick win), then layer in an AI-powered WhatsApp booking bot. Based on their digital presence score, they're losing roughly 60% of potential conversions due to lack of online discoverability.",
  pitch: "For the outreach strategy, I'd lead with a **value-first cold email** referencing their Google reviews, follow up on LinkedIn with a mockup screenshot, and close with a WhatsApp message that includes a Calendly link. The analytics show this sequence has the highest conversion rate for local service businesses.",
  proposal: "A strong proposal should highlight: (1) an interactive service catalog with pricing, (2) a direct booking calendar integration, (3) an automated review request pipeline post-service, and (4) WhatsApp notification sync. I'd price this as a package at GH₵ 8,000-12,000 depending on scope.",
  search: "For lead discovery, I recommend targeting niches where digital presence is lowest: dental clinics, local restaurants, and logistics companies. My analysis shows these verticals have the highest conversion rates for web design proposals in Accra and Lagos markets.",
  analytics: "Your pipeline shows a healthy conversion rate. The biggest lever right now is **reactivating stale leads** in 'contacted' status. I suggest running a re-engagement campaign using a personalized follow-up sequence — DM me and I'll draft one for your top 5 leads.",
  default: "Great question! Here's my analysis based on the current pipeline data: Focus on leads without websites first — they have the highest conversion potential. I recommend prioritizing the leads with digital presence scores under 40, as they have the most urgent need for your services.",
};

const MODEL_MAP: Record<string, string> = {
  lead: 'gemini-3.5-flash',
  pitch: 'llama-3.3-70b-instruct',
  proposal: 'qwen-2.5-72b-instruct',
  search: 'gemini-3.5-flash',
  analytics: 'llama-3.1-8b-instruct',
  default: 'llama-3.1-8b-instruct',
};

// Default model for the companion chat
const DEFAULT_CHAT_MODEL = 'llama-3.1-8b-instruct';

/**
 * Generate an AI response by calling the backend multi-provider router.
 * Falls back to local simulated responses if the backend is unreachable
 * or if no AI API keys are configured.
 */
export async function generateAIResponse(
  userMessage: string,
  addTrace: AIContextValue['addTrace'],
  modelOverride?: string,
  contextMessages?: { role: 'user' | 'assistant'; content: string }[]
): Promise<{ text: string; model: string; latencyMs: number; provider?: string; inputTokens?: number; outputTokens?: number }> {
  const startTime = performance.now();
  const model = modelOverride || DEFAULT_CHAT_MODEL;

  try {
    // Build messages array with conversation history for context
    const messages = [
      { role: 'system' as const, content: 'You are a sales intelligence AI assistant for the Client Hunter CRM platform. You help analyze leads, craft outreach pitches, propose web design solutions, and provide pipeline analytics. Be concise, practical, and action-oriented. Use markdown for emphasis when helpful.' },
      ...(contextMessages || []),
      { role: 'user' as const, content: userMessage },
    ];

    // Try the real backend AI router first
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, model, temperature: 0.7, maxTokens: 1024 }),
    });

    if (response.ok) {
      const data = await response.json();
      const latencyMs = Math.round(performance.now() - startTime);

      addTrace(
        'Companion',
        `chat_reply:${model}`,
        data.model || model,
        data.usage?.promptTokens ?? Math.ceil(userMessage.length / 4),
        data.usage?.completionTokens ?? Math.ceil((data.content || '').length / 4),
        latencyMs,
        0,
        'success'
      );

      return {
        text: data.content,
        model: data.model || model,
        latencyMs,
        provider: data.provider,
        inputTokens: data.usage?.promptTokens,
        outputTokens: data.usage?.completionTokens,
      };
    }

    // Backend responded with an error (no API keys configured)
    console.warn('[AI Companion] Backend AI chat error, falling back to local simulation:', await response.text().catch(() => 'unknown'));
  } catch (err) {
    console.warn('[AI Companion] Backend unreachable, falling back to local simulation:', err);
  }

  // ─── Local fallback simulation ───
  const msgLower = userMessage.toLowerCase();
  let category: string = 'default';
  if (msgLower.includes('lead') || msgLower.includes('analyze') || msgLower.includes('score')) category = 'lead';
  else if (msgLower.includes('pitch') || msgLower.includes('email') || msgLower.includes('outreach')) category = 'pitch';
  else if (msgLower.includes('proposal') || msgLower.includes('website') || msgLower.includes('design')) category = 'proposal';
  else if (msgLower.includes('search') || msgLower.includes('find') || msgLower.includes('discover')) category = 'search';
  else if (msgLower.includes('analytics') || msgLower.includes('pipeline') || msgLower.includes('stats')) category = 'analytics';

  const simModel = MODEL_MAP[category] || MODEL_MAP.default;
  const latencyMs = Math.floor(Math.random() * 400) + 200;
  const text = AI_RESPONSES[category] || AI_RESPONSES.default;

  // Simulate delay
  await new Promise(r => setTimeout(r, 800 + Math.random() * 400));

  addTrace(
    'Companion',
    `simulated_chat_reply:${category}`,
    simModel,
    Math.floor(userMessage.length / 4) + 80,
    Math.floor(text.length / 4),
    latencyMs + Math.floor(Math.random() * 100),
    0,
    'success'
  );

  return { text, model: simModel, latencyMs, provider: 'Fallback (Simulated)' };
}

export { THOUGHT_STEPS };
