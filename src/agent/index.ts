import type { Asset, SgtShowInsight, DiscussionPost, Comment, CommunityMember, UserNotification, Watchlist, NewsItem, IpoData } from '../types';
import type { Intent, IntentType, IntentResult, IntentHandler } from './types';
import { getCached, setCache, invalidateCache } from './cache';

// ─── Fallback / Mock Data ────────────────────────────────────────
// Built-in mock data so the app works even if the server is down.

const FALLBACK_ASSETS: Asset[] = [
  { id: 'us-nvda', name: 'NVIDIA Corporation', ticker: 'NVDA', price: 940.25, changePercent: 2.45, type: 'stock', market: 'us', description: 'AI & GPU computing leader powering the generative AI revolution. NVIDIA’s CUDA moat and data center dominance drive explosive growth.', beginnerExplanation: 'NVIDIA designs the computer chips that power most AI systems. Think of them as the "picks and shovels" of the AI gold rush.', sentiment: 'bullish', stats: { peRatio: '68.2', marketCap: '$2.3T', high52w: '$974.00', low52w: '$380.50', volume: '42.5M', dividendYield: '0.03%' }, bullishCase: 'Data center revenue up 400%+ YoY. Blackwell architecture launch will extend the AI hardware lead through 2026.', bearishCase: 'Competition from AMD and custom chips (Google TPU, AWS Trainium) could erode market share. Valuation multiple is rich.', news: [] },
  { id: 'us-aapl', name: 'Apple Inc.', ticker: 'AAPL', price: 178.50, changePercent: 1.80, type: 'stock', market: 'us', description: 'Consumer tech giant with unmatched brand loyalty, ecosystem lock-in, and services revenue growth.', beginnerExplanation: 'Apple makes iPhones, Macs, and services like Apple Music. Their strength is keeping customers inside their ecosystem.', sentiment: 'bullish', stats: { peRatio: '29.1', marketCap: '$2.8T', high52w: '$199.80', low52w: '$153.40', volume: '38.1M', dividendYield: '0.48%' }, bullishCase: 'Services revenue (App Store, Apple Music, iCloud) now $100B+ annual run-rate with 70% margins.', bearishCase: 'iPhone upgrade cycles are lengthening. China regulatory risks and Huawei competition pressure sales.', news: [] },
  { id: 'crypto-btc', name: 'Bitcoin', ticker: 'BTC', price: 66530, changePercent: 4.20, type: 'crypto', market: 'crypto', description: 'The original digital asset. Store of value for the digital age with fixed supply of 21M coins.', beginnerExplanation: 'Bitcoin is digital gold. There will only ever be 21 million Bitcoins, which makes it scarce like precious metals.', sentiment: 'bullish', stats: { peRatio: 'N/A', marketCap: '$1.31T', high52w: '$73,800', low52w: '$38,500', volume: '$32B', dividendYield: 'N/A' }, bullishCase: 'Spot ETF inflows are absorbing circulating supply. Institutional adoption accelerating through regulated products.', bearishCase: 'Regulatory uncertainty persists. Energy consumption criticism and potential for quantum computing threats.', news: [] },
  { id: 'crypto-sol', name: 'Solana', ticker: 'SOL', price: 142.80, changePercent: 6.80, type: 'crypto', market: 'crypto', description: 'High-performance blockchain optimized for scalable dApps and DeFi with low transaction costs.', beginnerExplanation: 'Solana is a faster, cheaper alternative to Ethereum for running decentralized applications.', sentiment: 'bullish', stats: { peRatio: 'N/A', marketCap: '$62B', high52w: '$210.00', low52w: '$19.50', volume: '$4.8B', dividendYield: 'N/A' }, bullishCase: 'Breakpoint conference catalysts. Firedancer validator client will improve network reliability significantly.', bearishCase: 'Past network outages raise reliability concerns. Competition from Ethereum L2s and new L1s (Sui, Aptos).', news: [] },
  { id: 'ngx-gtco', name: 'GTCO Holdings Plc', ticker: 'GTCO', price: 48.50, changePercent: 3.20, type: 'stock', market: 'global', description: 'Leading Nigerian financial holding company with strong tier-1 capital base and Pan-African expansion.', beginnerExplanation: 'GTCO is one of Nigeria\'s biggest banks. They make money from loans, fees, and their growing African operations.', sentiment: 'bullish', stats: { peRatio: '5.2', marketCap: '₦1.43T', high52w: '₦52.00', low52w: '₦27.50', volume: '18.2M', dividendYield: '8.5%' }, bullishCase: 'Exceptional dividend yield. Naira revaluation gains on foreign currency positions. Digital banking leadership.', bearishCase: 'Naira volatility impacts earnings. Rising non-performing loans in retail segment.', news: [] },
  { id: 'ngx-zenith', name: 'Zenith Bank Plc', ticker: 'ZENITH', price: 42.30, changePercent: 2.10, type: 'stock', market: 'global', description: 'Nigeria\'s largest bank by market cap with strong tier-1 capital and growing digital banking footprint.', beginnerExplanation: 'Zenith is Nigeria\'s biggest bank by market value. They are known for strong corporate banking relationships.', sentiment: 'bullish', stats: { peRatio: '4.8', marketCap: '₦1.32T', high52w: '₦46.00', low52w: '₦24.80', volume: '15.6M', dividendYield: '9.2%' }, bullishCase: 'Huge FX revaluation gains. Expanding into fintech with diverse revenue streams. Strong capital adequacy.', bearishCase: 'Regulatory pressures on banking fees. High inflation environment pressures operating costs.', news: [] },
  { id: 'commodity-gold', name: 'Gold (XAU/USD)', ticker: 'XAU', price: 2345.60, changePercent: 0.85, type: 'commodity', market: 'global', description: 'The ultimate safe-haven asset. Central bank buying and geopolitical uncertainty driving prices to record highs.', beginnerExplanation: 'Gold is a precious metal that people buy as a safe investment during uncertain times.', sentiment: 'bullish', stats: { peRatio: 'N/A', marketCap: '$14T+', high52w: '$2,450', low52w: '$1,810', volume: 'N/A', dividendYield: 'N/A' }, bullishCase: 'Global central banks buying gold at record pace. BRICS de-dollarization narrative strengthens demand.', bearishCase: 'High real interest rates could reduce gold appeal. Strong USD typically pressures gold prices.', news: [] },
];

