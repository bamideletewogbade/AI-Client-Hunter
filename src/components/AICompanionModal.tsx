import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAI, generateAIResponse, THOUGHT_STEPS } from './AIContext';
import { MODEL_OPTIONS, PROVIDER_COLORS } from '../types';
import {
  Sparkles, Send, Bot, User, X, ChevronDown, Mic, MicOff, Trash2,
  Cpu, Zap, Clock, Brain, MessageSquare, PanelRightClose, Activity
} from 'lucide-react';
import AIProviderHealthCheck from './AIProviderHealthCheck';

interface AICompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AICompanionModal({ isOpen, onClose }: AICompanionModalProps) {
  const { messages, addMessage, clearMessages, addTrace, isProcessing, startTask, endTask, modelRoutes, updateModelRoute } = useAI();
  const [input, setInput] = useState('');
  const [currentThoughtIndex, setCurrentThoughtIndex] = useState(0);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isHealthCheckOpen, setIsHealthCheckOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Voice recognition setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) setInput(prev => prev.trim() ? `${prev} ${transcript}` : transcript);
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  // Thought step animation during processing
  useEffect(() => {
    if (!isProcessing) { setCurrentThoughtIndex(0); return; }
    const interval = setInterval(() => setCurrentThoughtIndex(prev => (prev + 1) % THOUGHT_STEPS.length), 500);
    return () => clearInterval(interval);
  }, [isProcessing]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMsg = input.trim();
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    setInput('');
    addMessage({ sender: 'user', text: userMsg, timestamp });
    startTask(`Companion replying: ${userMsg.slice(0, 40)}...`);

    // Pass conversation history for context-aware replies
    const lastMessages = messages.slice(-6).map(m => ({
      role: m.sender === 'user' ? 'user' as const : 'assistant' as const,
      content: m.text,
    }));

    const response = await generateAIResponse(userMsg, addTrace, currentModel, lastMessages);

    addMessage({
      sender: 'ai',
      text: response.text,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      model: response.model,
      latencyMs: response.latencyMs,
      costUsd: 0,
    });
    endTask();
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) recognitionRef.current.stop();
    else try { recognitionRef.current.start(); } catch {}
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const currentModel = modelRoutes.find(r => r.task === 'conversation_chat')?.model || 'llama-3.1-8b-instruct';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-sm sm:bg-zinc-950/30"
            onClick={onClose}
          />

          {/* Bottom Sheet on Mobile / Slide-in Panel on Desktop */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
            className="fixed bottom-0 left-0 right-0 z-50 
                       sm:bottom-auto sm:top-4 sm:right-4 sm:left-auto sm:w-[420px] sm:max-h-[80vh] sm:rounded-2xl
                       bg-white border border-zinc-200 rounded-t-2xl shadow-2xl 
                       flex flex-col overflow-hidden max-h-[85vh]"
          >
            {/* Handle bar for mobile */}
            <div className="flex justify-center pt-2 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-zinc-300" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200/70 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shrink-0 shadow-sm">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-zinc-900 font-display">AI Companion</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${isProcessing ? 'bg-blue-500 animate-pulse' : 'bg-emerald-400'}`} />
                  </div>
                  <p className="text-[10px] text-zinc-500 font-mono truncate">
                    {isProcessing ? 'Processing...' : `Ready · ${currentModel.split('-').slice(0, 2).join(' ')}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Provider Health Check */}
                <button
                  onClick={() => setIsHealthCheckOpen(true)}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 transition-colors cursor-pointer"
                  title="Provider Health & Token Usage"
                >
                  <Activity className="w-4 h-4" />
                </button>

                {/* Model Picker */}
                <div className="relative">
                  <button
                    onClick={() => setShowModelPicker(!showModelPicker)}
                    className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 transition-colors cursor-pointer"
                    title="Switch AI Model"
                  >
                    <Cpu className="w-4 h-4" />
                  </button>
                  <AnimatePresence>
                    {showModelPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute right-0 top-full mt-1 w-[240px] bg-white border border-zinc-200 rounded-xl shadow-xl z-50 p-1.5 space-y-0.5"
                      >
                        <p className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-wider px-2 pt-1 pb-1.5">Route Model</p>
                        {MODEL_OPTIONS.map(opt => (
                          <button
                            key={opt.id}
                            onClick={() => {
                              updateModelRoute('conversation_chat', opt.id);
                              setShowModelPicker(false);
                              addTrace('LLM Router', `route_task:chat->${opt.id}`, opt.id, 40, 8, 60, 0, 'success');
                            }}
                            className={`w-full text-left p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                              currentModel === opt.id
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'hover:bg-zinc-50 text-zinc-700 border border-transparent'
                            }`}
                          >
                            <div className="font-medium">{opt.name}</div>
                            <div className="text-[9px] text-zinc-400 font-mono mt-0.5">
                              <span className={`inline-block px-1.5 py-0.5 rounded-full border ${(() => {
                                const label = opt.apiProvider === 'groq' ? 'Groq' : opt.apiProvider === 'openrouter' ? 'OpenRouter' : 'Google Gemini';
                                return PROVIDER_COLORS[label] || 'bg-zinc-100 text-zinc-500 border-zinc-200';
                              })()}`}>
                                {opt.provider}
                              </span>
                              <span className="ml-1">· <span className={opt.tier === 'Fast' ? 'text-emerald-500' : 'text-amber-500'}>{opt.tier}</span></span>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button onClick={clearMessages} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 transition-colors cursor-pointer" title="Clear chat">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 transition-colors cursor-pointer" title="Close">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px] max-h-[50vh] sm:max-h-[55vh]">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[88%] ${msg.sender === 'user' ? 'order-1' : 'order-1'}`}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] text-zinc-400 font-mono">{msg.timestamp}</span>
                      {msg.sender === 'ai' && (
                        <span className="flex items-center gap-1 text-[9px] font-mono text-zinc-400">
                          <Bot className="w-2.5 h-2.5" /> AI
                        </span>
                      )}
                    </div>
                    <div className={`p-3 rounded-xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-sm'
                        : 'bg-zinc-50 border border-zinc-100 text-zinc-700 rounded-tl-sm'
                    }`}>
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    </div>
                    {msg.model && msg.sender === 'ai' && (
                      <div className="flex items-center gap-2 mt-1 text-[8px] font-mono text-zinc-400">
                        <Zap className="w-2.5 h-2.5" />
                        <span>{msg.model}</span>
                        {msg.latencyMs && <><Clock className="w-2.5 h-2.5" /><span>{msg.latencyMs}ms</span></>}
                      </div>
                    )}
                    {msg.model && msg.sender === 'ai' && (() => {
                      const modelOpt = MODEL_OPTIONS.find(m => m.id === msg.model || msg.model?.includes(m.id));
                      const provKey = modelOpt?.apiProvider || 'AI';
                      const provLabel = provKey === 'groq' ? 'Groq' : provKey === 'openrouter' ? 'OpenRouter' : provKey === 'gemini' ? 'Google Gemini' : 'AI';
                      const colorClass = PROVIDER_COLORS[provLabel] || 'bg-zinc-100 text-zinc-500 border-zinc-200';
                      return (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-full border ${colorClass}`}>
                            {provLabel}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
              ))}

              {/* Processing indicator */}
              {isProcessing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-start max-w-[88%] space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-blue-600">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                    AI Processing...
                  </div>
                  <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3 space-y-1.5 w-full">
                    <div className="flex items-center justify-between text-[8px] text-zinc-400 uppercase tracking-widest font-mono">
                      <span>Agent Monologue</span>
                      <span className="text-blue-500 animate-pulse">● processing</span>
                    </div>
                    <p className="text-[10px] text-zinc-600 font-mono italic">
                      <span className="text-blue-500 font-bold">&gt;</span> {THOUGHT_STEPS[currentThoughtIndex]}
                    </p>
                  </div>
                  <div className="flex gap-1 pl-1">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  </div>
                </motion.div>
              )}

              <div ref={scrollRef} />
            </div>

            {/* Suggested prompts */}
            <div className="px-4 pb-1.5 pt-0.5 flex flex-wrap gap-1.5 border-t border-zinc-100/80">
              {['Analyze top lead', 'Draft outreach pitch', 'Proposal strategy', 'Pipeline tips'].map(text => (
                <button
                  key={text}
                  onClick={() => { setInput(text); inputRef.current?.focus(); }}
                  className="text-[9px] bg-zinc-50 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 px-2 py-1 rounded-lg border border-zinc-200/80 font-mono cursor-pointer transition-colors shrink-0"
                >
                  {text}
                </button>
              ))}
            </div>

            {/* Input area */}
            <div className="p-3 border-t border-zinc-100/80 flex items-center gap-1.5 bg-white shrink-0">
              <button
                onClick={toggleListening}
                className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all cursor-pointer shrink-0 ${
                  isListening ? 'bg-red-50 border-red-200 text-red-500 animate-pulse' : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? 'Listening...' : 'Ask the AI companion...'}
                className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 placeholder:text-zinc-400"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isProcessing}
                className="w-9 h-9 flex items-center justify-center bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-200 disabled:cursor-not-allowed text-white rounded-lg transition-all cursor-pointer shrink-0 shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </>
      )}

      {/* Provider Health Check Modal */}
      <AIProviderHealthCheck
        isOpen={isHealthCheckOpen}
        onClose={() => setIsHealthCheckOpen(false)}
      />
    </AnimatePresence>
  );
}
