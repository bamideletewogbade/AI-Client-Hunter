import { useState, useEffect } from 'react';
import { 
  Sparkles, ArrowLeft, Heart, BarChart2, MessageSquare, 
  ThumbsUp, Calendar, AlertTriangle, ArrowUpRight, ArrowDownRight, 
  Share2, RefreshCw, Send, Check 
} from 'lucide-react';
import { Asset, Comment, Watchlist } from '../types';
import { sgtAgent } from '../agent';
import { useAuth } from './AuthContext';

interface AssetDetailPageProps {
  assetId: string;
  onBack: () => void;
  watchlistIds: string[];
  onToggleWatchlist: (assetId: string) => void;
}

export default function AssetDetailPage({ assetId, onBack, watchlistIds, onToggleWatchlist }: AssetDetailPageProps) {
  const { user } = useAuth();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'ai-analysis' | 'community' | 'news'>('overview');
  const [aiAnalysisCustom, setAiAnalysisCustom] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [commentReactionFilter, setCommentReactionFilter] = useState<'bullish' | 'bearish' | 'neutral' | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const loadAssetData = async () => {
    try {
      const result = await sgtAgent.dispatch({ type: 'FETCH_ASSET_DETAIL', assetId });
      setAsset(result.asset);
    } catch (e) {
      console.error(e);
    }
  };

  const loadCommunityDiscussions = async () => {
    try {
      const result = await sgtAgent.dispatch({ type: 'FETCH_DISCUSSIONS' });
      const linked = result.posts.find((d: any) => d.assetId === assetId);
      if (linked) {
        setComments(linked.comments || []);
      } else {
        setComments([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAssetData();
    loadCommunityDiscussions();
  }, [assetId]);

  const triggerFreshAiAnalysis = async () => {
    if (!asset) return;
    setLoadingAi(true);
    setAiAnalysisCustom(null);
    try {
      const result = await sgtAgent.dispatch({ type: 'AI_ANALYSIS', assetId: asset.id });
      setAiAnalysisCustom(result.analysis);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAi(false);
    }
  };

  const submitComment = async () => {
    if (!newCommentText.trim() || !asset) return;
    try {
      // Find the associated discussion or post it
      let discId = assetId === 'us-nvda' ? 'disc-1' : assetId === 'crypto-btc' ? 'disc-2' : '';
      if (!discId) {
        // create dynamic thread via agent
        const createResult = await sgtAgent.dispatch({
          type: 'CREATE_DISCUSSION',
          data: {
            sector: asset.type === 'crypto' ? 'crypto' : 'general',
            title: `Community outlook debate on ${asset.ticker}`,
            content: `What is your price expectation of ${asset.name} for this quarter?`,
            authorName: user?.displayName || "Local Investor",
            authorEmail: user?.email || "guest@sgtshow.com",
            assetId: asset.id
          }
        });
        if (createResult.success && createResult.id) {
          discId = createResult.id;
        }
      }

      if (!discId) {
        console.error('Could not find or create discussion thread');
        return;
      }

      const commentResult = await sgtAgent.dispatch({
        type: 'ADD_COMMENT',
        postId: discId,
        data: {
          content: newCommentText,
          authorName: user?.displayName || "Visitor Investor",
          authorEmail: user?.email || "guest@sgtshow.com",
          reaction: commentReactionFilter
        }
      });

      if (commentResult.success) {
        setNewCommentText('');
        setCommentReactionFilter(null);
        loadCommunityDiscussions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FE8C00] border-t-transparent" />
        <p className="mt-4 text-xs text-zinc-400 font-mono">retrieving asset parameters...</p>
      </div>
    );
  }

  const sign = asset.changePercent >= 0 ? '+' : '';
  const colorClass = asset.changePercent >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-500 font-bold';
  const stateColor = asset.sentiment === 'bullish' ? 'text-emerald-400 bg-emerald-500/10' : asset.sentiment === 'bearish' ? 'text-rose-400 bg-rose-500/10' : 'text-zinc-400 bg-zinc-800';

  const inWatchlist = watchlistIds.includes(asset.id);

  const exportText = `🧠 sgt show: AI Market Breakdown
Asset: ${asset.ticker} (${asset.name})
Price: ${asset.market === 'ngx' ? '₦' : '$'}${asset.price.toLocaleString()} (${sign}${asset.changePercent}%)
AI Sentiment Outlook: ${asset.sentiment.toUpperCase()}
Bullish Case: ${asset.bullishCase.slice(0, 100)}...
Analyze global markets simply @ Sgt Show!`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(exportText);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6 relative text-left">
      {/* Header and Back Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-805 bg-zinc-90 w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-85"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={() => onToggleWatchlist(asset.id)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold border transition-all cursor-pointer ${
              inWatchlist 
                ? 'border-[#FE8C00] bg-[#FE8C00]/10 text-[#FE8C00]' 
                : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white'
            }`}
          >
            <Heart className="h-4 w-4 fill-current" />
            {inWatchlist ? "Watchlisted" : "Add to Watchlist"}
          </button>

          <button 
            onClick={() => setShowShareModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-[#FE8C00] px-4 py-2.5 text-xs font-bold text-zinc-950 hover:bg-[#E07B00] transition-colors cursor-pointer"
          >
            <Share2 className="h-4 w-4" /> Share Card
          </button>
        </div>
      </div>

      {/* Asset Hero overview */}
      <div className="rounded-2xl border border-zinc-805 bg-zinc-950 p-6 flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#FE8C00]">
            {"Multi-Market Platform > " + asset.market.toUpperCase()}
          </span>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold text-white mt-2 leading-tight flex items-baseline gap-2.5">
            {asset.name}
            <span className="text-xs font-mono font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">{asset.ticker}</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-2.5 max-w-xl leading-relaxed">
            {asset.description}
          </p>
        </div>

        <div className="flex md:flex-col items-baseline md:items-end justify-between md:justify-center border-t md:border-t-0 border-l-0 md:border-l border-zinc-900/60 pt-4 md:pt-0 pl-0 md:pl-6 shrink-0 gap-2">
          <div>
            <span className="text-2xl font-black font-display text-white">
              {asset.market === 'ngx' ? '₦' : '$'}{asset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className={`text-xs ml-2 font-black ${colorClass}`}>
              {sign}{asset.changePercent}%
            </span>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase font-mono mt-1 ${stateColor}`}>
            {asset.sentiment} Outlook
          </span>
        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <div className="flex border-b border-zinc-900 overflow-x-auto hide-scrollbar">
        {(['overview', 'ai-analysis', 'community', 'news'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3.5 text-xs font-bold tracking-wide uppercase font-mono shrink-0 border-b-2 transition-all cursor-pointer ${
              activeTab === tab 
                ? 'border-[#FE8C00] text-[#FE8C00]' 
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="mt-4">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Fundamental stats */}
            <div className="lg:col-span-2 space-y-4">
              <div className="glass-panel p-5 text-left space-y-3">
                <h3 className="font-display text-sm font-bold text-white flex items-center gap-1.5 border-b border-zinc-900 pb-2">
                  <BarChart2 className="h-4.5 w-4.5 text-[#FE8C00]" />
                  Key Statistics / Parameters
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(asset.stats).map(([k, v]) => (
                    <div key={k} className="p-3 bg-zinc-900/30 rounded-xl">
                      <p className="text-[10px] text-zinc-500 lowercase uppercase first-letter:uppercase font-mono">
                        {k.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-xs font-bold text-white mt-1">{v || 'N/A'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Simple explanation */}
              <div className="glass-panel p-5 text-left space-y-2">
                <span className="text-[10px] font-mono tracking-wider font-extrabold text-[#FE8C05] uppercase">
                  FINANCIAL CLASS SIMPLIFIED
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                  {asset.beginnerExplanation}
                </p>
              </div>
            </div>

            {/* Quick Bullish / Bearish Sidebar */}
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 space-y-1.5">
                <h4 className="text-[11px] font-mono tracking-widest uppercase font-bold text-emerald-400">
                  Bullish Case
                </h4>
                <p className="text-xs text-zinc-300 leading-normal font-semibold">
                  {asset.bullishCase}
                </p>
              </div>

              <div className="p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10 space-y-1.5">
                <h4 className="text-[11px] font-mono tracking-widest uppercase font-bold text-rose-405">
                  Bearish Risk
                </h4>
                <p className="text-xs text-zinc-300 leading-normal font-semibold">
                  {asset.bearishCase}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai-analysis' && (
          <div className="glass-panel p-6 space-y-6 text-left glow-accent">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
              <div>
                <h3 className="font-display text-base font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="h-5 w-5 text-[#FE8C00] animate-pulse" />
                  Sgt Show AI Deep Intelligence Analysis
                </h3>
                <p className="text-[11px] text-zinc-500 font-medium">
                  Synthesizes sentiment triggers and real-time market movement dynamics instantly.
                </p>
              </div>

              <button 
                onClick={triggerFreshAiAnalysis}
                disabled={loadingAi}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-[#FE8C00] px-4.5 py-2.5 text-xs font-bold text-zinc-950 hover:bg-[#E07B00] transition-colors cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 ${loadingAi ? 'animate-spin' : ''}`} />
                {loadingAi ? 'Triggering Copilot...' : 'Ask Live Gemini Analysis'}
              </button>
            </div>

            {loadingAi ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#FE8C00] border-t-transparent" />
                <p className="text-xs text-zinc-400 font-mono">running server-side generative analysis with Google Search Grounding...</p>
              </div>
            ) : aiAnalysisCustom ? (
              <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/80 p-5 font-sans whitespace-pre-line text-xs leading-relaxed text-zinc-200">
                {aiAnalysisCustom}
              </div>
            ) : (
              <div className="space-y-5">
                <div className="p-4 bg-zinc-900/20 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase font-mono text-[#FE8C00]">Default AI Summary</h4>
                  <p className="text-xs text-zinc-300 leading-relaxed font-semibold">
                    The platform evaluates {asset.ticker} as highly active with dynamic triggers. If you are tracking this indicator in your long-term retail portfolio, look out for Naira-volatility shields (domestic) or interest rates policy tighter (global).
                  </p>
                </div>

                <div className="flex items-center justify-center py-4 border-t border-zinc-900/40">
                  <button 
                    onClick={triggerFreshAiAnalysis}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#FE8C00] hover:underline"
                  >
                    Click to load generative Gemini Analysis →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'community' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {/* Comment input form */}
              <div className="glass-panel p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300">Add Community Reply</span>
                  <div className="flex items-center gap-1 border border-zinc-800 rounded-lg p-0.5 bg-zinc-950">
                    {(['bullish', 'bearish', 'neutral'] as const).map((re) => (
                      <button
                        key={re}
                        onClick={() => setCommentReactionFilter(re === commentReactionFilter ? null : re)}
                        className={`text-[9px] font-mono uppercase px-2 py-1 rounded-md transition-colors ${
                          commentReactionFilter === re 
                            ? re === 'bullish' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 
                              re === 'bearish' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' : 
                              'bg-zinc-800 text-zinc-200 border border-zinc-700'
                            : 'text-zinc-500 hover:text-white'
                        }`}
                      >
                        {re}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask questions or post your outlook comment..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="flex-1 rounded-xl border border-zinc-800 bg-zinc-95 px-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#FE8C00]"
                  />
                  <button
                    onClick={submitComment}
                    className="p-2.5 rounded-xl bg-[#FE8C00] text-zinc-950 hover:bg-[#E07B00]"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Comments stream */}
              <div className="space-y-3">
                {comments.length === 0 ? (
                  <div className="glass-panel py-10 text-center text-zinc-500 text-xs">
                    Be the first to share your investment perspective on {asset.ticker}!
                  </div>
                ) : (
                  comments.map((com) => (
                    <div key={com.id} className="glass-panel p-4 flex gap-3 text-left">
                      <div className="h-8 w-8 rounded-xl bg-zinc-804 flex items-center justify-center font-bold text-zinc-400 border border-zinc-800">
                        {com.authorName.slice(0,2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-white">{com.authorName}</span>
                            <span className="text-[10px] text-zinc-500 ml-2 font-mono">
                              {new Date(com.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {com.reaction && (
                            <span className={`text-[8px] font-mono font-bold uppercase rounded px-1.5 py-0.5 ${
                              com.reaction === 'bullish' ? 'bg-emerald-500/10 text-emerald-400' :
                              com.reaction === 'bearish' ? 'bg-rose-500/10 text-rose-403' : 'bg-zinc-800 text-zinc-400'
                            }`}>
                              {com.reaction}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                          {com.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sidebar debate parameters */}
            <div className="glass-panel p-4 text-left h-fit space-y-4">
              <h4 className="font-display text-xs font-bold text-white uppercase tracking-wider">
                Debate Sentiments Summary
              </h4>

              <div className="rounded-xl bg-zinc-900/40 p-3.5 border border-zinc-800 space-y-2">
                <div className="flex items-center gap-1 text-[10px] font-mono font-extrabold text-[#FE8C00] tracking-wider">
                  <ThumbsUp className="h-3.5 w-3.5" />
                  SGT BOARD DEBATE NOTE
                </div>
                <p className="text-[11px] text-zinc-300 leading-normal font-semibold">
                  Most traders are following the FX-revaluation capacity. Telecom regulatory uncertainties are keeping active buyer volumes suppressed on communications lines.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'news' && (
          <div className="space-y-4">
            <h3 className="font-display text-base font-bold text-white flex items-center gap-1.5 border-b border-zinc-900 pb-2 text-left">
              <Calendar className="h-4.5 w-4.5 text-[#FE8C00]" />
              AI-Curated News Interpretations
            </h3>

            {asset.news.length === 0 ? (
              <div className="glass-panel py-10 text-center text-zinc-500 text-xs">
                No recent news entries for this asset.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {asset.news.map((n, i) => (
                  <div key={i} className="glass-panel p-5 text-left space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                        <span>{n.source}</span>
                        <span>{n.date}</span>
                      </div>
                      <h4 className="font-display text-sm font-bold text-white mt-1.5 leading-snug">
                        {n.title}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                        {n.summary}
                      </p>
                    </div>

                    {/* AI Interpretation */}
                    <div className="rounded-xl bg-[#FE8C00]/5 border border-[#FE8C00]/10 p-3.5">
                      <p className="text-[10px] font-mono font-bold text-[#FE8C00] tracking-wider uppercase">
                        AI Interpretation
                      </p>
                      <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                        {n.interpretation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Share Export Modal Overlay */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-zinc-950/70 backdrop-blur-sm" onClick={() => setShowShareModal(false)}>
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6 text-left shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto modal-bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
              <h3 className="font-display text-sm font-bold text-white flex items-center gap-1.5">
                <Share2 className="h-4 w-4 text-[#FE8C00]" />
                WhatsApp / Twitter Share Card
              </h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="text-xs text-zinc-500 hover:text-white font-mono"
              >
                Close
              </button>
            </div>

            {/* Simulated Visual card output preview */}
            <div className="rounded-xl border border-zinc-85/70 bg-gradient-to-br from-zinc-900 to-zinc-950 p-5 font-mono text-[11px] text-[#FE8C00] leading-relaxed select-all">
              <div className="flex items-center gap-1 mb-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                SGT SHOW PLATFORM EXPORT
              </div>
              <p className="text-zinc-200 mt-1">{exportText}</p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button 
                onClick={copyToClipboard}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-90 px-4 py-2.5 text-xs font-bold text-white hover:bg-zinc-80"
              >
                {copiedLink ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
                {copiedLink ? 'Copied Text!' : 'Copy to Clipboard'}
              </button>
              
              <a
                href={`https://wa.me/?text=${encodeURIComponent(exportText)}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
              >
                Send to WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
