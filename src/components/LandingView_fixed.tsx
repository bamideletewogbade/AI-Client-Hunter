import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  Users, 
  Layers, 
  Bot, 
  ArrowUpRight, 
  ArrowRight, 
  ChevronRight, 
  ChevronDown,
  Coins, 
  Activity, 
  MessageSquare, 
  Twitter, 
  Globe, 
  Zap, 
  CheckCircle2, 
  ArrowDownRight,
  Shield,
  Star,
  RefreshCw,
  Flame,
  Calendar,
  Trophy,
  Milestone,
  Compass,
  Code,
  BarChart3,
  Lock,
  Unlock,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useAuth } from './AuthContext';
import { sgtAgent } from '../agent';
import IntelligenceMesh from './IntelligenceMesh';

// Tiny responsive Sparkline widget rendering clean area with gradient fills using recharts, loading data dynamically
function SparklineChart({ ticker, color, timeframe }: { ticker: string, color: string, timeframe: '1d' | '1w' | '1m' }) {
  const [data, setData] = useState<{ value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await sgtAgent.dispatch({ type: 'HISTORICAL_DATA', ticker, timeframe });
        if (active) {
          setData(result.data || []);
        }
      } catch (err) {
        console.error("Error fetching historical data:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => {
      active = false;
    };
  }, [ticker, timeframe]);

  // For Real-time feel on 1D charts, let's periodically query or subtly shift the last value
  useEffect(() => {
    if (timeframe !== '1d' || loading || data.length === 0) return;
    const interval = setInterval(() => {
      setData(prev => {
        if (prev.length === 0) return prev;
        const lastVal = prev[prev.length - 1].value;
        const delta = (Math.random() - 0.47) * (lastVal * 0.001);
        const nextVal = Number((lastVal + delta).toFixed(2));
        return [...prev.slice(1), { value: nextVal }];
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [timeframe, loading, data.length]);

  const gradientId = React.useMemo(() => `sparklineGlow-${ticker}-${timeframe}-${Math.random().toString(36).substr(2, 5)}`, [ticker, timeframe]);

  if (loading) {
    return (
      <div className="h-10 w-28 shrink-0 flex items-center justify-center bg-zinc-950/20 rounded-xl">
        <div className="h-3.5 w-3.5 animate-spin rounded-full border border-zinc-700 border-t-[#FE8C00]" />
      </div>
    );
  }

  return (
    <div className="h-10 w-28 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.35}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={1.5} 
            fillOpacity={1} 
            fill={`url(#${gradientId})`}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface LandingViewProps {
  setActiveTab: (tab: 'feed' | 'markets' | 'community' | 'watchlists' | 'sgtshow' | 'assistant') => void;
  onSelectAsset: (id: string) => void;
  onOpenAuthModal?: () => void;
}

export default function LandingView({ setActiveTab, onSelectAsset, onOpenAuthModal }: LandingViewProps) {
  // Timeframe states for dynamic historical sparkline rendering
  const [btcTimeframe, setBtcTimeframe] = useState<'1d' | '1w' | '1m'>('1d');
  const [nvdaTimeframe, setNvdaTimeframe] = useState<'1d' | '1w' | '1m'>('1d');
  const [aaplTimeframe, setAaplTimeframe] = useState<'1d' | '1w' | '1m'>('1d');

  // Community & Privacy State Variables & Handlers
  const [members, setMembers] = useState<any[]>([]);
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [editedBio, setEditedBio] = useState('');
  const [isProfilePublic, setIsProfilePublic] = useState(true);

  const loadMembers = async () => {
    try {
      const result = await sgtAgent.dispatch({ type: 'FETCH_MEMBERS' });
      const data = result.members;
      setMembers(data);
      if (user) {
        const self = data.find((m: any) => m.email?.toLowerCase() === user.email?.toLowerCase());
        if (self) {
          setUserProfile(self);
          setEditedBio(self.bio || '');
          setIsProfilePublic(self.isPublic !== false);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingSettings(true);
    try {
      const result = await sgtAgent.dispatch({
        type: 'SAVE_PROFILE',
        data: {
          displayName: user.displayName,
          bio: editedBio,
          isPublic: isProfilePublic,
        }
      });
      if (result.success) {
        loadMembers();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSettings(false);
    }
  };

  const [livePrices, setLivePrices] = useState({
    BTC: { price: 66530, change: '+4.20%', color: '#FFA133' },
    NVDA: { price: 940.25, change: '+2.45%', color: '#10B981' },
    AAPL: { price: 178.50, change: '+1.80%', color: '#38BDF8' }
  });

  // Dynamic live price variations to keep the screen active
  useEffect(() => {
    const priceInterval = setInterval(() => {
      setLivePrices(prev => {
        const btcDelta = (Math.random() - 0.47) * 45;
        const nvdaDelta = (Math.random() - 0.47) * 2.50;
        const aaplDelta = (Math.random() - 0.47) * 0.45;

        const nextBtc = Number((prev.BTC.price + btcDelta).toFixed(2));
        const nextNvda = Number((prev.NVDA.price + nvdaDelta).toFixed(2));
        const nextAapl = Number((prev.AAPL.price + aaplDelta).toFixed(2));

        return {
          BTC: {
            price: nextBtc,
            change: btcDelta >= 0 ? `+${(4.2 + (Math.random() * 0.05)).toFixed(2)}%` : `+${(4.1 + (Math.random() * 0.05)).toFixed(2)}%`,
            color: '#FFA133'
          },
          NVDA: {
            price: nextNvda,
            change: nvdaDelta >= 0 ? `+${(2.4 + (Math.random() * 0.04)).toFixed(2)}%` : `+${(2.3 + (Math.random() * 0.04)).toFixed(2)}%`,
            color: '#10B981'
          },
          AAPL: {
            price: nextAapl,
            change: aaplDelta >= 0 ? `+${(1.8 + (Math.random() * 0.03)).toFixed(2)}%` : `+${(1.7 + (Math.random() * 0.03)).toFixed(2)}%`,
            color: '#38BDF8'
          }
        };
      });
    }, 4500);

    return () => clearInterval(priceInterval);
  }, []);

  // Interactive poll state
  const [votedTickers, setVotedTickers] = useState<Record<string, 'bull' | 'bear'>>({});
  const [pollVotes, setPollVotes] = useState({
    BTC: { bull: 482, bear: 139 },
    NVDA: { bull: 295, bear: 42 },
    AAPL: { bull: 341, bear: 88 }
  });

  // Copilot simulated prompt state
  const [copilotPrompt, setCopilotPrompt] = useState<string | null>(null);
  const [copilotResponse, setCopilotResponse] = useState<string>('');
  const [isCopilotTyping, setIsCopilotTyping] = useState(false);

  // Stats incremental counter to simulate live tracking
  const [liveTriggersCount, setLiveTriggersCount] = useState({
    signals: 4829,
    activeTraders: 1422,
    insightsParsed: 19485
  });

  // State variables for Live Market Pulse grounded feed
  const [pulseLiveNews, setPulseLiveNews] = useState<any[]>([]);
  const [isPulseLoading, setIsPulseLoading] = useState(true);
  const [isPulseGrounded, setIsPulseGrounded] = useState(false);

  const fetchLiveMarketPulse = async () => {
    setIsPulseLoading(true);
    try {
      const result = await sgtAgent.dispatch({ type: 'MARKET_PULSE' });
      setPulseLiveNews(result.headlines || []);
      setIsPulseGrounded(!!result.grounded);
    } catch (e) {
      console.error("Failed to fetch market pulse breaking news:", e);
    } finally {
      setIsPulseLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveMarketPulse();
  }, []);

  // Expandable FAQ state & dataset
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const faqItems = [
    {
      question: "How do I start trading?",
      answer: "Since SGT Show is an information and intelligence sandbox, we do not directly execute or broker trades on our rails. To initiate real asset positioning, we suggest executing trades with a registered NGX broker (for equities like GTCO or Zenith Bank) or utilizing fully compliant digital commodity exchange networks."
    },
    {
      question: "Is the data live?",
      answer: "Yes! The multi-market asset telemetry updates every few seconds using our underlying intelligence grid connectors. You can witness real-time price variations, directional sentiment shifts, and synchronized websocket signal triggers streamed live straight to your dashboard."
    },
    {
      question: "What is the Sgt Show Intelligence Grid?",
      answer: "It is an opinionated market telemetry dashboard mapping Nigerian (NGX) equities, web3 digital asset currencies, and macroeconomic factors. The platform synthesizes direct news indices, Twitter feeds from @sgtshow_intel, and expert AI analysis."
    },
    {
      question: "How do I build and prioritize my manual watchlist?",
      answer: "Simply navigate to the Markets tab and select the heart icon on any asset to track it. In your Watchlist tab, you can drag individual asset cards using the left gripping handle icon to rearrange and prioritize your favorite assets easily."
    },
    {
      question: "Is the AI Intel Copilot secure?",
      answer: "Absolutely. Our AI synthesis engines proxy query inputs securely through server-side layers, evaluating real-time macro indices and underlying exchange hedges without exposing user data. This produces rapid, expert insights 24/7."
    }
  ];

  // Roadmap interactive filter state
  const [activeRoadmapFilter, setActiveRoadmapFilter] = useState<'all' | 'signals' | 'community'>('all');
  const [hoveredRoadmapId, setHoveredRoadmapId] = useState<string | null>(null);
  const [activeRoadmapSimulationId, setActiveRoadmapSimulationId] = useState<string | null>(null);

  // Simulation sandbox states for roadmap interactive previews
  const [simForexPair, setSimForexPair] = useState('USDNGN');
  const [simModelConfidence, setSimModelConfidence] = useState(78);
  const [simFeedLogs, setSimFeedLogs] = useState<string[]>([
    "Neural layer primed: USD/NGN buffer coefficients normalized.",
    "CBN sentiment statement decoded: neutral forward guidance.",
    "Macro liquidity desk loaded: weighted vector ready."
  ]);
  const [simBoardLeaderboard, setSimBoardLeaderboard] = useState([
    { rank: 1, user: 'Cap_Table_Analyst', verifiedAs: 'Verified Financial Accountant', karma: 12450, hits: '87%' },
    { rank: 2, user: 'SgtShow01', verifiedAs: 'Operator / Boots-on-Ground Researcher', karma: 10780, hits: '91%' },
    { rank: 3, user: 'DeltaScout_NG', verifiedAs: 'Accredited Community Scout', karma: 8340, hits: '79%' },
    { rank: 4, user: 'NaijaOracle', verifiedAs: 'Macro Analyst Trainee', karma: 6110, hits: '74%' },
  ]);
  const [simUserVoteSubmitted, setSimUserVoteSubmitted] = useState<string | null>(null);

  // Roadmap items data array
  const roadmapItems = [
    {
      id: 'rm-forex-ai',
      category: 'signals' as const,
      quarter: 'Q3 2026',
      status: 'Active Dev',
      icon: 'bot',
      accentBgColor: 'bg-amber-500/10',
      accentBorderColor: 'border-amber-500/20',
      accentTextColor: 'text-amber-400',
      title: 'Forex AI Signal Engine',
      metrics: '4.2K SIGNALS PARSED',
      sentiment: '+87% ACCURACY',
      summary: 'Real-time macro inference on USD/NGN and emerging market pairs with neural sentiment decoding. Streams CBN, IMF, and Fed statements for predictive alpha.',
      glowColor: '#FE8C00',
      expandedDetails: [
        'Neural NLP pipeline tuned for CBN policy statements and Fed FOMC minutes',
        'Live sentiment scoring from 20+ emerging market FX liquidity desks',
        'Automated alert triggers on NGN corridor breaches exceeding 1.2% variance',
        'Historical backtesting engine validates inference confidence against 6-month benchmarks',
      ],
    },
    {
      id: 'rm-community-lb',
      category: 'community' as const,
      quarter: 'Q3 2026',
      status: 'Active Dev',
      icon: 'trophy',
      accentBgColor: 'bg-emerald-500/10',
      accentBorderColor: 'border-emerald-500/20',
      accentTextColor: 'text-emerald-400',
      title: 'Community Scout Leaderboard',
      metrics: '142 ACTIVE SCOUTS',
      sentiment: '92% VERIFICATION RATE',
      summary: 'Verified boots-on-ground researchers curating vetted intelligence from local NGX desks and macro networks. Peer endorsements drive reputation scores.',
      glowColor: '#10B981',
      expandedDetails: [
        'Tiered verification badges (Scout, Analyst, Auditor, Operator) with progressive access',
        'Karma-weighted voting power on community sentiment polls and macro assessments',
        'On-chain attestation of research correctness for transparent audit trails',
        'Weekly accuracy leaderboard with XP rewards for top-ranked contributors',
      ],
    },
  ];
  
  // Sort roadmapItems: Active Dev items first, then Planning, then Proposed
  const sortedRoadmapItems = [...roadmapItems].sort((a, b) => {
    const statusOrder = ['Active Dev', 'Planning', 'Proposed'];
    return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
  });
  
  // Compute remaining roadmap items (after grid displays sorted items)
  const remainingRoadmapItems = sortedRoadmapItems.slice(0, sortedRoadmapItems.length);

  // Increment counter slightly to make the application feel highly dynamic and operating in real-time
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTriggersCount(prev => ({
        signals: prev.signals + (Math.random() > 0.6 ? 1 : 0),
        activeTraders: prev.activeTraders + (Math.random() > 0.85 ? 1 : Math.random() < 0.15 ? -1 : 0),
        insightsParsed: prev.insightsParsed + (Math.random() > 0.3 ? 1 : 0)
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Run simulated copilot text typing
  const handleCopilotPromptClick = (prompt: string, answer: string) => {
    if (isCopilotTyping) return;
    setCopilotPrompt(prompt);
    setIsCopilotTyping(true);
    setCopilotResponse('');
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < answer.length) {
        setCopilotResponse(prev => prev + answer.charAt(index));
        index++;
      } else {
        clearInterval(interval);
        setIsCopilotTyping(false);
      }
    }, 15);
  };

  const handleVote = (ticker: keyof typeof pollVotes, sentiment: 'bull' | 'bear') => {
    if (votedTickers[ticker]) return;

    // Trigger toast notification event
    const toastEvent = new CustomEvent('show-toast', {
      detail: {
        message: `Registered your ${sentiment === 'bull' ? 'BULLISH' : 'BEARISH'} vote for ${String(ticker)}!`,
        type: 'success'
      }
    });
    window.dispatchEvent(toastEvent);

    setVotedTickers(prev => ({ ...prev, [ticker]: sentiment }));
    setPollVotes(prev => ({
      ...prev,
      [ticker]: {
        ...prev[ticker],
        [sentiment]: prev[ticker][sentiment] + 1
      }
    }));
  };

  // Predefined prompts for interactive AI section
  const predefinedPrompts = [
    {
      question: "Why are Tier-1 Nigerian banks rising?",
      answer: "NGX bank tickers (Zenith, FBNH, GTCO) are capturing record high forex swap gains amid currency adjustments. This drives massive capital reserves, supporting reliable record-setting dividend payouts despite local macro headwinds."
    },
    {
      question: "Is there a real Bitcoin ETF support floor?",
      answer: "ETF inflows continue to vacuum liquid supply on Coinbase and OTC desks. On-chain metrics indicate heavy accumulation clustering between $62k - $65k, indicating strong institutional floor defense in medium horizons."
    },
    {
      question: "Stabilization plays for high NGN inflation?",
      answer: "Look to dual-listed equities acting as currency hedges (e.g. Seplat Energy, Airtel Africa) which generate key dividend yields pegged to foreign currencies, alongside selected dual stablecoin yield nodes."
    }
  ];

  // Features mapping
  const coreFeatures = [
    {
      id: 'feed' as const,
      tab: 'feed' as const,
      title: 'Smart Intelligence Feed',
      desc: 'Real-time multi-market signals, news parsing, and automated AI interpretations designed to keep institutional confusion out of your strategy.',
      icon: <Layers className="h-5 w-5 text-amber-500" />,
      tag: 'DAILY BREFS',
      glow: 'group-hover:shadow-[0_0_20px_rgba(254,140,0,0.15)]',
      color: '#FE8C00'
    },
    {
      id: 'markets' as const,
      tab: 'markets' as const,
      title: 'Multi-Market Indices & Assets',
      desc: 'Track NGX stocks, global cryptocurrencies, and US indicators. Deep-dive into metrics, price activity, and detailed metrics with a click.',
      icon: <TrendingUp className="h-5 w-5 text-[#10B981]" />,
      tag: 'REALTIME TRACKER',
      glow: 'group-hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]',
      color: '#10B981'
    },
    {
      id: 'sgtshow' as const,
      tab: 'sgtshow' as const,
      title: 'Sgt Show Insights Hub',
      desc: 'Get highly-opinionated, alpha-heavy Twitter insights from Sgt Show synchronized with live AI breakdowns to simplify complex narratives.',
      icon: <Twitter className="h-5 w-5 text-sky-400" />,
      tag: '@SGTSHOW_INTEL',
      glow: 'group-hover:shadow-[0_0_20px_rgba(56,189,248,0.15)]',
      color: '#38BDF8'
    },
    {
      id: 'assistant' as const,
      tab: 'assistant' as const,
      title: 'AI Intel Copilot',
      desc: 'Chat with our tailored generative system trained to cut through forex volatility, global equity hedges, and digital asset cycles.',
      icon: <Bot className="h-5 w-5 text-indigo-400" />,
      tag: '24/7 COPILOT',
      glow: 'group-hover:shadow-[0_0_20px_rgba(129,140,248,0.15)]',
      color: '#818CF8'
    },
    {
      id: 'community' as const,
      tab: 'community' as const,
      title: 'Debates & Community Hub',
      desc: 'Join high-quality community arguments. Vote on sentiments, challenge market actions, and view current member signals on core tickers.',
      icon: <Users className="h-5 w-5 text-pink-500" />,
      tag: 'COMMUNITY AGORA',
      glow: 'group-hover:shadow-[0_0_20px_rgba(236,72,153,0.15)]',
      color: '#EC4899'
    },
    {
      id: 'watchlists' as const,
      tab: 'watchlists' as const,
      title: 'Custom Investment Boards',
      desc: 'Track selected equities and digital assets. Build local watchlists with real-time feedback loops on daily volatility levels.',
      icon: <Star className="h-5 w-5 text-amber-200" />,
      tag: 'WATCHLISTS',
      glow: 'group-hover:shadow-[0_0_20px_rgba(253,230,138,0.15)]',
      color: '#FDE28A'
    }
  ];

  return (
    <div className="space-y-12 pb-12">
      {/* SECTION 1: HERO CONTAINER */}
      <div className="relative rounded-3xl overflow-hidden border border-zinc-800 bg-[#0C0C0E] bg-radial from-[#1e1003] via-[#0C0C0E] to-[#0C0C0E] px-4 sm:px-8 lg:px-12 py-14 sm:py-20 lg:py-24 text-center min-h-[500px] sm:min-h-[600px] flex flex-col items-center justify-center">
        {/* Intelligence Mesh background animation */}
        <IntelligenceMesh className="opacity-70 sm:opacity-100" />

        {/* Absolute ambient glow points */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] sm:w-[450px] lg:w-[550px] h-[200px] sm:h-[250px] lg:h-[300px] bg-gradient-to-b from-[#FE8C00]/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-12 w-[150px] sm:w-[220px] h-[150px] sm:h-[220px] bg-amber-500/5 blur-3xl pointer-events-none" />
        
        {/* Animated dynamic badge */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-1.5 text-xs font-semibold text-zinc-400"
        >
          <Sparkles className="h-3.5 w-3.5 text-[#FE8C00] animate-pulse" />
          <span>Multi-Market Intelligence System v2.6 ACTIVE</span>
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
        </motion.div>

        {/* Catchy dynamic header */}
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.1]"
        >
          Sgt Show Investing<br />
          <span className="bg-gradient-to-r from-[#FE8C00] via-[#FFA133] to-[#FE8C00] bg-clip-text text-transparent">
            Intelligence Grid
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-neutral-400 text-xs sm:text-sm leading-relaxed"
        >
          An opinionated financial playground mapping Nigerian Exchange (NGX) equities, digital currencies, and US indexes. Empowered with AI breakdowns, community sentinel debates, and actual real-time social streams. Anchored in a community-first driven approach to investing across various asset classes.
        </motion.p>

        {/* Dynamic Launch Triggers / Action Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto"
        >
          <button
            onClick={() => setActiveTab('feed')}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 rounded-xl bg-[#FE8C00] hover:bg-[#FFA522] px-7 py-3.5 text-xs font-bold text-zinc-950 transition-all transform hover:-translate-y-0.5 shadow-lg shadow-[#FE8C00]/20 cursor-pointer"
          >
            Launch Intelligence Feed
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setActiveTab('assistant')}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 rounded-xl border border-zinc-700 bg-zinc-900/40 hover:bg-zinc-900 px-7 py-3.5 text-xs font-bold text-white transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Bot className="h-4 w-4 text-[#FE8C00]" />
            Consult Sgt AI
          </button>
        </motion.div>

        {/* Real-time Ticker Ribbon Simulator */}
        <div className="mt-14 pt-8 border-t border-zinc-900/40 grid grid-cols-3 gap-3 max-w-3xl mx-auto">
          <div className="text-center p-3 rounded-xl bg-zinc-900/30 border border-zinc-900/50">
            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Active Signals</p>
            <span className="text-base sm:text-lg font-mono font-extrabold text-[#FE8C00]">
              {liveTriggersCount.signals.toLocaleString()}
            </span>
          </div>
          <div className="text-center p-3 rounded-xl bg-zinc-900/30 border border-zinc-900/50">
            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Intel Parsed</p>
            <span className="text-base sm:text-lg font-mono font-extrabold text-neutral-200">
              {liveTriggersCount.insightsParsed.toLocaleString()}
            </span>
          </div>
          <div className="text-center p-3 rounded-xl bg-zinc-900/30 border border-zinc-900/50">
            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Active Members</p>
            <span className="text-base sm:text-lg font-mono font-extrabold text-[#10B981]">
              {liveTriggersCount.activeTraders.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Real-time Recharts Sparkline Grid */}
        <div className="mt-8 pt-6 border-t border-zinc-900/40 max-w-3xl mx-auto">
          <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest font-bold mb-4 flex items-center justify-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            Live Market Activity Sparklines (Sgt Feed)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* BTC Card */}
            <div 
              onClick={() => {
                setActiveTab('markets');
                onSelectAsset('btc');
              }}
              className="group/spark cursor-pointer flex flex-col justify-between p-3.5 rounded-xl border border-zinc-900 bg-zinc-900/10 hover:border-[#FFA133]/60 hover:bg-[#FFA133]/5 transition-all text-left space-y-3"
            >
              <div className="flex items-center justify-between w-full">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono font-bold text-neutral-450 group-hover/spark:text-[#FFA133] transition-colors block">BTC / USD (CORE)</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-xs font-black text-white">${livePrices.BTC.price.toLocaleString()}</span>
                    <span className="font-mono text-[9px] font-bold text-emerald-400">{livePrices.BTC.change}</span>
                  </div>
                </div>
                <SparklineChart ticker="btc" color="#FFA133" timeframe={btcTimeframe} />
              </div>

              {/* BTC Timeframe Toggle Selector */}
              <div 
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 bg-zinc-950/65 p-0.5 rounded-lg border border-zinc-900 w-fit self-end"
              >
                {(['1d', '1w', '1m'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setBtcTimeframe(tf)}
                    className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                      btcTimeframe === tf 
                        ? 'bg-[#FFA133] text-zinc-950 shadow-sm' 
                        : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    {tf.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* NVDA Card */}
            <div 
              onClick={() => {
                setActiveTab('markets');
                onSelectAsset('us-nvda');
              }}
              className="group/spark cursor-pointer flex flex-col justify-between p-3.5 rounded-xl border border-zinc-900 bg-zinc-900/10 hover:border-[#10B981]/60 hover:bg-[#10B981]/5 transition-all text-left space-y-3"
            >
              <div className="flex items-center justify-between w-full">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono font-bold text-neutral-450 group-hover/spark:text-[#10B981] transition-colors block">NVIDIA (US EQUITIES)</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-xs font-black text-white">${livePrices.NVDA.price.toFixed(2)}</span>
                    <span className="font-mono text-[9px] font-bold text-emerald-400">{livePrices.NVDA.change}</span>
                  </div>
                </div>
                <SparklineChart ticker="nvda" color="#10B981" timeframe={nvdaTimeframe} />
              </div>

              {/* NVDA Timeframe Toggle Selector */}
              <div 
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 bg-zinc-950/65 p-0.5 rounded-lg border border-zinc-900 w-fit self-end"
              >
                {(['1d', '1w', '1m'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setNvdaTimeframe(tf)}
                    className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                      nvdaTimeframe === tf 
                        ? 'bg-[#10B981] text-zinc-950 shadow-sm' 
                        : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    {tf.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* AAPL Card */}
            <div 
              onClick={() => {
                setActiveTab('markets');
                onSelectAsset('us-aapl');
              }}
              className="group/spark cursor-pointer flex flex-col justify-between p-3.5 rounded-xl border border-zinc-900 bg-zinc-900/10 hover:border-[#38BDF8]/60 hover:bg-[#38BDF8]/5 transition-all text-left space-y-3"
            >
              <div className="flex items-center justify-between w-full">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono font-bold text-neutral-450 group-hover/spark:text-[#38BDF8] transition-colors block">APPLE INC (US BLUE CHIP)</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-xs font-black text-white">${livePrices.AAPL.price.toFixed(2)}</span>
                    <span className="font-mono text-[9px] font-bold text-[#38BDF8]">{livePrices.AAPL.change}</span>
                  </div>
                </div>
                <SparklineChart ticker="aapl" color="#38BDF8" timeframe={aaplTimeframe} />
              </div>

              {/* AAPL Timeframe Toggle Selector */}
              <div 
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 bg-zinc-950/65 p-0.5 rounded-lg border border-zinc-900 w-fit self-end"
              >
                {(['1d', '1w', '1m'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setAaplTimeframe(tf)}
                    className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                      aaplTimeframe === tf 
                        ? 'bg-[#38BDF8] text-zinc-950 shadow-sm' 
                        : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    {tf.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1.2: SGT SHOW FOUNDER & COMMUNITY PORTAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Founder credentials card (5 cols) */}
        <div className="lg:col-span-12 xl:col-span-5 rounded-2xl border border-zinc-900 bg-[#0C0C0E] bg-radial from-[#150d06] to-[#0C0C0E] p-6 text-left relative overflow-hidden flex flex-col justify-between space-y-5">
          {/* Header background light */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#FE8C00]/10 blur-3xl rounded-full pointer-events-none" />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[9px] font-mono font-bold tracking-widest text-[#FE8C00] uppercase">
                <Shield className="h-3 w-3 text-[#FE8C00]" />
                Sgt Verified Operator Profile
              </span>
              <Twitter className="h-4.5 w-4.5 text-sky-400" />
            </div>

            {/* Profile mimic layout */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#FE8C00] to-amber-600 flex items-center justify-center border-2 border-[#FE8C00] shadow-md shadow-[#FE8C00]/15 relative overflow-hidden">
                    <span className="font-display font-black text-white text-lg tracking-tighter">SGT</span>
                  </div>
                  <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-blue-500 border border-[#0C0C0E] flex items-center justify-center text-[8px] text-white font-bold" title="Blue Verified">✓</span>
                </div>
                <div>
                  <h3 className="font-display text-sm sm:text-base font-black text-white flex items-center gap-1.5 leading-none">
                    Sgt Show
                    <span className="bg-blue-500/10 text-[8px] px-1.5 py-0.5 rounded border border-blue-500/25 text-blue-400 font-mono uppercase font-black">Vetted</span>
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-mono mt-1.5">
                    <span className="text-[#FE8C00] font-black">@SgtShow01</span> • <span className="text-zinc-200 font-bold">30.5K</span> Followers
                  </p>
                </div>
              </div>

              {/* Bio & Details */}
              <div className="space-y-2 text-xs text-zinc-300 border-t border-zinc-900/40 pt-3">
                <p className="font-semibold text-neutral-200 leading-relaxed">
                  "Medically and tactically trained US Soldier."
                </p>
                
                <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-[9.5px] font-mono text-zinc-500 font-black uppercase tracking-wider">
                  <span>🗺️ Wildwood, MO</span>
                  <span>•</span>
                  <span>🎂 born sept 18</span>
                  <span>•</span>
                  <span>🗓️ joined jan 2011</span>
                </div>
              </div>

              {/* Pinned Tweet Showcase */}
              <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-4 space-y-2.5 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[8.5px] font-mono text-[#FE8C00] font-extrabold uppercase flex items-center gap-1">
                    📌 Pinned Bulletin
                  </span>
                  <span className="text-[8px] font-mono text-zinc-500">May 2026</span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed font-semibold italic">
                  "Yesterday, I spent 9hrs with my son in the ocean (fishing). We only caught a baby shark. We had to put it back in the wavy ocean."
                </p>
                <div className="pt-2 flex items-center gap-2 text-[9px] font-mono text-zinc-500 uppercase font-black border-t border-zinc-900/30">
                  <span>⚓ DISCIPLINE</span>
                  <span>•</span>
                  <span>🐟 FOCUS OVER FOMO</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-900/40 pt-3.5 flex justify-between items-center text-[10px] font-mono text-zinc-500 font-bold">
            <span>SGT SHOW HEADQUARTERS</span>
            <a 
              href="https://twitter.com/SgtShow01" 
              target="_blank" 
              rel="noreferrer" 
              className="text-[#FE8C00] hover:text-amber-400 hover:underline transition-colors"
            >
              @SgtShow01 Profile ↗
            </a>
          </div>
        </div>

        {/* Community & Ground Research highlights (7 cols) */}
        <div className="lg:col-span-12 xl:col-span-7 rounded-2xl border border-zinc-900 bg-[#0C0C0E] bg-radial from-[#0c1611] to-[#0C0C0E] p-6 text-left relative overflow-hidden flex flex-col justify-between space-y-6">
          {/* Header background light */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />

          <div className="space-y-4">
            <span className="flex items-center gap-1.5 text-[9px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Sovereign SGT Trading & Investment Community
            </span>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Join a sovereign network of vetted analysts, traders, and boots-on-ground researchers who share verified intelligence—no bots, no shills, no empty speculation.
            </p>
          </div>

          <div className="pt-4 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-[10px] text-zinc-500 font-mono tracking-wide uppercase font-bold">
              👥 Get early access to vetted intelligence—before institutional desks
            </div>
            <button
              onClick={() => setActiveTab('community')}
              className="w-full sm:w-auto text-[10.5px] font-mono font-black bg-emerald-500 hover:bg-emerald-600 text-zinc-950 px-5.5 py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-505/10"
            >
              Access Community Board
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-zinc-900 bg-zinc-950/20 p-5 sm:p-6 text-left space-y-4 relative overflow-hidden">
        {/* Aesthetic background mesh */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#FE8C00]/5 blur-3xl rounded-full pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-bold text-emerald-400 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                LIVE PULSE
              </span>
              {isPulseGrounded ? (
                <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[9px] font-bold text-amber-400 font-mono border border-amber-500/20">
                  <Globe className="h-2.5 w-2.5" />
                  GROUNDED WITH GOOGLE SEARCH
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-0.5 text-[9px] font-bold text-zinc-400 font-mono">
                  SIMULATED TELEMETRY FEED
                </span>
              )}
            </div>
            <h3 className="font-display text-lg font-black text-white flex items-center gap-2">
              <Flame className="h-4 w-4 text-[#FE8C00]" />
              Live Market Pulse
            </h3>
            <p className="text-xs text-neutral-400">
              Breaking financial indicators and equity catalysts parsed directly via core search intelligence.
            </p>
          </div>

          <button
            onClick={fetchLiveMarketPulse}
            disabled={isPulseLoading}
            className="self-start sm:self-center flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-950 text-neutral-300 hover:text-white px-3 py-1.5 text-xs font-mono font-bold transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 ${isPulseLoading ? 'animate-spin' : ''}`} />
            Refresh Pulse
          </button>
        </div>

        {/* Dynamic Infinite Marquee Ribbon */}
        {!isPulseLoading && pulseLiveNews.length > 0 && (
          <div className="relative flex overflow-hidden border-y border-zinc-900/80 bg-zinc-950/60 py-2 font-mono text-[10px] text-[#FE8C00] select-none rounded">
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes ticker-scroll {
                0% { transform: translate3d(0, 0, 0); }
                100% { transform: translate3d(-50%, 0, 0); }
              }
              .ticker-track {
                display: inline-flex;
                white-space: nowrap;
                animation: ticker-scroll 32s linear infinite;
              }
              .ticker-track:hover {
                animation-play-state: paused;
              }
            `}} />
            <div className="ticker-track flex gap-12 shrink-0">
              {/* Render twice for seamless looping */}
              {[...pulseLiveNews, ...pulseLiveNews].map((news, i) => (
                <span key={i} className="flex items-center gap-2 font-bold uppercase tracking-wide">
                  <span className="h-1 text-emerald-400 select-none">•</span>
                  <span className="text-neutral-400 text-[9px] bg-zinc-950 w-fit px-1.5 py-0.5 rounded border border-zinc-800">{news.source}</span>
                  <span className="text-white hover:text-[#FE8C05] transition-colors">{news.title}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Content State Handler */}
        {isPulseLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="rounded-xl border border-zinc-900/60 bg-zinc-900/10 p-4 space-y-3 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-16 bg-zinc-800 rounded" />
                  <div className="h-3 w-10 bg-zinc-800 rounded" />
                </div>
                <div className="h-4 w-3/4 bg-zinc-800 rounded" />
                <div className="space-y-2">
                  <div className="h-3 w-full bg-zinc-800/60 rounded" />
                  <div className="h-3 w-5/6 bg-zinc-800/60 rounded" />
                </div>
                <div className="h-10 w-full bg-zinc-900/40 rounded border border-zinc-800/40" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pulseLiveNews.map((news) => (
              <div 
                key={news.id} 
                className="group/pulse-card flex flex-col justify-between rounded-xl border border-zinc-900 bg-zinc-950/40 p-4.5 hover:border-zinc-800 hover:bg-zinc-900/10 transition-all text-left space-y-3 relative overflow-hidden"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="rounded bg-zinc-950 px-2 py-0.5 border border-zinc-800 text-neutral-300 font-bold group-hover/pulse-card:border-[#FE8C00]/30 group-hover/pulse-card:text-[#FE8C00] transition-colors">
                      {news.source}
                    </span>
                    <span className="text-zinc-500 font-bold">{news.time}</span>
                  </div>

                  <h4 className="font-display text-xs sm:text-sm font-bold text-white leading-snug group-hover/pulse-card:text-white transition-colors">
                    {news.title}
                  </h4>

                  <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                    {news.summary}
                  </p>
                </div>

                <div className="space-y-2.5">
                  {/* Sgt Show custom assessment Callout box */}
                  <div className="rounded-lg border-l-2 border-[#FE8C00] bg-zinc-900/50 p-2.5 text-[11px] font-semibold text-neutral-300 italic leading-normal">
                    <span className="text-amber-500 font-mono not-italic uppercase text-[9px] block tracking-widest font-extrabold mb-1">Impact Analysis:</span>
                    {news.impact}
                  </div>

                  <div className="flex justify-end pt-1">
                    <a
                      href={news.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#FE8C00] hover:text-amber-400 hover:underline cursor-pointer"
                    >
                      Retrieve Article <ArrowUpRight className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: THE CORE INTEL GRID WITH CARD HOVERS */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FE8C00]">
            INTELLIGENCE DECK
          </span>
          <h2 className="font-display text-2xl font-black text-white">
            Explore System Modules
          </h2>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Hover over elements to see live energy highlights. Tap any card directly to navigate to that workspace tab.
          </p>
        </div>

        {/* Stunning responsive 3D card layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coreFeatures.map((feat, index) => (
            <motion.div
              key={feat.id}
              onClick={() => {
                setActiveTab(feat.tab);
                const toastEvent = new CustomEvent('show-toast', {
                  detail: {
                    message: `Switched view to standard ${feat.title} workspace.`,
                    type: 'info'
                  }
                });
                window.dispatchEvent(toastEvent);
              }}
              whileHover={{ 
                y: -6, 
                scale: 1.015,
                borderColor: feat.color,
                boxShadow: `0 15px 35px -5px ${feat.color}25`
              }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
              className="group relative cursor-pointer rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-4 sm:p-6 flex flex-col justify-between text-left min-h-[200px] sm:min-h-[240px] lg:min-h-64 overflow-hidden"
            >
              {/* Animated top card light reflection */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-tr from-transparent to-white/[0.015] rounded-bl-full group-hover:bg-white/[0.025] transition-all" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  {/* Visual micro icon box */}
                  <div className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 group-hover:scale-110 transition-transform duration-300">
                    {feat.icon}
                  </div>
                  <span className="text-[9px] font-mono font-bold tracking-widest px-2 py-0.5 rounded-md border border-zinc-800 bg-zinc-900/40 text-neutral-400 group-hover:text-white transition-colors">
                    {feat.tag}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-display text-sm font-bold text-white group-hover:text-[#FE8C00] transition-colors flex items-center gap-1">
                    {feat.title}
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                    {feat.desc}
                  </p>
                </div>
              </div>

              {/* Card CTA trigger at bottom */}
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-zinc-500 group-hover:text-white mt-4 border-t border-zinc-900/60 pt-3">
                <span>Access Dashboard Workspace</span>
                <ChevronRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* SECTION 3: INTERACTIVE DYNAMIC SHOWCASES (VOTING & SIMULATOR) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* INTERACTIVE COMPONENT A: DYNAMIC TICKER SENTIMENT POLL */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6 text-left space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-900/60 pb-3">
            <div>
              <span className="text-[9px] font-mono tracking-widest font-bold text-[#FE8C00] uppercase">
                Sgt Wisdom Sentinel
              </span>
              <h3 className="font-display text-base font-bold text-white mt-1">
                Sentinel Sentiment Votes
              </h3>
            </div>
            <Activity className="h-4 w-4 text-[#FE8C00] animate-pulse" />
          </div>

          <p className="text-[11px] text-zinc-400 leading-normal">
            Market perception dictates real liquidation nodes. Vote your directional bias on core tickers to lock in sentiment curves.
          </p>

          <div className="space-y-4">
            {(Object.keys(pollVotes) as Array<keyof typeof pollVotes>).map((ticker) => {
              const total = pollVotes[ticker].bull + pollVotes[ticker].bear;
              const bullPercent = Math.round((pollVotes[ticker].bull / total) * 100);
              const bearPercent = 100 - bullPercent;
              const hasVoted = votedTickers[ticker];

              return (
                <div key={ticker} className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white font-mono">{ticker}</span>
                      <p className="text-[9px] text-zinc-500 uppercase tracking-wider">
                        {ticker === 'BTC' ? 'Digital Core' : ticker === 'DANGCEM' ? 'NGX Industrial' : 'NGX Finance'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!hasVoted ? (
                        <>
                          <button
                            onClick={() => handleVote(ticker, 'bull')}
                            className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-md bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 transition-all cursor-pointer"
                          >
                            Bullish
                          </button>
                          <button
                            onClick={() => handleVote(ticker, 'bear')}
                            className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-md bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/20 transition-all cursor-pointer"
                          >
                            Bearish
                          </button>
                        </>
                      ) : (
                        <span className="text-[9px] font-bold text-zinc-500 flex items-center gap-1 uppercase bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Voted {votedTickers[ticker]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progressive Sentiment Visual Bars */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 font-bold">
                      <span className="text-emerald-400">{bullPercent}% Bullish</span>
                      <span className="text-rose-400">{bearPercent}% Bearish</span>
                    </div>
                    
                    <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden flex">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${bullPercent}%` }}
                        transition={{ type: 'spring', stiffness: 80 }}
                        className="h-full bg-emerald-500" 
                      />
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${bearPercent}%` }}
                        transition={{ type: 'spring', stiffness: 80 }}
                        className="h-full bg-rose-500" 
                      />
                    </div>
                    <p className="text-[9px] text-zinc-500 text-right leading-none mt-1">
                      Total system votes: {total}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* INTERACTIVE COMPONENT B: COPILOT CONTEXT TERMINAL SIMULATOR */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6 text-left flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-900/60 pb-3">
              <div>
                <span className="text-[9px] font-mono tracking-widest font-bold text-[#FE8C00] uppercase">
                  AI Synthesis sandbox
                </span>
                <h3 className="font-display text-base font-bold text-white mt-1">
                  Interact Sgt Copilot
                </h3>
              </div>
              <Bot className="h-4.5 w-4.5 text-[#FE8C00]" />
            </div>

            <p className="text-[11px] text-zinc-400 leading-normal">
              Click any suggested topic key below. The system will synthesize raw asset parameters to compile an expert answer instantly.
            </p>

            {/* Quick Prompts Cloud */}
            <div className="flex flex-wrap gap-2">
              {predefinedPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCopilotPromptClick(p.question, p.answer)}
                  className={`px-3 py-2 text-left text-[11px] font-semibold rounded-xl border transition-all cursor-pointer ${
                    copilotPrompt === p.question 
                      ? 'bg-zinc-900 border-[#FE8C00] text-white font-bold' 
                      : 'bg-zinc-950/80 border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-800'
                  }`}
                >
                  {p.question}
                </button>
              ))}
            </div>

            {/* Output terminal window */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-4 font-mono select-none h-44 overflow-y-auto relative">
              <div className="absolute top-2.5 right-3 flex items-center gap-1 text-[8px] font-mono font-bold text-[#FE8C00]">
                {isCopilotTyping ? (
                  <>
                    <span className="animate-ping h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>SYNTHESIZING...</span>
                  </>
                ) : copilotPrompt ? (
                  <span>SYNTHESIS OK</span>
                ) : (
                  <span>STANDBY</span>
                )}
              </div>

              {!copilotPrompt ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-zinc-600">
                  <Bot className="h-7 w-7 mb-2 text-zinc-700 animate-bounce" />
                  <p className="text-[10px]">Select any prompt card above to initialize</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 uppercase font-bold tracking-wider">
                    <span className="text-[#FE8C00] font-sans font-black">▶</span> Query: "{copilotPrompt}"
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap">
                    {copilotResponse}
                    {isCopilotTyping && <span className="inline-block w-1.5 h-3 bg-[#FE8C00] ml-0.5 animate-pulse" />}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-zinc-900 flex justify-end">
            <button
              onClick={() => setActiveTab('assistant')}
              className="text-xs font-bold text-[#FE8C00] hover:text-[#FFA133] flex items-center gap-1 group/btn cursor-pointer"
            >
              Open Comprehensive Copilot 
              <ChevronRight className="h-4 w-4 transform group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 4.5: INTERACTIVE SOVEREIGN ROADMAP */}
      <div id="sgt-roadmaps-section" className="rounded-2xl border border-zinc-800 bg-[#0C0C0E] bg-radial from-[#120e09] to-[#0C0C0E] p-6 lg:p-8 text-left space-y-8 relative overflow-hidden">
        {/* Ambient header glow */}
        <div className="absolute top-0 right-[25%] w-72 h-72 bg-[#FE8C00]/5 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-[10%] w-60 h-60 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />

        {/* Title area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-900 pb-5">
          <div className="space-y-1">
            <span className="flex items-center gap-1.5 text-[9px] font-mono tracking-widest font-bold text-[#FE8C00] uppercase">
              <Compass className="h-3.5 w-3.5 text-[#FE8C00] animate-spin-slow" />
              Sovereign Development Roadmaps
            </span>
            <h3 className="font-display text-xl sm:text-2xl font-black text-white">
              Tactical Feature Pipeline & Sandbox
            </h3>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Explore custom analytics, community reputation vaults, and multi-broker simulation interfaces under preparation. Hover cards to reveal specifications; click <span className="text-[#FE8C00] font-bold">Try Interactive Preview</span> to run local simulated prototypes instantly.
            </p>
          </div>

          {/* Categories Tab Filter Selector */}
          <div className="flex flex-wrap gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-900 w-fit">              {(['all', 'signals', 'community'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => {
                    setActiveRoadmapFilter(filter);
                    setActiveRoadmapSimulationId(null); // Close simulators on filter swap
                  }}
                  className={`text-[9.5px] font-mono font-black uppercase px-3.5 py-2.5 rounded-lg border transition-all cursor-pointer ${
                    activeRoadmapFilter === filter
                      ? 'bg-[#FE8C00] text-zinc-950 border-[#FE8C00] shadow-sm shadow-[#FE8C00]/20'
                      : 'text-zinc-400 hover:text-white bg-zinc-900/40 border-transparent hover:bg-zinc-900'
                  }`}
                >
                  {filter === 'all' ? 'All Pipelines' : filter === 'signals' ? 'Signals & AI' : 'Reputation'}
                </button>
              ))}
          </div>
        </div>

        {/* Main Grid View */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
          {roadmapItems
            .filter((item) => activeRoadmapFilter === 'all' || item.category === activeRoadmapFilter)
            .map((item) => {
              const isHovered = hoveredRoadmapId === item.id;
              const isSimulating = activeRoadmapSimulationId === item.id;

              return (
                <div
                  key={item.id}
                  id={`roadmap-card-${item.id}`}
                  className="group relative rounded-2xl border border-zinc-900 bg-zinc-950/40 hover:bg-[#0E0E11]/80 hover:border-zinc-800 transition-all duration-350 p-5 flex flex-col justify-between space-y-5 overflow-hidden"
                  onMouseEnter={() => setHoveredRoadmapId(item.id)}
                  onMouseLeave={() => setHoveredRoadmapId(null)}
                  style={{
                    boxShadow: isHovered 
                      ? `0 10px 30px -10px ${item.glowColor}, inset 0 1px 0 0 rgba(255,255,255,0.03)` 
                      : 'inset 0 1px 0 0 rgba(255,255,255,0.01)'
                  }}
                >
                  <div className="space-y-3.5 z-10">
                    <div className="flex items-center justify-between">
                      {/* Quarter Badge */}
                      <span className="text-[10px] font-mono font-black border border-zinc-900 bg-zinc-900/50 px-2.5 py-1 rounded-md text-zinc-400 uppercase tracking-wider">
                        🎯 {item.quarter}
                      </span>

                      {/* Status pill */}
                      <span className={`text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded border ${
                        item.status === 'Active Dev' ? 'bg-amber-500/10 border-amber-500/20 text-[#FE8C00]' :
                        item.status === 'Planning' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        item.status === 'Proposed' ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' :
                        'bg-zinc-800/20 border-zinc-805 text-zinc-400'
                      }`}>
                        ● {item.status}
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl border shrink-0 ${item.accentBgColor} ${item.accentBorderColor}`}>
                        {item.icon === 'bot' && <Bot className={`h-5 w-5 ${item.accentTextColor}`} />}
                        {item.icon === 'trophy' && <Trophy className={`h-5 w-5 ${item.accentTextColor}`} />}
                        {item.icon === 'shield' && <Shield className={`h-5 w-5 ${item.accentTextColor}`} />}
                        {item.icon === 'compass' && <Compass className={`h-5 w-5 ${item.accentTextColor}`} />}
                      </div>
                      <div>
                        <h4 className="text-sm font-black font-display text-white group-hover:text-[#FE8C00] transition-colors">
                          {item.title}
                        </h4>
                        <span className="text-[8.5px] font-mono tracking-wider font-bold text-zinc-500 uppercase block mt-1.5">
                          SYSTEM META: {item.metrics} • {item.sentiment}
                        </span>
                      </div>
                    </div>

                    <p className="text-neutral-400 text-[11px] leading-relaxed font-semibold">
                      {item.summary}
                    </p>

                    {/* Hover Reveal Block */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="pt-3.5 border-t border-zinc-900/50 space-y-2.5"
                        >
                          <span className="text-[9px] font-mono font-bold text-[#FE8C00] uppercase block">
                            📋 Engineering Specifications:
                          </span>
                          <ul className="space-y-1.5">
                            {item.expandedDetails.map((bullet, idx) => (
                              <li key={idx} className="text-[10px] text-zinc-400 leading-normal flex items-start gap-1.5 font-semibold">
                                <span className={`text-[12px] leading-none shrink-0 ${item.accentTextColor}`}>▪</span>
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Sandbox Launcher */}
                  <div className="pt-3 border-t border-zinc-900 flex items-center justify-between gap-2 z-10">
                    <button
                      onClick={() => {
                        setActiveRoadmapSimulationId(isSimulating ? null : item.id);
                        if (!isSimulating) {
                          const toastEvent = new CustomEvent('show-toast', {
                            detail: {
                              message: `Booted interactive simulator for ${item.title}`,
                              type: 'info'
                            }
                          });
                          window.dispatchEvent(toastEvent);
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-lg text-[10px] sm:text-[10.5px] font-mono font-black uppercase px-4 py-2 bg-zinc-900 border border-zinc-803 cursor-pointer transition-all ${
                        isSimulating
                          ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
                          : 'text-[#FE8C00] hover:text-white hover:border-[#FE8C00]/50 hover:bg-zinc-850'
                      }`}
                    >
                      {isSimulating ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin text-rose-400" />
                          Shutdown Simulation
                        </>
                      ) : (
                        <>
                          <Zap className="h-3 w-3 text-[#FE8C00] animate-pulse" />
                          Try Interactive Preview
                        </>
                      )}
                    </button>
                    {!isSimulating && (
                      <span className="text-[9px] font-mono text-zinc-600 font-bold uppercase select-none">
                        Interactive Vetted Spec ↗
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Stateful Simulated Sandbox Panel */}
        <AnimatePresence>
          {activeRoadmapSimulationId && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-6 rounded-2xl border-2 border-dashed border-[#FE8C00]/35 bg-[#09090C] p-5 sm:p-6 text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-1 bg-[#FE8C00] text-zinc-950 text-[9px] font-mono font-black uppercase tracking-widest rounded-bl-xl shadow flex items-center gap-1">
                <span className="h-1.5 w-1.5 bg-zinc-950 rounded-full animate-ping" />
                Live Sandbox Simulation Terminal
              </div>

              {/* SIMULATOR A: AI Sentiment Forex Analyzer */}
              {activeRoadmapSimulationId === 'rm-forex-ai' && (
                <div className="space-y-4">
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-[#FE8C00] uppercase font-mono tracking-wider">
                      🧪 AI NLP Engine Sandbox [ACTIVE]
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Test feeding international and CBN currency declarations into the neural analyzer to compute immediate sentiment coefficients.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 align-top">
                    {/* Controls */}
                    <div className="md:col-span-4 space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono tracking-wide text-zinc-500 uppercase font-black">1. Choose Currency Pair</label>
                        <select
                          value={simForexPair}
                          onChange={(e) => {
                            setSimForexPair(e.target.value);
                            setSimFeedLogs(prev => [
                              `Swapped model weights focus to global pair: ${e.target.value}`,
                              ...prev.slice(0, 3)
                            ]);
                          }}
                          className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white p-2.5 rounded-lg focus:outline-none focus:border-[#FE8C00] cursor-pointer"
                        >
                          <option value="USDNGN">USD / NGN (Naira Spot Target)</option>
                          <option value="GBPNGN">GBP / NGN (Naira External)</option>
                          <option value="EURUSD">EUR / USD (Global Macro Pivot)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono tracking-wide text-zinc-500 uppercase font-black block">2. Model Temperature Coefficient</label>
                        <div className="flex items-center gap-3">
                          <input 
                            type="range" 
                            min="65" 
                            max="99" 
                            value={simModelConfidence}
                            onChange={(e) => setSimModelConfidence(Number(e.target.value))}
                            className="flex-1 accent-[#FE8C00] bg-zinc-900 cursor-pointer"
                          />
                          <span className="text-xs font-mono font-bold text-white shrink-0">{simModelConfidence}% Conf.</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const statements = [
                            `[CBN speech processed]: IMF advises flexible rate convergence. Risk indicator: Medium.`,
                            `[Federal Reserve release]: Hawkish FOMC meeting details detected. High pressure on emerging liquidity banks.`,
                            `[Spot desk matching]: Extreme buyer vacuum mapped around 1460 NGN/1 USD.`,
                            `[Macro pivot]: FX transaction volumes ticked up 17% in tier-1 bank ledger swap books.`
                          ];
                          const randomStatement = statements[Math.floor(Math.random() * statements.length)];
                          setSimFeedLogs(prev => [randomStatement, ...prev.slice(0, 4)]);
                          
                          const event = new CustomEvent('show-toast', {
                            detail: {
                              message: "Sovereign AI NLP Engine processed statements successfully!",
                              type: 'success'
                            }
                          });
                          window.dispatchEvent(event);
                        }}
                        className="w-full text-xs font-mono font-black text-zinc-950 bg-[#FE8C00] hover:bg-amber-500 py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-[#FE8C00]/10"
                      >
                        <Bot className="h-3.5 w-3.5" />
                        Execute Live AI Signal Probe
                      </button>
                    </div>

                    {/* Results Terminal outputs */}
                    <div className="md:col-span-8 flex flex-col justify-between rounded-xl bg-zinc-950 border border-zinc-900 p-4 min-h-[170px]">
                      <div className="space-y-2">
                        <span className="text-[9px] font-mono text-[#FE8C00] tracking-widest uppercase font-black block">
                          🛰️ AI Terminal Log Activity Feed
                        </span>
                        <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                          {simFeedLogs.map((log, idx) => (
                            <p key={idx} className="text-[10px] font-mono text-zinc-400 leading-normal flex items-start gap-1.5 font-semibold">
                              <span className="text-[#FE8C00] shrink-0">▋</span>
                              <span>{log}</span>
                            </p>
                          ))}
                        </div>
                      </div>

                      <div className="mt-3.5 pt-3 border-t border-zinc-900/60 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[9.5px] font-mono text-zinc-500 font-bold uppercase">
                          <span>Pair: <span className="text-white font-extrabold">{simForexPair}</span></span>
                          <span>•</span>
                          <span>Inference confidence: <span className="text-[#FE8C00] font-extrabold">{simModelConfidence}%</span></span>
                        </div>
                        <span className="text-[9.5px] font-mono text-emerald-400 font-extrabold flex items-center gap-1">
                          <span className="h-1.5 w-1.5 bg-emerald-450 rounded-full animate-pulse" />
                          HEDGE STABLE
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SIMULATOR B: Community Leaderboard Vetting */}
              {activeRoadmapSimulationId === 'rm-community-lb' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-emerald-400 uppercase font-mono tracking-wider">
                      🏆 Community Vetting & Representative Boards
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      See how members validate or reject other investors' boots-on-the-ground research records. Click "Endorse Vetted Thesis" to increase their reputation points!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                    {/* Leaderboard Simulator */}
                    <div className="md:col-span-8 bg-zinc-950 border border-zinc-950 rounded-xl overflow-hidden p-3.5">
                      <span className="text-[9px] font-mono text-emerald-400 font-extrabold uppercase tracking-wider block mb-2.5">
                        👥 TOP COMMITTED FUNDAMENTAL AUDITORS (SGT LEADERBOARD)
                      </span>
                      <div className="space-y-2">
                        {simBoardLeaderboard.map((scout) => (
                          <div 
                            key={scout.rank} 
                            className="bg-zinc-900/40 border border-zinc-900/60 flex items-center justify-between p-2.5 rounded-lg text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <span className={`text-[10px] font-mono font-black h-5 w-5 rounded flex items-center justify-center ${
                                scout.rank === 1 ? 'bg-[#FE8C00]/25 text-[#FE8C00]' :
                                scout.rank === 2 ? 'bg-emerald-455/25 text-emerald-400' :
                                'bg-zinc-800 text-zinc-500'
                              }`}>#{scout.rank}</span>
                              <div>
                                <h5 className="font-semibold text-white flex items-center gap-1">
                                  {scout.user}
                                  {scout.rank === 2 && <span className="text-[7.5px] px-1 bg-sky-500/10 border border-sky-500/20 rounded font-mono text-sky-400 uppercase">Founder</span>}
                                </h5>
                                <p className="text-[9.5px] text-neutral-500 font-mono">{scout.verifiedAs}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <span className="text-[10.5px] font-mono text-emerald-400 font-black">{scout.karma.toLocaleString()} XP</span>
                                <p className="text-[8.5px] text-zinc-500 font-mono uppercase font-bold">ACCURACY: {scout.hits}</p>
                              </div>
                              <button
                                onClick={() => {
                                  setSimBoardLeaderboard(prev => prev.map(item => {
                                    if (item.user === scout.user) {
                                      return { ...item, karma: item.karma + 150 };
                                    }
                                    return item;
                                  }));
                                  const customEvent = new CustomEvent('show-toast', {
                                    detail: {
                                      message: `Endorsed ${scout.user}'s research! Added +150 Reputation XP.`,
                                      type: 'success'
                                    }
                                  });
                                  window.dispatchEvent(customEvent);
                                }}
                                className="px-2.5 py-1.5 rounded-md border border-emerald-500/20 hover:border-emerald-500/40 text-[9px] font-mono font-black uppercase text-emerald-400 hover:bg-emerald-500/10 cursor-pointer transition-all"
                              >
                                Endorse Vetted Thesis
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Vetting rules checklist */}
                    <div className="md:col-span-4 flex flex-col justify-between p-4 rounded-xl border border-zinc-900 bg-zinc-950/25">
                      <div className="space-y-2.5">
                        <span className="text-[9.5px] font-mono text-zinc-500 font-black uppercase tracking-wider block">
                          🛡️ ACCREDITATION DETAILS
                        </span>
                        <p className="text-[10px] text-zinc-400 leading-normal font-semibold">
                          Representative standing is recalculating live on our index systems based on accuracy:
                        </p>
                        <div className="space-y-1.5 text-[10px] text-zinc-300 font-semibold font-mono">
                          <p className="flex items-center gap-1.5 text-zinc-400">
                            <span className="text-emerald-400">✔</span> Double-vetted Ledger Match
                          </p>
                          <p className="flex items-center gap-1.5 text-zinc-400">
                            <span className="text-emerald-400">✔</span> Staking rep on correctness
                          </p>
                          <p className="flex items-center gap-1.5 text-zinc-400">
                            <span className="text-emerald-400">✔</span> Live audits on CBN data
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-zinc-905">
                        <button
                          onClick={() => {
                            setSimUserVoteSubmitted("scout-tier-pending");
                            const evt = new CustomEvent('show-toast', {
                              detail: {
                                message: "Committed sovereign check-in. Applied for Vetting Auditing Tier!",
                                type: 'success'
                              }
                            });
                            window.dispatchEvent(evt);
                          }}
                          disabled={!!simUserVoteSubmitted}
                          className={`w-full text-center text-[10px] font-mono font-black uppercase py-2.5 rounded-lg transition-all border ${
                            simUserVoteSubmitted 
                              ? 'border-zinc-805 text-zinc-500 bg-zinc-950 cursor-not-allowed' 
                              : 'bg-emerald-500 border-emerald-500 text-zinc-950 hover:bg-emerald-600 cursor-pointer'
                          }`}
                        >
                          {simUserVoteSubmitted ? "✓ Vetting Application Submitted" : "Check-in as Anonymous Scout"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SECTION 5: INTERACTIVE FAQ ACCORDION */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6 lg:p-8 text-left space-y-6">
        <div className="border-b border-zinc-900 pb-4">
          <span className="text-[9px] font-mono tracking-widest font-bold text-[#FE8C00] uppercase">
            RESOURCES & HELP
          </span>
          <p className="text-xs text-zinc-400 mt-1">
            New to Sgt Show? Here is a breakdown of common questions and operational procedures.
          </p>
        </div>

        <div className="space-y-3.5 max-w-4xl">
          {faqItems.map((item, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div 
                key={index} 
                className="rounded-xl border border-zinc-900 bg-zinc-950/40 overflow-hidden transition-all duration-350"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left font-display text-sm font-bold text-white hover:text-[#FE8C00] hover:bg-zinc-900/10 transition-colors cursor-pointer select-none"
                >
                  <span>{item.question}</span>
                  <div className={`p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all transform duration-300 ${isOpen ? 'rotate-180 bg-zinc-800 text-[#FE8C00]' : ''}`}>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                    >
                      <div className="px-4 pb-4 pt-1.5 border-t border-zinc-900/40 text-xs text-zinc-400 leading-relaxed font-semibold">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}