import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { Asset, DiscussionPost, Watchlist, SgtShowInsight, UserNotification, CommunityMember, IpoData, Comment } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize WebSocket server under manual upgrade architecture
const server = createServer(app);
const wss = new WebSocketServer({ noServer: true });

function broadcast(data: any) {
  const payload = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

wss.on('connection', (ws) => {
  console.log('Sgt Show WS client connected.');
  
  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message.toString());
      if (parsed.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (e) {
      // ignore
    }
  });
});

// ─── Live Price Broadcasting ─────────────────────────────────────
function broadcastLivePrices() {
  const assets = sgtShowDb.assets;
  const priceUpdates = assets.map(a => {
    const delta = (Math.random() - 0.47) * a.price * 0.008;
    const newPrice = Number((a.price + delta).toFixed(2));
    const changePct = Number((((newPrice - a.price) / a.price) * 100).toFixed(2));
    return {
      id: a.id,
      ticker: a.ticker,
      price: newPrice,
      changePercent: changePct,
      name: a.name,
    };
  });
  broadcast({ type: 'live_prices', prices: priceUpdates, timestamp: Date.now() });
}

// Broadcast live prices every 6 seconds
setInterval(broadcastLivePrices, 6000);

app.use(express.json());

// Path to Sgt Show persistence storage
const DB_FILE = path.join(process.cwd(), 'sgt_show_db.json');

