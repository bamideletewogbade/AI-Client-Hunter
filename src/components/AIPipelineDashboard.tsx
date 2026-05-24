import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAI } from './AIContext';
import {
  Search, BarChart3, FileText, Send, Bot, Cpu, Activity,
  Zap, Clock, DollarSign, Network, Sparkles, Brain, ChevronDown, X
} from 'lucide-react';

interface AgentNode {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  glowColor: string;
  role: string;
  x: number;
  y: number;
}

interface Particle {
  id: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number;
  speed: number;
  color: string;
  size: number;
}

const AGENTS: AgentNode[] = [
  { id: 'discovery', name: 'Discovery', icon: <Search className="w-4 h-4" />, color: '#3b82f6', bgColor: '#1e3a5f', glowColor: 'rgba(59, 130, 246, 0.3)', role: 'Search & Find Leads', x: 50, y: 15 },
  { id: 'analyzer', name: 'Analyzer', icon: <BarChart3 className="w-4 h-4" />, color: '#8b5cf6', bgColor: '#2e1065', glowColor: 'rgba(139, 92, 246, 0.3)', role: 'Business Intelligence', x: 25, y: 40 },
  { id: 'proposal', name: 'Proposal', icon: <FileText className="w-4 h-4" />, color: '#f59e0b', bgColor: '#451a03', glowColor: 'rgba(245, 158, 11, 0.3)', role: 'Web Design Pitches', x: 75, y: 40 },
  { id: 'pitch', name: 'PitchCraft', icon: <Send className="w-4 h-4" />, color: '#f43f5e', bgColor: '#4c0519', glowColor: 'rgba(244, 63, 94, 0.3)', role: 'Outreach Copy', x: 15, y: 70 },
  { id: 'companion', name: 'Companion', icon: <Bot className="w-4 h-4" />, color: '#10b981', bgColor: '#064e3b', glowColor: 'rgba(16, 185, 129, 0.3)', role: 'Chat & Assist', x: 85, y: 70 },
  { id: 'router', name: 'LLM Router', icon: <Cpu className="w-4 h-4" />, color: '#06b6d4', bgColor: '#083344', glowColor: 'rgba(6, 182, 212, 0.3)', role: 'Model Distribution', x: 50, y: 90 },
];

// Links form a web connecting agents
const LINKS = [
  { from: 'discovery', to: 'analyzer' },
  { from: 'discovery', to: 'proposal' },
  { from: 'analyzer', to: 'proposal' },
  { from: 'analyzer', to: 'pitch' },
  { from: 'proposal', to: 'pitch' },
  { from: 'pitch', to: 'companion' },
  { from: 'companion', to: 'router' },
  { from: 'router', to: 'discovery' },
  { from: 'router', to: 'analyzer' },
  { from: 'router', to: 'proposal' },
  { from: 'router', to: 'pitch' },
  { from: 'router', to: 'companion' },
];

