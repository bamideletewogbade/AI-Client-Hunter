import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAI } from './AIContext';
import { PROVIDER_COLORS } from '../types';
import {
  Wifi, WifiOff, Clock, Layers, RefreshCw,
  BarChart3, X, Activity, Zap, CheckCircle2, XCircle
} from 'lucide-react';

// ─── Animation Variants ─────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.08, type: 'spring', damping: 20, stiffness: 200, mass: 0.6 },
  }),
};

const usageItemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.06, type: 'spring', damping: 22, stiffness: 180 },
  }),
};

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1, scale: 1,
    transition: { type: 'spring', damping: 14, stiffness: 220 },
  },
};

interface AIProviderHealthCheckProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIProviderHealthCheck({ isOpen, onClose }: AIProviderHealthCheckProps) {
  const { providerHealth, checkProviderHealth, providerUsage, fetchProviderUsage, addTrace } = useAI();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (isOpen) {
      checkProviderHealth();
      fetchProviderUsage();
    }
    return () => { mountedRef.current = false; };
  }, [isOpen, checkProviderHealth, fetchProviderUsage]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    addTrace('LLM Router', 'health_check:manual_refresh', 'n/a', 2, 1, 0, 0, 'success');
    await Promise.all([checkProviderHealth(), fetchProviderUsage()]);
    setTimeout(() => { if (mountedRef.current) setIsRefreshing(false); }, 400);
  };

  const getProviderColor = (provider: string): string => {
    if (provider.toLowerCase().includes('groq')) return '#7c3aed';
    if (provider.toLowerCase().includes('gemini')) return '#2563eb';
    if (provider.toLowerCase().includes('openrouter')) return '#059669';
    return '#6b7280';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                       w-[480px] max-w-[calc(100vw-32px)] max-h-[85vh] overflow-y-auto
                       bg-white border border-zinc-200 rounded-2xl shadow-2xl"
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="flex items-center justify-between px-5 py-4 border-b border-zinc-100"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.08 }}
                  className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-sm"
                >
                  <Activity className="w-4.5 h-4.5 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 font-display">Provider Health</h3>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    <motion.span
                      key={providerHealth.filter(h => h.available).length}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {providerHealth.filter(h => h.available).length}/{providerHealth.length} providers online
                    </motion.span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRefresh}
                  className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 transition-colors cursor-pointer"
                  title="Refresh health checks"
                >
                  <motion.span
                    animate={isRefreshing ? { rotate: 360 } : {}}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                    className="block"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </motion.span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>

            <div className="p-5 space-y-5">
              {/* Provider status cards */}
              <motion.div
                initial="hidden"
                animate="visible"
                className="space-y-2.5"
              >
                <motion.p
                  variants={cardVariants}
                  custom={0}
                  className="text-[9px] font-bold font-mono uppercase tracking-widest text-zinc-400"
                >
                  Provider Status
                </motion.p>
                
                {/* Always show all three providers */}
                {[
                  { id: 'groq', name: 'Groq Cloud', models: ['LLaMA 3.1 8B', 'LLaMA 3.3 70B', 'Mixtral 8x7B'] },
                  { id: 'gemini', name: 'Google Gemini', models: ['Gemini 3.5 Flash'] },
                  { id: 'openrouter', name: 'OpenRouter', models: ['Qwen 2.5 72B', 'DeepSeek Coder v2'] },
                ].map((providerInfo, idx) => {
                  const health = providerHealth.find(h =>
                    h.provider?.toLowerCase().includes(providerInfo.id) ||
                    h.model?.toLowerCase().includes(providerInfo.id)
                  );
                  const isAvailable = health?.available ?? false;
                  const latency = health?.latencyMs;
                  const errorMsg = health?.error;
                  const color = getProviderColor(providerInfo.name);
                  const badgeClass = PROVIDER_COLORS[providerInfo.name] || 'bg-zinc-100 text-zinc-500 border-zinc-200';

                  return (
                    <motion.div
                      key={providerInfo.id}
                      custom={idx + 1}
                      variants={cardVariants}
                      whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.06)', borderColor: isAvailable ? color + '40' : '#e4e4e7' }}
                      className="flex items-start gap-3.5 p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50 cursor-default transition-colors"
                    >
                      {/* Status dot */}
                      <motion.div
                        className="mt-0.5"
                        whileHover={{ scale: 1.15 }}
                        transition={{ type: 'spring', damping: 12 }}
                      >
                        {isAvailable ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 + idx * 0.08 }}
                            className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          </motion.div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                            <XCircle className="w-4 h-4 text-zinc-400" />
                          </div>
                        )}
                      </motion.div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-800">{providerInfo.name}</span>
                            <motion.span
                              variants={badgeVariants}
                              className={`text-[8px] font-mono px-1.5 py-0.5 rounded-full border ${badgeClass}`}
                            >
                              {isAvailable ? 'Connected' : 'Disconnected'}
                            </motion.span>
                          </div>
                          {isAvailable && latency && (
                            <motion.span
                              initial={{ opacity: 0, x: 8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 + idx * 0.08 }}
                              className="text-[9px] font-mono text-zinc-400 flex items-center gap-1 shrink-0"
                            >
                              <Clock className="w-2.5 h-2.5" />
                              {latency}ms
                            </motion.span>
                          )}
                        </div>

                        {isAvailable ? (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 + idx * 0.08 }}
                            className="flex items-center gap-2 mt-1.5"
                          >
                            <Wifi className="w-3 h-3 text-emerald-500" />
                            <span className="text-[9px] font-mono text-emerald-600">API responding</span>
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 + idx * 0.08 }}
                            className="mt-1.5"
                          >
                            <div className="flex items-center gap-1.5">
                              <WifiOff className="w-3 h-3 text-zinc-400" />
                              <span className="text-[9px] font-mono text-zinc-400">
                                {errorMsg || 'Not configured — set API key in .env'}
                              </span>
                            </div>
                          </motion.div>
                        )}

                        {/* Available models */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.35 + idx * 0.08 }}
                          className="flex flex-wrap gap-1 mt-2"
                        >
                          {providerInfo.models.map(m => (
                            <span
                              key={m}
                              className={`text-[7px] font-mono px-1.5 py-0.5 rounded-full border ${
                                isAvailable
                                  ? 'bg-zinc-100 text-zinc-500 border-zinc-200'
                                  : 'bg-zinc-50 text-zinc-400 border-zinc-200/50'
                              }`}
                            >
                              {m}
                            </span>
                          ))}
                        </motion.div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Token Usage Section */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, type: 'spring', damping: 18 }}
                className="border-t border-zinc-100 pt-4"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-between mb-3"
                >
                  <p className="text-[9px] font-bold font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                    <Layers className="w-3 h-3" />
                    Token Usage
                  </p>
                  <span className="text-[8px] font-mono text-zinc-400">
                    {providerUsage.reduce((a, u) => a + u.requests, 0)} total requests
                  </span>
                </motion.div>

                {providerUsage.length === 0 || providerUsage.every(u => u.requests === 0) ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.45 }}
                    className="text-center py-5 bg-zinc-50 rounded-xl border border-zinc-100"
                  >
                    <BarChart3 className="w-6 h-6 text-zinc-300 mx-auto mb-1" />
                    <p className="text-[10px] text-zinc-400 font-mono">No usage data yet</p>
                    <p className="text-[8px] text-zinc-300 mt-0.5">Usage tracking starts after the first AI request</p>
                  </motion.div>
                ) : (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    className="space-y-2"
                  >
                    {providerUsage.filter(u => u.requests > 0).map((usage, idx) => {
                      const totalTokens = usage.promptTokens + usage.completionTokens;
                      const color = getProviderColor(usage.provider);
                      return (
                        <motion.div
                          key={usage.provider}
                          custom={idx}
                          variants={usageItemVariants}
                          whileHover={{ y: -1, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderColor: color + '30' }}
                          className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-100 bg-zinc-50/50 cursor-default transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <motion.div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: color }}
                              animate={{ scale: [1, 1.4, 1] }}
                              transition={{ duration: 0.6, repeat: Infinity, repeatDelay: idx * 2 }}
                            />
                            <span className="text-[10px] font-bold text-zinc-700">{usage.provider}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[9px] font-mono text-zinc-500">
                            <span>{usage.requests} req</span>
                            <span>{totalTokens.toLocaleString()} tok</span>
                            <span>{usage.avgLatencyMs}ms avg</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </motion.div>

              {/* System status footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="border-t border-zinc-100 pt-3 flex items-center justify-between text-[8px] font-mono text-zinc-400"
              >
                <span className="flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5" />
                  Auto-refresh on open
                </span>
                <span>
                  {providerHealth.length > 0
                    ? `${providerHealth.filter(h => h.available).length} of ${providerHealth.length} providers available`
                    : 'No provider data'}
                </span>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