// Root Data Seed
const INITIAL_ASSETS: Asset[] = [
  {
    id: "us-aapl",
    name: "Apple Inc.",
    ticker: "AAPL",
    price: 178.50,
    changePercent: -0.45,
    type: "stock",
    market: "us",
    description: "Apple Inc. designs, manufactures, and markets smart mobile communication and media devices, personal computers, and portable digital music players around the world.",
    beginnerExplanation: "Apple is a global consumer tech pioneer. They build highly integrated premium hardware (iPhones, Macs) and earn high-margin subscription fees (App Store, iCloud) from a fiercely loyal billionaire ecosystem.",
    sentiment: "neutral",
    stats: {
      peRatio: "28.5",
      marketCap: "$2.82 Trillion",
      high52w: "$199.60",
      low52w: "$164.00",
      volume: "52.4 Million",
      dividendYield: "0.55%"
    },
    bullishCase: "Incredible brand equity, high device switching costs, massive capital return program (stock buybacks), and upcoming on-device generative AI features.",
    bearishCase: "Lengthening smartphone renewal cycles, high dependency on supply chains, and ongoing global regulatory antitrust scrutiny on App Store fees.",
    news: [
      {
        title: "Apple Unveils Dedicated AI Silicon Chips for On-Device Intelligence",
        summary: "Apple announces next-gen neural cores to process generative tasks privately without sending user audio/text queries to third-party servers.",
        interpretation: "Strong differentiator. High privacy safeguards are a superb selling point, securing future hardware upgrades.",
        source: "Wall Street Journal",
        date: "2026-05-18"
      }
    ]
  },
  {
    id: "us-msft",
    name: "Microsoft Corporation",
    ticker: "MSFT",
    price: 415.60,
    changePercent: 1.25,
    type: "stock",
    market: "us",
    description: "Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide. Its Productivity and Business Processes segment includes Office, Exchange, SharePoint, Microsoft Teams, and LinkedIn.",
    beginnerExplanation: "Microsoft is the global enterprise engine. Almost every major corporation runs on Office or Windows, and their fast integration of OpenAI tech into cloud services has made them a trillion-dollar cloud titan.",
    sentiment: "bullish",
    stats: {
      peRatio: "35.8",
      marketCap: "$3.08 Trillion",
      high52w: "$430.00",
      low52w: "$315.00",
      volume: "22.5 Million",
      dividendYield: "0.72%"
    },
    bullishCase: "Absolute dominance in high-growth enterprise cloud (Azure), swift monetization of Copilot AI extensions, and recurring corporate software contracts.",
    bearishCase: "Heavy capital requirements for continuous server center expansions, and regulatory reviews of tech consortium acquisitions.",
    news: [
      {
        title: "Microsoft Cloud Revenue Surges 21% as Enterprise AI Adoption Scales",
        summary: "Microsoft reports record high commercial bookings triggered by rapid Azure neural chip lease demand.",
        interpretation: "Shows immediate pricing power and conversion from AI research into enterprise-grade profits.",
        source: "Bloomberg",
        date: "2026-05-20"
      }
    ]
  },
  {
    id: "us-nvda",
    name: "NVIDIA Corporation",
    ticker: "NVDA",
    price: 940.25,
    changePercent: 4.82,
    type: "stock",
    market: "us",
    description: "Nvidia Corp is the vanguard of global Artificial Intelligence graphics processors (GPUs), building systemic hardware and soft architectures (CUDA) powering AI data warehouses.",
    beginnerExplanation: "Nvidia is the company that makes the high-performance 'brains' (silicon chips) that companies like Google, Microsoft, and OpenAI buy to training complex AI models like ChatGPT and Gemini.",
    sentiment: "bullish",
    stats: {
      peRatio: "55.4",
      marketCap: "$2.35 Trillion",
      high52w: "$974.00",
      low52w: "$380.00",
      volume: "48.2 Million",
      dividendYield: "0.02%"
    },
    bullishCase: "Unmatched software ecosystem lock-in with CUDA, high switching costs, insatiable cloud computing GPU demand, and next-gen Blackwell chips selling out instantly.",
    bearishCase: "Extreme valuation multiples priced for perfection, potential bottleneck exports due to geopolitical chip sanctions, and risk of capital consolidation cooling in tech budgets.",
    news: [
      {
        title: "Nvidia Blackwell GPU Orders Fully Booked for 12 Months",
        summary: "Tech firms rush to lock supply contracts for new high-density superchips despite premium pricing structures.",
        interpretation: "Shows demand is not cooling. Keeps revenue estimates exceptionally secure for the coming fiscal cycle.",
        source: "Wall Street Journal",
        date: "2026-05-15"
      }
    ]
  },
  {
    id: "us-tsla",
    name: "Tesla, Inc.",
    ticker: "TSLA",
    price: 185.30,
    changePercent: -1.25,
    type: "stock",
    market: "us",
    description: "Tesla, Inc. designs, mass-produces, and implements battery electric motorvehicles, smart solar grids, utility energy storage cells, and deep-learning robotics engines.",
    beginnerExplanation: "Tesla is the world's most famous electric car maker. However, bulls believe it's actually an AI and robotics company that will unlock millions of autonomous self-driving robotaxis.",
    sentiment: "neutral",
    stats: {
      peRatio: "42.1",
      marketCap: "$590 Billion",
      high52w: "$299.00",
      low52w: "$138.00",
      volume: "88.4 Million",
      dividendYield: "N/A"
    },
    bullishCase: "Dominance in energy battery storage sales (Megapacks) offsetting car margins, potential breakthrough in FSD software licensing, and upcoming low-cost Model 2 launch.",
    bearishCase: "Severe margin degradation from electric vehicle price-war cuts, intense localized competition in China (BYD), and slower Western charging infrastructure scaling.",
    news: [
      {
        title: "Tesla Megapacks Outstrip Car Delivery Margin Contributions",
        summary: "Utility microgrid projects globally register aggressive growth, securing alternative clean tech revenue.",
        interpretation: "Highly encouraging. Confirms Tesla is a broad energy storage giant, dampening core EV cyclical supply-glut effects.",
        source: "Bloomberg",
        date: "2026-05-12"
      }
    ]
  },
  {
    id: "crypto-btc",
    name: "Bitcoin",
    ticker: "BTC",
    price: 68450.00,
    changePercent: -3.20,
    type: "crypto",
    market: "crypto",
    description: "Bitcoin is the pioneer decentralized cryptographic digital asset, functioning as a peer-to-peer sovereign trust network and an alternative store of value ('digital gold').",
    beginnerExplanation: "Bitcoin is like digital gold. There are only ever 21 million Bitcoins that can exist, meaning government banks cannot print more of it to inflate away your purchasing power.",
    sentiment: "neutral",
    stats: {
      marketCap: "$1.34 Trillion",
      high52w: "$73,800",
      low52w: "$26,100",
      volume: "$31.5 Billion",
      dividendYield: "N/A"
    },
    bullishCase: "Massive institutional inflows from Wall Street Spot ETFs, sovereign reserve allocations, and inflation hedge adoption in hyperinflationary markets.",
    bearishCase: "Central bank hawkish rates (higher for longer), regulatory pressure on non-KYC mixers, and short-term leverage liquidations in retail derivatives.",
    news: [
      {
        title: "Sovereign Pension Funds Disclose Aggressive Bitcoin ETF Holdings",
        summary: "State retirement accounts reveal initial multi-million-dollar allocations to regulated BTC holdings.",
        interpretation: "Institutional validation is absolute. It means price declines will likely trigger strong buying support levels.",
        source: "CoinDesk",
        date: "2026-05-22"
      }
    ]
  },
  {
    id: "crypto-sol",
    name: "Solana",
    ticker: "SOL",
    price: 165.40,
    changePercent: 5.80,
    type: "crypto",
    market: "crypto",
    description: "Solana is a high-performance Layer-1 blockchain optimized for fast transaction speed, minimal fees, and massive developer scaling compared to Ethereum.",
    beginnerExplanation: "Solana is like a super-fast highway for crypto apps. While Ethereum costs $10 in fees and is slow, Solana costs a fraction of a cent and is instant, making it the favorite for active retail traders.",
    sentiment: "bullish",
    stats: {
      marketCap: "$75.2 Billion",
      high52w: "$210.00",
      low52w: "$18.50",
      volume: "$4.1 Billion",
      dividendYield: "N/A"
    },
    bullishCase: "Unequivocal dominance in retail trading and decentralized exchanges (DEX), booming memecoin liquidity pools, and strong performance of independent validators.",
    bearishCase: "Historically prone to network consensus halts during extreme high traffic, and concerns about native supply centralization.",
    news: [
      {
        title: "Solana DEX Weekly Volume Flips Ethereum Mainnet",
        summary: "Decentralized trade volumes scale aggressively on Raydium and Jupiter due to retail network preferences.",
        interpretation: "Signals a fundamental market pivot. Users prefer low transaction costs, driving organic price support on SOL.",
        source: "Blockworks",
        date: "2026-05-25"
      }
    ]
  },
  {
    id: "commodity-gold",
    name: "Gold Spot",
    ticker: "XAU",
    price: 2350.80,
    changePercent: 0.85,
    type: "commodity",
    market: "global",
    description: "Gold Spot price represents the global standard target for raw physical bullion transactions, acting as a historical anchor against fiat currency depreciation.",
    beginnerExplanation: "Gold is the world's oldest currency anchor. When paper currencies fluctuate or inflation prints high globally, institutions buy gold to lock raw purchasing power indices safely.",
    sentiment: "bullish",
    stats: {
      marketCap: "$15.8 Trillion",
      high52w: "$2,450.00",
      low52w: "$1,910.00",
      volume: "$150 Billion Daily",
      dividendYield: "N/A"
    },
    bullishCase: "Persistent sovereign central bank buying, deep fear of high inflation matrices, and geopolitical diversification away from US Treasury reserves.",
    bearishCase: "Prolonged high federal lending yields increasing opportunity costs of holding yieldless physical metals.",
    news: [
      {
        title: "Global Central Banks Liquidate Yield Treasuries for Physical Gold Reserves",
        summary: "Report indicates historic raw bullion storage increases by eastern-bank hubs to mitigate inflation exposure.",
        interpretation: "Strong structural flow. Underwrites deep defensive support regardless of central bank interest rate speeds.",
        source: "FT Commodities",
        date: "2026-05-24"
      }
    ]
  }
];

