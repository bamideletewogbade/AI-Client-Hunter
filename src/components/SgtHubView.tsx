import { useState, useEffect } from 'react';
import { Sparkles, Twitter, ExternalLink, RefreshCw, Send, Check } from 'lucide-react';
import { SgtShowInsight } from '../types';

interface SgtHubViewProps {
  onSelectAsset: (id: string) => void;
}

export default function SgtHubView({ onSelectAsset }: SgtHubViewProps) {
  const [insights, setInsights] = useState<SgtShowInsight[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Custom Simulator Tweet input
  const [newTweetInput, setNewTweetInput] = useState('');
  const [loadingAiParse, setLoadingAiParse] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const fetchInsights = async () => {
    try {
      const resp = await fetch('/api/insights');
      if (resp.ok) {
        setInsights(await resp.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const submitCreatorTweet = async () => {
    if (!newTweetInput.trim()) return;
    setLoadingAiParse(true);
    try {
      // Determine related assets keywords dynamically
      const lower = newTweetInput.toLowerCase();
      const tokens: string[] = [];
      if (lower.includes("gtco") || lower.includes("gtbank")) tokens.push("GTCO");
      if (lower.includes("mtn") || lower.includes("mtnn")) tokens.push("MTNN");
      if (lower.includes("btc") || lower.includes("bitcoin")) tokens.push("BTC");
      if (lower.includes("sol") || lower.includes("solana")) tokens.push("SOL");

      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newTweetInput,
          sentiment: lower.includes("🚀") || lower.includes("bullish") || lower.includes("buying") ? "bullish" : lower.includes("📉") || lower.includes("bearish") || lower.includes("selling") ? "bearish" : "neutral",
          relatedAssets: tokens
        })
      });

      if (response.ok) {
        setNewTweetInput('');
        setSuccessMsg(true);
        setTimeout(() => setSuccessMsg(false), 3000);
        fetchInsights();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAiParse(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Twitter Bridge Hero banner */}
      <div className="rounded-2xl border border-zinc-805 bg-gradient-to-br from-zinc-950/80 to-[#100b03] p-6 text-left space-y-3 relative glow-accent overflow-hidden">
        <Twitter className="absolute right-6 top-6 h-20 w-20 text-zinc-900/40 -rotate-12 pointer-events-none" />
        <span className="text-[10px] font-mono font-bold tracking-widest text-[#FE8C00] uppercase">
          Twitter Intelligence Bridge active
        </span>
        <h2 className="font-display text-lg md:text-xl font-extrabold text-white">Sgt Show Creator Hub</h2>
        <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
          Follow the primary digital signal voice of NGX. The portal ingests Twitter/X feeds and generates bite-sized, simplified summaries of complex financial announcements, removing institutional confusion.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left main: Simulated digital cards bridge */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-90 w-full pb-3">
            <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Twitter className="h-4.5 w-4.5 text-[#FE8C00]" />
              Recent Signal Feed Cards
            </h3>
            <button 
              onClick={fetchInsights} 
              className="p-1 px-2.5 rounded border border-zinc-800 text-[10px] font-mono text-zinc-400 hover:text-white flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Sync Feed
            </button>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#FE8C00] border-t-transparent" />
                <p className="text-xs text-zinc-400 font-mono mt-2">loading cards...</p>
              </div>
            ) : insights.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">No ingest history.</p>
            ) : (
              insights.map(card => (
                <div key={card.id} className="glass-panel p-5 space-y-4 relative overflow-hidden text-left bg-zinc-950/50">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <img 
                        src="https://images.unsplash.com/photo-1542206395-9feb3edaa68d?q=80&w=256&auto=format&fit=crop" 
                        alt="Sgt Show" 
                        className="h-8.5 w-8.5 rounded-xl object-cover border border-[#FE8C00]"
                      />
                      <div>
                        <span className="text-xs font-bold text-white flex items-center gap-1">
                          Sgt Show
                          <span className="bg-blue-500 text-[8px] px-1 rounded-sm text-white font-mono uppercase">Vetted</span>
                        </span>
                        <p className="text-[10px] text-zinc-400 font-mono">@SgtShow01</p>
                      </div>
                    </div>

                    <span className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase font-mono ${
                      card.sentiment === 'bullish' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' :
                      card.sentiment === 'bearish' ? 'bg-rose-500/10 text-rose-450 border border-rose-500/20' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {card.sentiment} outlook
                    </span>
                  </div>

                  {/* Original Tweet Area */}
                  <p className="text-xs text-zinc-200 mt-2 leading-relaxed italic border-l border-zinc-804 pl-3.5">
                    "{card.content}"
                  </p>

                  {/* AI platform translation card */}
                  <div className="rounded-xl border border-zinc-850 bg-gradient-to-tr from-zinc-90 to-zinc-950 p-4.5 space-y-1.5 text-left glow-accent">
                    <div className="flex items-center gap-1 text-[9px] font-mono font-bold tracking-widest text-[#FE8C00] uppercase">
                      <Sparkles className="h-4.5 w-4.5 animate-pulse text-[#FE8C00]" />
                      AI Simple English Breakout
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed font-semibold">
                      {card.aiSummary}
                    </p>

                    {card.assets && card.assets.length > 0 && (
                      <div className="flex items-center gap-1 pt-1">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase font-semibold">Related Indicators:</span>
                        {card.assets.map(tk => (
                          <span 
                            key={tk} 
                            onClick={() => {
                              const t = tk.toLowerCase();
                              const mapId = 
                                t === 'aapl' ? 'us-aapl' :
                                t === 'msft' ? 'us-msft' :
                                t === 'nvda' ? 'us-nvda' :
                                t === 'tsla' ? 'us-tsla' :
                                t === 'btc' ? 'crypto-btc' :
                                t === 'sol' ? 'crypto-sol' :
                                t === 'xau' ? 'commodity-gold' : '';
                              if (mapId) onSelectAsset(mapId);
                            }}
                            className="hover:underline text-[10px] cursor-pointer font-bold text-[#FE8C00] font-mono"
                          >
                            {tk}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column: Simulated tweet trigger tool & Migration instructions */}
        <div className="space-y-4 text-left">
          <div className="flex items-center justify-between border-b border-zinc-90 pb-3">
            <h3 className="font-display text-sm font-bold text-white flex items-center gap-1 text-left">
              Bridge Tool (Simulator)
            </h3>
          </div>

          {/* Simulated Tweet Ingest Form */}
          <div className="glass-panel p-5 space-y-3">
            <span className="text-[10px] font-mono tracking-wider font-extrabold text-[#FE8C00] uppercase">
              Ingest Signal Broadcast
            </span>
            <p className="text-[11px] text-zinc-400">
              Simulate Sgt Show tweeting. Paste a raw macro or earnings tweet below to trigger real-time AI summary breakdowns:
            </p>

            <textarea
              rows={4}
              placeholder="e.g. Oando PLC production numbers are soaring following NAOC acquisition. Upstream cash is king! 🚀🚀 #OANDO #NGX"
              value={newTweetInput}
              onChange={(e) => setNewTweetInput(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-95 px-4.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-[#FE8C00] resize-none"
            />

            {successMsg && (
              <p className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1 animate-bounce">
                <Check className="h-4.5 w-4.5" /> Signal Ingested! AI synthesis added to listings.
              </p>
            )}

            <button
              onClick={submitCreatorTweet}
              disabled={loadingAiParse}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#FE8C00] px-4.5 py-2.5 text-xs font-bold text-zinc-950 hover:bg-[#E07B00]"
            >
              <Send className="h-4 w-4 text-zinc-950" />
              {loadingAiParse ? 'Running Gemini Parser...' : 'Broadcast Tweet Signal'}
            </button>
          </div>

          {/* Official Migration instructions */}
          <div className="rounded-2xl border border-zinc-850 p-5 space-y-3">
            <h4 className="text-xs font-bold text-white">Turn on Tweet Notifications</h4>
            <p className="text-[11px] text-zinc-400 leading-normal">
              1. Search for <span className="text-[#FE8C00] font-bold">@SgtShow01</span> on Twitter.<br />
              2. Click the bell icon 🔔 to receive push notifications.<br />
              3. Our platform parses every asset ticker mentioned to update these cards instantly!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