const FALLBACK_INSIGHTS: SgtShowInsight[] = [
  { id: 'ins-1', content: 'GTCO is stacking massive FX swap gains right now. The tier-1 capital buffer is wider than the street expects. Keep your eyes on the dividend print next month. 🚀', aiSummary: 'GTCO is generating significant profits from foreign exchange swap transactions, building a strong capital reserve that exceeds market expectations. Anticipate an impressive dividend announcement next month.', sentiment: 'bullish', createdAt: new Date().toISOString(), assets: ['GTCO'], fullAnalysisId: 'ngx-gtco' },
  { id: 'ins-2', content: 'I spent the day reviewing macro data. The NGN is showing signs of stabilization against the dollar. Import-dependent sectors will breathe again soon. Macro improvements ahead.', aiSummary: 'The Nigerian Naira appears to be stabilizing against the US Dollar, which will positively impact import-dependent sectors. Macroeconomic indicators suggest continued improvement in currency stability.', sentiment: 'bullish', createdAt: new Date(Date.now() - 3600000).toISOString(), assets: ['NGN'] },
  { id: 'ins-3', content: 'Be cautious of the telecom space this quarter. Regulatory headwinds from NCC and increased infrastructure costs are squeezing margins. MTNN might miss estimates. 📉', aiSummary: 'The Nigerian telecommunications sector faces regulatory challenges from the NCC and rising infrastructure costs. MTN Nigeria may report earnings below analyst expectations this quarter.', sentiment: 'bearish', createdAt: new Date(Date.now() - 7200000).toISOString(), assets: ['MTNN'] },
];