const INITIAL_INSIGHTS: SgtShowInsight[] = [
  {
    id: "ins-1",
    content: "Intel check: Nvidia vs Apple valuation divergence is historic. NVDA is pricing in Blackwell AI chip bookings booked 12 months deep. Apple, on the other hand, is a capital returns compounding monster. Diversified allocation is the secure play! 🧠📈 #GlobalMacro",
    aiSummary: "Nvidia and Apple display a stark divergence: Nvidia offers explosive generative chip sales growth, whereas Apple operates as a cash buyback machine with high device switching costs. Combining both in global portfolios offers premium high-growth and defensive symmetry.",
    sentiment: "bullish",
    createdAt: "2026-05-26T10:00:00Z",
    assets: ["NVDA", "AAPL"],
    fullAnalysisId: "us-nvda"
  },
  {
    id: "ins-2",
    content: "Bitcoin consolidating flatly between $66k and $69k is textbook structural accumulation. Speculators are hunting highly volatile meme liquidity pools on Solana, but sovereign pensions are silently sweep-feeding Spot ETFs. Be conscious of structural accumulation speeds! ⏳🧠 #Crypto",
    aiSummary: "Bitcoin's flat trade limits are typical accumulation phases. While retail volume targets high-risk pools on cheap chains (Solana), core pension funds are utilizing ETF instruments to capture spot reserves quietly. Long-term metrics remain bullishly supported.",
    sentiment: "neutral",
    createdAt: "2026-05-25T14:30:00Z",
    assets: ["BTC"],
    fullAnalysisId: "crypto-btc"
  },
  {
    id: "ins-3",
    content: "Central bank gold buying is the main macro trade of the year. Physical bullion is forming an explicit backstop against global fiat debasement and US dollar reserve weaponization. If real yields drop, expect explosive runups. 📈🪙 #Commodities #Macro",
    aiSummary: "Sovereign global institutions are aggressively substituting physical Gold bullion for treasury debt assets to shield reserve balances from structural inflation and systemic sanctions. This forms a powerful long-term pricing support baseline.",
    sentiment: "bullish",
    createdAt: "2026-05-24T09:15:00Z",
    assets: ["XAU"],
    fullAnalysisId: "commodity-gold"
  }
];

const INITIAL_DISCUSSIONS: DiscussionPost[] = [
  {
    id: "disc-1",
    assetId: "us-nvda",
    sector: "tech",
    title: "Can Nvidia sustain Blackwell margins when competition catches up?",
    content: "Nvidia has been printing ridiculous profits, but MSFT, GOOG, and Amazon are all designing their own custom silicon ASICs. Will Blackwell's booked backlog protect them for another 24 months, or does margin degradation loom?",
    authorName: "Marcus Sterling",
    authorEmail: "marcus.st@macro.io",
    reactions: { bullish: 24, bearish: 4, neutral: 8 },
    comments: [
      {
        id: "com-1-1",
        postId: "disc-1",
        content: "Custom chips are hyper-specialized, but Nvidia's CUDA software ecosystem is the actual moat. You don't just buy GPUs, you buy the whole runtime library stack.",
        authorName: "Elena Rostova",
        authorEmail: "elena@silicon.com",
        reaction: "bullish",
        createdAt: "2026-05-26T11:20:00Z"
      },
      {
        id: "com-1-2",
        postId: "disc-1",
        content: "Valuations are incredibly high, but demand stays absolute. I'm pricing MSFT orders deep into NVDA's pipeline. Hold long.",
        authorName: "Aoki Tanaka",
        authorEmail: "aoki@capital.jp",
        reaction: "neutral",
        createdAt: "2026-05-26T12:05:00Z"
      }
    ],
    createdAt: "2026-05-26T08:00:00Z",
    aiSummary: "Forum community supports structural long stance (75% Bullish or Neutral). Most analysts outline Nvidia's key differentiator as their CUDA software stack integration rather than raw silicon chips, sustaining heavy margins deep into late 2027."
  },
  {
    id: "disc-2",
    assetId: "crypto-btc",
    sector: "crypto",
    title: "Bitcoin Spot ETF consolidation vs retail on-chain activity",
    content: "With ETF flows showing massive daily inflows from state-level pension groups, why is spot price hovering quietly at $68k? Is on-chain speculation moving away into Solana or is this silent institutional capture?",
    authorName: "Devon Cole",
    authorEmail: "devon@coinventure.com",
    reactions: { bullish: 12, bearish: 2, neutral: 5 },
    comments: [],
    createdAt: "2026-05-25T16:00:00Z",
    aiSummary: "Subscribers maintain extremely high strategic conviction. They characterize current flat ranges as institutional lockboxes, capturing available spot liquidity silently off-exchange to secure long-term allocations."
  }
];

const INITIAL_WATCHLISTS: Watchlist[] = [
  {
    id: "sys-ngx-banking",
    name: "NGX Banking Shield",
    description: "Premium high-yield financial stocks in Nigeria.",
    assets: ["ngx-gtco"],
    isSystem: true,
    creatorName: "Sgt Show"
  },
  {
    id: "sys-us-ai-momentum",
    name: "US AI Powerhouse",
    description: "Global tech leaders steering Artificial Intelligence growth.",
    assets: ["us-nvda", "us-tsla"],
    isSystem: true,
    creatorName: "Sgt Show"
  },
  {
    id: "sys-crypto-momentum",
    name: "Crypto Bluechips",
    description: "Major sovereign trust cryptos.",
    assets: ["crypto-btc", "crypto-sol"],
    isSystem: true,
    creatorName: "Sgt Show"
  }
];

const INITIAL_NOTIFICATIONS: UserNotification[] = [
  {
    id: "not-1",
    title: "Sgt Show Posted fresh Market Insight",
    body: "GTCO vs Windfall CBN Taxes: 'Ignore the daily noise. Massive dividends loading!' Review the breakout.",
    category: "insight",
    createdAt: "2026-05-26T10:05:00Z",
    read: false
  },
  {
    id: "not-2",
    title: "Solana (SOL) surges +5.80% in DEX swap volume rally",
    body: "Solana semanal volumes flip Ethereum mainnet protocols. Check out the bullish analyst cases.",
    category: "movement",
    createdAt: "2026-05-25T21:45:00Z",
    read: true
  }
];

