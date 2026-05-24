/**
 * AI Provider Router — Multi-Provider Abstraction Layer
 * 
 * Supports:
 *   • Google Gemini (via @google/genai SDK) — Free tier
 *   • Groq Cloud (OpenAI-compatible API) — Free tier, fast Llama inference
 *   • OpenRouter (OpenAI-compatible API) — Free open models
 * 
 * Usage:
 *   const router = new AIRouter();
 *   const response = await router.complete({
 *     model: 'llama-3.1-8b-instruct',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   });
 */

import { GoogleGenAI } from '@google/genai';

// ─── Types ──────────────────────────────────────────────────────

export interface AICompletionRequest {
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AICompletionResponse {
  content: string;
  model: string;           // Actual model used (might differ from request)
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
  provider: string;        // 'Groq' | 'OpenRouter' | 'Google Gemini'
  latencyMs: number;
}

interface AIProvider {
  readonly name: string;
  isAvailable(): boolean;
  complete(req: AICompletionRequest): Promise<AICompletionResponse>;
}

// ─── Model → Provider Routing Table ────────────────────────────
// Maps internal model IDs to provider + provider-specific model name

interface RouteEntry {
  provider: 'groq' | 'openrouter' | 'gemini';
  modelName: string;
}

export const MODEL_ROUTES: Record<string, RouteEntry> = {
  'llama-3.1-8b-instruct':   { provider: 'groq',       modelName: 'llama-3.1-8b-instant' },
  'llama-3.3-70b-instruct':  { provider: 'groq',       modelName: 'llama-3.3-70b-versatile' },
  'mistral-7b-instruct':     { provider: 'groq',       modelName: 'mixtral-8x7b-32768' },
  'qwen-2.5-72b-instruct':   { provider: 'openrouter', modelName: 'qwen/qwen-2.5-72b-instruct' },
  'deepseek-coder-v2':       { provider: 'openrouter', modelName: 'deepseek/deepseek-coder-v2-instruct' },
  'gemini-3.5-flash':        { provider: 'gemini',     modelName: 'gemini-3.5-flash' },
};

// ─── Provider Implementations ──────────────────────────────────

/**
 * Groq Cloud Provider — OpenAI-compatible, fast Llama inference
 * Free tier: ~30 RPM, 6000 TPM (check current limits at console.groq.com)
 */
class GroqProvider implements AIProvider {
  readonly name = 'Groq';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || '';
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async complete(req: AICompletionRequest): Promise<AICompletionResponse> {
    const route = MODEL_ROUTES[req.model];
    const modelName = route?.modelName || req.model;
    const start = Date.now();

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        messages: req.messages,
        temperature: req.temperature ?? 0.7,
        max_tokens: req.maxTokens ?? 1024,
      }),
    });

    const latencyMs = Date.now() - start;

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API (${response.status}): ${errText.slice(0, 200)}`);
    }

    const data: any = await response.json();

    return {
      content: data.choices?.[0]?.message?.content || '',
      model: data.model || modelName,
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
      },
      provider: 'Groq',
      latencyMs,
    };
  }
}

/**
 * OpenRouter Provider — OpenAI-compatible, many free open models
 * Free: models with $0 price (see openrouter.ai/collections/free-models)
 */
class OpenRouterProvider implements AIProvider {
  readonly name = 'OpenRouter';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async complete(req: AICompletionRequest): Promise<AICompletionResponse> {
    const route = MODEL_ROUTES[req.model];
    const modelName = route?.modelName || req.model;
    const start = Date.now();

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI-Client-Hunter',
      },
      body: JSON.stringify({
        model: modelName,
        messages: req.messages,
        temperature: req.temperature ?? 0.7,
        max_tokens: req.maxTokens ?? 1024,
      }),
    });

    const latencyMs = Date.now() - start;

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter API (${response.status}): ${errText.slice(0, 200)}`);
    }

    const data: any = await response.json();

    return {
      content: data.choices?.[0]?.message?.content || '',
      model: data.model || modelName,
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
      },
      provider: 'OpenRouter',
      latencyMs,
    };
  }
}

/**
 * Google Gemini Provider — uses @google/genai SDK
 * Free tier: available, check limits at aistudio.google.com
 */
class GeminiProvider implements AIProvider {
  readonly name = 'Google Gemini';
  private client: GoogleGenAI | null = null;

  constructor() {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      try {
        this.client = new GoogleGenAI({ apiKey: key });
      } catch {
        this.client = null;
      }
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async complete(req: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.client) {
      throw new Error('Gemini API key not configured');
    }

    const route = MODEL_ROUTES[req.model];
    const modelName = route?.modelName || req.model;
    const start = Date.now();

    // Convert OpenAI-style messages to Gemini prompt format
    const systemPrompt = req.messages.find(m => m.role === 'system')?.content || '';
    const conversationHistory = req.messages
      .filter(m => m.role !== 'system')
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');

    const fullPrompt = systemPrompt
      ? `${systemPrompt}\n\n${conversationHistory}`
      : conversationHistory;

    const response = await this.client.models.generateContent({
      model: modelName,
      contents: fullPrompt,
      config: {
        temperature: req.temperature ?? 0.7,
        maxOutputTokens: req.maxTokens ?? 1024,
      },
    });

    const latencyMs = Date.now() - start;
    const content = response.text || '';
    const tokenEstimate = Math.ceil(content.length / 4); // rough estimate

    return {
      content,
      model: modelName,
      usage: {
        promptTokens: Math.ceil(fullPrompt.length / 4),
        completionTokens: tokenEstimate,
      },
      provider: 'Google Gemini',
      latencyMs,
    };
  }
}

