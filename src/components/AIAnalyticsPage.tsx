import { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAI } from './AIContext';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  Brain, Cpu, Zap, BarChart3, Activity,
  RefreshCw, Layers, Database, Wifi,
  Sparkles, Radio
} from 'lucide-react';

// ─── Animation Variants ─────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', damping: 22, stiffness: 200, mass: 0.6 },
  },
};

const chartCardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1, y: 0,
    transition: { type: 'spring', damping: 20, stiffness: 180, mass: 0.7 },
  },
};

const tableRowVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.03, type: 'spring', damping: 25, stiffness: 250 },
  }),
};

// ─── Animated Counter ────────────────────────────────────────────

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);
  const frameRef = useRef<number>();

  useEffect(() => {
    const start = prevRef.current;
    const diff = value - start;
    if (diff === 0) { setDisplay(value); return; }
    const duration = Math.min(600, Math.abs(diff) * 2);
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
      else prevRef.current = value;
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [value]);

  return <>{display.toLocaleString()}{suffix}</>;
}

// ─── Provider Helpers ────────────────────────────────────────────

const PROVIDER_PALETTE: Record<string, { stroke: string; fill: string }> = {
  'Groq':         { stroke: '#7c3aed', fill: '#7c3aed' },
  'Google Gemini': { stroke: '#2563eb', fill: '#2563eb' },
  'OpenRouter':   { stroke: '#059669', fill: '#059669' },
};
const PROVIDER_ORDER = ['Groq', 'Google Gemini', 'OpenRouter'];

/** Map a model ID (or backend-returned model name) to a canonical provider name */
function getProviderFromModel(model: string): string {
  if (model.includes('gemini')) return 'Google Gemini';
  if (model.includes('qwen') || model.includes('deepseek')) return 'OpenRouter';
  return 'Groq';
}