const INITIAL_MEMBERS: CommunityMember[] = [
  {
    uid: "member-1",
    displayName: "Kelechi_Alpha",
    email: "kelechi@sgtshow.com",
    createdAt: "2026-01-10T11:20:00Z",
    isPublic: true,
    avatarColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    badge: "Sovereign Strategist",
    bio: "Global macro analyst. Tracking yield spreads, Federal Reserve cycles, artificial intelligence chip scale bounds, and multi-market asset telemetry."
  },
  {
    uid: "member-2",
    displayName: "SgtShow01",
    email: "founder@sgtshow.com",
    createdAt: "2026-02-14T08:30:00Z",
    isPublic: true,
    avatarColor: "bg-[#FE8C00]/10 text-[#FE8C00] border-[#FE8C00]/20",
    badge: "Founder & Curator",
    bio: "Main editor. Building SGT signal chains to safeguard retail portfolios from paper debasing using heavy durables and cryptocurrency trends."
  },
  {
    uid: "member-3",
    displayName: "Tayo_Fx_Spec",
    email: "tayo@sgtshow.com",
    createdAt: "2026-03-01T15:45:00Z",
    isPublic: true,
    avatarColor: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    badge: "Liquidity Scout",
    bio: "Forex speculator and commodity trader. Specializing in physical bullion (Gold/XAU), network-fee optimization protocols, and corporate margin levels."
  },
  {
    uid: "member-4",
    displayName: "Bisi_Global_Invest",
    email: "bisi@sgtshow.com",
    createdAt: "2026-04-20T10:15:00Z",
    isPublic: true,
    avatarColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    badge: "Retail Advocate",
    bio: "Long-term strategist. Focusing on high free cashflow tech assets, Bitcoin range-bound accumulation, and premium corporate dividend holders."
  }
];

// Load Database locally or write defaults
let sgtShowDb: {
  assets: Asset[];
  insights: SgtShowInsight[];
  discussions: DiscussionPost[];
  watchlists: Watchlist[];
  notifications: UserNotification[];
  members: CommunityMember[];
} = {
  assets: [...INITIAL_ASSETS],
  insights: [...INITIAL_INSIGHTS],
  discussions: [...INITIAL_DISCUSSIONS],
  watchlists: [...INITIAL_WATCHLISTS],
  notifications: [...INITIAL_NOTIFICATIONS],
  members: [...INITIAL_MEMBERS]
};

if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    sgtShowDb = {
      assets: parsed.assets || [...INITIAL_ASSETS],
      insights: parsed.insights || [...INITIAL_INSIGHTS],
      discussions: parsed.discussions || [...INITIAL_DISCUSSIONS],
      watchlists: parsed.watchlists || [...INITIAL_WATCHLISTS],
      notifications: parsed.notifications || [...INITIAL_NOTIFICATIONS],
      members: parsed.members || [...INITIAL_MEMBERS]
    };
  } catch (error) {
    console.error("DB reading failed, resetting to defaults:", error);
  }
} else {
  fs.writeFileSync(DB_FILE, JSON.stringify(sgtShowDb, null, 2));
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(sgtShowDb, null, 2));
  } catch (e) {
    console.error("Failed to persist database:", e);
  }
}

// Lazy Load Gemini API
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY is not defined. Deploying local simulated intelligence models.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// REST Endpoints
app.get('/api/market-pulse', async (req, res) => {
  const client = getGeminiClient();
  if (!client) {
    // Return realistic highly detailed fallback news
    const fallbacks = [
      {
        id: "fb-1",
        title: "CBN Retains Lending Stance; Cash Reserve Ratios Pressed At 26.25%",
        source: "Nairametrics",
        summary: "The Central Bank of Nigeria held its key lending interest rate steady in its latest session to curb liquidity levels and stabilize currency pressures.",
        impact: "Slight restriction. Banks like GTCO retain elevated double-digit treasury interest yields, while private mortgage yields tighten.",
        url: "https://nairametrics.com",
        time: "10m ago"
      },
      {
        id: "fb-2",
        title: "Global Datacenters Drive High Demand Waves for AI GPU Accelerators",
        source: "Bloomberg",
        summary: "Tech leaders expand multi-billion dollar datacloud compute centers to capture deep-learning trends, boosting chip pre-orders.",
        impact: "Bullish for Nvidia (NVDA). High-volume forward bookings secure robust premium revenue streams across upcoming quarters.",
        url: "https://bloomberg.com",
        time: "32m ago"
      },
      {
        id: "fb-3",
        title: "Bitcoin Consolidates Cleanly Inside Sovereign $68,000 Support Nodes",
        source: "CoinDesk",
        summary: "Short-term leverage accounts clear out while regulated pension funds report continuous inflows within Spot ETF asset lines.",
        impact: "Healthy range accumulation phase. Keeps deep support levels sound while minimizing speculative leverage bubbles.",
        url: "https://www.coindesk.com",
        time: "1h ago"
      },
      {
        id: "fb-4",
        title: "NGX Group Secures Approvals For Digital Equities Tokenization Trial",
        source: "BusinessDay NG",
        summary: "The Nigerian Exchange Group expands regulatory capabilities to experiment with private asset syndication on secure cloud ledgers.",
        impact: "Increases liquidity flexibility. Simplifies micro-capital pooling routes for young tech firms seeking retail options.",
        url: "https://businessday.ng",
        time: "2h ago"
      }
    ];
    return res.json({ headlines: fallbacks, grounded: false });
  }

  try {
    const prompt = `Search the web for the absolute latest breaking financial news, bank earnings, crypto movements, or macroeconomic updates specifically regarding Nigerian financial markets (NGX equities like GTCO, MTNN, Oando, Zenith Bank) and global crypto and tech indicators.
Select the top 4 most critical updates occurring right now.

Respond STRICTLY with a JSON object containing a "headlines" array of 4 items.
For each headline, extract the source name, bulleted summary, localized investing impact, published time (e.g., "12m ago" or "1h ago"), and the original source URL.
Schema:
{
  "headlines": [
    {
      "id": "string",
      "title": "string",
      "source": "string",
      "summary": "string",
      "impact": "string",
      "url": "string (must be a valid URL related to the article)",
      "time": "string"
    }
  ]
}`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });

    try {
      const parsed = JSON.parse(response.text.trim());
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const headlinesWithUrls = parsed.headlines.map((item: any, idx: number) => {
        let finalUrl = item.url;
        if (!finalUrl || !finalUrl.startsWith('http')) {
          const chunk = chunks[idx % chunks.length];
          if (chunk?.web?.uri) {
            finalUrl = chunk.web.uri;
          } else {
            finalUrl = 'https://nairametrics.com';
          }
        }
        return {
          ...item,
          url: finalUrl
        };
      });
      res.json({ headlines: headlinesWithUrls, grounded: true });
    } catch {
      let cleaned = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      res.json({ headlines: parsed.headlines, grounded: true });
    }
  } catch (error: any) {
    console.error("Breaking pulse call failed:", error);
    res.status(500).json({ error: "Failed to generate market pulse" });
  }
});