// ─── Router ────────────────────────────────────────────────────

export class AIRouter {
  private providers: Map<string, AIProvider> = new Map();
  private fallbackProvider: AIProvider | null = null;

  // Cumulative usage tracking per provider
  private usageStats: Record<string, { promptTokens: number; completionTokens: number; requests: number; totalLatencyMs: number }> = {
    'Groq': { promptTokens: 0, completionTokens: 0, requests: 0, totalLatencyMs: 0 },
    'OpenRouter': { promptTokens: 0, completionTokens: 0, requests: 0, totalLatencyMs: 0 },
    'Google Gemini': { promptTokens: 0, completionTokens: 0, requests: 0, totalLatencyMs: 0 },
  };

  constructor() {
    // Register available providers
    const gemini = new GeminiProvider();
    const groq = new GroqProvider();
    const openrouter = new OpenRouterProvider();

    if (gemini.isAvailable()) this.providers.set('gemini', gemini);
    if (groq.isAvailable()) this.providers.set('groq', groq);
    if (openrouter.isAvailable()) this.providers.set('openrouter', openrouter);

    // Gemini is the preferred fallback since it's already in the project
    this.fallbackProvider = gemini.isAvailable() ? gemini : null;
  }

  /**
   * Check if any AI provider is configured and available
   */
  hasAnyProvider(): boolean {
    return this.providers.size > 0;
  }

  /**
   * Get a summary of which providers are active
   */
  getStatus(): { provider: string; available: boolean }[] {
    return [
      { provider: 'Google Gemini', available: this.providers.has('gemini') },
      { provider: 'Groq Cloud',    available: this.providers.has('groq') },
      { provider: 'OpenRouter',    available: this.providers.has('openrouter') },
    ];
  }

  /**
   * Route a completion request to the correct provider based on model ID
   */
  async complete(req: AICompletionRequest): Promise<AICompletionResponse> {
    const route = MODEL_ROUTES[req.model];

    if (!route) {
      throw new Error(`Unknown model "${req.model}". Available: ${Object.keys(MODEL_ROUTES).join(', ')}`);
    }

    const provider = this.providers.get(route.provider);
    if (!provider) {
      // Provider not configured — try any available provider
      if (this.providers.size > 0) {
        const fallbackProvider = this.providers.values().next().value;
        console.warn(`[AI Router] ${route.provider} not configured, falling back to ${fallbackProvider.name}`);
        const result = await fallbackProvider.complete(req);
        this.recordUsage(result);
        return result;
      }
      throw new Error(
        `No AI provider available for "${req.model}". Set one of: GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY in .env`
      );
    }

    const result = await provider.complete(req);
    this.recordUsage(result);
    return result;
  }

  /**
   * Track usage for a completed request
   */
  private recordUsage(response: AICompletionResponse): void {
    const stats = this.usageStats[response.provider];
    if (stats) {
      stats.promptTokens += response.usage.promptTokens;
      stats.completionTokens += response.usage.completionTokens;
      stats.requests += 1;
      stats.totalLatencyMs += response.latencyMs;
    }
  }

  /**
   * Get cumulative token usage across all providers
   */
  getUsageStats(): { provider: string; promptTokens: number; completionTokens: number; requests: number; avgLatencyMs: number }[] {
    return Object.entries(this.usageStats).map(([provider, stats]) => ({
      provider,
      promptTokens: stats.promptTokens,
      completionTokens: stats.completionTokens,
      requests: stats.requests,
      avgLatencyMs: stats.requests > 0 ? Math.round(stats.totalLatencyMs / stats.requests) : 0,
    }));
  }

  /**
   * Get the route entry for a specific model ID
   */
  getModelRoute(modelId: string): { provider: string; modelName: string } | null {
    return MODEL_ROUTES[modelId] || null;
  }

  /**
   * Test a specific model — sends a tiny ping to verify the provider responds
   */
  async testModel(modelId: string): Promise<{ model: string; provider: string; available: boolean; latencyMs?: number; error?: string }> {
    const route = MODEL_ROUTES[modelId];
    if (!route) {
      return { model: modelId, provider: 'unknown', available: false, error: 'Unknown model ID' };
    }

    const providerMap: Record<string, string> = { 'groq': 'Groq', 'openrouter': 'OpenRouter', 'gemini': 'Google Gemini' };
    const providerName = providerMap[route.provider] || route.provider;

    const status = this.getStatus();
    const statusEntry = status.find(s => s.provider.toLowerCase().includes(route.provider));
    if (!statusEntry?.available) {
      return { model: modelId, provider: providerName, available: false, error: 'API key not configured' };
    }

    try {
      const start = Date.now();
      const resp = await this.complete({
        messages: [{ role: 'user', content: 'Reply with only the word OK.' }],
        model: modelId,
        temperature: 0.1,
        maxTokens: 10,
      });
      return {
        model: modelId,
        provider: resp.provider,
        available: true,
        latencyMs: resp.latencyMs,
      };
    } catch (err: any) {
      return {
        model: modelId,
        provider: providerName,
        available: false,
        error: err.message?.slice(0, 150) || String(err),
      };
    }
  }

  /**
   * Get the list of models that can actually be used right now
   */
  getAvailableModels(): { modelId: string; provider: string }[] {
    return Object.entries(MODEL_ROUTES)
      .filter(([_, route]) => this.providers.has(route.provider))
      .map(([modelId, route]) => ({
        modelId,
        provider: route.provider,
      }));
  }
}