export default function AIPipelineDashboard() {
  const { traces, isProcessing, currentTask, totalTraces, avgLatency, totalCost } = useAI();
  const [particles, setParticles] = useState<Particle[]>([]);
  const [highlightedAgent, setHighlightedAgent] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const particleIdRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ w: 600, h: 400 });

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ w: Math.max(width, 300), h: Math.max(height, 350) });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Convert percentages to pixels
  const nodePositions = useMemo(() => {
    const { w, h } = dimensions;
    return AGENTS.map(a => ({
      ...a,
      px: (a.x / 100) * w,
      py: (a.y / 100) * h,
    }));
  }, [dimensions]);

  // Spawn particles when traces update
  useEffect(() => {
    if (traces.length === 0 || !isProcessing) return;
    
    const latestTrace = traces[0];
    const agentNode = AGENTS.find(a => 
      latestTrace.agent.toLowerCase().includes(a.id) ||
      a.id.includes(latestTrace.agent.toLowerCase())
    );
    if (!agentNode) return;

    const agentPos = nodePositions.find(n => n.id === agentNode.id);
    if (!agentPos) return;

    // Spawn particles from this agent to connected agents
    const connectedLinks = LINKS.filter(l => l.from === agentNode.id || l.to === agentNode.id);
    
    const interval = setInterval(() => {
      const link = connectedLinks[Math.floor(Math.random() * connectedLinks.length)];
      const fromNode = nodePositions.find(n => n.id === link.from)!;
      const toNode = nodePositions.find(n => n.id === link.to)!;
      
      particleIdRef.current++;
      setParticles(prev => [...prev.slice(-30), {
        id: particleIdRef.current,
        fromX: fromNode.px,
        fromY: fromNode.py,
        toX: toNode.px,
        toY: toNode.py,
        progress: 0,
        speed: 0.02 + Math.random() * 0.03,
        color: fromNode.color,
        size: 2 + Math.random() * 2,
      }]);
    }, 200);

    return () => clearInterval(interval);
  }, [traces, isProcessing, nodePositions]);

  // Animate particles
  useEffect(() => {
    if (particles.length === 0) return;
    const interval = setInterval(() => {
      setParticles(prev => {
        const updated = prev.map(p => ({
          ...p,
          progress: p.progress + p.speed,
        })).filter(p => p.progress < 1);
        return updated;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [particles.length > 0]);

  // Agent-to-agent connection lines (SVG)
  const linkLines = useMemo(() => {
    return LINKS.map(link => {
      const fromNode = nodePositions.find(n => n.id === link.from)!;
      const toNode = nodePositions.find(n => n.id === link.to)!;
      const isHighlighted = highlightedAgent && (link.from === highlightedAgent || link.to === highlightedAgent);
      return { ...link, fromNode, toNode, isHighlighted };
    });
  }, [nodePositions, highlightedAgent]);

  // Count traces per agent for badges
  const agentTraceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    traces.forEach(t => {
      const agentNode = AGENTS.find(a =>
        t.agent.toLowerCase().includes(a.id) || a.id.includes(t.agent.toLowerCase())
      );
      if (agentNode) {
        counts[agentNode.id] = (counts[agentNode.id] || 0) + 1;
      }
    });
    return counts;
  }, [traces]);

  return (
    <div className="w-full">
      {/* Collapse toggle */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-sm">
            <Network className="w-3 h-3 text-white" />
          </div>
          <h3 className="text-sm font-bold text-zinc-900 font-display">AI Agent Mesh</h3>
          {isProcessing && (
            <span className="text-[9px] font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 animate-pulse">
              Processing...
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[9px] font-mono text-zinc-400">
          <span>{totalTraces} ops</span>
          <span>{avgLatency}ms avg</span>
          <span className="text-emerald-500">$0.00</span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              ref={containerRef}
              className="relative w-full border border-zinc-200 rounded-2xl bg-zinc-50/80 overflow-hidden"
              style={{ aspectRatio: '3/2', minHeight: '350px' }}
            >
              {/* Background grid pattern */}
              <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: `
                    linear-gradient(#3b82f6 1px, transparent 1px),
                    linear-gradient(90deg, #3b82f6 1px, transparent 1px)
                  `,
                  backgroundSize: '24px 24px',
                }}
              />

              {/* SVG connection layer */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <defs>
                  <filter id="particle-glow">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Connection lines */}
                {linkLines.map((link, i) => (
                  <g key={i}>
                    {/* Glow */}
                    <line
                      x1={link.fromNode.px}
                      y1={link.fromNode.py}
                      x2={link.toNode.px}
                      y2={link.toNode.py}
                      stroke={link.isHighlighted ? link.fromNode.color : '#d4d4d4'}
                      strokeWidth={link.isHighlighted ? 2 : 1}
                      strokeOpacity={link.isHighlighted ? 0.6 : 0.3}
                      className="transition-all duration-300"
                    />
                    {/* Dashed background line */}
                    <line
                      x1={link.fromNode.px}
                      y1={link.fromNode.py}
                      x2={link.toNode.px}
                      y2={link.toNode.py}
                      stroke="#e4e4e7"
                      strokeWidth={0.5}
                      strokeDasharray="3,3"
                    />
                  </g>
                ))}

                {/* Data particles */}
                {particles.map(p => {
                  const x = p.fromX + (p.toX - p.fromX) * p.progress;
                  const y = p.fromY + (p.toY - p.fromY) * p.progress;
                  return (
                    <circle
                      key={p.id}
                      cx={x}
                      cy={y}
                      r={p.size}
                      fill={p.color}
                      opacity={0.8}
                      filter="url(#particle-glow)"
                    />
                  );
                })}

                {/* Pulsing rings around active agents */}
                {isProcessing && traces.length > 0 && nodePositions.map(node => {
                  const isActive = traces[0]?.agent.toLowerCase().includes(node.id);
                  if (!isActive) return null;
                  return (
                    <circle
                      key={`pulse-${node.id}`}
                      cx={node.px}
                      cy={node.py}
                      r={22}
                      fill="none"
                      stroke={node.color}
                      strokeWidth={1.5}
                      opacity={0.4}
                      className="animate-ping"
                      style={{ animationDuration: '2s' }}
                    />
                  );
                })}
              </svg>

              {/* Agent nodes */}
              {nodePositions.map(node => {
                const count = agentTraceCounts[node.id] || 0;
                const isActive = isProcessing && traces[0]?.agent.toLowerCase().includes(node.id);
                return (
                  <div
                    key={node.id}
                    onMouseEnter={() => setHighlightedAgent(node.id)}
                    onMouseLeave={() => setHighlightedAgent(null)}
                    className="absolute z-10"
                    style={{
                      left: `${node.x}%`,
                      top: `${node.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <motion.div
                      animate={{
                        scale: isActive ? [1, 1.15, 1] : 1,
                        transition: { duration: 1.5, repeat: isActive ? Infinity : 0 },
                      }}
                      className={`relative flex flex-col items-center gap-1 cursor-pointer transition-opacity duration-200 ${
                        highlightedAgent && highlightedAgent !== node.id ? 'opacity-30' : 'opacity-100'
                      }`}
                      onClick={() => setHighlightedAgent(highlightedAgent === node.id ? null : node.id)}
                    >
                      {/* Node circle */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center border-2 shadow-lg transition-all duration-200"
                        style={{
                          backgroundColor: node.bgColor,
                          borderColor: node.color,
                          boxShadow: isActive
                            ? `0 0 12px ${node.glowColor}, 0 0 24px ${node.glowColor}`
                            : `0 2px 8px ${node.glowColor}`,
                        }}
                      >
                        <span style={{ color: node.color }}>{node.icon}</span>
                      </div>

                      {/* Name */}
                      <span
                        className="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded-full whitespace-nowrap"
                        style={{
                          backgroundColor: `${node.color}15`,
                          color: node.color,
                          border: `1px solid ${node.color}30`,
                        }}
                      >
                        {node.name}
                      </span>

                      {/* Trace count badge */}
                      {count > 0 && (
                        <span
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white"
                          style={{ backgroundColor: node.color }}
                        >
                          {count}
                        </span>
                      )}
                    </motion.div>

                    {/* Agent info tooltip on hover */}
                    <AnimatePresence>
                      {highlightedAgent === node.id && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 bg-white border border-zinc-200 rounded-xl shadow-xl p-3 z-20"
                        >
                          <p className="text-[10px] font-bold text-zinc-800">{node.name}</p>
                          <p className="text-[8px] text-zinc-500 font-mono mt-0.5">{node.role}</p>
                          {count > 0 && (
                            <div className="mt-2 pt-2 border-t border-zinc-100 text-[8px] font-mono text-zinc-400">
                              <span>{count} tasks executed</span>
                            </div>
                          )}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-r border-b border-zinc-200 rotate-45 -mt-1" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {/* Bottom status bar */}
              <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-white/80 backdrop-blur-sm border-t border-zinc-200 flex items-center justify-between text-[8px] font-mono text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${isProcessing ? 'bg-blue-500 animate-pulse' : 'bg-emerald-400'}`} />
                  <span>{isProcessing ? currentTask || 'Processing...' : 'All agents idle'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" /> {totalTraces} ops
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> {avgLatency}ms
                  </span>
                </div>
              </div>
            </div>

            {/* Agent legend */}
            <div className="flex flex-wrap gap-2 mt-2">
              {AGENTS.map(agent => (
                <div
                  key={agent.id}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-zinc-200 bg-white text-[8px] font-mono"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: agent.color }} />
                  <span className="text-zinc-600">{agent.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