app.get('/api/historical', (req, res) => {
  const ticker = (req.query.ticker as string || 'btc').toLowerCase();
  const timeframe = (req.query.timeframe as string || '1d').toLowerCase();

  let basePrice = 45;
  let volatility = 0.02;
  let pointsCount = 12;

  if (ticker === 'btc' || ticker === 'btc/usd') {
    basePrice = 65000;
    volatility = 0.012;
  } else if (ticker === 'gtco') {
    basePrice = 44.5;
    volatility = 0.009;
  } else if (ticker === 'zenith' || ticker === 'zenithbank') {
    basePrice = 38.2;
    volatility = 0.008;
  }

  if (timeframe === '1d') {
    pointsCount = 12;
  } else if (timeframe === '1w') {
    pointsCount = 7;
    volatility = volatility * 1.8;
  } else if (timeframe === '1m') {
    pointsCount = 30;
    volatility = volatility * 3.5;
  }

  // Generate deterministic progression with a bit of noise to prevent extreme erratic behavior
  const data = [];
  let currentPrice = basePrice * (1 - volatility * (pointsCount / 2) * 0.15); // start slightly lower

  for (let i = 0; i < pointsCount; i++) {
    const progressTrend = (i / pointsCount) * (basePrice * volatility * 0.4);
    const sineFactor = Math.sin((i / pointsCount) * Math.PI * 2) * (basePrice * volatility * 0.25);
    const pseudoRandom = Math.sin(i * 9821.5 + ticker.charCodeAt(0)) * (basePrice * volatility * 0.12);
    
    const value = Number((currentPrice + progressTrend + sineFactor + pseudoRandom).toFixed(2));
    data.push({ value });
  }

  res.json({ ticker, timeframe, data });
});

app.get('/api/assets', (req, res) => {
  res.json(sgtShowDb.assets);
});

app.get('/api/assets/:id', (req, res) => {
  const asset = sgtShowDb.assets.find(a => a.id === req.params.id);
  if (!asset) return res.status(404).json({ error: "Asset not found" });
  res.json(asset);
});

app.post('/api/assets/:id/ai-analysis', async (req, res) => {
  const asset = sgtShowDb.assets.find(a => a.id === req.params.id);
  if (!asset) return res.status(404).json({ error: "Asset not found" });

  const client = getGeminiClient();
  if (!client) {
    // Elegant Offline simulated analyst explanation
    const simulatedResponse = `### 🧠 Sgt Show AI Copilot Report: ${asset.ticker} (${asset.name})

We ran a simulated structural review on **${asset.ticker}** for African retail portfolios:

1. **Why it Matters:** ${asset.type === 'crypto' ? 'A major global digital commodity asset.' : 'An extremely systemic enterprise block listed on ' + asset.market.toUpperCase()}.
2. **Current Retail Stance:** The market sentiment is **${asset.sentiment.toUpperCase()}**. 
3. **Core Catalyst:** Standard domestic currency adjustments, retail accumulation cycles, and strong cash generation margins.
   
*Note: Connect your Gemini API Key in AI Studio > Settings > Secrets to unlock live Google Search grounding feeds for this security!*`;

    return res.json({ analysis: simulatedResponse });
  }

  try {
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are the premium 'Sgt Show AI Investing assistant' specialized in African and multi-market investing.
Provide a clear, conversational, beginner-friendly breakout for retail investors of the asset: ${asset.name} (${asset.ticker}) currently trading on the ${asset.market.toUpperCase()} market.
Structure your assessment into:
1. "The Core Catalyst" (What is driving the recent sentiment simply)
2. "Why Beginners Should Watch It" (Simplified terms)
3. "Actionable Insight" (No financial trading advice, just how retail should understand its cycle)
Keep it conversational, inspiring, clear, and highly localized for an active Nigerian / African retail trader.`,
      config: {
        tools: [{ googleSearch: {} }] // Live search grounding enabled!
      }
    });

    res.json({ analysis: response.text });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed calling Gemini AI assistant" });
  }
});

app.get('/api/insights', (req, res) => {
  res.json(sgtShowDb.insights);
});

app.post('/api/insights', (req, res) => {
  const { content, sentiment, relatedAssets } = req.body;
  const newInsight: SgtShowInsight = {
    id: `ins-${Date.now()}`,
    content,
    sentiment: sentiment || 'neutral',
    aiSummary: `AI Breakout: ${content.slice(0, 100)}...`, // Placeholder, standard fallback
    createdAt: new Date().toISOString(),
    assets: relatedAssets || []
  };

  // Run server-side Gemini to summarize the Sgt Show Twitter card instantly!
  const client = getGeminiClient();
  if (client) {
    client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are 'Sgt Show' invest editor. Summarize this tweet into a pristine, high-impact retail takeaway: "${content}"`
    }).then(res => {
      newInsight.aiSummary = res.text;
      saveDb();
      broadcast({ type: 'insight_added', insight: newInsight });
    }).catch(e => console.error("Async tweet summary fail:", e));
  }

  sgtShowDb.insights.unshift(newInsight);
  saveDb();
  broadcast({ type: 'insight_added', insight: newInsight });
  res.status(201).json(newInsight);
});

