import React, { useState, useEffect, DragEvent } from 'react';
import { Sparkles, Trash2, FolderPlus, Eye, TrendingUp, AlertCircle, Plus, Share2, GripVertical } from 'lucide-react';
import { Asset, Watchlist } from '../types';

interface WatchlistViewProps {
  onSelectAsset: (id: string) => void;
  watchlistIds: string[];
  onToggleWatchlist: (assetId: string) => void;
  onReorderWatchlist: (reorderedIds: string[]) => void;
}

export default function WatchlistView({ onSelectAsset, watchlistIds, onToggleWatchlist, onReorderWatchlist }: WatchlistViewProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');

  // Drag and drop local states
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const loadData = async () => {
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/assets'),
        fetch('/api/watchlists')
      ]);
      if (r1.ok && r2.ok) {
        setAssets(await r1.json());
        setWatchlists(await r2.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const resp = await fetch('/api/watchlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName,
          description: newFolderDesc,
          assets: [],
          isSystem: false
        })
      });
      if (resp.ok) {
        setNewFolderName('');
        setNewFolderDesc('');
        setShowFolderModal(false);
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData('text/plain');
    const sourceIndex = parseInt(sourceIndexStr, 10);
    
    setDraggedIndex(null);
    setDragOverIndex(null);

    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

    // Use mapped layout instead of filter so manual positions are respected
    const customOrdered = watchlistIds
      .map(id => assets.find(a => a.id === id))
      .filter((a): a is Asset => !!a);

    const [removed] = customOrdered.splice(sourceIndex, 1);
    customOrdered.splice(targetIndex, 0, removed);

    const reorderedIds = customOrdered.map(item => item.id);
    onReorderWatchlist(reorderedIds);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
         <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FE8C00] border-t-transparent" />
         <p className="mt-4 text-xs text-zinc-400 font-mono">loading client watchlists...</p>
      </div>
    );
  }

  // Find and sort assets according to custom sequence of watchlistIds
  const myWatchlistedAssets = watchlistIds
    .map(id => assets.find(a => a.id === id))
    .filter((a): a is Asset => !!a);

  return (
    <div className="space-y-6 text-left">
      {/* Portfolio Header Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-900 pb-4">
        <div>
          <h2 className="font-display text-lg font-bold text-white">Sovereign Watchlist Engine</h2>
          <p className="text-[11px] text-zinc-500 font-medium">Create customized asset folders or follow Sgt Show pre-vetted sector lists.</p>
        </div>

        <button
          onClick={() => setShowFolderModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-90 px-4 py-2.5 text-xs font-bold text-[#FE8C00] transition-colors cursor-pointer"
        >
          <FolderPlus className="h-4 w-4" /> Create Custom Folder
        </button>
      </div>

      {/* Main core user Watchlist folder */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-[#FE8C00] flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FE8C00]" />
            My Followed Assets ({myWatchlistedAssets.length})
          </h3>
          {myWatchlistedAssets.length > 1 && (
            <p className="text-[10px] text-zinc-500 font-mono">
              💡 Drag cards directly by the left handle icon to reprioritize execution lines
            </p>
          )}
        </div>

        {myWatchlistedAssets.length === 0 ? (
          <div className="rounded-2xl border border-zinc-805/40 bg-zinc-90 w-full p-6 text-center text-xs text-zinc-500 leading-normal">
            Your customized list is empty. Explore the <span className="text-[#FE8C00] font-bold">Markets page</span> to add assets!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myWatchlistedAssets.map((asset, index) => {
              const sign = asset.changePercent >= 0 ? '+' : '';
              const colorClass = asset.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-500';
              const isCurrentlyDragged = draggedIndex === index;
              const isCurrentlyHoveredOver = dragOverIndex === index;

              return (
                <div 
                  key={asset.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`glass-panel p-4.5 text-left flex flex-col justify-between h-40 space-y-4 hover:border-zinc-800 transition-all glow-accent relative select-none ${
                    isCurrentlyDragged ? 'opacity-35 scale-95 border-dashed border-zinc-700 bg-zinc-950/40' : ''
                  } ${
                    isCurrentlyHoveredOver ? 'border-[#FE8C00]/40 bg-zinc-900/50 scale-[1.015]' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2.5">
                      {/* Drag handle button with grip indicator */}
                      <div 
                        className="mt-0.5 p-1 rounded hover:bg-zinc-900 text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing"
                        title="Drag to rearrange"
                      >
                        <GripVertical className="h-4 w-4 shrink-0" />
                      </div>

                      <div>
                        <span className="text-[8.5px] font-mono uppercase tracking-wider text-zinc-500">
                          {asset.market.toUpperCase()} • {asset.ticker}
                        </span>
                        <h4 className="font-display text-sm font-bold text-white mt-1 leading-tight">{asset.name}</h4>
                      </div>
                    </div>

                    <button
                      onClick={() => onToggleWatchlist(asset.id)}
                      className="p-1.5 text-zinc-550 hover:text-rose-500 rounded bg-zinc-900"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-baseline justify-between border-t border-zinc-905 pt-3">
                    <div>
                      <span className="text-sm font-bold text-zinc-100">
                        {asset.market === 'ngx' ? '₦' : '$'}{asset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <span className={`text-[10px] font-bold ml-2.5 ${colorClass}`}>
                        {sign}{asset.changePercent}%
                      </span>
                    </div>

                    <button
                      onClick={() => onSelectAsset(asset.id)}
                      className="flex items-center gap-1 text-[10px] font-bold text-[#FE8C00] hover:underline cursor-pointer"
                    >
                      Inspect <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pre-defined watchlists */}
      <div className="space-y-4 pt-4 border-t border-zinc-900">
        <h3 className="font-display text-sm font-bold text-white">Sgt Show Vetted Model Portfolios</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {watchlists.map(wl => {
            // Find assets matching inside this list
            const matchedAssets = assets.filter(a => wl.assets.includes(a.id));
            const capCount = matchedAssets.length;

            return (
              <div 
                key={wl.id} 
                className="glass-panel p-5 text-left space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] font-mono bg-zinc-900 px-2 py-0.5 rounded text-[#FE8C00] font-bold uppercase">
                        Vetted Portfolio
                      </span>
                      <h4 className="font-display text-sm font-bold text-white mt-2">
                        {wl.name}
                      </h4>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-400 mt-1 lines-clamp-2 leading-relaxed">
                    {wl.description}
                  </p>
                </div>

                {/* mini members ticker names */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {matchedAssets.map(a => (
                    <span 
                      key={a.id} 
                      onClick={() => onSelectAsset(a.id)}
                      className="text-[9px] font-mono cursor-pointer bg-zinc-900 hover:bg-zinc-800 px-2 py-1 rounded text-zinc-300 border border-zinc-850"
                    >
                      {a.ticker} ({a.changePercent >= 0 ? '+' : ''}{a.changePercent}%)
                    </span>
                  ))}
                  {capCount === 0 && (
                    <span className="text-[10px] text-zinc-600">No assets in this category</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
