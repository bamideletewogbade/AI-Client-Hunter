import { useState, useEffect } from 'react';
import { 
  Search, Calendar, Clock, DollarSign, Users, ExternalLink,
  ChevronDown, RefreshCw, Target, CheckCircle2, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sgtAgent } from '../agent';
import type { IpoData } from '../types';

const EXCHANGE_OPTIONS = ['All', 'NYSE', 'NASDAQ', 'NGX'];
const SECTOR_OPTIONS = ['All', 'Fintech', 'Telecommunications', 'Cloud Computing / AI', 'Energy', 'Social Media'];

type SortKey = 'expectedDate' | 'estimatedMarketCap' | 'companyName';

export default function IpoView() {
  const [ipos, setIpos] = useState<IpoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [exchangeFilter, setExchangeFilter] = useState('All');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('expectedDate');
  const [selectedIpo, setSelectedIpo] = useState<IpoData | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'filed' | 'priced'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [dataSource, setDataSource] = useState<string | null>(null);
  const [dataGrounded, setDataGrounded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchIpos = async () => {
    setRefreshing(true);
    try {
      const result = await sgtAgent.dispatch({ type: 'FETCH_IPOS' });
      setIpos(result.ipos);
      if (result.source) setDataSource(result.source);
      setDataGrounded(result.grounded || false);
      if (result.lastUpdated) {
        const d = new Date(result.lastUpdated);
        const now = new Date();
        const mins = Math.floor((now.getTime() - d.getTime()) / 60000);
        setLastUpdated(mins < 1 ? 'Just now' : mins < 60 ? `${mins}m ago` : d.toLocaleString());
      }
    } catch (e) {
      console.error('Failed to fetch IPOs:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIpos();
  }, []);

  const filteredIpos = ipos
    .filter(ipo => exchangeFilter === 'All' || ipo.exchange === exchangeFilter)
    .filter(ipo => sectorFilter === 'All' || ipo.sector === sectorFilter)
    .filter(ipo => statusFilter === 'all' || ipo.status === statusFilter)
    .filter(ipo => 
      searchQuery === '' || 
      ipo.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ipo.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ipo.sector.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'companyName':
          return a.companyName.localeCompare(b.companyName);
        case 'estimatedMarketCap': {
          const capA = parseFloat(a.estimatedMarketCap.replace(/[^0-9.]/g, ''));
          const capB = parseFloat(b.estimatedMarketCap.replace(/[^0-9.]/g, ''));
          return capB - capA;
        }
        case 'expectedDate':
        default:
          return a.expectedDate.localeCompare(b.expectedDate);
      }
    });

  const upcomingCount = ipos.filter(i => i.status === 'upcoming').length;
  const filedCount = ipos.filter(i => i.status === 'filed').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-400 font-mono uppercase">
            <Clock className="h-3 w-3" />
            Upcoming
          </span>
        );
      case 'filed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 font-mono uppercase">
            <Target className="h-3 w-3" />
            Filed
          </span>
        );
      case 'priced':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 font-mono uppercase">
            <CheckCircle2 className="h-3 w-3" />
            Priced
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 text-[10px] font-bold text-zinc-400 font-mono uppercase">
            {status}
          </span>
        );
    }
  };

  const getExchangeColor = (exchange: string) => {
    switch (exchange) {
      case 'NASDAQ': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'NYSE': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'NGX': return 'text-[#FE8C00] bg-[#FE8C00]/10 border-[#FE8C00]/20';
      default: return 'text-zinc-400 bg-zinc-800/30 border-zinc-800/40';
    }
  };

  const formatDate = (dateStr: string) => {
    if (dateStr.includes('Q')) return dateStr;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-[#FE8C00] to-[#FFA133] flex items-center justify-center font-display text-[10px] font-black text-zinc-950">
              IPO
            </div>
            <span className="text-[10px] font-mono font-bold text-[#FE8C00] uppercase tracking-wider">
              Global IPO Calendar
            </span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-black text-white">
            Initial Public Offerings
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Track upcoming, filed, and priced IPOs across global exchanges. Data sourced from verified filings and market intelligence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-zinc-400">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              {upcomingCount} Upcoming
            </span>
            <span className="text-zinc-700">|</span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              {filedCount} Filed
            </span>
          </div>
          <button
            onClick={fetchIpos}
            disabled={refreshing}
            className="p-2 rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-zinc-800 bg-zinc-950/40">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search IPOs by name, ticker, or sector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/70 py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder-zinc-500 outline-none focus:border-[#FE8C00] transition-all"
          />
        </div>

        {/* Exchange Filter */}
        <select
          value={exchangeFilter}
          onChange={(e) => setExchangeFilter(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2.5 text-[11px] font-bold text-white outline-none focus:border-[#FE8C00] transition-all cursor-pointer"
        >
          {EXCHANGE_OPTIONS.map(ex => (
            <option key={ex} value={ex}>{ex === 'All' ? 'All Exchanges' : ex}</option>
          ))}
        </select>

        {/* Sector Filter */}
        <select
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2.5 text-[11px] font-bold text-white outline-none focus:border-[#FE8C00] transition-all cursor-pointer"
        >
          {SECTOR_OPTIONS.map(s => (
            <option key={s} value={s}>{s === 'All' ? 'All Sectors' : s}</option>
          ))}
        </select>

        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-zinc-900/70 rounded-lg border border-zinc-800 p-0.5">
          {(['all', 'upcoming', 'filed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold font-mono uppercase transition-all cursor-pointer ${
                statusFilter === s
                  ? 'bg-[#FE8C00] text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2.5 text-[11px] font-bold text-white outline-none focus:border-[#FE8C00] transition-all cursor-pointer"
        >
          <option value="expectedDate">Sort: Date</option>
          <option value="estimatedMarketCap">Sort: Market Cap</option>
          <option value="companyName">Sort: Name</option>
        </select>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/40">
          <p className="text-[9px] font-mono text-zinc-500 uppercase font-bold tracking-wider">Total IPOs</p>
          <p className="text-lg font-display font-black text-white mt-1">{ipos.length}</p>
        </div>
        <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <p className="text-[9px] font-mono text-amber-400 uppercase font-bold tracking-wider">Upcoming</p>
          <p className="text-lg font-display font-black text-amber-300 mt-1">{upcomingCount}</p>
        </div>
        <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5">
          <p className="text-[9px] font-mono text-blue-400 uppercase font-bold tracking-wider">Filed</p>
          <p className="text-lg font-display font-black text-blue-300 mt-1">{filedCount}</p>
        </div>
        <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/40">
          <p className="text-[9px] font-mono text-zinc-500 uppercase font-bold tracking-wider">Exchanges</p>
          <p className="text-lg font-display font-black text-white mt-1">
            {new Set(ipos.map(i => i.exchange)).size}
          </p>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-4 animate-pulse">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-2/3 bg-zinc-800 rounded" />
                  <div className="h-3 w-1/3 bg-zinc-800 rounded" />
                </div>
                <div className="h-6 w-20 bg-zinc-800 rounded" />
              </div>
              <div className="h-3 w-full bg-zinc-800/60 rounded" />
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-zinc-800 rounded" />
                <div className="h-5 w-16 bg-zinc-800 rounded" />
                <div className="h-5 w-16 bg-zinc-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredIpos.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="h-12 w-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto">
            <Search className="h-6 w-6 text-zinc-500" />
          </div>
          <p className="text-sm font-bold text-zinc-400">No IPOs match your filters</p>
          <p className="text-xs text-zinc-600">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredIpos.map((ipo, idx) => (
            <motion.div
              key={ipo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedIpo(selectedIpo?.id === ipo.id ? null : ipo)}
              className={`group relative rounded-xl border p-5 text-left transition-all cursor-pointer ${
                selectedIpo?.id === ipo.id
                  ? 'border-[#FE8C00] bg-[#FE8C00]/5 shadow-lg shadow-[#FE8C00]/5'
                  : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-900/30'
              }`}
            >
              {/* Company Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display text-sm font-bold text-white group-hover:text-[#FE8C00] transition-colors">
                      {ipo.companyName}
                    </h3>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${getExchangeColor(ipo.exchange)}`}>
                      {ipo.ticker}:{ipo.exchange}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-mono text-zinc-400">{ipo.sector}</span>
                    <span className="text-zinc-700">•</span>
                    <span className="text-[10px] font-mono text-zinc-400">{ipo.country}</span>
                  </div>
                </div>
                {getStatusBadge(ipo.status)}
              </div>

              {/* Description */}
              <p className="text-[11px] text-zinc-400 leading-relaxed mt-3 line-clamp-2">
                {ipo.description}
              </p>

              {/* Key Metrics */}
              <div className="flex flex-wrap items-center gap-3 mt-3.5">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="font-bold text-white">{ipo.priceRange}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
                  <BarChart3 className="h-3.5 w-3.5 text-blue-400" />
                  <span>Cap: <span className="font-bold text-white">{ipo.estimatedMarketCap}</span></span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
                  <Calendar className="h-3.5 w-3.5 text-[#FE8C00]" />
                  <span className="font-bold text-white">{formatDate(ipo.expectedDate)}</span>
                </div>
              </div>

              {/* Underwriters */}
              {ipo.underwriters.length > 0 && (
                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-zinc-900/40">
                  <Users className="h-3 w-3 text-zinc-500 shrink-0" />
                  <div className="flex flex-wrap gap-1">
                    {ipo.underwriters.map((uw, i) => (
                      <span
                        key={i}
                        className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400"
                      >
                        {uw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Expand indicator */}
              <div className="absolute bottom-3 right-3 text-zinc-600 group-hover:text-zinc-400 transition-colors">
                <ChevronDown className={`h-4 w-4 transition-transform ${selectedIpo?.id === ipo.id ? 'rotate-180' : ''}`} />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Selected IPO Detail Modal */}
      <AnimatePresence>
        {selectedIpo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="rounded-xl border border-[#FE8C00]/30 bg-zinc-950/80 p-6 space-y-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-black text-white">{selectedIpo.companyName}</h3>
                  {getStatusBadge(selectedIpo.status)}
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  {selectedIpo.ticker} · {selectedIpo.exchange} · {selectedIpo.country}
                </p>
              </div>
              <button
                onClick={() => setSelectedIpo(null)}
                className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all cursor-pointer"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed">{selectedIpo.description}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/30">
                <p className="text-[9px] font-mono text-zinc-500 uppercase font-bold">Price Range</p>
                <p className="text-sm font-display font-bold text-white mt-1">{selectedIpo.priceRange}</p>
              </div>
              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/30">
                <p className="text-[9px] font-mono text-zinc-500 uppercase font-bold">Market Cap</p>
                <p className="text-sm font-display font-bold text-white mt-1">{selectedIpo.estimatedMarketCap}</p>
              </div>
              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/30">
                <p className="text-[9px] font-mono text-zinc-500 uppercase font-bold">Shares Offered</p>
                <p className="text-sm font-display font-bold text-white mt-1">{selectedIpo.sharesOffered}</p>
              </div>
              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/30">
                <p className="text-[9px] font-mono text-zinc-500 uppercase font-bold">Expected Date</p>
                <p className="text-sm font-display font-bold text-white mt-1">{formatDate(selectedIpo.expectedDate)}</p>
              </div>
            </div>

            {selectedIpo.underwriters.length > 0 && (
              <div>
                <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider mb-2">Underwriters</p>
                <div className="flex flex-wrap gap-2">
                  {selectedIpo.underwriters.map((uw, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-xs font-bold text-white"
                    >
                      {uw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => {
                  const query = `${selectedIpo.companyName} ${selectedIpo.ticker} IPO ${selectedIpo.exchange}`;
                  window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
                }}
                className="flex items-center gap-1.5 text-[11px] font-bold text-[#FE8C00] hover:text-[#FFA133] transition-colors cursor-pointer"
              >
                Search for official prospectus
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>        {/* Data freshness note */}
      <div className="text-center">
        <p className="text-[9px] font-mono text-zinc-600 flex items-center justify-center gap-2">
          {dataSource && (
            <>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold ${
                dataGrounded 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${dataGrounded ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                {dataGrounded ? 'Live Search' : 'Static Data'}
              </span>
              <span className="text-zinc-600">{dataSource}</span>
              {lastUpdated && <span className="text-zinc-700">·</span>}
              {lastUpdated && <span className="text-zinc-600">Updated {lastUpdated}</span>}
            </>
          )}
        </p>
      </div>
    </div>
  );
}