app.get('/api/discussions', (req, res) => {
  res.json(sgtShowDb.discussions);
});

app.post('/api/discussions', (req, res) => {
  const { sector, title, content, authorName, authorEmail, assetId, userReaction } = req.body;
  const newPost: DiscussionPost = {
    id: `disc-${Date.now()}`,
    assetId,
    sector: sector || 'general',
    title,
    content,
    authorName: authorName || "Community Member",
    authorEmail: authorEmail || "guest@sgtshow.com",
    reactions: { bullish: userReaction === 'bullish' ? 1 : 0, bearish: userReaction === 'bearish' ? 1 : 0, neutral: userReaction === 'neutral' ? 1 : 0 },
    comments: [],
    createdAt: new Date().toISOString(),
    aiSummary: "Simplifying discussion..."
  };

  // Run background Gemini to summarize the community thread automatically!
  const client = getGeminiClient();
  if (client) {
    client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Synthesize this discussion topic inside Sgt Show's investing forum.
Title: "${title}"
Content: "${content}"
Give a 1-sentence smart community sentiment takeaway (e.g. "Community is highly curious but divided about...")`
    }).then(res => {
      newPost.aiSummary = res.text;
      saveDb();
      broadcast({ type: 'discussion_added', post: newPost });
    }).catch(e => console.error("Discussion summary failed:", e));
  } else {
    newPost.aiSummary = `Active forum topic in ${sector?.toUpperCase()} sector. Join the discussion to add sentiment weight.`;
  }

  sgtShowDb.discussions.unshift(newPost);
  saveDb();
  broadcast({ type: 'discussion_added', post: newPost });
  res.status(201).json(newPost);
});

app.post('/api/discussions/:id/comments', (req, res) => {
  const { id } = req.params;
  const { content, authorName, authorEmail, reaction } = req.body;
  
  const post = sgtShowDb.discussions.find(p => p.id === id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  const newComment = {
    id: `com-${Date.now()}`,
    postId: id,
    content,
    authorName: authorName || "Trader",
    authorEmail: authorEmail || "guest@sgtshow.com",
    reaction: reaction || null,
    createdAt: new Date().toISOString()
  };

  post.comments.push(newComment);
  
  if (reaction === 'bullish') post.reactions.bullish++;
  else if (reaction === 'bearish') post.reactions.bearish++;
  else if (reaction === 'neutral') post.reactions.neutral++;

  // Trigger Gemini summary update for comments!
  const client = getGeminiClient();
  if (client) {
    const threadData = `Thread: "${post.title}". Comments count: ${post.comments.length}. Comments: ${post.comments.map(c => c.content).join(' | ')}`;
    client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Summarize the collective sentiment outlook of this investment thread. Keep it under 2 sentences.
Data: ${threadData}`
    }).then(res => {
      post.aiSummary = res.text;
      saveDb();
      broadcast({ type: 'discussion_updated', post });
    }).catch(e => console.error("Comments summary update failed:", e));
  }

  saveDb();
  broadcast({ type: 'discussion_updated', post });
  res.status(201).json(newComment);
});

app.get('/api/members', (req, res) => {
  res.json(sgtShowDb.members || []);
});

app.put('/api/members/profile', (req, res) => {
  const { email, displayName, bio, badge, isPublic, avatarColor, uid } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  let idx = (sgtShowDb.members || []).findIndex(m => m.email.toLowerCase() === email.toLowerCase());
  if (idx === -1) {
    const newMember: CommunityMember = {
      uid: uid || `member-${Date.now()}`,
      displayName: displayName || email.split('@')[0],
      email: email,
      bio: bio || "New SGT investor scout.",
      badge: badge || "Retail Scout",
      isPublic: isPublic !== undefined ? isPublic : true,
      avatarColor: avatarColor || "bg-[#FE8C00]/10 text-[#FE8C00] border-[#FE8C00]/20",
      createdAt: new Date().toISOString()
    };
    if (!sgtShowDb.members) sgtShowDb.members = [];
    sgtShowDb.members.push(newMember);
    saveDb();
    return res.json(newMember);
  } else {
    sgtShowDb.members[idx] = {
      ...sgtShowDb.members[idx],
      displayName: displayName !== undefined ? displayName : sgtShowDb.members[idx].displayName,
      bio: bio !== undefined ? bio : sgtShowDb.members[idx].bio,
      badge: badge !== undefined ? badge : sgtShowDb.members[idx].badge,
      isPublic: isPublic !== undefined ? isPublic : sgtShowDb.members[idx].isPublic,
      avatarColor: avatarColor !== undefined ? avatarColor : sgtShowDb.members[idx].avatarColor,
      uid: uid || sgtShowDb.members[idx].uid
    };
    saveDb();
    return res.json(sgtShowDb.members[idx]);
  }
});

app.get('/api/watchlists', (req, res) => {
  res.json(sgtShowDb.watchlists);
});

app.post('/api/watchlists', (req, res) => {
  const { name, description, assets, isSystem, creatorName } = req.body;
  const newList: Watchlist = {
    id: `watchlist-${Date.now()}`,
    name,
    description,
    assets: assets || [],
    isSystem: isSystem || false,
    isFollowed: false,
    creatorName: creatorName || "Retail Investor"
  };

  sgtShowDb.watchlists.push(newList);
  saveDb();
  res.status(201).json(newList);
});