export default function AIAnalyticsPage() {
  const { traces, providerUsage, fetchProviderUsage, providerHealth, checkProviderHealth } = useAI();
  const [loading, setLoading] = useState(true);
  const [prevTraceCount, setPrevTraceCount] = useState(0);
  const [newDataPulse, setNewDataPulse] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const liveDotRef = useRef<HTMLSpanElement>(null);

  // Initial data load
  useEffect(() => {
    Promise.all([fetchProviderUsage(), checkProviderHealth()]).finally(() => setLoading(false));
  }, [fetchProviderUsage, checkProviderHealth]);

  // Live polling — refresh provider usage & health every 5 seconds
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      fetchProviderUsage();
      checkProviderHealth();
    }, 5000);
    return () => clearInterval(interval);
  }, [isLive, fetchProviderUsage, checkProviderHealth]);

  // Detect new traces and pulse the dashboard
  useEffect(() => {
    if (traces.length > prevTraceCount && prevTraceCount > 0) {
      setNewDataPulse(true);
      // Flash the live dot
      if (liveDotRef.current) {
        liveDotRef.current.classList.remove('animate-ping');
        void liveDotRef.current.offsetWidth; // force reflow
        liveDotRef.current.classList.add('animate-ping');
      }
      const timeout = setTimeout(() => setNewDataPulse(false), 600);
      return () => clearTimeout(timeout);
    }
    setPrevTraceCount(traces.length);
  }, [traces.length, prevTraceCount]);

  // ─── Derived Data ──────────────────────────────────────────────

  // 1. Token time-series: group traces into buckets by sequence
  const tokenTimeData = useMemo(() => {
    if (traces.length === 0) return [];
    const sorted = [...traces].reverse(); // oldest first
    let cumPrompt = 0, cumCompletion = 0;
    return sorted.map((t, i) => {
      cumPrompt += t.inputTokens || 0;
      cumCompletion += t.outputTokens || 0;
      return {
        step: `#${i + 1}`,
        prompt: cumPrompt,
        completion: cumCompletion,
        total: cumPrompt + cumCompletion,
        agent: t.agent,
      };
    });
  }, [traces]);

  // 2. Per-provider request counts
  const requestCountData = useMemo(() => {
    const counts: Record<string, number> = {};
    traces.forEach(t => {
      const p = getProviderFromModel(t.model);
      counts[p] = (counts[p] || 0) + 1;
    });
    return PROVIDER_ORDER.filter(p => (counts[p] || 0) > 0).map(p => ({
      name: p,
      requests: counts[p] || 0,
      fill: PROVIDER_PALETTE[p]?.stroke || '#6b7280',
    }));
  }, [traces]);

  // 3. Per-provider token distribution
  const tokenDistData = useMemo(() => {
    const totalTokens = providerUsage.filter(u => u.requests > 0).map(u => ({
      name: u.provider,
      value: u.promptTokens + u.completionTokens,
      fill: PROVIDER_PALETTE[u.provider]?.stroke || '#6b7280',
    }));
    return totalTokens;
  }, [providerUsage]);

  // 4. Latency time-series per provider
  const latencyTimeData = useMemo(() => {
    if (traces.length === 0) return [];
    const sorted = [...traces].reverse();
    const series: Record<string, { step: string; latency: number }[]> = {};
    sorted.forEach((t, i) => {
      const p = getProviderFromModel(t.model);
      if (!series[p]) series[p] = [];
      series[p].push({ step: `#${i + 1}`, latency: t.latencyMs });
    });
    // Merge into single array of objects
    const steps = sorted.map((_, i) => {
      const entry: any = { step: `#${i + 1}` };
      Object.entries(series).forEach(([provider, pts]) => {
        if (pts[i]) entry[provider] = pts[i].latency;
      });
      return entry;
    });
    return steps;
  }, [traces]);

  // 5. Provider overview cards data
  const providerCards = useMemo(() => {
    return PROVIDER_ORDER.map(p => {
      const usage = providerUsage.find(u => u.provider === p);
      const health = providerHealth.find(h =>
        h.provider?.toLowerCase().includes(p.toLowerCase()) ||
        h.model?.toLowerCase().includes(p.toLowerCase().split(' ')[0])
      );
      return {
        name: p,
        color: PROVIDER_PALETTE[p]?.stroke || '#6b7280',
        requests: usage?.requests || 0,
        tokens: (usage?.promptTokens || 0) + (usage?.completionTokens || 0),
        avgLatency: usage?.avgLatencyMs || 0,
        available: health?.available ?? false,
        latencyTest: health?.latencyMs,
      };
    });
  }, [providerUsage, providerHealth]);

  // 6. Aggregate stats
  const aggregateStats = useMemo(() => {
    const totalTokens = providerUsage.reduce((a, u) => a + u.promptTokens + u.completionTokens, 0);
    const totalRequests = providerUsage.reduce((a, u) => a + u.requests, 0);
    const avgLat = traces.length > 0
      ? Math.round(traces.reduce((a, t) => a + t.latencyMs, 0) / traces.length)
      : 0;
    const success = traces.filter(t => t.result === 'success').length;
    const rate = traces.length > 0 ? Math.round((success / traces.length) * 100) : 100;
    return { totalTokens, totalRequests, avgLat, successRate: rate };
  }, [providerUsage, traces]);

  // ─── Empty State ───────────────────────────────────────────────

  const showEmpty = !loading && traces.length === 0 && providerUsage.every(u => u.requests === 0);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-24 bg-[#0C0C0E]/40 rounded-xl border border-zinc-800 overflow-hidden relative"
      >
        {/* Shimmer background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-800/20 to-transparent -skew-x-12"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.15, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Sparkles className="h-8 w-8 text-blue-500 mb-3" />
        </motion.div>
        <span className="text-xs text-zinc-500 relative">Loading AI usage analytics...</span>
        <div className="flex gap-1.5 mt-3 relative">
          <motion.span
            className="w-1.5 h-1.5 bg-blue-500 rounded-full"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
          />
          <motion.span
            className="w-1.5 h-1.5 bg-indigo-500 rounded-full"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
          />
          <motion.span
            className="w-1.5 h-1.5 bg-purple-500 rounded-full"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
          />
        </div>
      </motion.div>
    );
  }

  // ─── Tooltip Shared Style ──────────────────────────────────────

  const tooltipStyle = {
    contentStyle: { backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: '11px' },
    itemStyle: { color: '#e4e4e7', fontSize: '11px' },
    labelStyle: { color: '#71717a', fontSize: '10px' },
  };

  return (
    <AnimatePresence mode="wait">
      {showEmpty ? (
        <motion.div
          key="empty"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center py-24 bg-[#0C0C0E]/40 rounded-xl border border-zinc-800"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
            className="p-3 rounded-2xl bg-zinc-900 border border-zinc-700/50 mb-4"
          >
            <Brain className="h-8 w-8 text-zinc-500" />
          </motion.div>
          <motion.h3
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm font-bold text-zinc-300 mb-1"
          >
            No AI Usage Data Yet
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="text-[11px] text-zinc-500 text-center max-w-xs leading-relaxed"
          >
            Start using the AI companion, search for leads, or analyze your pipeline to see analytics here.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.36 }}
            className="flex items-center gap-2 mt-4 text-[9px] text-zinc-500 font-mono"
          >
            <Wifi className="h-3 w-3 text-zinc-600" />
            <span>Usage tracking is automatic — just send a message to the AI Companion</span>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          id="ai-analytics-dashboard"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={`space-y-6 transition-all duration-500 ${newDataPulse ? 'brightness-110' : ''}`}
        >

          {/* ─── Live Indicator + Page Title ────────────────── */}
          <motion.div variants={itemVariants} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white font-display">AI Usage Analytics</h2>
                <p className="text-[9px] text-zinc-500 font-mono">
                  {traces.length} traces · {providerUsage.filter(u => u.requests > 0).length || 0} active providers
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Live indicator */}
              <button
                onClick={() => setIsLive(!isLive)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[9px] font-mono font-bold transition-all cursor-pointer ${
                  isLive
                    ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-400 hover:bg-emerald-950/50'
                    : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:bg-zinc-800/50'
                }`}
              >
                <span className="relative flex h-2 w-2">
                  {isLive && (
                    <span
                      ref={liveDotRef}
                      className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"
                    />
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                </span>
                <span>{isLive ? 'LIVE' : 'PAUSED'}</span>
                {isLive && <Radio className="w-2.5 h-2.5 text-emerald-400/70" />}
              </button>

              {/* Refresh button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { fetchProviderUsage(); checkProviderHealth(); }}
                className="p-1.5 rounded-lg hover:bg-zinc-800/50 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                title="Refresh now"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </motion.div>

          {/* ─── Aggregate Stats Bar ─────────────────────────── */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -2, borderColor: '#4f46e5', boxShadow: '0 4px 20px rgba(79, 70, 229, 0.08)' }}
              className="rounded-xl border border-zinc-800 bg-[#0C0C0E] p-4 relative overflow-hidden group"
            >
              <motion.div
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-950/40 border border-indigo-900/30 text-indigo-400 mb-2 group-hover:bg-indigo-950/60 group-hover:border-indigo-800/40 transition-colors"
              >
                <Brain className="h-4.5 w-4.5" />
              </motion.div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Tokens</p>
              <p className="text-2xl font-mono font-bold text-white mt-0.5">
                <AnimatedCounter value={aggregateStats.totalTokens} />
              </p>
              <span className="text-[9px] text-zinc-500 block mt-1.5 leading-normal">
                Prompt + completion across all providers
              </span>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ y: -2, borderColor: '#3b82f6', boxShadow: '0 4px 20px rgba(59, 130, 246, 0.08)' }}
              className="rounded-xl border border-zinc-800 bg-[#0C0C0E] p-4 relative overflow-hidden group"
            >
              <motion.div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-950/40 border border-blue-900/30 text-blue-400 mb-2 group-hover:bg-blue-950/60 group-hover:border-blue-800/40 transition-colors">
                <Zap className="h-4.5 w-4.5" />
              </motion.div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Requests</p>
              <p className="text-2xl font-mono font-bold text-white mt-0.5">
                <AnimatedCounter value={aggregateStats.totalRequests} />
              </p>
              <span className="text-[9px] text-zinc-500 block mt-1.5 leading-normal">
                Across {providerCards.filter(c => c.requests > 0).length || 'available'} providers
              </span>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ y: -2, borderColor: '#10b981', boxShadow: '0 4px 20px rgba(16, 185, 129, 0.08)' }}
              className="rounded-xl border border-zinc-800 bg-[#0C0C0E] p-4 relative overflow-hidden group"
            >
              <motion.div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 mb-2 group-hover:bg-emerald-950/60 group-hover:border-emerald-800/40 transition-colors">
                <Activity className="h-4.5 w-4.5" />
              </motion.div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Avg Latency</p>
              <p className="text-2xl font-mono font-bold text-emerald-400 mt-0.5">
                <AnimatedCounter value={aggregateStats.avgLat} suffix="ms" />
              </p>
              <span className="text-[9px] text-zinc-500 block mt-1.5 leading-normal">
                Success rate: <AnimatedCounter value={aggregateStats.successRate} suffix="%" />
              </span>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ y: -2, borderColor: '#f59e0b', boxShadow: '0 4px 20px rgba(245, 158, 11, 0.08)' }}
              className="rounded-xl border border-zinc-800 bg-[#0C0C0E] p-4 relative overflow-hidden group"
            >
              <motion.div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-950/40 border border-amber-900/30 text-amber-400 mb-2 group-hover:bg-amber-950/60 group-hover:border-amber-800/40 transition-colors">
                <BarChart3 className="h-4.5 w-4.5" />
              </motion.div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Agents Active</p>
              <p className="text-2xl font-mono font-bold text-amber-400 mt-0.5">
                <AnimatedCounter value={new Set(traces.map(t => t.agent)).size} />
              </p>
              <span className="text-[9px] text-zinc-500 block mt-1.5 leading-normal">
                Unique agent types deployed
              </span>
            </motion.div>
          </motion.div>

      {/* ─── Provider Overview Cards ─────────────────────────── */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {providerCards.map((card, idx) => {
              const hasData = card.requests > 0;
              return (
                <motion.div
                  key={card.name}
                  variants={itemVariants}
                  whileHover={{ y: -3, scale: 1.005, transition: { type: 'spring', damping: 18 } }}
                  className={`rounded-xl border p-4 relative overflow-hidden group ${
                    hasData
                      ? 'bg-[#0C0C0E] border-zinc-800'
                      : 'bg-[#0C0C0E]/50 border-zinc-800/60'
                  }`}
                >
                  {/* Color accent bar — animated on hover */}
                  <motion.div
                    className="absolute top-0 left-0 w-full h-0.5"
                    initial={{ scaleX: 0, transformOrigin: 'left' }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.3 + idx * 0.07, duration: 0.4 }}
                    style={{ backgroundColor: card.available ? card.color : '#3f3f46' }}
                  />

                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <motion.div
                        className="w-8 h-8 rounded-lg flex items-center justify-center border group-hover:scale-110 transition-transform"
                        style={{
                          backgroundColor: `${card.color}15`,
                          borderColor: `${card.color}30`,
                        }}
                        whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.4 } }}
                      >
                        <Cpu className="w-4 h-4" style={{ color: card.color }} />
                      </motion.div>
                      <div>
                        <p className="text-xs font-bold text-white">{card.name}</p>
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 + idx * 0.07 }}
                          className={`text-[8px] font-mono ${
                            card.available ? 'text-emerald-400' : 'text-zinc-500'
                          }`}
                        >
                          {card.available ? 'Connected' : 'Not configured'}
                        </motion.span>
                      </div>
                    </div>
                    {card.available && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + idx * 0.07, type: 'spring', damping: 15 }}
                        className={`text-[8px] font-mono px-1.5 py-0.5 rounded-full border ${
                          card.latencyTest && card.latencyTest < 1000
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {card.latencyTest ? `${card.latencyTest}ms` : '—'}
                      </motion.span>
                    )}
                  </div>

                  {hasData ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 + idx * 0.07 }}
                      className="grid grid-cols-3 gap-2 mt-2"
                    >
                      <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-900 group-hover:border-zinc-700/50 transition-colors">
                        <p className="text-[8px] text-zinc-500 font-mono uppercase">Requests</p>
                        <p className="text-sm font-mono font-bold text-white mt-0.5">{card.requests}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-900 group-hover:border-zinc-700/50 transition-colors">
                        <p className="text-[8px] text-zinc-500 font-mono uppercase">Tokens</p>
                        <p className="text-sm font-mono font-bold text-white mt-0.5">{card.tokens.toLocaleString()}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-900 group-hover:border-zinc-700/50 transition-colors">
                        <p className="text-[8px] text-zinc-500 font-mono uppercase">Avg Lat</p>
                        <p className="text-sm font-mono font-bold text-white mt-0.5">{card.avgLatency}ms</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.45 + idx * 0.07 }}
                      className="flex items-center justify-center py-3 text-[9px] text-zinc-500 font-mono"
                    >
                      <Wifi className="w-3 h-3 mr-1.5 text-zinc-600" />
                      <span>No requests yet</span>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>

      {/* ─── Charts Grid ─────────────────────────────────────── */}
          <motion.div variants={chartCardVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* Token Consumption Over Time (AreaChart) — spans 7 cols */}
            <motion.div
              variants={chartCardVariants}
              whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}
              className="lg:col-span-7 rounded-xl border border-zinc-800 bg-[#0C0C0E] p-5 space-y-4 transition-colors group hover:border-zinc-700"
            >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-zinc-500" />
              <span className="text-xs font-bold text-white">Token Consumption Over Time</span>
            </div>
            <span className="text-[8px] text-zinc-500 font-mono">
              Cumulative · {tokenTimeData.length} steps
            </span>
          </div>

          <div className="h-[260px] w-full">
            {tokenTimeData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-zinc-500 italic">
                No trace data to chart
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tokenTimeData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="promptGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="completionGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="step" stroke="#6b7280" fontSize={9} tickLine={false} interval="preserveStartEnd" />
                  <YAxis stroke="#6b7280" fontSize={9} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v} />
                  <Tooltip
                    formatter={(value: any) => [value.toLocaleString(), '']}
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                    itemStyle={{ color: '#e4e4e7', fontSize: '11px' }}
                    labelStyle={{ color: '#71717a', fontSize: '10px' }}
                  />
                  <Area
                    type="monotone" dataKey="prompt" stroke="#3b82f6" strokeWidth={2}
                    fill="url(#promptGrad)" name="Prompt Tokens" stackId="1"
                  />
                  <Area
                    type="monotone" dataKey="completion" stroke="#7c3aed" strokeWidth={2}
                    fill="url(#completionGrad)" name="Completion Tokens" stackId="2"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

            {/* Token Distribution (PieChart) — spans 5 cols */}
            <motion.div
              variants={chartCardVariants}
              whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}
              className="lg:col-span-5 rounded-xl border border-zinc-800 bg-[#0C0C0E] p-5 space-y-4 flex flex-col transition-colors group hover:border-zinc-700"
            >
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-zinc-500" />
            <span className="text-xs font-bold text-white">Token Distribution by Provider</span>
          </div>

          <div className="flex-1 h-[220px] w-full flex items-center justify-center relative">
            {tokenDistData.length === 0 ? (
              <div className="text-xs text-zinc-500 italic">No token data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tokenDistData}
                    cx="50%" cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {tokenDistData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.fill} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [value.toLocaleString(), 'Tokens']}
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                    itemStyle={{ color: '#e4e4e7', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            {tokenDistData.length > 0 && (
              <div className="absolute flex flex-col items-center justify-center inset-0 pointer-events-none">
                <span className="text-lg font-bold font-mono text-white">
                  {aggregateStats.totalTokens.toLocaleString()}
                </span>
                <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">Total Tokens</span>
              </div>
            )}
          </div>

          {/* Legend */}
          {tokenDistData.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800">
              {tokenDistData.map(entry => (
                <div key={entry.name} className="flex items-center gap-1.5 text-[9px] font-mono">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }} />
                  <span className="text-zinc-400">{entry.name}</span>
                  <span className="text-zinc-500">
                    ({Math.round((entry.value / Math.max(1, aggregateStats.totalTokens)) * 100)}%)
                  </span>
                </div>
              ))}
            </div>
          )}
            </motion.div>

          </motion.div>

          {/* ─── Second Charts Row ───────────────────────────────── */}
          <motion.div variants={chartCardVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* Requests Per Provider (BarChart) — spans 6 cols */}
            <motion.div
              variants={chartCardVariants}
              whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}
              className="lg:col-span-6 rounded-xl border border-zinc-800 bg-[#0C0C0E] p-5 space-y-4 transition-colors group hover:border-zinc-700"
            >
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-zinc-500" />
            <span className="text-xs font-bold text-white">Requests per Provider</span>
          </div>

          <div className="h-[220px] w-full">
            {requestCountData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-zinc-500 italic">
                No request data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={requestCountData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="requests" radius={[4, 4, 0, 0]}>
                    {requestCountData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

            {/* Latency Trends (LineChart) — spans 6 cols */}
            <motion.div
              variants={chartCardVariants}
              whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}
              className="lg:col-span-6 rounded-xl border border-zinc-800 bg-[#0C0C0E] p-5 space-y-4 transition-colors group hover:border-zinc-700"
            >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-zinc-500" />
              <span className="text-xs font-bold text-white">Latency Trends</span>
            </div>
            <span className="text-[8px] text-zinc-500 font-mono">
              ms per request · {latencyTimeData.length} data points
            </span>
          </div>

          <div className="h-[220px] w-full">
            {latencyTimeData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-zinc-500 italic">
                No latency data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={latencyTimeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="step" stroke="#6b7280" fontSize={9} tickLine={false} interval="preserveStartEnd" />
                  <YAxis stroke="#6b7280" fontSize={9} tickLine={false} tickFormatter={(v) => `${v}ms`} />
                  <Tooltip
                    formatter={(value: any, name: string) => [`${value}ms`, name]}
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                    itemStyle={{ color: '#e4e4e7', fontSize: '11px' }}
                    labelStyle={{ color: '#71717a', fontSize: '10px' }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '9px', color: '#a1a1aa' }}
                    iconType="circle"
                    iconSize={6}
                  />
                  {PROVIDER_ORDER.filter(p => latencyTimeData.some(d => d[p] !== undefined)).map(p => (
                    <Line
                      key={p}
                      type="monotone"
                      dataKey={p}
                      stroke={PROVIDER_PALETTE[p]?.stroke || '#6b7280'}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 3, strokeWidth: 1 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
            </motion.div>

          </motion.div>

      {/* ─── Recent Agent Activity Table ─────────────────────── */}
          <motion.div variants={itemVariants} className="rounded-xl border border-zinc-800 bg-[#0C0C0E] p-5 space-y-3 group hover:border-zinc-700 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-zinc-500" />
            <span className="text-xs font-bold text-white">Recent Agent Traces</span>
          </div>
          <span className="text-[8px] text-zinc-500 font-mono">{traces.length} total traces</span>
        </div>

        {traces.length === 0 ? (
          <div className="flex items-center justify-center py-6 text-[10px] text-zinc-500 italic">
            No agent activity recorded yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[9px] font-mono">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-800">
                  <th className="pb-2 pr-3 font-bold uppercase tracking-wider">Agent</th>
                  <th className="pb-2 pr-3 font-bold uppercase tracking-wider">Task</th>
                  <th className="pb-2 pr-3 font-bold uppercase tracking-wider">Model</th>
                  <th className="pb-2 pr-3 font-bold uppercase tracking-wider text-right">Tokens</th>
                  <th className="pb-2 pr-3 font-bold uppercase tracking-wider text-right">Latency</th>
                  <th className="pb-2 pr-3 font-bold uppercase tracking-wider">Result</th>
                  <th className="pb-2 font-bold uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody>
                {traces.slice(0, 15).map((t, idx) => {
                  const agentColor = t.agent === 'Discovery' ? '#3b82f6'
                    : t.agent === 'Analyzer' ? '#8b5cf6'
                    : t.agent === 'ProposalWriter' ? '#f59e0b'
                    : t.agent === 'PitchCraft' ? '#10b981'
                    : t.agent === 'Companion' ? '#06b6d4'
                    : t.agent === 'LLM Router' ? '#7c3aed'
                    : '#6b7280';
                  return (
                    <motion.tr
                      key={t.id}
                      custom={idx}
                      variants={tableRowVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)', transition: { duration: 0.15 } }}
                      className="border-b border-zinc-800/50 transition-colors"
                    >
                      <td className="py-2 pr-3">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: agentColor }} />
                          <span className="text-zinc-300">{t.agent}</span>
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-zinc-400 max-w-[140px] truncate">{t.task}</td>
                      <td className="py-2 pr-3 text-zinc-500">{t.model}</td>
                      <td className="py-2 pr-3 text-right text-zinc-400">{(t.inputTokens + t.outputTokens).toLocaleString()}</td>
                      <td className="py-2 pr-3 text-right text-zinc-400">{t.latencyMs}ms</td>
                      <td className="py-2 pr-3">
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${
                          t.result === 'success'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {t.result}
                        </span>
                      </td>
                      <td className="py-2 text-zinc-500">{t.timestamp}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
          </motion.div>

          {/* Footer note */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-between text-[8px] font-mono text-zinc-600 px-1"
          >
            <span className="flex items-center gap-1">
              <RefreshCw className="w-2.5 h-2.5" />
              Auto-refreshes on mount · data from in-memory traces
            </span>
            <span>
              All providers are free-tier · $0 cost incurred
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
