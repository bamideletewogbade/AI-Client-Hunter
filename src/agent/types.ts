import type { Asset, SgtShowInsight, DiscussionPost, CommunityMember, UserNotification, Watchlist, IpoData } from '../types';

// ─── Result Types ────────────────────────────────────────────────
export interface AssetListResult { assets: Asset[] }
export interface InsightListResult { insights: SgtShowInsight[] }
export interface DiscussionListResult { posts: DiscussionPost[] }
export interface MemberListResult { members: CommunityMember[] }
export interface NotificationListResult { notifications: UserNotification[] }
export interface WatchlistListResult { watchlists: Watchlist[] }
export interface IpoListResult { ipos: IpoData[]; grounded?: boolean; source?: string; lastUpdated?: string }
export interface MarketPulseResult { headlines: any[]; grounded: boolean }
export interface HistoricalDataResult { data: { value: number }[] }
export interface AiAnalysisResult { analysis: string }
export interface AiAssistantResult { answer: string; sentiment?: 'bullish' | 'bearish' | 'neutral'; keyTakeaway?: string }
export interface MutationResult { success: boolean; id?: string }

// ─── Intent Union ────────────────────────────────────────────────
export type Intent =
  | { type: 'FETCH_ASSETS'; market?: string }
  | { type: 'FETCH_INSIGHTS' }
  | { type: 'FETCH_DISCUSSIONS'; sector?: string }
  | { type: 'FETCH_MEMBERS' }
  | { type: 'FETCH_NOTIFICATIONS' }
  | { type: 'FETCH_WATCHLISTS' }
  | { type: 'FETCH_IPOS' }
  | { type: 'MARKET_PULSE' }
  | { type: 'HISTORICAL_DATA'; ticker: string; timeframe: string }
  | { type: 'FETCH_ASSET_DETAIL'; assetId: string }
  | { type: 'AI_ANALYSIS'; assetId: string }
  | { type: 'AI_ASSISTANT'; prompt: string; model?: string }
  | { type: 'SAVE_PROFILE'; data: Record<string, any> }
  | { type: 'CREATE_DISCUSSION'; data: Record<string, any> }
  | { type: 'ADD_COMMENT'; postId: string; data: Record<string, any> }
  | { type: 'MARK_NOTIFICATION_READ'; notificationId: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'CREATE_WATCHLIST'; data: Record<string, any> }
  | { type: 'POST_INSIGHT'; data: Record<string, any> }
  | { type: 'TOGGLE_WATCHLIST'; assetId: string; watchlistIds: string[] };

// ─── Intent → Result Map ─────────────────────────────────────────
export interface IntentResultMap {
  'FETCH_ASSETS': AssetListResult;
  'FETCH_INSIGHTS': InsightListResult;
  'FETCH_DISCUSSIONS': DiscussionListResult;
  'FETCH_MEMBERS': MemberListResult;
  'FETCH_NOTIFICATIONS': NotificationListResult;
  'FETCH_WATCHLISTS': WatchlistListResult;
  'FETCH_IPOS': IpoListResult;
  'MARKET_PULSE': MarketPulseResult;
  'HISTORICAL_DATA': HistoricalDataResult;
  'FETCH_ASSET_DETAIL': { asset: Asset | null };
  'AI_ANALYSIS': AiAnalysisResult;
  'AI_ASSISTANT': AiAssistantResult;
  'SAVE_PROFILE': MutationResult;
  'CREATE_DISCUSSION': MutationResult;
  'ADD_COMMENT': MutationResult;
  'MARK_NOTIFICATION_READ': MutationResult;
  'CLEAR_NOTIFICATIONS': MutationResult;
  'CREATE_WATCHLIST': MutationResult;
  'POST_INSIGHT': MutationResult;
  'TOGGLE_WATCHLIST': MutationResult;
}

export type IntentType = Intent['type'];

export type IntentResult<T extends IntentType> = T extends keyof IntentResultMap ? IntentResultMap[T] : never;

// ─── Handler Signature ───────────────────────────────────────────
export type IntentHandler<T extends Intent = Intent> = (intent: T) => Promise<IntentResult<T['type']>>;
