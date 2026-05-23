import { useState, useEffect } from 'react';
import {
  Search, MapPin, Sparkles, Building2, Phone, Globe, Star, ArrowRight,
  Loader2, Check, Copy, Settings, Calendar, Award, Layout, Plus, CheckCircle
} from 'lucide-react';
import { Lead, SearchQueryConfig } from '../types';
import MapView from './MapView';

interface DiscoveryEngineProps {
  onSaveLead: (lead: Lead) => Promise<boolean>;
  savedLeadNames: string[];
  onInspectLead: (lead: Lead) => void;
  crmLeads: Lead[];
}

export default function DiscoveryEngine({ onSaveLead, savedLeadNames, onInspectLead, crmLeads }: DiscoveryEngineProps) {
  const [query, setQuery] = useState('Dental Clinic');
  const [location, setLocation] = useState('Accra');
  const [isSearching, setIsSearching] = useState(false);
  const [discoveredLeads, setDiscoveredLeads] = useState<Lead[]>([]);
  const [searchNotice, setSearchNotice] = useState<string | null>(null);
  
  // Quick pre-set terms to guide search
  const PRESET_INDUSTRIES = [
    { label: '🦷 Dental Practice', query: 'Dental Clinic' },
    { label: '🍔 Restaurants', query: 'Restaurants' },
    { label: '🚚 Freight Logistics', query: 'Logistics Companies' },
    { label: '🏫 Academies', query: 'Private Schools' },
    { label: '🏥 Medical Clinics', query: 'Health Clinics' }
  ];

  const PRESET_CITIES = ['Accra', 'Lagos', 'London', 'Kumasi'];

  const triggerSearch = async (targetQuery?: string, targetLoc?: string) => {
    const q = targetQuery || query;
    const l = targetLoc !== undefined ? targetLoc : location;
    
    setIsSearching(true);
    setSearchNotice(null);
    try {
      const response = await fetch('/api/leads/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, location: l }),
      });
      if (!response.ok) throw new Error("Search gateway error.");
      const data = await response.json();
      setDiscoveredLeads(data.leads || []);
      if (data.isFallback) {
        localStorage.setItem('hunter_ai_fallback', 'true');
        window.dispatchEvent(new Event('storage'));
      }
      if (data.notice) {
        setSearchNotice(data.notice);
      }
    } catch (err) {
      console.error("Discovery Search fail:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Perform initial search to show something beautiful on load
  useEffect(() => {
    const prefillNiche = localStorage.getItem('hunter_prefill_niche');
    const prefillCity = localStorage.getItem('hunter_prefill_city');
    
    let targetQ = 'Dental Clinic';
    let targetL = 'Accra';
    
    if (prefillNiche) {
      targetQ = prefillNiche;
      setQuery(prefillNiche);
      localStorage.removeItem('hunter_prefill_niche');
    }
    if (prefillCity) {
      targetL = prefillCity;
      setLocation(prefillCity);
      localStorage.removeItem('hunter_prefill_city');
    }
    
    triggerSearch(targetQ, targetL);
  }, []);

  const [savingId, setSavingId] = useState<string | null>(null);

  const handleSaveToPipeline = async (ld: Lead) => {
    setSavingId(ld.id);
    const success = await onSaveLead(ld);
    if (success) {
      // update localized tags in search output
      setDiscoveredLeads(prev => prev.map(item => {
        if (item.name === ld.name && item.address === ld.address) {
          return { ...item, isSaved: true };
        }
        return item;
      }));
    }
    setSavingId(null);
  };

  return (
    <div id="discovery-engine-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      
      {/* Search Filter Controls Left */}
      <div className="lg:col-span-4 space-y-5">
        <div className="rounded-xl border border-zinc-800 bg-[#0C0C0E] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-950/80 border border-blue-900/30 text-blue-400">
              <Search className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-sans font-bold text-white">Target Lead Parameters</h3>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Business Keyword</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Dental clinic, Gym, Bakery..."
                  className="w-full bg-[#09090B] border border-zinc-800 p-2.5 pl-9 text-xs text-zinc-300 placeholder-zinc-500 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Target Location</label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Accra, Lagos, London..."
                  className="w-full bg-[#09090B] border border-zinc-800 p-2.5 pl-9 text-xs text-zinc-300 placeholder-zinc-500 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <button
              onClick={() => triggerSearch()}
              disabled={isSearching}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs py-2.5 shadow-lg shadow-blue-900/10 cursor-pointer transition-all active:scale-[0.99]"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  Querying Maps Grounding...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-blue-200" />
                  Discover Prospects
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preset selections */}
        <div className="rounded-xl border border-zinc-800 bg-[#0C0C0E] p-4 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 block">Lead Target presets</span>
          
          <div className="space-y-1.5">
            {PRESET_INDUSTRIES.map((ind) => (
              <button
                key={ind.label}
                onClick={() => {
                  setQuery(ind.query);
                  triggerSearch(ind.query, location);
                }}
                className={`w-full flex items-center justify-between text-left text-xs rounded-lg p-2.5 border transition-all cursor-pointer ${
                  query === ind.query
                    ? 'bg-zinc-800/60 border-zinc-700 text-white font-semibold'
                    : 'bg-transparent border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <span>{ind.label}</span>
                <ArrowRight className="h-3 w-3 opacity-40 shrink-0" />
              </button>
            ))}
          </div>

          <div className="border-t border-zinc-800 pt-3">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">Popular hubs</span>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESET_CITIES.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setLocation(c);
                    triggerSearch(query, c);
                  }}
                  className={`px-2 py-1.5 border rounded text-center text-xs transition-all cursor-pointer ${
                    location === c
                      ? 'bg-blue-950/40 text-blue-400 border-blue-900/40'
                      : 'bg-[#09090B] border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Discovered Records Lists Right */}
      <div className="lg:col-span-8 space-y-4">
        
        {/* Render Map Frame if leads are there */}
        <MapView leads={discoveredLeads} onSelectLead={onInspectLead} />

        {searchNotice && (
          <div className="flex items-center gap-2 rounded-xl bg-blue-950/20 border border-blue-900/30 px-4 py-2.5 text-xs text-blue-300">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 flex shrink-0 animate-pulse"></span>
            <p className="leading-snug">{searchNotice}</p>
          </div>
        )}

        {/* Leads Lists */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans font-semibold text-zinc-400 flex items-center gap-2">
              Discovered Business Opportunities
              <span className="rounded bg-[#0C0C0E] text-zinc-300 px-2 py-0.5 border border-zinc-800 font-mono text-[10px]">
                {discoveredLeads.length} Found
              </span>
            </span>
            <span className="text-[10px] text-zinc-500 italic">Values generated in real-time</span>
          </div>

          {isSearching ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-[#0C0C0E]/40 border border-zinc-800 rounded-xl">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-3" />
              <h5 className="text-sm font-semibold text-zinc-200">Querying Google Search Grounding</h5>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                Gemini is performing a localized search matching your specified keywords to filter real, registered phone profiles, ratings, and websites.
              </p>
            </div>
          ) : discoveredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-[#0C0C0E]/40 border border-zinc-800 rounded-xl">
              <Building2 className="h-8 w-8 text-zinc-700 mb-2" />
              <h5 className="text-xs font-semibold text-zinc-400">No leads discovered yet</h5>
              <p className="text-[11px] text-zinc-500 mt-1">Specify parameters above and trigger lead search to populate deals.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {discoveredLeads.map((ld) => {
                const isSaved = savedLeadNames.includes(ld.name) || ld.isSaved;

                return (
                  <div
                    key={ld.id}
                    className="group flex flex-col justify-between rounded-xl border border-zinc-800 bg-[#0C0C0E]/90 p-4 transition-all duration-200 hover:border-zinc-750 hover:bg-[#0C0C0E]"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="max-w-[70%]">
                          <h4 className="text-xs font-bold text-white truncate" title={ld.name}>{ld.name}</h4>
                          <span className="text-[9px] text-zinc-500 font-mono tracking-wider block mt-0.5">{ld.category}</span>
                        </div>
                        {/* Digital Score Badge Gauge */}
                        <div className="flex flex-col items-end shrink-0">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                            ld.digitalPresenceScore < 40
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : ld.digitalPresenceScore < 60
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {ld.digitalPresenceScore}/100
                          </span>
                          <span className="text-[8px] text-zinc-500 mt-0.5 uppercase tracking-wide">Maturity</span>
                        </div>
                      </div>

                      <p className="text-[10px] text-zinc-400 line-clamp-2 min-h-[30px] leading-relaxed">
                        {ld.address}
                      </p>

                      <div className="flex flex-wrap gap-1">
                        {ld.tags.slice(0, 3).map((t) => (
                          <span key={t} className="text-[9px] rounded bg-[#09090B] border border-zinc-800 px-1.5 py-px text-zinc-450 font-mono">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-zinc-800/60 mt-3 pt-3 flex items-center justify-between">
                      {/* Website label */}
                      {ld.website ? (
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3 text-emerald-400 shrink-0" />
                          <span className="text-[10px] text-zinc-400 truncate max-w-[120px] font-medium" title={ld.website}>
                            {ld.website.replace('http://', '').replace('https://', '').replace('www.', '')}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-rose-500/10 px-2 py-0.5 border border-rose-500/20 rounded text-rose-400 text-[10px] font-bold uppercase tracking-wider">
                          <span>NO WEBSITE</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onInspectLead(ld)}
                          className="text-[10px] font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        >
                          Details
                        </button>
                        
                        <button
                          onClick={() => handleSaveToPipeline(ld)}
                          disabled={isSaved || savingId === ld.id}
                          className={`flex items-center gap-1 rounded px-2.5 py-1 text-[10px] font-bold transition-all border ${
                            isSaved
                              ? 'bg-zinc-900 border-zinc-800 text-zinc-500 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-500 border-blue-600 text-white cursor-pointer active:scale-95'
                          }`}
                        >
                          {savingId === ld.id ? (
                            <Loader2 className="h-2.5 w-2.5 animate-spin" />
                          ) : isSaved ? (
                            <CheckCircle className="h-2.5 w-2.5 text-blue-400" />
                          ) : (
                            <Plus className="h-2.5 w-2.5" />
                          )}
                          {isSaved ? 'In CRM' : 'Save CRM'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