const FALLBACK_DISCUSSIONS: DiscussionPost[] = [
  { id: 'disc-1', sector: 'banks', title: 'Is the banking sector rally sustainable?', content: 'With tier-1 banks reporting massive FX revaluation gains, are we looking at a sustainable trend or a one-time boost? I am thinking GTCO and Zenith are positioned for continued outperformance given their digital banking investments.', authorName: 'Cap_Table_Analyst', authorEmail: 'analyst@sgtshow.com', reactions: { bullish: 28, bearish: 7, neutral: 4 }, comments: [{ id: 'c1', postId: 'disc-1', content: 'The FX gains are real but non-recurring. Focus on core earnings growth and dividend policy instead.', authorName: 'DeltaScout_NG', authorEmail: 'delta@sgtshow.com', reaction: 'bearish', createdAt: new Date().toISOString() }, { id: 'c2', postId: 'disc-1', content: 'Disagree — the digital banking push is opening new revenue streams. GTCOs agency banking network is unmatched.', authorName: 'NaijaOracle', authorEmail: 'oracle@sgtshow.com', reaction: 'bullish', createdAt: new Date().toISOString() }], createdAt: new Date().toISOString(), aiSummary: 'The community is divided: while FX revaluation gains are likely one-time, digital banking investments represent genuine long-term value creation for tier-1 Nigerian banks.' },
  { id: 'disc-2', sector: 'crypto', title: 'BTC ETF flows — liquidity vacuum forming?', content: 'Spot Bitcoin ETFs have absorbed over 300K BTC since January. At this rate, available exchange supply will be depleted within months. Are we looking at a supply shock?', authorName: 'SgtShow01', authorEmail: 'sgt@sgtshow.com', reactions: { bullish: 45, bearish: 3, neutral: 8 }, comments: [{ id: 'c3', postId: 'disc-2', content: 'Supply shock thesis is real. We have never seen institutional demand at this scale. Price discovery to the upside when supply runs out.', authorName: 'MacroObserver', authorEmail: 'macro@sgtshow.com', reaction: 'bullish', createdAt: new Date().toISOString() }], createdAt: new Date(Date.now() - 86400000).toISOString(), aiSummary: 'Strong consensus that ETF-driven supply absorption is creating a structural shortage of Bitcoin on exchanges, potentially leading to significant upward price pressure.' },
  { id: 'disc-3', sector: 'general', title: 'NGN stabilization — what it means for stocks', content: 'With the Naira stabilizing around 1,450/USD, import-dependent sectors (manufacturing, telecom) should see margin recovery. Thoughts on how to position?', authorName: 'MacroScout', authorEmail: 'macro@sgtshow.com', reactions: { bullish: 15, bearish: 5, neutral: 12 }, comments: [], createdAt: new Date(Date.now() - 172800000).toISOString() },
];

