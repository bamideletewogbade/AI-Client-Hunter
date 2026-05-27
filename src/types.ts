/**
 * Sgt Show Investing Intelligence Platform - Interface Definitions
 */

export interface NewsItem {
  title: string;
  summary: string;
  interpretation: string;
  source: string;
  date: string;
}

export interface Asset {
  id: string; // e.g. "ngx-gtco", "us-tsla", "crypto-btc"
  name: string;
  ticker: string;
  price: number;
  changePercent: number;
  type: 'stock' | 'crypto' | 'forex' | 'commodity';
  market: 'us' | 'crypto' | 'global';
  description: string;
  beginnerExplanation: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  stats: {
    peRatio?: string;
    marketCap?: string;
    high52w?: string;
    low52w?: string;
    volume?: string;
    dividendYield?: string;
  };
  bullishCase: string;
  bearishCase: string;
  news: NewsItem[];
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  authorName: string;
  authorEmail: string;
  authorAvatar?: string;
  reaction?: 'bullish' | 'bearish' | 'neutral' | null;
  createdAt: string;
}

export interface DiscussionPost {
  id: string;
  assetId?: string; // Optional links to asset
  sector: 'banks' | 'tech' | 'crypto' | 'general';
  title: string;
  content: string;
  authorName: string;
  authorEmail: string;
  authorAvatar?: string;
  reactions: {
    bullish: number;
    bearish: number;
    neutral: number;
  };
  userReaction?: 'bullish' | 'bearish' | 'neutral' | null;
  comments: Comment[];
  createdAt: string;
  aiSummary?: string;
}

export interface Watchlist {
  id: string;
  name: string;
  description?: string;
  assets: string[]; // List of asset IDs
  isSystem: boolean;
  isFollowed?: boolean;
  creatorName?: string;
}

export interface SgtShowInsight {
  id: string;
  content: string; // Original Twitter post body
  aiSummary: string; // AI breakout of points
  sentiment: 'bullish' | 'bearish' | 'neutral';
  createdAt: string;
  assets?: string[]; // Related asset tickers e.g. ["BTC", "GTCO"]
  fullAnalysisId?: string; // Links to asset page if breakdown available
}

export interface UserNotification {
  id: string;
  title: string;
  body: string;
  category: 'movement' | 'insight' | 'discussion' | 'watchlist';
  createdAt: string;
  read: boolean;
}

export interface AskResponse {
  answer: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  keyTakeaway?: string;
  links?: { title: string; uri: string }[];
}

export interface CommunityMember {
  uid: string;
  displayName: string;
  email: string;
  createdAt: string;
  isPublic: boolean;
  avatarColor: string;
  badge: string; // e.g. "Senior Advisor", "Market Analyst", etc
  bio: string;
}

export interface IpoData {
  id: string;
  companyName: string;
  ticker: string;
  exchange: string;
  sector: string;
  priceRange: string;
  sharesOffered: string;
  expectedDate: string;
  status: 'upcoming' | 'priced' | 'withdrawn' | 'filed';
  description: string;
  estimatedMarketCap: string;
  underwriters: string[];
  logo?: string;
  country: string;
  source?: string;
}
