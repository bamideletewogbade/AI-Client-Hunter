import { useState, useEffect } from 'react';
import Header from './components/Header';
import LandingView from './components/LandingView_fixed';
import SmartFeedView from './components/SmartFeedView';
import MarketsView from './components/MarketsView';
import AssetDetailPage from './components/AssetDetailPage';
import CommunityView from './components/CommunityView';
import SgtHubView from './components/SgtHubView';
import IpoView from './components/IpoView';
import AiAssistant from './components/AiAssistant';
import AuthModal from './components/AuthModal';
import OnboardingModal from './components/OnboardingModal';
import { AuthProvider } from './components/AuthContext';
import { LivePriceProvider } from './context/LivePriceContext';
import { CalendarRange, Target, AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'welcome' | 'feed' | 'markets' | 'community' | 'sgtshow' | 'ipos'>('welcome');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [watchlistIds, setWatchlistIds] = useState<string[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error'; id: number } | null>(null);

  // Initialize watchlist tracking from local storage
  useEffect(() => {
    const saved = localStorage.getItem('sgt_watchlist_ids');
    if (saved) {
      try {
        setWatchlistIds(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const handleToggleWatchlist = (assetId: string) => {
    setWatchlistIds(prev => {
      const next = prev.includes(assetId) 
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId];
      localStorage.setItem('sgt_watchlist_ids', JSON.stringify(next));
      
      triggerToast(
        prev.includes(assetId) 
          ? "Removed asset from your active Watchlist"
          : "Saved asset to your active Watchlist",
        prev.includes(assetId) ? "info" : "success"
      );
      return next;
    });
  };

  const handleReorderWatchlist = (reorderedIds: string[]) => {
    setWatchlistIds(reorderedIds);
    localStorage.setItem('sgt_watchlist_ids', JSON.stringify(reorderedIds));
    triggerToast("Updated manual Watchlist execution priority", "success");
  };

  // Toast listener utility
  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type: 'success' | 'info' | 'error' }>;
      if (customEvent.detail) {
        setToast({
          message: customEvent.detail.message,
          type: customEvent.detail.type || 'info',
          id: Date.now()
        });
      }
    };
    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  // WebSocket Integration for Real-time Signal updates & Live Toast triggers
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: any;
    let isMounted = true;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      console.log('Sgt Show WS connection starting on:', wsUrl);
      
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (!isMounted) return;

          switch (message.type) {
            case 'insight_added':
              triggerToast(`Sgt Show dropped an Insight: "${message.insight.content.slice(0, 45)}..."`, 'success');
              break;
            case 'discussion_added':
              triggerToast(`New debate raised: "${message.post.title.slice(0, 45)}..."`, 'info');
              break;
            default:
              break;
          }
        } catch (err) {
          // ignore
        }
      };

      ws.onclose = () => {
        if (!isMounted) return;
        reconnectTimer = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, []);

  return (
    <AuthProvider>
      <LivePriceProvider>
      <div id="sgt-viewport-root" className="min-h-screen bg-[#0C0C0E] text-zinc-100 antialiased font-sans selection:bg-[#FE8C00]/15 selection:text-[#FE8C00]">
        
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setSelectedAssetId(null); // Clear selected subpages
            setActiveTab(tab);
          }}
          onSearch={(query) => {
            triggerToast(`Searching Sgt intelligence boards for "${query}"...`, 'info');
          }}
          unassignedNotificationsCount={0}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />

        {/* Core application canvas */}
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedAssetId ? `detail-${selectedAssetId}` : `tab-${activeTab}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {selectedAssetId ? (
                <AssetDetailPage
                  assetId={selectedAssetId}
                  onBack={() => setSelectedAssetId(null)}
                  watchlistIds={watchlistIds}
                  onToggleWatchlist={handleToggleWatchlist}
                />
              ) : (
                <>
                  {activeTab === 'welcome' && (
                    <LandingView
                      setActiveTab={setActiveTab}
                      onSelectAsset={(id) => setSelectedAssetId(id)}
                      onOpenAuthModal={() => setIsAuthModalOpen(true)}
                    />
                  )}

                  {activeTab === 'feed' && (
                    <SmartFeedView
                      onSelectAsset={(id) => setSelectedAssetId(id)}
                      setActiveTab={setActiveTab}
                    />
                  )}

                  {activeTab === 'markets' && (
                    <MarketsView
                      onSelectAsset={(id) => setSelectedAssetId(id)}
                      watchlistIds={watchlistIds}
                      onToggleWatchlist={handleToggleWatchlist}
                      onReorderWatchlist={handleReorderWatchlist}
                    />
                  )}

                  {activeTab === 'community' && (
                    <CommunityView
                      onSelectAsset={(id) => setSelectedAssetId(id)}
                    />
                  )}

                  {activeTab === 'sgtshow' && (
                    <SgtHubView
                      onSelectAsset={(id) => setSelectedAssetId(id)}
                    />
                  )}

                  {activeTab === 'ipos' && (
                    <IpoView />
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Master Fintech Compact footer */}
          <footer className="mt-16 py-8 border-t border-zinc-900/40 text-center">
            <p className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase font-mono">
              ⚡ SHOW INVESTING INTELLIGENCE PLATFORM • © 2026
            </p>
            <div className="flex justify-center items-center gap-3.5 mt-2.5 text-[10.5px] font-semibold text-zinc-500 font-sans">
              <a href="mailto:bishoptewogbade@gmail.com" className="hover:text-[#FE8C00] transition-colors font-medium">bishoptewogbade@gmail.com</a>
              <span className="text-zinc-800">•</span>
              <a href="https://twitter.com/SgtShow_Intel" target="_blank" rel="noreferrer" className="hover:text-amber-500 transition-colors font-medium">X Profile</a>
              <span className="text-zinc-800">•</span>
              <span className="text-zinc-500">Bamidele Tewogbade</span>
            </div>
          </footer>
        </main>

        {/* Persistent Floating AI Assistant */}
        <AiAssistant />

        {/* Onboarding Flow */}
        <OnboardingModal />

        {/* Unified Auth Modal */}
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
        />

        {/* Absolute Floating Toaster Alert System */}
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="fixed top-6 right-6 z-50 max-w-sm w-full p-4 rounded-xl border shadow-2xl bg-[#121215] border-zinc-800 flex items-start gap-3 text-white"
            >
              <div className="shrink-0 mt-0.5">
                {toast.type === 'success' ? (
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
                ) : toast.type === 'error' ? (
                  <AlertCircle className="h-4.5 w-4.5 text-rose-400" />
                ) : (
                  <Info className="h-4.5 w-4.5 text-[#FE8C00]" />
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest leading-none">
                  {toast.type === 'success' ? 'INTELLIGENCE SIGNAL' : toast.type === 'error' ? 'ALERT ERROR' : 'PLATFORM BULLETIN'}
                </p>
                <p className="text-[11px] text-zinc-200 mt-1.5 leading-normal">{toast.message}</p>
              </div>
              <button
                onClick={() => setToast(null)}
                className="p-1 rounded bg-[#1A1A22] border border-zinc-805 text-zinc-400 hover:text-white transition-all cursor-pointer shrink-0"
              >
                <X className="h-3 w-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
      </LivePriceProvider>
    </AuthProvider>
  );
}
