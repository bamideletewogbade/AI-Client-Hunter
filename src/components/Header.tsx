import React, { useState, useEffect } from 'react';
import { Search, Bell, Sparkles, LogIn, LogOut, Check, ChevronDown, MessageSquare, Newspaper, Twitter, ShieldCheck } from 'lucide-react';
import { useAuth } from './AuthContext';
import { UserNotification } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onSearch: (query: string) => void;
  unassignedNotificationsCount: number;
  onOpenAuthModal: () => void;
}

export default function Header({ activeTab, setActiveTab, onSearch, unassignedNotificationsCount, onOpenAuthModal }: HeaderProps) {
  const { user, logout } = useAuth();
  const [localSearch, setLocalSearch] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState<UserNotification[]>([]);
  const [sgtHubDropdownOpen, setSgtHubDropdownOpen] = useState(false);

  const fetchNotifs = async () => {
    try {
      const resp = await fetch('/api/notifications');
      if (resp.ok) {
        const data = await resp.json();
        setNotificationsList(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000); // Poll notifications every 10s
    return () => clearInterval(interval);
  }, []);

  const markRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      fetchNotifs();
    } catch (e) {
      console.error(e);
    }
  };

  const clearAllNotifs = async () => {
    try {
      await fetch('/api/notifications/clear', { method: 'POST' });
      fetchNotifs();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(localSearch);
    }
  };

  // Determine if activeTab belongs under the Sgt Hub sub-menu
  const isSgtHubActive = ['feed', 'sgtshow', 'community'].includes(activeTab);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-900/80 bg-[#0C0C0E]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo (S Logo + Show Investing) */}
        <div 
          onClick={() => {
            setActiveTab('welcome');
            setSgtHubDropdownOpen(false);
          }} 
          className="flex cursor-pointer items-center gap-2.5 group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#FE8C00] to-[#FFA133] font-display text-base font-extrabold text-zinc-950 glow-accent transform group-hover:scale-105 transition-all">
            S
          </div>
          <div className="text-left">
            <span className="font-display text-sm font-black tracking-wider text-white group-hover:text-[#FE8C00] transition-colors uppercase flex items-center gap-1">
              Show Investing<span className="text-[#FE8C00]">.</span>
            </span>
            <p className="text-[9px] font-mono tracking-widest text-[#FE8C00] uppercase -mt-1 font-extrabold">SOVEREIGN INTEL</p>
          </div>
        </div>

        {/* Desktop Navigation (Highly Consolidated) */}
        <nav className="hidden md:flex items-center space-x-1">
          {/* Launchpad */}
          <button
            onClick={() => {
              setActiveTab('welcome');
              setSgtHubDropdownOpen(false);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeTab === 'welcome' 
                ? 'text-[#FE8C00] bg-zinc-900/60 font-bold' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/30'
            }`}
          >
            Launchpad
          </button>

          {/* Markets */}
          <button
            onClick={() => {
              setActiveTab('markets');
              setSgtHubDropdownOpen(false);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeTab === 'markets' 
                ? 'text-[#FE8C00] bg-zinc-900/60 font-bold' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/30'
            }`}
          >
            Markets
          </button>

          {/* SGT Hub Submenu dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setSgtHubDropdownOpen(true)}
            onMouseLeave={() => setSgtHubDropdownOpen(false)}
          >
            <button
              onClick={() => setSgtHubDropdownOpen(!sgtHubDropdownOpen)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-1 ${
                isSgtHubActive
                  ? 'text-[#FE8C00] bg-zinc-900/60 font-bold' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/30'
              }`}
            >
              Sgt Hub
              <ChevronDown className={`h-3 w-3 transition-transform ${sgtHubDropdownOpen ? 'rotate-180 text-[#FE8C00]' : 'text-zinc-500'}`} />
            </button>

            {/* Submenu Popover on hover/click */}
            {sgtHubDropdownOpen && (
              <div className="absolute left-0 mt-1 w-72 rounded-xl border border-zinc-850 bg-zinc-950/95 p-2 shadow-2xl backdrop-blur-md z-50 text-left">
                {/* Combined Smart Feed */}
                <div 
                  onClick={() => {
                    setActiveTab('feed');
                    setSgtHubDropdownOpen(false);
                  }}
                  className={`p-2.5 rounded-lg transition-all cursor-pointer hover:bg-zinc-900 flex items-start gap-2.5 ${
                    activeTab === 'feed' ? 'bg-zinc-900/60 border border-zinc-800' : ''
                  }`}
                >
                  <div className="h-7 w-7 rounded bg-amber-500/10 flex items-center justify-center text-[#FE8C00]">
                    <Newspaper className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-white leading-none">Smart Intel Brief</h4>
                    <p className="text-[9.5px] text-zinc-400 mt-1 leading-normal">Daily simplified macro-economic insights</p>
                  </div>
                </div>

                {/* Twitter Signals Ingest */}
                <div 
                  onClick={() => {
                    setActiveTab('sgtshow');
                    setSgtHubDropdownOpen(false);
                  }}
                  className={`p-2.5 rounded-lg transition-all cursor-pointer hover:bg-zinc-900 flex items-start gap-2.5 mt-1 ${
                    activeTab === 'sgtshow' ? 'bg-zinc-900/60 border border-zinc-800' : ''
                  }`}
                >
                  <div className="h-7 w-7 rounded bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Twitter className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-white leading-none">Twitter Signals Ingest</h4>
                    <p className="text-[9.5px] text-zinc-400 mt-1 leading-normal">Direct raw socials parsed by AI (Bamidele's voice)</p>
                  </div>
                </div>

                {/* Community Forum Board */}
                <div 
                  onClick={() => {
                    setActiveTab('community');
                    setSgtHubDropdownOpen(false);
                  }}
                  className={`p-2.5 rounded-lg transition-all cursor-pointer hover:bg-zinc-900 flex items-start gap-2.5 mt-1 ${
                    activeTab === 'community' ? 'bg-zinc-900/60 border border-zinc-800' : ''
                  }`}
                >
                  <div className="h-7 w-7 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-white leading-none">Community Board</h4>
                    <p className="text-[9.5px] text-zinc-400 mt-1 leading-normal">Member debates, sentiment pools & profile logs</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Search & Actions */}
        <div className="flex items-center gap-3">
          {/* Global Search Bar */}
          <div className="relative hidden max-w-xs sm:block">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search assets, topics..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={handleSearchKeyPress}
              className="w-48 lg:w-56 rounded-xl border border-zinc-800 bg-zinc-900/70 py-2 pl-9 pr-4 text-xs font-medium text-white placeholder-zinc-500 outline-none focus:border-[#FE8C00] transition-all"
            />
          </div>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setSgtHubDropdownOpen(false);
              }}
              className="relative p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white transition-all hover:bg-zinc-9"
            >
              <Bell className="h-4.5 w-4.5" />
              {notificationsList.filter(n => !n.read).length > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FE8C00] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FE8C00]"></span>
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2.5 w-80 rounded-2xl border border-zinc-805 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-md z-50">
                <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2.5">
                  <span className="font-display text-xs font-bold text-white uppercase tracking-wider">Alerts Feed</span>
                  {notificationsList.length > 0 && (
                    <button 
                      onClick={clearAllNotifs}
                      className="text-[10px] font-semibold text-[#FE8C00] hover:text-[#FFA133]"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="mt-2.5 max-h-64 overflow-y-auto space-y-2 hide-scrollbar">
                  {notificationsList.length === 0 ? (
                    <p className="text-center text-[11px] text-zinc-500 py-6">No recent alerts</p>
                  ) : (
                    notificationsList.map((not) => (
                      <div 
                        key={not.id} 
                        onClick={() => {
                          markRead(not.id);
                          if (not.category === 'insight') setActiveTab('sgtshow');
                          else if (not.category === 'discussion') setActiveTab('community');
                          else setActiveTab('markets');
                          setNotificationsOpen(false);
                        }}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                          not.read 
                            ? 'bg-zinc-900/10 border-zinc-900/40 text-zinc-400' 
                            : 'bg-zinc-900/60 border-zinc-800 text-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div>
                            <span className="text-[8px] font-mono tracking-wider uppercase font-bold text-[#FE8C00]">
                              {not.category}
                            </span>
                            <h4 className="text-[11px] font-bold mt-0.5 leading-snug">{not.title}</h4>
                            <p className="text-[10px] text-zinc-400 mt-1 leading-normal">{not.body}</p>
                          </div>
                          {!not.read && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                markRead(not.id);
                              }}
                              className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-white"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Authentic Check via AuthModal */}
          {user ? (
            <div className="flex items-center gap-2 border-l border-zinc-800 pl-3">
              {/* Profile card with positive yes indicators */}
              <div className="flex items-center gap-2 pr-1">
                <img
                  src={user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256&auto=format&fit=crop"}
                  alt="user avatar"
                  className="h-8.5 w-8.5 rounded-xl object-cover border border-[#FE8C00]/40"
                />
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-[10px] font-bold text-white max-w-[80px] truncate leading-none">{user.displayName}</span>
                  <span className="text-[8px] text-emerald-400 font-mono font-bold flex items-center gap-0.5 mt-0.5 uppercase">
                    <ShieldCheck className="h-2.5 w-2.5 shrink-0 text-emerald-400" /> Member: YES
                  </span>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-xl text-zinc-500 hover:text-[#FE8C00] transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/40 px-3.5 py-2 text-xs font-semibold text-white hover:border-[#FE8C00] transition-all cursor-pointer hover:bg-zinc-900"
            >
              <LogIn className="h-4 w-4 text-[#FE8C00]" />
              <span className="hidden sm:inline">Sign In / Sign Up</span>
            </button>
          )}
        </div>
      </div>

      {/* COMPANION: Clean Mobile Navigation Tray with grouped drop structures */}
      <div className="md:hidden border-t border-zinc-900/40 bg-zinc-950/40 p-2 flex items-center justify-around text-center w-full">
        <button
          onClick={() => setActiveTab('welcome')}
          className={`text-[9.5px] font-mono uppercase font-bold px-3 py-1.5 rounded-lg ${
            activeTab === 'welcome' ? 'text-[#FE8C00] bg-zinc-900/70' : 'text-zinc-500'
          }`}
        >
          Launchpad
        </button>
        <button
          onClick={() => setActiveTab('markets')}
          className={`text-[9.5px] font-mono uppercase font-bold px-3 py-1.5 rounded-lg ${
            activeTab === 'markets' ? 'text-[#FE8C00] bg-zinc-900/70' : 'text-zinc-500'
          }`}
        >
          Markets
        </button>
        <button
          onClick={() => setActiveTab('feed')}
          className={`text-[9.5px] font-mono uppercase font-bold px-3 py-1.5 rounded-lg ${
            activeTab === 'feed' ? 'text-[#FE8C00] bg-zinc-900/70' : 'text-zinc-500'
          }`}
        >
          Brief
        </button>
        <button
          onClick={() => setActiveTab('sgtshow')}
          className={`text-[9.5px] font-mono uppercase font-bold px-3 py-1.5 rounded-lg ${
            activeTab === 'sgtshow' ? 'text-[#FE8C00] bg-zinc-900/70' : 'text-zinc-500'
          }`}
        >
          Signals
        </button>
        <button
          onClick={() => setActiveTab('community')}
          className={`text-[9.5px] font-mono uppercase font-bold px-3 py-1.5 rounded-lg ${
            activeTab === 'community' ? 'text-[#FE8C00] bg-zinc-900/70' : 'text-zinc-500'
          }`}
        >
          Community
        </button>
      </div>
    </header>
  );
}