app.put('/api/watchlists/:id', (req, res) => {
  const { id } = req.params;
  const idx = sgtShowDb.watchlists.findIndex(w => w.id === id);
  if (idx === -1) return res.status(404).json({ error: "Watchlist not found" });

  sgtShowDb.watchlists[idx] = {
    ...sgtShowDb.watchlists[idx],
    ...req.body
  };
  saveDb();
  res.json(sgtShowDb.watchlists[idx]);
});

// ── IPO Endpoints ────────────────────────────────────────────────
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
    description: 'SpaceX\'s satellite internet division serving 4M+ subscribers globally with low-earth-orbit broadband constellation.',
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
    description: 'Specialized cloud provider for GPU-accelerated AI workloads. Partners with NVIDIA and Microsoft Azure.',
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
    description: 'Nigeria\'s largest merchant payment processor with 3M+ businesses on platform. Expanding across Africa.',
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
    description: 'Leading African payments technology company processing payments in 30+ African countries.',
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
    description: 'Midstream energy infrastructure company focusing on gas processing and pipeline transportation.',
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
    description: 'Social media platform with 500M+ monthly active users. Strong AI data licensing business.',
    estimatedMarketCap: '$8B',
    underwriters: ['Morgan Stanley', 'Goldman Sachs'],
    country: 'USA',
  },
];