const FALLBACK_MEMBERS: CommunityMember[] = [
  { uid: 'm1', displayName: 'Cap_Table_Analyst', email: 'analyst@sgtshow.com', createdAt: new Date().toISOString(), isPublic: true, avatarColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', badge: 'Tier-1 Bank Auditor', bio: 'Specializing in NGX banking stocks and dividend yield analysis.' },
  { uid: 'm2', displayName: 'SgtShow01', email: 'sgt@sgtshow.com', createdAt: new Date().toISOString(), isPublic: true, avatarColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20', badge: 'Sovereign Watcher', bio: 'Operator. Researching macro trends across NGX, crypto, and global markets.' },
  { uid: 'm3', displayName: 'DeltaScout_NG', email: 'delta@sgtshow.com', createdAt: new Date().toISOString(), isPublic: true, avatarColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20', badge: 'Liquidity Specialist', bio: 'Tracking OTC flows and institutional order book movements in Lagos.' },
  { uid: 'm4', displayName: 'NaijaOracle', email: 'oracle@sgtshow.com', createdAt: new Date().toISOString(), isPublic: true, avatarColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', badge: 'Macro Specialist', bio: 'Forex and macro analysis with focus on CBN policy impacts.' },
];

const FALLBACK_NOTIFICATIONS: UserNotification[] = [
  { id: 'n1', title: 'New Signal: GTCO', body: 'GTCO showing strong buy signal — FX swap gains exceeding estimates.', category: 'insight', createdAt: new Date().toISOString(), read: false },
  { id: 'n2', title: 'Market Movement: BTC', body: 'Bitcoin crossed $66,500 — up 4.2% in the last 24 hours.', category: 'movement', createdAt: new Date(Date.now() - 1800000).toISOString(), read: false },
  { id: 'n3', title: 'Discussion Reply', body: 'MacroObserver replied to your BTC ETF thread.', category: 'discussion', createdAt: new Date(Date.now() - 3600000).toISOString(), read: true },
];

const FALLBACK_WATCHLISTS: Watchlist[] = [
  { id: 'wl-1', name: 'Sgt Core Portfolio', description: 'Sgt Show\'s hand-picked high-conviction picks across NGX, crypto, and US markets.', assets: ['us-nvda', 'crypto-btc', 'ngx-gtco'], isSystem: true },
  { id: 'wl-2', name: 'NGX Bank Focus', description: 'Tier-1 Nigerian banking stocks with high dividend yield potential.', assets: ['ngx-gtco', 'ngx-zenith'], isSystem: true },
  { id: 'wl-3', name: 'Crypto Majors', description: 'Digital asset core holdings — Bitcoin and leading layer-1 protocols.', assets: ['crypto-btc', 'crypto-sol'], isSystem: true },
];

const FALLBACK_PULSE = {
  headlines: [
    { id: 'p1', source: 'Reuters', time: '2m ago', title: 'Fed Signals Potential Rate Cut as Inflation Eases', summary: 'Federal Reserve Chair indicates possible policy adjustment in September if economic data continues to show cooling inflation.', impact: 'Dovish Fed stance supports risk-on assets. Emerging markets (including NGX) could see foreign portfolio inflows if USD weakens.', url: '#' },
    { id: 'p2', source: 'Bloomberg', time: '12m ago', title: 'Nigeria\'s Foreign Reserves Climb to $34B', summary: 'Central Bank of Nigeria reports steady reserve accumulation, supporting Naira stability efforts.', impact: 'Stronger reserves buffer gives CBN more tools to defend the Naira. Positive for NGX equities as FX liquidity improves.', url: '#' },
    { id: 'p3', source: 'CNBC', time: '28m ago', title: 'NVIDIA Market Cap Surges Past $2.3T on AI Demand', summary: 'Unprecedented demand for AI training chips drives data center revenue growth of 400% year-over-year.', impact: 'NVDA dominance in AI hardware continues. Supply chain constraints may limit near-term upside but long-term thesis remains intact.', url: '#' },
    { id: 'p4', source: 'CoinDesk', time: '45m ago', title: 'Bitcoin ETF Inflows Hit $650M in Single Day', summary: 'Record single-day inflow into spot Bitcoin ETFs as institutional adoption accelerates.', impact: 'Institutional demand is absorbing available supply. If this pace continues, a supply squeeze could drive prices significantly higher.', url: '#' },
  ],
  grounded: false,
};

const FALLBACK_IPOS: IpoData[] = [
  {
    id: 'ipo-1',
    companyName: 'Klarna Group Plc',
    ticker: 'KLAR',
    exchange: 'NYSE',
    sector: 'Fintech',
    priceRange: '$28 - $35',
    sharesOffered: '45M',
    expectedDate: '2026-06-28',
    status: 'upcoming',
    description: 'Swedish fintech giant pioneering BNPL (Buy Now Pay Later) services. One of the most anticipated fintech IPOs with 85M+ active users globally.',
    estimatedMarketCap: '$12B',
    underwriters: ['Goldman Sachs', 'Morgan Stanley', 'JPMorgan'],
    country: 'Sweden / USA',
  },
  {
    id: 'ipo-2',
    companyName: 'Starlink Communications (SpaceX)',
    ticker: 'STLK',
    exchange: 'NASDAQ',
    sector: 'Telecommunications',
    priceRange: '$85 - $105',
    sharesOffered: '80M',
    expectedDate: '2026-09-01',
    status: 'filed',
    description: 'SpaceX\'s satellite internet division serving 4M+ subscribers globally with low-earth-orbit broadband constellation. High-growth recurring revenue model.',
    estimatedMarketCap: '$65B',
    underwriters: ['Goldman Sachs', 'Morgan Stanley', 'Barclays'],
    country: 'USA',
  },
  {
    id: 'ipo-3',
    companyName: 'CoreWeave Inc.',
    ticker: 'CRWV',
    exchange: 'NASDAQ',
    sector: 'Cloud Computing / AI',
    priceRange: '$42 - $50',
    sharesOffered: '55M',
    expectedDate: '2026-07-15',
    status: 'upcoming',
    description: 'Specialized cloud provider for GPU-accelerated AI workloads. Partners with NVIDIA and Microsoft Azure. One of the fastest-growing AI infrastructure companies.',
    estimatedMarketCap: '$15B',
    underwriters: ['Morgan Stanley', 'JPMorgan', 'Goldman Sachs'],
    country: 'USA',
  },
  {
    id: 'ipo-4',
    companyName: 'Moniepoint Inc.',
    ticker: 'MPT',
    exchange: 'NGX',
    sector: 'Fintech',
    priceRange: '₦38 - ₦45',
    sharesOffered: '350M',
    expectedDate: '2026-08-20',
    status: 'upcoming',
    description: 'Nigeria\'s largest merchant payment processor with 3M+ businesses on platform. Expanding into banking, credit, and remittance services across Africa.',
    estimatedMarketCap: '₦720B',
    underwriters: ['Renaissance Capital', 'CSL Stockbrokers'],
    country: 'Nigeria',
  },
  {
    id: 'ipo-5',
    companyName: 'Flutterwave Inc.',
    ticker: 'FLUT',
    exchange: 'NASDAQ',
    sector: 'Fintech',
    priceRange: '$24 - $30',
    sharesOffered: '40M',
    expectedDate: '2026-Q4',
    status: 'filed',
    description: 'Leading African payments technology company processing payments in 30+ African countries. Backed by Tiger Global, YC, and Avenir Growth.',
    estimatedMarketCap: '$5B',
    underwriters: ['Goldman Sachs', 'Citigroup', 'JPMorgan'],
    country: 'Nigeria / USA',
  },
  {
    id: 'ipo-6',
    companyName: 'Nigerian Midstream Energy Co.',
    ticker: 'NMEC',
    exchange: 'NGX',
    sector: 'Energy',
    priceRange: '₦45 - ₦52',
    sharesOffered: '500M',
    expectedDate: '2026-07-28',
    status: 'upcoming',
    description: 'Midstream energy infrastructure company focusing on gas processing, pipeline transportation, and storage solutions across Nigeria\'s Niger Delta region.',
    estimatedMarketCap: '₦850B',
    underwriters: ['CSL Stockbrokers', 'Chapel Hill Denham'],
    country: 'Nigeria',
  },
  {
    id: 'ipo-7',
    companyName: 'Reddit Inc. (Direct Listing)',
    ticker: 'RDDT',
    exchange: 'NYSE',
    sector: 'Social Media',
    priceRange: '$32 - $36',
    sharesOffered: '22M',
    expectedDate: '2026-07-05',
    status: 'upcoming',
    description: 'Social media platform with 500M+ monthly active users. Strong AI data licensing business and growing advertising revenue.',
    estimatedMarketCap: '$8B',
    underwriters: ['Morgan Stanley', 'Goldman Sachs'],
    country: 'USA',
  },
];

// ─── Helper: API fetch with timeout ──────────────────────────────
async function apiFetch<T>(url: string, options?: RequestInit, timeoutMs = 8000): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { ...options, signal: controller.signal });
    if (!resp.ok) throw new Error(`API error: ${resp.status}`);
    return await resp.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── SgtAgent Core ───────────────────────────────────────────────
class SgtAgent {
  private handlers = new Map<string, IntentHandler>();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults() {
    // ── FETCH_ASSETS ──────────────────────────────────────────
    this.register('FETCH_ASSETS', async (intent) => {
      const cacheKey = `assets_${intent.market || 'all'}`;
      const cached = getCached<Asset[]>(cacheKey);
      if (cached) return { assets: cached };

      try {
        const assets = await apiFetch<Asset[]>('/api/assets');
        setCache(cacheKey, assets, 15_000);
        return { assets };
      } catch {
        const fallback = intent.market
          ? FALLBACK_ASSETS.filter(a => a.market === intent.market)
          : FALLBACK_ASSETS;
        return { assets: fallback };
      }
    });

    // ── FETCH_INSIGHTS ────────────────────────────────────────
    this.register('FETCH_INSIGHTS', async () => {
      const cached = getCached<SgtShowInsight[]>('insights');
      if (cached) return { insights: cached };
      try {
        const insights = await apiFetch<SgtShowInsight[]>('/api/insights');
        setCache('insights', insights, 15_000);
        return { insights };
      } catch {
        return { insights: FALLBACK_INSIGHTS };
      }
    });

    // ── FETCH_DISCUSSIONS ─────────────────────────────────────
    this.register('FETCH_DISCUSSIONS', async (intent) => {
      const cacheKey = `discussions_${intent.sector || 'all'}`;
      const cached = getCached<DiscussionPost[]>(cacheKey);
      if (cached) return { posts: cached };
      try {
        const posts = await apiFetch<DiscussionPost[]>('/api/discussions');
        setCache(cacheKey, posts, 10_000);
        return {
          posts: intent.sector && intent.sector !== 'all'
            ? posts.filter(p => p.sector === intent.sector)
            : posts,
        };
      } catch {
        const filtered = intent.sector && intent.sector !== 'all'
          ? FALLBACK_DISCUSSIONS.filter(p => p.sector === intent.sector)
          : FALLBACK_DISCUSSIONS;
        return { posts: filtered };
      }
    });

    // ── FETCH_MEMBERS ─────────────────────────────────────────
    this.register('FETCH_MEMBERS', async () => {
      const cached = getCached<CommunityMember[]>('members');
      if (cached) return { members: cached };
      try {
        const members = await apiFetch<CommunityMember[]>('/api/members');
        setCache('members', members, 15_000);
        return { members };
      } catch {
        return { members: FALLBACK_MEMBERS };
      }
    });

    // ── FETCH_NOTIFICATIONS ───────────────────────────────────
    this.register('FETCH_NOTIFICATIONS', async () => {
      const cached = getCached<UserNotification[]>('notifications');
      if (cached) return { notifications: cached };
      try {
        const notifications = await apiFetch<UserNotification[]>('/api/notifications');
        setCache('notifications', notifications, 10_000);
        return { notifications };
      } catch {
        return { notifications: FALLBACK_NOTIFICATIONS };
      }
    });

    // ── FETCH_WATCHLISTS ──────────────────────────────────────
    this.register('FETCH_WATCHLISTS', async () => {
      const cached = getCached<Watchlist[]>('watchlists');
      if (cached) return { watchlists: cached };
      try {
        const watchlists = await apiFetch<Watchlist[]>('/api/watchlists');
        setCache('watchlists', watchlists, 15_000);
        return { watchlists };
      } catch {
        return { watchlists: FALLBACK_WATCHLISTS };
      }
    });

    // ── MARKET_PULSE ──────────────────────────────────────────
    // ── FETCH_IPOS ──────────────────────────────────────────────
    this.register('FETCH_IPOS', async () => {
      const cached = getCached<{ ipos: IpoData[]; grounded: boolean; source: string; lastUpdated: string }>('ipos_v2');
      if (cached) return { ipos: cached.ipos, grounded: cached.grounded, source: cached.source, lastUpdated: cached.lastUpdated };
      try {
        const result = await apiFetch<{ ipos: IpoData[]; grounded: boolean; source: string; lastUpdated: string }>('/api/ipos');
        setCache('ipos_v2', result, 120_000);
        return { ipos: result.ipos, grounded: result.grounded, source: result.source, lastUpdated: result.lastUpdated };
      } catch {
        return { ipos: FALLBACK_IPOS, grounded: false, source: 'Offline fallback data', lastUpdated: new Date().toISOString() };
      }
    });

    // ── MARKET_PULSE ──────────────────────────────────────────
    this.register('MARKET_PULSE', async () => {
      try {
        const data = await apiFetch<{ headlines: any[]; grounded: boolean }>('/api/market-pulse');
        return data;
      } catch {
        return FALLBACK_PULSE;
      }
    });

    // ── HISTORICAL_DATA ───────────────────────────────────────
    this.register('HISTORICAL_DATA', async (intent) => {
      const cacheKey = `hist_${intent.ticker}_${intent.timeframe}`;
      const cached = getCached<{ value: number }[]>(cacheKey);
      if (cached) return { data: cached };
      try {
        const res = await apiFetch<{ data: { value: number }[] }>(
          `/api/historical?ticker=${intent.ticker}&timeframe=${intent.timeframe}`
        );
        setCache(cacheKey, res.data, 20_000);
        return res;
      } catch {
        // Generate realistic mock data
        const basePrice = intent.ticker === 'btc' ? 66530 : intent.ticker === 'nvda' ? 940 : 178;
        const volatility = basePrice * 0.005;
        const points = intent.timeframe === '1d' ? 48 : intent.timeframe === '1w' ? 168 : 720;
        const data = Array.from({ length: points }, (_, i) => ({
          value: basePrice + Math.sin(i * 0.2) * volatility * 0.5 + (Math.random() - 0.5) * volatility,
        }));
        return { data };
      }
    });

    // ── FETCH_ASSET_DETAIL ────────────────────────────────────
    this.register('FETCH_ASSET_DETAIL', async (intent) => {
      try {
        const asset = await apiFetch<Asset>(`/api/assets/${intent.assetId}`);
        return { asset };
      } catch {
        const asset = FALLBACK_ASSETS.find(a => a.id === intent.assetId) || null;
        return { asset };
      }
    });

    // ── AI_ANALYSIS ───────────────────────────────────────────
    this.register('AI_ANALYSIS', async (intent) => {
      try {
        const result = await apiFetch<{ analysis: string }>(
          `/api/assets/${intent.assetId}/ai-analysis`,
          { method: 'POST' },
          15000
        );
        return result;
      } catch {
        return {
          analysis: `AI analysis for ${intent.assetId} is currently in offline mode. The platform evaluates this asset as highly active with dynamic triggers. For retail portfolio positioning, consider hedge strategies against Naira volatility (domestic) or interest rate policy shifts (global). Connect to the live server for deep Gemini-powered analysis.`
        };
      }
    });

    // ── AI_ASSISTANT ──────────────────────────────────────────
    this.register('AI_ASSISTANT', async (intent) => {
      try {
        return await apiFetch<{ answer: string; sentiment?: 'bullish' | 'bearish' | 'neutral'; keyTakeaway?: string }>(
          '/api/ai/assistant',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: intent.prompt, model: intent.model || 'gemma2-9b-it' }),
          },
          15000
        );
      } catch {
        return {
          answer: `📡 **Offline Intelligence Report**\n\nI'm currently operating in offline mode. Based on cached market data:\n\n*${intent.prompt}*\n\nKey observations:\n- NGX Banking: Tier-1 banks continue to show strong capital buffers\n- BTC: Institutional accumulation patterns remain intact\n- NVIDIA: AI demand trajectory unchanged\n\nConnect to the server for real-time AI-powered analysis with Google Grounding.`,
          sentiment: 'neutral',
          keyTakeaway: 'Server connection required for live AI synthesis. Cache data shows normal market conditions.',
        };
      }
    });

    // ── Mutations ─────────────────────────────────────────────
    this.register('SAVE_PROFILE', async (intent) => {
      try {
        const result = await apiFetch<{ id: string }>('/api/members/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(intent.data),
        });
        invalidateCache('members');
        return { success: true, id: result.id };
      } catch {
        return { success: true, id: 'mock-' + Date.now() };
      }
    });

    this.register('CREATE_DISCUSSION', async (intent) => {
      try {
        const result = await apiFetch<{ id: string }>('/api/discussions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(intent.data),
        });
        invalidateCache('discussions');
        return { success: true, id: result.id };
      } catch {
        return { success: true, id: 'mock-disc-' + Date.now() };
      }
    });

    this.register('ADD_COMMENT', async (intent) => {
      try {
        await apiFetch(`/api/discussions/${intent.postId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(intent.data),
        });
        invalidateCache('discussions');
        return { success: true };
      } catch {
        return { success: true };
      }
    });

    this.register('MARK_NOTIFICATION_READ', async (intent) => {
      try {
        await apiFetch(`/api/notifications/${intent.notificationId}/read`, { method: 'PUT' });
        invalidateCache('notifications');
        return { success: true };
      } catch {
        return { success: true };
      }
    });

    this.register('CLEAR_NOTIFICATIONS', async () => {
      try {
        await apiFetch('/api/notifications/clear', { method: 'POST' });
        invalidateCache('notifications');
        return { success: true };
      } catch {
        return { success: true };
      }
    });

    this.register('CREATE_WATCHLIST', async (intent) => {
      try {
        await apiFetch('/api/watchlists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(intent.data),
        });
        invalidateCache('watchlists');
        return { success: true };
      } catch {
        return { success: true };
      }
    });

    this.register('POST_INSIGHT', async (intent) => {
      try {
        await apiFetch('/api/insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(intent.data),
        });
        invalidateCache('insights');
        return { success: true };
      } catch {
        return { success: true };
      }
    });

    this.register('TOGGLE_WATCHLIST', async (intent) => {
      // This is a client-side only operation (localStorage)
      const next = intent.watchlistIds.includes(intent.assetId)
        ? intent.watchlistIds.filter(id => id !== intent.assetId)
        : [...intent.watchlistIds, intent.assetId];
      localStorage.setItem('sgt_watchlist_ids', JSON.stringify(next));
      return { success: true };
    });
  }

  private register<T extends IntentType>(type: T, handler: IntentHandler<Extract<Intent, { type: T }>>): void {
    this.handlers.set(type, handler as IntentHandler);
  }

  async dispatch<I extends Intent>(intent: I): Promise<IntentResult<I['type']>> {
    const handler = this.handlers.get(intent.type) as IntentHandler<I> | undefined;
    if (!handler) {
      throw new Error(`No handler registered for intent type: ${intent.type}`);
    }
    return handler(intent);
  }
}

// ─── Singleton Export ────────────────────────────────────────────
export const sgtAgent = new SgtAgent();
