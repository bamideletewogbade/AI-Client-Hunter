import { useState, useEffect } from 'react';
import { Search, Sparkles, TrendingUp, TrendingDown, Eye, Check, Plus, FolderHeart } from 'lucide-react';
import { Asset, Watchlist } from '../types';
import WatchlistView from './WatchlistView';

interface MarketsViewProps {
  onSelectAsset: (id: string) => void;
  watchlistIds: string[];
  onToggleWatchlist: (assetId: string) => void;
  onReorderWatchlist: (reorderedIds: string[]) => void;
}

export default function MarketsView({ onSelectAsset, watchlistIds, onToggleWatchlist, onReorderWatchlist }: MarketsViewProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [marketTab, setMarketTab] = useState<'us' | 'crypto' | 'global' | 'watchlist'>('us');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAssets = async () => {
    try {
      const r = await fetch('/api/assets');
      if (r.ok) {
        setAssets(await r.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FE8C00] border-t-transparent" />
        <p className="mt-4 text-xs text-zinc-400 font-mono">loading multi-asset market feeds...</p>
      </div>
    );
  }

  // Filter assets based on market tab and search query
  const filteredAssets = assets.filter(asset => 
    asset.market === marketTab && 
    (asset.name.toLowerCase().includes(search.toLowerCase()) || 
     asset.ticker.toLowerCase().includes(search.toLowerCase()))
  );

  // Group trending and movement items dynamically
  const topGainers = [...filteredAssets].sort((a,b) => b.changePercent - a.changePercent).slice(0, 3);
  const topLosers = [...filteredAssets].sort((a,b) => a.changePercent - b.changePercent).slice(0, 3);

  const marketLabels = {
    us: "US Wall Street",
    crypto: "Cryptocurrency",
    global: "Global Macro & Commodities",
    watchlist: "My Watchlist"
  };

  return (
    <div className="space-y-6">
      {/* Search and Toggles */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-900 pb-4">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {(['us', 'crypto', 'global', 'watchlist'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setMarketTab(tab);
                setSearch('');
              }}
              className={`flex-1 sm:flex-none uppercase tracking-wider font-mono text-[10px] font-bold px-4 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                marketTab === tab 
                  ? 'border-[#FE8C00] bg-[#FE8C00]/10 text-[#FE8C00]' 
                  : 'border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:text-white'
              }`}
            >
              {tab === 'us' ? 'US STOCKS' : tab === 'crypto' ? 'CRYPTO' : tab === 'global' ? 'GLOBAL MACRO' : (
                <>
                  <FolderHeart className="h-3.5 w-3.5 text-[#FE8C00]" />
                  MY WATCHLIST
                </>
              )}
            </button>
          ))}
        </div>

        {marketTab !== 'watchlist' && (
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder={`Search ${marketLabels[marketTab]}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-90 px-9 py-2 text-xs font-semibold text-white placeholder-zinc-500 outline-none focus:border-[#FE8C00]"
            />
          </div>
        )}
      </div>

      {marketTab === 'watchlist' ? (
        <WatchlistView
          onSelectAsset={onSelectAsset}
          watchlistIds={watchlistIds}
          onToggleWatchlist={onToggleWatchlist}
          onReorderWatchlist={onReorderWatchlist}
        />
      ) : (
        <>
          {/* Movement Callout row (Top Gainers / Losers) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Gainers */}
            <div className="glass-panel p-4 text-left space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 font-display">
                <TrendingUp className="h-4 w-4" />
                Top Gainers today
              </div>
              <div className="space-y-2">
                {topGainers.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => onSelectAsset(item.id)}
                    className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/30 hover:bg-zinc-900/60 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-200">{item.ticker}</span>
                      <span className="text-[10px] text-zinc-500 hidden sm:inline">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-zinc-300">
                        {item.market === 'ngx' ? '₦' : '$'}{item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        +{item.changePercent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Losers */}
            <div className="glass-panel p-4 text-left space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 font-display">
                <TrendingDown className="h-4 w-4" />
                Under Pressure / Pullback
              </div>
              <div className="space-y-2">
                {topLosers.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => onSelectAsset(item.id)}
                    className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/30 hover:bg-zinc-900/60 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-200">{item.ticker}</span>
                      <span className="text-[10px] text-zinc-500 hidden sm:inline">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-zinc-300">
                        {item.market === 'ngx' ? '₦' : '$'}{item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] font-extrabold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                        {item.changePercent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Asset Grid */}
          <div className="space-y-3">
            <h2 className="font-display text-base font-bold text-white text-left">
              All Listed Assets ({filteredAssets.length})
            </h2>

            {filteredAssets.length === 0 ? (
              <div className="glass-panel py-12 text-center text-zinc-500 text-xs">
                No assets found matching search filters
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAssets.map((asset) => {
                  const inWatchlist = watchlistIds.includes(asset.id);
                  return (
                    <div 
                      key={asset.id}
                      className="glass-panel p-5 text-left flex flex-col justify-between h-48 space-y-4 relative group hover:border-[#FE8C00]/40 transition-all glow-accent"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[9px] font-mono font-extrabold tracking-wider uppercase text-zinc-500">
                            {asset.market.toUpperCase()} • {asset.type.toUpperCase()}
                          </span>
                          <h3 className="font-display text-base font-bold text-white mt-1 group-hover:text-[#FE8C00] transition-colors">
                            {asset.name}
                          </h3>
                          <span className="text-xs font-mono font-bold bg-zinc-900 px-2 py-0.5 rounded text-zinc-300">
                            {asset.ticker}
                          </span>
                        </div>

                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleWatchlist(asset.id);
                          }}
                          className={`p-2 rounded-xl transition-all cursor-pointer ${
                            inWatchlist 
                              ? 'bg-[#FE8C00]/10 border border-[#FE8C00] text-[#FE8C00]' 
                              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                          }`}
                          title={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
                        >
                          {inWatchlist ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                        </button>
                      </div>

                      {/* Pricing and changes */}
                      <div className="flex items-baseline justify-between border-t border-zinc-900/60 pt-3">
                        <div>
                          <span className="text-sm font-bold text-white">
                            {asset.market === 'ngx' ? '₦' : '$'}{asset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                          <span className={`text-[10px] font-bold ml-2 ${
                            asset.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-500'
                          }`}>
                            {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent}%
                          </span>
                        </div>

                        <button
                          onClick={() => onSelectAsset(asset.id)}
                          className="flex items-center gap-1.5 rounded-xl border border-zinc-805 bg-zinc-900/60 hover:bg-zinc-90 px-3.5 py-1.5 text-[10px] font-bold text-white transition-colors cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Intelligence Page
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