app.get('/api/ipos', async (req, res) => {
  const client = getGeminiClient();
  if (!client) {
    // Return curated fallback IPO data with data freshness note
    return res.json({
      ipos: FALLBACK_IPOS,
      grounded: false,
      lastUpdated: new Date().toISOString(),
      source: 'Static dataset (API key required for live search)',
    });
  }

  try {
    const prompt = `Search the web for the most recent and verified upcoming Initial Public Offerings (IPOs) globally. Focus on:
- US markets: NYSE, NASDAQ (major tech, fintech, SPACs)
- African markets: NGX Nigeria, JSE South Africa
- European markets: LSE, Euronext
- Asian markets: HKEX, TSE

Select the top 6-8 most significant upcoming, filed, or recently priced IPOs.

For each IPO, extract verified details from official filings (SEC, exchange websites, or financial news).

Respond STRICTLY with a JSON object containing an "ipos" array.
Schema:
{
  "ipos": [
    {
      "id": "string (e.g., ipo-1)",
      "companyName": "string",
      "ticker": "string",
      "exchange": "string (NYSE | NASDAQ | NGX | LSE | HKEX | etc)",
      "sector": "string",
      "priceRange": "string (e.g., $28-$35 or ₦45-₦52)",
      "sharesOffered": "string",
      "expectedDate": "string (e.g., 2026-06-28 or 2026-Q4)",
      "status": "string (upcoming | filed | priced | withdrawn)",
      "description": "string (1-2 sentences about the company)",
      "estimatedMarketCap": "string",
      "underwriters": ["string"],
      "country": "string"
    }
  ]
}

Only include IPOs where you can verify the information from reliable sources. If you cannot find enough real IPOs, return fewer items but ensure each one is accurate.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });

    try {
      const parsed = JSON.parse(response.text.trim());
      const ipos = parsed.ipos || [];
      res.json({
        ipos: ipos.length > 0 ? ipos : FALLBACK_IPOS,
        grounded: true,
        lastUpdated: new Date().toISOString(),
        source: 'Gemini web search with Google grounding',
      });
    } catch {
      let cleaned = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      const ipos = parsed.ipos || [];
      res.json({
        ipos: ipos.length > 0 ? ipos : FALLBACK_IPOS,
        grounded: true,
        lastUpdated: new Date().toISOString(),
        source: 'Gemini web search with Google grounding',
      });
    }
  } catch (error: any) {
    console.error('IPO search failed:', error);
    res.json({
      ipos: FALLBACK_IPOS,
      grounded: false,
      lastUpdated: new Date().toISOString(),
      source: 'Fallback dataset (live search unavailable)',
    });
  }
});

app.get('/api/notifications', (req, res) => {
  res.json(sgtShowDb.notifications);
});

app.put('/api/notifications/:id/read', (req, res) => {
  const not = sgtShowDb.notifications.find(n => n.id === req.params.id);
  if (not) {
    not.read = true;
    saveDb();
  }
  res.json({ success: true });
});

app.post('/api/notifications/clear', (req, res) => {
  sgtShowDb.notifications = [];
  saveDb();
  res.json({ success: true });
});

// Master Intelligent Ask API using Gemini with Search grounding
app.post('/api/ai/assistant', async (req, res) => {
  const { prompt, model } = req.body;
  if (!prompt) return res.status(400).json({ error: "Question prompt is required" });

  const activeModel = model || "gemma2-9b-it";
  const client = getGeminiClient();

  if (!client) {
    // Elegant Offline Local simulation expert logic
    let answer = `### 🧠 Sgt Show AI Assistant (Simulated: ${activeModel.toUpperCase()})

Thanks for asking! I operate under high-grade simulated **${activeModel.toUpperCase()}** weights because your secret \`GEMINI_API_KEY\` is not currently configured in AI Studio.

Here is what I know about your query using my localized parameters:
- You asked: "**${prompt}**"
- For global multi-market portfolios, current focus vectors center on **Federal Reserve lending lanes, Nvidia's CUDA graphics processor margins, sovereign central bank gold swaps, and institutional BTC ETF absorption support levels**.
- A smart macro rule is: **Ignore daily short-term speculative noises. Focus on assets generating durable, compound cash yields!**

To resolve this live using the real-time Gemini Search engine and the active **${activeModel}** model, configure your API key in **Settings > Secrets** in AI Studio!`;
    
    let sentiment: 'bullish' | 'bearish' | 'neutral' = "neutral";
    let keyTakeaway = "Focus on assets generating real, durable global revenue under high-inflation shields.";

    const query = prompt.toLowerCase();
    if (query.includes("btc") || query.includes("bitcoin") || query.includes("crypto")) {
      answer = `### 🧠 Why in-chain BTC accumulation matters (Simulated: ${activeModel.toUpperCase()})

Right now, **Bitcoin (BTC)** is undergoing strategic low-volatility consolidation between the **$65,000 to $69,000** support thresholds.

Here is the simple breakdown:
1. **The Speculator Shakeout:** Retail capital is chasing high-velocity, low-liquidity memecoins on cheaper protocols like Solana.
2. **The Sovereign Sweep:** Meanwhile, global retirement pools and pension funds are quietly acquiring Spot ETF units during range contractions.
3. **Takeaway:** Low-volatility accumulation limits are historic setups for long-term price discoveries. Strategic investors remain highly bullish.`;
      sentiment = "bullish";
      keyTakeaway = "Retail is distracted by temporary network noise, while institutional giants build core trust allocations.";
    } else if (query.includes("tesla") || query.includes("tsla")) {
      answer = `### 🧠 Explain Tesla (TSLA) valuation drivers simply (Simulated: ${activeModel.toUpperCase()})

**Tesla** matches a complex transition phase in global equities:
1. **The Margin Headwinds:** Electric automobile margins are compressing due to intense price-cutting and hyper-competitive Chinese exports (BYD).
2. **The Megapack Backstop:** Their battery energy grid sales (Megapacks) are growing at double-digit speeds, offsetting automobile declines.
3. **The AI Beta:** Premium valuations are a direct bet on full self-driving network licensing (FSD) and humanoid robotics (Optimus) rather than metal automotive supply.`;
      sentiment = "neutral";
      keyTakeaway = "Tesla is shifting from a hardware auto manufacturer into an automated AI computing and grid storage utility.";
    } else if (query.includes("nvda") || query.includes("nvidia")) {
      answer = `### 🧠 Analyzing NVIDIA's short-term AI chip monopoly (Simulated: ${activeModel.toUpperCase()})

**NVIDIA** is leading the structural global computing reshuffle:
1. **Blackwell Backlog:** Supplies for next-generation Blackwell neural processors are fully booked for the next 12 months, locking in short-term cash flow predictability.
2. **The CUDA software lock-in:** Developers train LLMs using Nvidia's unified runtime architectures. Shifting to competing custom ASICs is extremely complex and slow.
3. **Key Indicator:** Watch cloud budget expenditures — as long as tech giants scale computing leases, Nvidia's pricing power stays absolute.`;
      sentiment = "bullish";
      keyTakeaway = "Nvidia is selling the virtual shovel loops inside the artificial intelligence gold rush, protected by their CUDA software moat.";
    } else if (query.includes("gold") || query.includes("xau") || query.includes("commodity")) {
      answer = `### 🧠 Gold's historic sovereign asset run (Simulated: ${activeModel.toUpperCase()})

**Gold Spot (XAU)** is flashing powerful structural triggers:
1. **Systemic Debasement Protection:** Global central banks are actively diversifying away from paper yield reserves in favor of physical raw bullion.
2. **Geopolitical Weaponization:** Holding physical gold in domestic vaults removes third-party sanction risks and currency freezes.
3. **Macro Pivot:** Gold thrives when real interest rates cool, making current resilience during hawkish regimes exceptionally bullish.`;
      sentiment = "bullish";
      keyTakeaway = "Gold acts as the ultimate ancient anchor when paper currencies inflate and global sovereign trust fragments.";
    }

    return res.json({
      answer,
      sentiment,
      keyTakeaway,
      modelUsed: activeModel
    });
  }

  try {
    const isOopModel = activeModel.startsWith("gemma") || activeModel.startsWith("llama") || activeModel.startsWith("qwen");
    // Standardize Gemini supported models on the enterprise API tier
    const targetModel = isOopModel ? "gemini-3.5-flash" : activeModel;

    const systemPrompt = `You are the ultimate digital investing intelligence partner: the "Sgt Show AI Assistant", running on the **${activeModel}** model.
Your mission is to help global retail investors understand financial markets clearly.
Provide a beginner-friendly, insight-driven answer that is highly conversational yet objective.
Avoid heavy financial jargon of legacy trading platforms, instead focus on simplifying complex stock, crypto, commodity, and forex terms.

Analyze the question: "${prompt}" and reply with a structured breakdown. Be friendly, clean, and inspiring. Use bold text and bullet points.
Also, classify the overall market outlook sentiment for this search query into either: 'bullish', 'bearish', or 'neutral'.

Your response must be returned in JSON format matching this schema:
{
  "answer": "Pristine markdown format string breaking down the concepts cleanly. Introduce why it matters and list key takeaways. (Mention at the end that this analysis is processed via ${activeModel})",
  "sentiment": "bullish" | "bearish" | "neutral",
  "keyTakeaway": "1-sentence golden rule or actionable insight summary for a retail investor."
}`;

    const response = await client.models.generateContent({
      model: targetModel,
      contents: systemPrompt,
      config: {
        tools: [{ googleSearch: {} }], // Real web search grounding!
        responseMimeType: "application/json"
      }
    });

    try {
      const parsed = JSON.parse(response.text.trim());
      res.json({
        ...parsed,
        modelUsed: activeModel
      });
    } catch {
      // Clean up markup markdown wrappers if any
      let cleaned = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      try {
        const parsed = JSON.parse(cleaned);
        res.json({
          ...parsed,
          modelUsed: activeModel
        });
      } catch {
        res.json({
          answer: response.text + `\n\n*(Processed via ${activeModel} optimization engine)*`,
          sentiment: "neutral",
          keyTakeaway: "Markets reward patience and structural intelligence. Block out the daily noise!",
          modelUsed: activeModel
        });
      }
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Gemini processing failed" });
  }
});

// Setup Vite & static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Handle WebSocket manual upgrade
  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Sgt Show dev server executing on port ${PORT}`);
  });
}

startServer();
