import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sgtAgent } from '../agent';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  keyTakeaway?: string;
}

export default function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemma2-9b-it');
  const [serverStatus, setServerStatus] = useState<'checking' | 'connected' | 'offline'>('checking');

  // Check server connection via WebSocket or health probe
  useEffect(() => {
    let cancelled = false;
    const checkConnection = async () => {
      try {
        const resp = await fetch('/api/assets', { method: 'HEAD', signal: AbortSignal.timeout(5000) });
        if (!cancelled) setServerStatus(resp.ok ? 'connected' : 'offline');
      } catch {
        if (!cancelled) setServerStatus('offline');
      }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "wel-1",
      sender: "assistant",
      text: `### Sgt Show Investing Intelligence Copilot! 🧠
      
I can analyze global tech giants, explain stock valuation multiples, audit macro commodity runs (Gold / XAU), or track crypto cycles (BTC/SOL) using state-of-the-art open source models.

**Ask me anything!** try:
- *"Nvidia vs Apple long term outlook"*
- *"Why are central banks accumulating Gold?"*
- *"Explain Bitcoin Spot ETF flows simply"*`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const presets = [
    "Nvidia vs Apple outlook",
    "Explain Bitcoin flat accumulation",
    "Why is gold spiking?"
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const result = await sgtAgent.dispatch({ type: 'AI_ASSISTANT', prompt: textToSend, model: selectedModel });
      const assistantMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: result.answer,
        sentiment: result.sentiment,
        keyTakeaway: result.keyTakeaway
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      const errorMsg: Message = {
        id: `ai-err-${Date.now()}`,
        sender: 'assistant',
        text: `The AI analyst (${selectedModel.toUpperCase()}) is taking a quick break. Please verify your SGT credentials or API key configuration!`
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, loading, isOpen]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Floating Chat Panel Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 280 }}
            className="mb-4 w-[380px] max-w-[calc(100vw-32px)] h-[510px] rounded-2xl border border-zinc-900 bg-[#0C0C0E]/95 shadow-2xl backdrop-blur-md flex flex-col overflow-hidden text-left"
          >
            {/* Header */}
            <div className="p-4 border-b border-zinc-900/60 bg-[#121215]/80 flex items-center justify-between relative">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-[#FE8C00] to-[#FFA133] flex items-center justify-center font-display text-xs font-black text-zinc-950">
                  S
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1">
                    Sgt Copilot
                    <span className={`flex h-1.5 w-1.5 rounded-full ${
                      serverStatus === 'connected' ? 'bg-emerald-500' : serverStatus === 'offline' ? 'bg-rose-500' : 'bg-amber-500'
                    } animate-pulse`} />
                  </h3>
                  <p className="text-[9px] font-mono font-bold">
                    <span className={serverStatus === 'connected' ? 'text-emerald-400' : serverStatus === 'offline' ? 'text-rose-400' : 'text-amber-400'}>
                      {serverStatus === 'connected' ? '● LIVE' : serverStatus === 'offline' ? '● OFFLINE' : '● CHECKING'}
                    </span>
                    <span className="text-[#FE8C00] ml-1">SOVEREIGN AI AGENT</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="text-[9px] font-mono font-bold bg-zinc-950 border border-zinc-900 text-[#FE8C00] rounded px-1.5 py-1.5 outline-none hover:border-[#FE8C00]/40 transition-all cursor-pointer select-none"
                >
                  <option value="gemma2-9b-it">Gemma 2 9B (FOSS)</option>
                  <option value="llama-3.3-70b">Llama 3.3 (FOSS)</option>
                  <option value="gemini-3.5-flash">Gemini 3.5 (Free)</option>
                  <option value="qwen-2.5-72b">Qwen 2.5 (FOSS)</option>
                </select>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-md border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Presets Tray */}
            <div className="p-2 border-b border-zinc-900/40 bg-zinc-950/40 flex items-center gap-1.5 overflow-x-auto hide-scrollbar select-none">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(p)}
                  disabled={loading}
                  className="shrink-0 text-[10px] font-sans font-bold px-2.5 py-1 rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-[#FE8C00]/40 transition-all cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 hide-scrollbar">
              {messages.map((m) => {
                const isAi = m.sender === 'assistant';
                return (
                  <div 
                    key={m.id}
                    className={`flex gap-2 text-xs leading-relaxed ${isAi ? 'justify-start' : 'justify-end'}`}
                  >
                    {isAi && (
                      <div className="h-6 w-6 rounded-md bg-[#FE8C00] shrink-0 flex items-center justify-center font-black text-xs text-zinc-950 border border-zinc-900">
                        S
                      </div>
                    )}
                    <div className="space-y-1.5 max-w-[85%] text-left">
                      <div className={`p-3 rounded-xl whitespace-pre-line border text-[11px] leading-normal ${
                        isAi 
                          ? 'bg-zinc-950/20 border-zinc-900/25 text-zinc-200' 
                          : 'bg-[#FE8C00] border-zinc-800 text-zinc-950 font-bold'
                      }`}>
                        {m.text}
                      </div>

                      {/* Sentiment or Takeaway indicators for AI response */}
                      {isAi && (m.sentiment || m.keyTakeaway) && (
                        <div className="rounded-lg border border-zinc-900 bg-zinc-950/40 p-2 space-y-1 text-[10px] text-zinc-400">
                          {m.sentiment && (
                            <div className="flex items-center gap-1">
                              <span className="text-[8px] font-mono text-zinc-500 uppercase">Bias:</span>
                              <span className={`text-[8px] font-bold uppercase ${
                                m.sentiment === 'bullish' ? 'text-emerald-400' :
                                m.sentiment === 'bearish' ? 'text-rose-500' : 'text-zinc-400'
                              }`}>
                                {m.sentiment}
                              </span>
                            </div>
                          )}
                          {m.keyTakeaway && (
                            <div className="border-t border-zinc-900/40 pt-1 leading-snug">
                              <span className="text-[#FE8C00] font-bold">Guide:</span> "{m.keyTakeaway}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex gap-2 justify-start items-center">
                  <div className="h-5 w-5 rounded-md bg-zinc-900 border border-[#FE8C00] border-t-transparent animate-spin" />
                  <p className="text-[10px] font-mono text-zinc-500">Evaluating Sovereign Indexes...</p>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input Footer Area */}
            <div className="p-3 border-t border-zinc-900/60 bg-[#121215]/80 flex gap-2">
              <input
                type="text"
                placeholder="Ask Sgt Show Copilot..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading) handleSend(input);
                }}
                disabled={loading}
                className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-[11.5px] text-white placeholder-zinc-500 outline-none focus:border-[#FE8C00] text-left"
              />
              <button
                onClick={() => handleSend(input)}
                disabled={loading}
                className="p-2.5 rounded-xl bg-[#FE8C00] text-zinc-950 hover:bg-[#E07B00] transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger Bubble Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full bg-[#FE8C00] hover:bg-[#E07B00] flex items-center justify-center text-zinc-950 shadow-2xl glow-accent border border-[#FE8C00]/40 z-50 cursor-pointer relative"
      >
        <Sparkles className="h-5.5 w-5.5 text-zinc-950 animate-pulse" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FE8C00] opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FFA133]" />
        </span>
      </motion.button>

    </div>
  );
}
