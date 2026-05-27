import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight, MessageSquare, ExternalLink } from 'lucide-react';
import { Asset, SgtShowInsight, DiscussionPost } from '../types';
import { sgtAgent } from '../agent';

interface SmartFeedProps {
  onSelectAsset: (id: string) => void;
  setActiveTab: (tab: any) => void;
}

export default function SmartFeedView({ onSelectAsset, setActiveTab }: SmartFeedProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [insights, setInsights] = useState<SgtShowInsight[]>([]);
  const [discussions, setDiscussions] = useState<DiscussionPost[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [r1, r2, r3] = await Promise.all([
        sgtAgent.dispatch({ type: 'FETCH_ASSETS' }),
        sgtAgent.dispatch({ type: 'FETCH_INSIGHTS' }),
        sgtAgent.dispatch({ type: 'FETCH_DISCUSSIONS' }),
      ]);
      setAssets(r1.assets);
      setInsights(r2.insights);
      setDiscussions(r3.posts);
    } catch (e) {
      console.error("Failed loading feed metrics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FE8C00] border-t-transparent" />
        <p className="mt-4 text-xs text-zinc-400 font-mono">synthesizing smart feed...</p>
      </div>
    );
  }

  // Computing dynamic statistics
  const trendingAssets = [...assets].sort((a,b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 3);
  const hotDiscussion = discussions[0];

  return (
    <div className="space-y-6">
      {/* Dynamic Header Brief */}
      <div className="rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-950 to-[#2c1303] border border-zinc-800 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 glow-accent">
        <div className="space-y-2 text-left md:max-w-xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FE8C00]/10 px-3 py-1 text-xs font-semibold text-[#FE8C00]">
            <Sparkles className="h-3.5 w-3.5" />
            Daily Intelligence Brief
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-white leading-tight">
            Global Semiconductor Moats & Heavy ETF Vacuuming
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed md:w-[94%]">
            The market is consolidating with institutional buyers supporting Bitcoin, while tech giants expand generative AI chips to secure explosive profit margins. Keep your head above the speculative noise.
          </p>
        </div>
        <button 
          onClick={() => setActiveTab('assistant')}
          className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2 rounded-xl bg-[#FE8C00] hover:bg-[#E07B00] px-5 py-3 text-xs font-bold text-zinc-950 transition-colors cursor-pointer glow-accent"
        >
          <Sparkles className="h-4 w-4" />
          Ask Sgt Show Copilot
        </button>
      </div>

      {/* Asset Mini ticker rail */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {assets.slice(0, 4).map((asset) => {
          const sign = asset.changePercent >= 0 ? '+' : '';
          const colorClass = asset.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-500';
          const Icon = asset.changePercent >= 0 ? ArrowUpRight : ArrowDownRight;
          return (
            <div 
              key={asset.id} 
              onClick={() => onSelectAsset(asset.id)}
              className="glass-panel glass-panel-hover p-4 text-left cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-500 tracking-wider">
                  {asset.market.toUpperCase()} • {asset.ticker}
                </span>
                <Icon className={`h-4 w-4 ${colorClass}`} />
              </div>
              <h3 className="text-sm font-bold mt-1 text-white">{asset.name}</h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xs font-bold text-zinc-200">
                  {asset.type === 'stock' && asset.market === 'ngx' ? '₦' : asset.type === 'crypto' || asset.market === 'us' ? '$' : ''}
                  {asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={`text-[10px] font-bold ${colorClass}`}>
                  {sign}{asset.changePercent}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Sgt Show Twitter Intelligence Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
              <span className="flex h-1.5 w-1.5 rounded-full bg-[#FE8C00]" />
              Sgt Show Twitter Feed Cards
            </h2>
            <button 
              onClick={() => setActiveTab('sgtshow')}
              className="text-xs font-semibold text-[#FE8C00] hover:underline flex items-center gap-1"
            >
              View Hub <ExternalLink className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-4">
            {insights.slice(0, 2).map((ins) => (
              <div key={ins.id} className="glass-panel p-5 space-y-3 relative group overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img 
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop" 
                      alt="Sgt Show" 
                      className="h-7 w-7 rounded-full object-cover border border-[#FE8C00]/40"
                    />
                    <div>
                      <span className="text-xs font-bold text-white">Sgt Show</span>
                      <p className="text-[9px] font-mono text-zinc-500">@SgtShow_Intel</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold font-mono uppercase ${
                    ins.sentiment === 'bullish' ? 'bg-emerald-500/10 text-emerald-400' :
                    ins.sentiment === 'bearish' ? 'bg-rose-500/10 text-rose-400' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {ins.sentiment} Outlook
                  </span>
                </div>

                <p className="text-xs text-zinc-305 italic pl-1 leading-relaxed border-l border-zinc-800">
                  "{ins.content}"
                </p>

                {/* AI Breakdown Card */}
                <div className="rounded-xl bg-zinc-90 w-full p-4 border border-zinc-850/60 font-sans space-y-1.5 text-left glow-accent">
                  <div className="flex items-center gap-1.5 text-[9px] font-mono tracking-widest font-bold text-[#FE8C00] uppercase">
                    <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                    AI Platform Breakdown
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed font-semibold">
                    {ins.aiSummary}
                  </p>
                  {ins.fullAnalysisId && (
                    <button 
                      onClick={() => onSelectAsset(ins.fullAnalysisId!)}
                      className="pt-1.5 text-[10px] font-bold text-[#FE8C00] hover:text-[#FFA133] transition-colors flex items-center gap-1"
                    >
                      Inspect Full Analysis →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Community Sentiment overview & Trending discussions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-[#FE8C00]" />
              Community Sentiment
            </h2>
          </div>

          {/* Sentiment Tracker Card */}
          <div className="glass-panel p-5 space-y-4 text-left">
            <div>
              <p className="text-xs text-zinc-400 font-semibold">Sector Sentiments Indexes</p>
              <div className="mt-2.5 space-y-3">
                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-zinc-300">Banking (NGX)</span>
                    <span className="text-emerald-400">82% Bullish</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: '82%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-zinc-300">Telecom (NGX)</span>
                    <span className="text-rose-400">57% Bearish</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500" style={{ width: '57%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-zinc-300">AI Stocks (US)</span>
                    <span className="text-emerald-400">76% Bullish</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: '76%', background: 'linear-gradient(to right, #FE8C00, #10B981)' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Hot Community Topic */}
            {hotDiscussion && (
              <div className="border-t border-zinc-800/60 pt-4 space-y-2">
                <span className="text-[9px] font-mono tracking-wider font-bold text-[#FE8C00] uppercase">
                  ACTIVE DISCUSSION
                </span>
                <h4 className="text-xs font-bold text-white line-clamp-1">
                  {hotDiscussion.title}
                </h4>
                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                  {hotDiscussion.content}
                </p>
                <button
                  onClick={() => setActiveTab('community')}
                  className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-[#FE8C00] hover:text-[#FFA133]"
                >
                  <MessageSquare className="h-3 w-3" />
                  {hotDiscussion.comments.length} replies • Enter Discussion
                </button>
              </div>
            )}
          </div>

          {/* Quick learning card */}
          <div className="rounded-2xl bg-gradient-to-br from-zinc-900/60 to-zinc-950/80 border border-zinc-805/70 p-5 text-left space-y-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-[#FE8C00]">
              <AlertTriangle className="h-4.5 w-4.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Simplified Investing: Rule #1</h4>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                "Price is what you pay. Value is what you get." In high-inflation or high-speculation environments, focus on global asset-magnates that generate high free cash flows and possess deep software or computing moats!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
