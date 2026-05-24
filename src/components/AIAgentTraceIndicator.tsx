import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAI } from './AIContext';
import { MODEL_OPTIONS } from '../types';
import {
  Cpu, Activity, DollarSign, Clock, Brain, Target, Zap,
  TrendingUp, BarChart3, Network, ChevronDown, X
} from 'lucide-react';

export default function AIAgentTraceIndicator() {
  const {
    traces, clearTraces, isProcessing, currentTask,
    totalCost, avgLatency, successRate, totalTraces,
    modelRoutes, updateModelRoute,
  } = useAI();
  const [isExpanded, setIsExpanded] = useState(false);

  const recentTraces = traces.slice(0, 8);

  // Get the active chat model
  const chatRoute = modelRoutes.find(r => r.task === 'conversation_chat');
  const activeModelObj = MODEL_OPTIONS.find(m => m.id === chatRoute?.model);
  const activeModelName = activeModelObj?.name || 'LLaMA 3.1 8B';

  return (
    <>
      {/* Floating pill — always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="fixed bottom-4 left-4 z-30 flex items-center gap-2 rounded-full 
                   bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 
                   px-3 py-2 shadow-lg hover:bg-zinc-800 
                   transition-all duration-200 cursor-pointer"
        title="AI Agent Mesh — View agent traces & metrics"
      >
        {/* Pulsing dot when processing */}
        <span className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-blue-400 animate-pulse' : 'bg-emerald-400'}`} />
        
        <span className="text-[10px] font-mono font-bold text-zinc-300">
          {isProcessing ? 'AI Processing...' : `AI Mesh · ${totalTraces} ops`}
        </span>
        
        <Cpu className="w-3 h-3 text-zinc-500" />
        
        <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Expanded metrics panel */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-30"
              onClick={() => setIsExpanded(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed bottom-16 left-4 z-40 w-[320px] max-w-[calc(100vw-32px)]
                         bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 
                         rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                    <Network className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white font-display">Agent Mesh</h3>
                    <p className="text-[8px] font-mono text-zinc-500">
                      {totalTraces} traces · {isProcessing ? 'Processing...' : 'Idle'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={clearTraces}
                    className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors text-[8px] font-bold cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-zinc-800/60">
                <div className="p-2 rounded-lg bg-zinc-800/40 border border-zinc-700/30 text-center">
                  <DollarSign className="w-3 h-3 text-emerald-400 mx-auto mb-0.5" />
                  <span className="text-[9px] font-mono font-bold text-emerald-400 block">$0.00</span>
                  <span className="text-[7px] font-mono text-zinc-600 uppercase tracking-wider">Cost</span>
                </div>
                <div className="p-2 rounded-lg bg-zinc-800/40 border border-zinc-700/30 text-center">
                  <Clock className="w-3 h-3 text-blue-400 mx-auto mb-0.5" />
                  <span className="text-[9px] font-mono font-bold text-blue-400 block">{avgLatency}ms</span>
                  <span className="text-[7px] font-mono text-zinc-600 uppercase tracking-wider">Avg Latency</span>
                </div>
                <div className="p-2 rounded-lg bg-zinc-800/40 border border-zinc-700/30 text-center">
                  <Activity className="w-3 h-3 text-purple-400 mx-auto mb-0.5" />
                  <span className="text-[9px] font-mono font-bold text-purple-400 block">{successRate}%</span>
                  <span className="text-[7px] font-mono text-zinc-600 uppercase tracking-wider">Success</span>
                </div>
              </div>

              {/* Active model */}
              <div className="px-4 py-2 border-b border-zinc-800/60 flex items-center justify-between">
                <span className="text-[9px] font-mono text-zinc-500">Active Model</span>
                <span className="text-[9px] font-mono font-bold text-blue-400 flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5" />
                  {activeModelName}
                </span>
              </div>

              {/* Trace list */}
              <div className="max-h-[280px] overflow-y-auto overscroll-contain">
                {recentTraces.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Brain className="w-6 h-6 text-zinc-700 mb-2" />
                    <p className="text-[10px] text-zinc-600 font-mono">No agent traces yet</p>
                    <p className="text-[8px] text-zinc-700 mt-1">Perform searches, analyze leads, or chat with the AI companion</p>
                  </div>
                ) : (
                  <div className="px-3 py-2 space-y-1">
                    {recentTraces.map((trace) => (
                      <div
                        key={trace.id}
                        className="flex items-start gap-2 p-2 rounded-lg hover:bg-zinc-800/30 transition-colors"
                      >
                        <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${
                          trace.result === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[9px] font-bold text-zinc-300 truncate font-mono">
                              [{trace.agent}]
                            </span>
                            <span className="text-[7px] font-mono text-zinc-600 shrink-0">{trace.timestamp}</span>
                          </div>
                          <p className="text-[8px] text-zinc-500 font-mono truncate mt-0.5">{trace.task}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[7px] font-mono text-zinc-600">{trace.model}</span>
                            <span className="text-[7px] font-mono text-zinc-600">{trace.latencyMs}ms</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer with route stats */}
              <div className="px-4 py-2 border-t border-zinc-800/60 flex items-center justify-between bg-zinc-900/50">
                <span className="text-[7px] font-mono text-zinc-600 uppercase tracking-wider">
                  All models run locally — $0 cost
                </span>
                <span className="text-[7px] font-mono text-zinc-600">
                  {totalTraces} operations
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
