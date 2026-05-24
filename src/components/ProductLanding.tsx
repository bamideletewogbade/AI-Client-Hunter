import { useState } from 'react';
import { 
  MapPin, 
  Sparkles, 
  Check, 
  ArrowRight, 
  Database,
  Layers,
  Search,
  Store,
  PenTool,
  Send,
  ExternalLink,
  ShieldAlert,
  Zap,
  Users,
  Mail,
  Twitter,
  Linkedin,
  RefreshCw,
  Sliders,
  Code,
  Activity
} from 'lucide-react';
import AIPipelineDashboard from './AIPipelineDashboard';

interface ProductLandingProps {
  onStartApp: () => void;
  isFirebaseConfigured: boolean;
  onConnectDatabase: () => void;
}

export default function ProductLanding({ onStartApp, isFirebaseConfigured, onConnectDatabase }: ProductLandingProps) {
  // Interactive Hero Widget State
  const [selectedNiche, setSelectedNiche] = useState('Dentist');
  const [targetCity, setTargetCity] = useState('Austin, TX');
  const [isSimulating, setIsSimulating] = useState(false);

  // Compare Tab State
  const [activeCompareTab, setActiveCompareTab] = useState<'rating' | 'website' | 'outreach'>('website');

  // --- Sandbox Simulator States (Levelsio style interactive feature test-drive) ---
  const [simStep, setSimStep] = useState<1 | 2 | 3>(1);
  const [simNiche, setSimNiche] = useState('Roofer');
  const [simCity, setSimCity] = useState('Miami, FL');
  const [isSimScan, setIsSimScan] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  const [copiedPitch, setCopiedPitch] = useState(false);

  // Simulated leads generated based on user niche selection
  const [simLeads, setSimLeads] = useState<any[]>([
    { name: "Miami Top-Tier Roofing & Siding", rating: 3.4, speed: "9.2s (Snail Mode)", hasWebsite: true, issue: "Slow Mobile Speed", originalScore: 35, category: "Contractor" },
    { name: "Everglades Roof Repair & Gutter Co", rating: 2.8, speed: "N/A (Offline)", hasWebsite: false, issue: "No Declared Website", originalScore: 20, category: "Services" },
    { name: "Sunshine State Roofers Guild", rating: 4.1, speed: "4.8s (Tardy)", hasWebsite: true, issue: "Ugly, non-responsive UI", originalScore: 45, category: "Roofing" }
  ]);

  const [selectedSimLead, setSelectedSimLead] = useState<any>({
    name: "Miami Top-Tier Roofing & Siding", rating: 3.4, speed: "9.2s (Snail Mode)", hasWebsite: true, issue: "Slow Mobile Speed", originalScore: 35, category: "Contractor"
  });

  // Simulated Audit Correction switches
  const [fixImages, setFixImages] = useState(false);
  const [fixMobile, setFixMobile] = useState(false);
  const [fixMapPin, setFixMapPin] = useState(false);
  const [fixSEO, setFixSEO] = useState(false);

  // Compute live corrected scores
  const getSimulatedScore = () => {
    if (!selectedSimLead) return 35;
    let score = selectedSimLead.originalScore;
    if (fixImages) score += 20;
    if (fixMobile) score += 25;
    if (fixMapPin) score += 20;
    if (fixSEO) score += 10;
    return Math.min(score, 100);
  };

  // Run lead scan simulation
  const handleSimRadarScan = () => {
    setIsSimScan(true);
    setSimProgress(10);
    
    // Reset switches
    setFixImages(false);
    setFixMobile(false);
    setFixMapPin(false);
    setFixSEO(false);

    // Increment progress simulated ticking
    const interval = setInterval(() => {
      setSimProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSimScan(false);
          // Set custom simulated leads based on user text to feel ultra real
          const titleCaseNiche = simNiche.charAt(0).toUpperCase() + simNiche.slice(1);
          const cityShort = simCity.split(',')[0];
          setSimLeads([
            { name: `${cityShort} Premium ${titleCaseNiche}s Ltd`, rating: 3.2, speed: "8.6s (Slow)", hasWebsite: true, issue: "Extremely Heavy Image Assets", originalScore: 30, category: titleCaseNiche },
            { name: `${cityShort} Classic ${titleCaseNiche} Pros`, rating: 2.5, speed: "Offline", hasWebsite: false, issue: "Missing Map Website Asset", originalScore: 15, category: titleCaseNiche },
            { name: `Apex ${titleCaseNiche} Outreach Group`, rating: 4.2, speed: "5.1s (Average)", hasWebsite: true, issue: "Dead External Links & Mobile Bugs", originalScore: 50, category: titleCaseNiche }
          ]);
          // Default selection
          setSelectedSimLead({
            name: `${cityShort} Premium ${titleCaseNiche}s Ltd`, rating: 3.2, speed: "8.6s (Slow)", hasWebsite: true, issue: "Extremely Heavy Image Assets", originalScore: 30, category: titleCaseNiche
          });
          // Push to audit step automatically to feel snappy
          setSimStep(2);
          return 100;
        }
        return prev + 30;
      });
    }, 450);
  };

  const getPitchEmailText = () => {
    const businessName = selectedSimLead?.name || "Local Business";
    const speedStr = selectedSimLead?.speed || "9.2s (Slow)";
    const nicheLabel = simNiche.toLowerCase();
    
    return `Subject: Performance & Design Audit for ${businessName}

Hi team at ${businessName},

I was running a local digital presence audit for ${nicheLabel} businesses in ${simCity} and noticed your profile. 

Your map ranking has great potential, but your website's mobile response speed is currently pegged at ${speedStr}. That is causing over 40% of potential local customers to bounce before your menu/portfolio even loads!

I went ahead and designed a modern, high-performance web dashboard concepts specifically for ${businessName}. It takes only 1.2 seconds to load, has built-in one-tap mobile booking triggers, and aligns perfectly with modern local Google SEO guidelines.

I would love to send over the initial Figma/Tailwind mockup structures free of charge. No obligation at all—I just wanted to show you what is possible for your brand.

Would you be open to a quick 5-minute look?

Best regards,
Bamidele Tewogbade
Lead Performance Architect, Client Hunter`;
  };

  const handleCopyPitch = () => {
    navigator.clipboard.writeText(getPitchEmailText());
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
  };

  // Handle the Interactive Search simulation
  const handleLaunchInstantScan = () => {
    setIsSimulating(true);
    // Persist to local storage so Discovery search can read & prefill
    localStorage.setItem('hunter_prefill_niche', selectedNiche);
    localStorage.setItem('hunter_prefill_city', targetCity);
    
    setTimeout(() => {
      setIsSimulating(false);
      onStartApp();
    }, 850);
  };

  // Mock Active Leads for the Masonry Live Feed (mimicking interiorai style grids)
  const previewLeads = [
    {
      name: "Apex Auto Repair",
      rating: "3.2 ⭐",
      issue: "No Website Found",
      location: "Miami, FL",
      status: "Opportunity detected",
      type: "Automotive"
    },
    {
      name: "Summit Bakery & Cafe",
      rating: "2.8 ⭐",
      issue: "Broken Link & Menu PDF",
      location: "Denver, CO",
      status: "Ready for pitch",
      type: "Bakery"
    },
    {
      name: "Bright Dental Care",
      rating: "4.1 ⭐",
      issue: "Ugly, Non-responsive UI",
      location: "Austin, TX",
      status: "Proposal drafted",
      type: "Dentist"
    },
    {
      name: "Vogue Hair Studio",
      rating: "3.4 ⭐",
      issue: "Slow Load Time (8.4s)",
      location: "Seattle, WA",
      status: "SEO checklist ready",
      type: "Salon"
    },
    {
      name: "Greenfield Landscaping",
      rating: "3.0 ⭐",
      issue: "No Website Declared",
      location: "Atlanta, GA",
      status: "Opportunity detected",
      type: "Gardening"
    },
    {
      name: "Pioneer Chiropractic",
      rating: "4.5 ⭐",
      issue: "Missing Google Maps Pin",
      location: "Chicago, IL",
      status: "Ready for audit",
      type: "Medical"
    }
  ];

  return (
    <div id="product-landing-root" className="bg-[#FAFAFB] text-zinc-900 selection:bg-blue-600/10 selection:text-blue-600 min-h-screen">
      
      {/* 🚀 Iconic Hero Section with Float Widget Block & Mosaic Background */}
      <section className="relative overflow-hidden pt-16 pb-24 border-b border-zinc-200 bg-linear-to-b from-white via-zinc-50/30 to-zinc-100/40">
        
        {/* Subtle geometric line design accents in the background */}
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full border-x border-dashed border-zinc-200/60" />
          <div className="absolute top-1/3 left-0 w-full h-px border-t border-dashed border-zinc-200/60" />
        </div>                        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-12 lg:items-center">
          
          {/* Left Column: Bold Copy and Bullet Indicators */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-left max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/60 px-3 py-1 text-xs font-semibold text-blue-700">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              <span className="font-display tracking-tight">AI Client Acquisition Engine v2.0</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-900 font-display leading-[1.08]">
              Fire your outbound agency. <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-700">
                Get real local clients.
              </span>
            </h1>

            <p className="text-zinc-600 text-sm sm:text-lg font-light leading-relaxed">
              Why send thousands of spam emails? Our intelligent radar scans Google Maps, diagnoses slow or missing local business websites, and generates customized redesign mockups to win clients directly.
            </p>

            {/* Quick Iconic 1-2-3 list, inspired by the reference sites */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-800">Scan Google Maps directly</p>
                  <p className="text-xs text-zinc-500">Pick any city or niche to find real, active businesses with poor online presence.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-800">Run a smart design audit</p>
                  <p className="text-xs text-zinc-500">Find exactly what is broken—whether it is raw speed, mobile bugs, or broken website links.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-800">Present direct, beautiful value</p>
                  <p className="text-xs text-zinc-500">Create a personalized redesign pitch with layout code structures to start high-ticket relationships.</p>
                </div>
              </div>
            </div>

            {/* Credibility logos */}
            <div className="pt-6 border-t border-zinc-200/80">
              <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 font-mono mb-3">TRUSTED BY FREELANCERS & AGENCIES WORLDWIDE</p>
              <div className="flex flex-wrap gap-4 items-center opacity-70">
                <span className="text-xs font-extrabold text-zinc-400 tracking-wider">STRIPE PIONEER</span>
                <span className="text-zinc-300">•</span>
                <span className="text-xs font-extrabold text-zinc-400 tracking-wider">SHOPIFY INSIDER</span>
                <span className="text-zinc-300">•</span>
                <span className="text-xs font-extrabold text-zinc-400 tracking-wider">YCOMBINATOR ASSIST</span>
              </div>
            </div>
          </div>

          {/* Right Column: Sleek Floating Action Controller Widget (Classic @levelsio layout) */}
          <div className="lg:col-span-5 relative mt-4 lg:mt-0">
            {/* Soft decorative background glow */}
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-xl opacity-10" />

            {/* Main Interactive Floating Widget Container */}
            <div className="relative bg-zinc-900 text-white rounded-2xl sm:rounded-3xl border border-zinc-800 shadow-2xl p-4 sm:p-8">
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-400 font-mono tracking-wider uppercase">Live Lead Scanner</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">No Credit Card Needed</span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold font-display tracking-tight text-white mb-5">
                Find local clients in seconds
              </h2>

              <div className="space-y-4">
                
                {/* Search Term Selection */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 font-mono">
                    Select Target Niche
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-2 gap-1.5 sm:gap-2">
                    {['Dentist', 'Roofer', 'Bakery', 'Coffee Shop', 'Barber', 'Gym'].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setSelectedNiche(n)}
                        className={`text-xs px-3 py-2 rounded-xl font-medium border transition-all text-center cursor-pointer ${
                          selectedNiche === n
                            ? 'bg-blue-600 text-white border-blue-500 font-bold'
                            : 'bg-zinc-800/60 text-zinc-300 border-zinc-700/60 hover:border-zinc-500'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Location text field */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 font-mono">
                    Target Location
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                    <input
                      type="text"
                      value={targetCity}
                      onChange={(e) => setTargetCity(e.target.value)}
                      placeholder="e.g. Dallas, TX"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-medium"
                    />
                  </div>
                </div>

                {/* Big Action Call To Action Button with dynamic loading feedback */}            <button
                          type="button"
                          onClick={handleLaunchInstantScan}
                          disabled={isSimulating}
                          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl py-3 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20 active:scale-98"
                        >
                          {isSimulating ? (
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span className="truncate">Scanning Maps...</span>
                            </div>
                          ) : (
                            <>
                              <span className="truncate">Find {selectedNiche} Leads Near {targetCity.split(',')[0]} →</span>
                            </>
                          )}
                        </button>

                {/* Database Backup indicator link */}
                <div className="pt-2 flex justify-between items-center text-[10px] font-mono text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Database className="h-3 w-3 text-zinc-500" />
                    <span>Mode: {isFirebaseConfigured ? 'Cloud Live Firestore' : 'Offline Local Backup'}</span>
                  </span>
                  {!isFirebaseConfigured && (
                    <button 
                      onClick={onConnectDatabase}
                      className="text-emerald-400 hover:underline cursor-pointer font-bold"
                    >
                      Connect DB
                    </button>
                  )}
                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 📊 Masonry Feed Section: Show Leads that Need Redesigns (Interior/Photo AI style Masonry visual) */}
      <section className="py-20 bg-white border-b border-zinc-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-[11px] font-bold tracking-widest uppercase text-blue-600 font-mono">Live Acquisition Tracker</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-zinc-900 mt-2">
              Leads matching current design criteria
            </h2>
            <p className="text-sm text-zinc-500 mt-2">
              Our radar finds physical, local business listings that suffer from bad design, missing layout mobile features, or incorrect map parameters.
            </p>
          </div>

          {/* Grid Layout of simulated leads cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {previewLeads.map((lead, idx) => (
              <div 
                key={idx} 
                className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] font-bold font-mono uppercase bg-zinc-200 text-zinc-700 rounded-md px-1.5 py-0.5 tracking-wider">
                        {lead.type}
                      </span>
                      <h3 className="text-sm font-bold text-zinc-950 font-display mt-2">{lead.name}</h3>
                      <p className="text-xs text-zinc-400 font-mono mt-0.5">{lead.location}</p>
                    </div>
                    <span className="text-xs font-bold text-amber-600 font-mono bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
                      {lead.rating}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span className="text-xs font-bold tracking-tight">{lead.issue}</span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-dashed border-zinc-200 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 font-mono uppercase font-bold tracking-wider">{lead.status}</span>
                  <button
                    type="button"
                    onClick={onStartApp}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Run Audit</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <button
              onClick={onStartApp}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs py-3.5 px-6 uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <span>Explore All Active Map Leads</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

        </div>
      </section>

      {/* 🚀 LEVELS.IO / PHOTOAI / INTERIORAI STYLE INTERACTIVE PLAYGROUND AND SIMULATOR */}
      <section id="interactive-sandbox-simulator" className="py-24 bg-zinc-950 text-white relative overflow-hidden border-y border-zinc-800">
        {/* Ambient grids in dark theme */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#1e40af_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 px-3 py-1 text-xs font-semibold text-blue-400">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              Interactive Workshop
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-white">
              Try the design engine in real-time
            </h2>
            <p className="text-sm text-zinc-400 max-w-xl mx-auto font-light leading-relaxed">
              Experience the core workflow of Client Hunter. Search, diagnose performance, toggle layout fixes to boost their digital presence score, and construct live contracts instantly.
            </p>
          </div>

          {/* Interactive Steps Progress tabs */}
          <div className="flex flex-col sm:flex-row justify-center items-stretch gap-2 max-w-3xl mx-auto mb-10 sm:mb-12">
            {[
              { step: 1, label: "1. Radar Map Probe", desc: "Select niche & scan maps" },
              { step: 2, label: "2. Real-Time Audit", desc: "Toggle diagnostic fixes" },
              { step: 3, label: "3. Automated Outreach", desc: "Preview custom proposal" },
            ].map((s) => (                <button
                key={s.step}
                type="button"
                onClick={() => setSimStep(s.step as any)}
                className={`flex-1 text-left p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                  simStep === s.step
                    ? 'bg-zinc-900 border-blue-500 shadow-lg shadow-blue-500/5'
                    : 'bg-zinc-900/40 border-zinc-900 hover:border-zinc-800 text-zinc-400'
                }`}
              >
                {simStep === s.step && (
                  <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-blue-500" />
                )}
                <p className={`text-[9px] sm:text-xs font-bold tracking-wide uppercase ${simStep === s.step ? 'text-blue-400' : 'text-zinc-500'}`}>
                  {s.label}
                </p>
                <p className="text-[9px] sm:text-[11px] mt-0.5 font-light hidden sm:block">{s.desc}</p>
              </button>
            ))}
          </div>

          {/* Sandbox Workspace Stage Grid */}
          <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-4 sm:p-8 lg:p-10 shadow-2xl relative">
            <div className="absolute top-4 left-4 flex gap-1.5 select-none">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
            </div>
            <div className="absolute top-3 right-4 sm:top-4 sm:right-6 font-mono text-[8px] sm:text-[10px] text-zinc-500 uppercase font-bold tracking-wider truncate max-w-[50%]">
              CLIENT_HUNTER_SIMULATOR_V2 // LIVE_PROT
            </div>

            <div className="mt-6 md:mt-4">
              
              {/* STEP 1: SCAN GENERATOR */}
              {simStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center animate-fade-in">
                  <div className="md:col-span-12 lg:col-span-5 space-y-6">
                    <div className="space-y-1 text-left">
                      <h3 className="text-lg font-bold font-display text-white">1. Probe Local Map coordinates</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed font-light">
                        Deploy Client Hunter's map crawler. Provide the specific local service niche and city. Our pipeline instantly scrapes, matches, and logs deficient listings.
                      </p>
                    </div>

                    <div className="space-y-4 pt-2 text-left">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 font-mono">
                          Local Service Sector
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {['Roofer', 'Dentist', 'Chiropractor', 'Hair Salon', 'Bakery', 'Plumber'].map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setSimNiche(n)}
                              className={`text-[10px] py-2 px-1 rounded-xl border text-center transition-all cursor-pointer truncate font-mono ${
                                simNiche === n 
                                  ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-bold' 
                                  : 'bg-zinc-850/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 tracking-wider uppercase mb-1.5 font-mono">
                          Local Municipality
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-zinc-500" />
                          <input 
                            type="text" 
                            value={simCity}
                            onChange={(e) => setSimCity(e.target.value)}
                            className="bg-zinc-850 border border-zinc-800 rounded-xl w-full pl-10 pr-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleSimRadarScan}
                        disabled={isSimScan}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl py-3 px-4 text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/10"
                      >
                        {isSimScan ? (
                          <div className="flex items-center gap-2">
                            <RefreshCw className="h-3.5 w-3.5 animate-spin text-white" />
                            <span>Pinging Map Coordinates ({simProgress}%)...</span>
                          </div>
                        ) : (
                          <>
                            <Search className="h-3.5 w-3.5" />
                            <span>Deploy Simulated Probe →</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-12 lg:col-span-7 bg-[#0b0c0e] border border-zinc-800 rounded-2xl p-4 sm:p-5 font-mono text-[10px] sm:text-[11px] text-zinc-400 min-h-[250px] sm:min-h-[290px] flex flex-col justify-between relative overflow-hidden">
                    {isSimScan ? (
                      <div className="space-y-3.5 my-auto text-center py-6 animate-pulse">
                        <Activity className="h-10 w-10 text-blue-500 mx-auto animate-bounce" />
                        <div className="space-y-1">
                          <p className="text-zinc-200 font-bold uppercase tracking-wider">DEPLOYING VIRTUAL GEO-RADAR MAPS SCRAPER</p>
                          <p className="text-[10px] text-blue-400">Pinging latitudes near {simCity} for {simNiche} listings...</p>
                        </div>
                        <div className="w-full max-w-xs bg-zinc-850 h-1.5 rounded-full mx-auto overflow-hidden">
                          <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${simProgress}%` }} />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2.5">
                          <div className="flex justify-between text-[10px] text-zinc-500 pb-2 border-b border-zinc-850">
                            <span>GEO_PING // OK</span>
                            <span>RADAR_PRESET_CONNECTED</span>
                          </div>
                          <p className="text-[10px] text-zinc-500 text-left">// Simulated search results for {simNiche} in {simCity}:</p>
                          {simLeads.map((s, i) => (
                            <div key={i} className="bg-zinc-900 border border-zinc-850 p-3 rounded-xl flex justify-between items-center hover:border-zinc-700 transition-all text-left">
                              <div className="space-y-1.5 truncate pr-2">
                                <div className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                  <span className="font-bold text-zinc-100 truncate">{s.name}</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-[9px] text-zinc-450">
                                  <span>Rating: <strong className="text-zinc-300">{s.rating} ★</strong></span>
                                  <span>•</span>
                                  <span>Audit: <strong className="text-rose-500">{s.issue}</strong></span>
                                </div>
                              </div>
                              <span className="text-[9px] px-2 py-0.5 rounded-md bg-zinc-850 text-zinc-450 border border-zinc-800 select-none uppercase tracking-wide">
                                {s.speed}
                              </span>
                            </div>
                          ))}
                        </div>
                        <p className="text-[9.5px] text-zinc-500 mt-4 leading-relaxed font-sans text-left">// Click 'Deploy Simulated Probe' at left to customize geographic queries inputs or proceed to step 2 above!</p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: LIVE AUDIT & SCORE OPTIMIZER */}
              {simStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch animate-fade-in">
                  
                  {/* Left subcolumn: Mock lead choosing */}
                  <div className="md:col-span-12 lg:col-span-5 space-y-5">
                    <div className="space-y-1 text-left">
                      <h3 className="text-lg font-bold font-display text-white">2. Run Dynamic Performance Audit</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed font-light">
                        Configure layout changes to solve core faults. Click these toggle switches on the bottom cards, and see the Digital Presence Score and mobile response speeds scale instantly!
                      </p>
                    </div>

                    {/* Mock listing list */}
                    <div className="space-y-2.5 pt-1 text-left">
                      <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold">SELECT BUSINESS TO AUDIT:</p>
                      {simLeads.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedSimLead(s);
                            // reset triggers
                            setFixImages(false);
                            setFixMobile(false);
                            setFixMapPin(false);
                            setFixSEO(false);
                          }}
                          className={`w-full text-left p-3.5 rounded-2xl border transition-all flex justify-between items-center cursor-pointer ${
                            selectedSimLead?.name === s.name
                              ? 'bg-zinc-850 border-blue-500 shadow-md'
                              : 'bg-zinc-900/60 border-zinc-850 hover:border-zinc-800'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <p className="text-xs font-bold text-white truncate">{s.name}</p>
                            <p className="text-[10px] mt-0.5 font-mono uppercase font-bold text-rose-500">{s.issue}</p>
                          </div>
                          <span className="text-[10px] font-mono shrink-0 font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md">
                            {s.rating} ★
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right subcolumn: Custom Speed dials and checkboxes */}                    <div className="md:col-span-12 lg:col-span-7 bg-[#0b0c0e] border border-zinc-800 rounded-2xl p-4 sm:p-8 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3.5 border-b border-zinc-850 mb-6">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-emerald-500" />
                          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">Simulated Audit Workbench</span>
                        </div>
                        <span className="text-[9px] px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full font-mono border border-emerald-500/20 uppercase font-bold">
                          ACTIVE_PROFILE: {selectedSimLead?.category || 'Standard'}
                        </span>
                      </div>

                      {/* Score Dial Simulator */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 mt-1 bg-zinc-900/40 p-3 sm:p-4 border border-zinc-850 rounded-2xl">
                        
                        <div className="text-center space-y-1">
                          <p className="text-[10px] font-mono text-zinc-400 uppercase font-bold tracking-widest">Presence Score</p>
                          <div className="relative inline-flex items-center justify-center mt-2">
                            {/* Simple dynamic SVG visual circular indicator */}
                            <svg className="w-16 h-16 sm:w-20 sm:h-20 transform -rotate-90">
                              <circle cx="40" cy="40" r="32" className="text-zinc-850" strokeWidth="6" stroke="currentColor" fill="transparent" />
                              <circle cx="40" cy="40" r="32" 
                                className={`transition-all duration-500 ${
                                  getSimulatedScore() >= 80 ? 'text-emerald-500' : 'text-amber-500'
                                }`} 
                                strokeWidth="6" 
                                strokeDasharray={2 * Math.PI * 32}
                                strokeDashoffset={2 * Math.PI * 32 * (1 - getSimulatedScore() / 100)}
                                strokeLinecap="round"
                                stroke="currentColor" 
                                fill="transparent" 
                              />
                            </svg>
                            <span className="absolute text-sm sm:text-base font-extrabold font-mono text-white mt-0.5">
                              {getSimulatedScore()}%
                            </span>
                          </div>
                          <p className="text-[11px] font-sans font-light mt-1.5 text-zinc-400">
                            {getSimulatedScore() >= 90 ? '⭐⭐⭐⭐⭐ Highly Optimized' : '⚠ Action required'}
                          </p>
                        </div>

                        <div className="flex flex-col justify-center space-y-2 text-left">
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase">Target Listing</span>
                            <p className="text-xs font-bold text-zinc-200 truncate">{selectedSimLead?.name}</p>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase">Current Response Speed</span>
                            <p className="text-xs font-bold text-red-400">
                              {fixImages && fixMobile ? '1.2s (Lightning)' : fixImages ? '4.8s (Average)' : selectedSimLead?.speed || 'Not Found'}
                            </p>
                          </div>
                        </div>

                      </div>

                      {/* Interactive Diagnostic Checklist Switches */}                        <div className="space-y-2.5">
                        <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-extrabold mb-1 text-left">DRAFT PERFORMANCE FIXES & CODE TOGGLES:</p>
                        
                        <label className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-zinc-850 hover:bg-zinc-850/40 transition-colors cursor-pointer select-none">
                          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                            <input 
                              type="checkbox" 
                              checked={fixImages}
                              onChange={(e) => setFixImages(e.target.checked)}
                              className="h-4 w-4 sm:h-4.5 sm:w-4.5 rounded-lg border-zinc-800 text-blue-600 bg-zinc-900 focus:ring-1 focus:ring-blue-500 cursor-pointer shrink-0"
                            />
                            <div className="text-left min-w-0">
                              <span className="text-[10px] sm:text-xs font-bold text-zinc-200 block truncate">Compress Modern WebP Images</span>
                              <p className="text-[9px] sm:text-[10px] text-zinc-400 hidden sm:block">Halves page asset footprint over initial JPEG frames (+20% Score)</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-emerald-400 shrink-0">+20%</span>
                        </label>

                        <label className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-zinc-850 hover:bg-zinc-850/40 transition-colors cursor-pointer select-none">
                          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                            <input 
                              type="checkbox" 
                              checked={fixMobile}
                              onChange={(e) => setFixMobile(e.target.checked)}
                              className="h-4 w-4 sm:h-4.5 sm:w-4.5 rounded-lg border-zinc-800 text-blue-600 bg-zinc-900 focus:ring-1 focus:ring-blue-500 cursor-pointer shrink-0"
                            />
                            <div className="text-left min-w-0">
                              <span className="text-[10px] sm:text-xs font-bold text-zinc-200 block truncate">Inject Mobile Viewport & CSS</span>
                              <p className="text-[9px] sm:text-[10px] text-zinc-400 hidden sm:block">Aligns page grid elements neatly to small screen displays (+25% Score)</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-emerald-400 shrink-0">+25%</span>
                        </label>

                        <label className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-zinc-850 hover:bg-zinc-850/40 transition-colors cursor-pointer select-none">
                          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                            <input 
                              type="checkbox" 
                              checked={fixMapPin}
                              onChange={(e) => setFixMapPin(e.target.checked)}
                              className="h-4 w-4 sm:h-4.5 sm:w-4.5 rounded-lg border-zinc-800 text-blue-600 bg-zinc-900 focus:ring-1 focus:ring-blue-500 cursor-pointer shrink-0"
                            />
                            <div className="text-left min-w-0">
                              <span className="text-[10px] sm:text-xs font-bold text-zinc-200 block truncate">Google Map Coordinates & Pins</span>
                              <p className="text-[9px] sm:text-[10px] text-zinc-400 hidden sm:block">Aligns spatial indicators on regional storefront results (+20% Score)</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-emerald-400 shrink-0">+20%</span>
                        </label>
                      </div>

                    </div>

                    <div className="mt-8 pt-4 border-t border-zinc-850 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                      <p className="text-[10.5px] text-zinc-400 font-sans font-light leading-tight">
                        Perfect! When score exceeds 60%, click Next Step directly to compile their custom redesign pitch templates.
                      </p>
                      <button
                        type="button"
                        onClick={() => setSimStep(3)}
                        className={`text-xs font-bold tracking-wider px-5 py-2.5 rounded-xl uppercase transition-all shrink-0 cursor-pointer shadow-md ${
                          getSimulatedScore() >= 60 
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/10' 
                            : 'bg-zinc-800 text-zinc-500 border border-zinc-800'
                        }`}
                      >
                        Compile Custom Pitch →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: AUTOMATED OUTREACH TEMPLATE GENERATOR */}
              {simStep === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch animate-fade-in">
                  
                  {/* Left Column: Explainer and interactive wireframe */}
                  <div className="md:col-span-12 lg:col-span-5 space-y-6">
                    <div className="space-y-1 text-left">
                      <h3 className="text-lg font-bold font-display text-white">3. Generate Custom Redesign Pitch</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed font-light">
                        Never send spam. Send customized design ideas, showing modern high-conversion UI layouts with dynamic viewport widgets tailored to their local niche.
                      </p>
                    </div>

                    {/* Cute Wireframe Preview Mock */}
                    <div className="bg-zinc-850 border border-zinc-800 rounded-2xl p-4 space-y-3 text-left">
                      <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest font-bold">PREVIEW DRAFT DESIGN SCHEME:</p>
                      
                      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-2.5">
                        {/* Header bar */}
                        <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
                          <span className="font-extrabold text-[10px] text-blue-400 uppercase tracking-tight font-display truncate max-w-[70%]">{selectedSimLead?.name || 'Local Business'}</span>
                          <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 rounded uppercase font-mono">1.2s Load Speed</span>
                        </div>

                        {/* Banner */}
                        <div className="bg-blue-600/10 border border-dashed border-blue-500/20 rounded-lg p-3 text-center space-y-1">
                          <p className="text-[11px] font-bold text-white">Transformative {simNiche} Layout</p>
                          <p className="text-[9px] text-zinc-400">Tap-to-Book Reservation triggers & local SEO attributes optimized</p>
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-2 gap-2 text-[8px] font-mono">
                          <div className="bg-zinc-850 p-1.5 rounded border border-zinc-800 text-zinc-300 flex items-center gap-1">
                            <span className="text-emerald-400">✔</span> Responsive Viewport
                          </div>
                          <div className="bg-zinc-850 p-1.5 rounded border border-zinc-800 text-zinc-300 flex items-center gap-1">
                            <span className="text-emerald-400">✔</span> WebP Asset Pipeline
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-[10px] text-zinc-500 leading-relaxed">
                        By presenting this wireframe visual proposal first, response rates typically scale up beyond 30%.
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={onStartApp}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl py-3.5 px-4 text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/25 animate-pulse"
                      >
                        <Sparkles className="h-4 w-4" />
                        <span>Launch Applet Dashboard Now</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Text block with copy-clipboard trigger */}
                  <div className="md:col-span-12 lg:col-span-7 bg-[#0b0c0e] border border-zinc-800 rounded-2xl p-4 sm:p-8 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3.5 border-b border-zinc-850">
                        <div className="flex items-center gap-2 min-w-0">
                          <Send className="h-4 w-4 text-blue-500 shrink-0" />
                          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono truncate">Outreach Email Draft</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyPitch}
                          className="text-[10px] border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white px-3 py-1.5 rounded-xl cursor-pointer transition-colors active:scale-98 font-bold flex items-center gap-1.5"
                        >
                          <span>{copiedPitch ? 'Copied Pitch!' : 'Copy to Clipboard'}</span>
                        </button>
                      </div>

                      <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-4 font-mono text-zinc-300 text-xs overflow-x-auto whitespace-pre-wrap max-h-[290px] leading-relaxed text-left">
                        {getPitchEmailText()}
                      </div>
                    </div>

                    <div className="pt-5 border-t border-zinc-850 flex justify-between items-center text-[10px] font-mono text-zinc-500">
                      <span>EMAIL_STATUS // PERFECTLY_REFINED</span>
                      <button 
                        onClick={() => setSimStep(1)} 
                        className="text-blue-400 hover:underline cursor-pointer uppercase font-bold text-right"
                      >
                        ← Restart Simulation
                      </button>
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>

        </div>
      </section>

      {/* ⚙️ AI Agent Mesh Section — Live visualization of the multi-provider routing pipeline */}
      <section className="py-20 bg-zinc-950 text-white border-y border-zinc-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 px-3 py-1 text-xs font-semibold text-blue-400">
              <Zap className="h-3.5 w-3.5" />
              Multi-Provider AI Mesh
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-white">
              Agent mesh routing in real-time
            </h2>
            <p className="text-sm text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed">
              Every search, analysis, proposal, and chat is routed through our intelligent LLM Router — 
              distributing workloads across Groq, OpenRouter, and Google Gemini based on model 
              capability and availability. Watch the data flow live.
            </p>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-4 sm:p-8 shadow-2xl">
            <AIPipelineDashboard />
          </div>

          {/* Provider credits */}
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            {[
              { name: 'Groq Cloud', desc: 'LLaMA 3.1/3.3 · Mixtral', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
              { name: 'OpenRouter', desc: 'Qwen 2.5 · DeepSeek Coder', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
              { name: 'Google Gemini', desc: 'Gemini 3.5 Flash · Search Grounding', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
            ].map(p => (
              <div key={p.name} className={`text-[9px] font-mono px-3 py-1.5 rounded-full border ${p.color}`}>
                <span className="font-bold">{p.name}</span>
                <span className="opacity-70"> — {p.desc}</span>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ⚡ The "Problem vs Fix" Interactive Feature comparison tool */}
      <section className="py-20 bg-zinc-50 border-b border-zinc-200">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] font-bold tracking-widest uppercase text-indigo-600 font-mono">Visual Proof</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-zinc-900 mt-2">
              Transform local businesses in 3 clicks
            </h2>
            <p className="text-sm text-zinc-500 mt-2">
              Don't sell service packages—sell instant, beautiful solutions. Compare what local clients have, versus what you can construct for them instantly.
            </p>
          </div>

          {/* Toggle Controller Tabs */}
          <div className="flex justify-center mb-6 sm:mb-8 overflow-x-auto px-2">
            <div className="inline-flex bg-zinc-200/80 p-1 border border-zinc-300/40 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setActiveCompareTab('website')}
                className={`text-[10px] sm:text-xs font-bold py-1.5 sm:py-2 px-2.5 sm:px-4 rounded-lg cursor-pointer transition-all whitespace-nowrap ${
                  activeCompareTab === 'website' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500'
                }`}
              >
                Website Redesign
              </button>
              <button
                type="button"
                onClick={() => setActiveCompareTab('rating')}
                className={`text-[10px] sm:text-xs font-bold py-1.5 sm:py-2 px-2.5 sm:px-4 rounded-lg cursor-pointer transition-all whitespace-nowrap ${
                  activeCompareTab === 'rating' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500'
                }`}
              >
                SEO & Maps
              </button>
              <button
                type="button"
                onClick={() => setActiveCompareTab('outreach')}
                className={`text-[10px] sm:text-xs font-bold py-1.5 sm:py-2 px-2.5 sm:px-4 rounded-lg cursor-pointer transition-all whitespace-nowrap ${
                  activeCompareTab === 'outreach' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500'
                }`}
              >
                Outreach
              </button>
            </div>
          </div>

          {/* Compare Content Visual Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            
            {/* The Before / Current State card */}
            <div className="bg-white border border-zinc-200 rounded-2xl sm:rounded-3xl p-4 sm:p-8 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold font-mono uppercase bg-red-50 border border-red-200 text-red-700 px-2 py-0.5 rounded-full">
                  Before / The Friction
                </span>

                {activeCompareTab === 'website' && (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-bold font-display text-zinc-900">Ugly, Broken Templates</h3>
                    <p className="text-xs leading-relaxed text-zinc-500">
                      Most storefront sites look built in 2011. Mobile pages load slowly, navigation layouts overflow, and online orders fail due to outdated scripting.
                    </p>
                    <ul className="text-xs text-zinc-600 space-y-2 pt-2">
                      <li className="flex items-center gap-2">• Slow mobile load speeds (8.5 seconds)</li>
                      <li className="flex items-center gap-2">• Booking or catalog triggers are broken</li>
                      <li className="flex items-center gap-2">• Zero layout responsiveness on smaller screens</li>
                    </ul>
                  </div>
                )}

                {activeCompareTab === 'rating' && (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-bold font-display text-zinc-900">Forgotten Maps Status</h3>
                    <p className="text-xs leading-relaxed text-zinc-500">
                      A high-intent client searches "Emergency dentist Austin", but the best dentists appear deep on Page 3 because coordinates and Google attributes are misaligned.
                    </p>
                    <ul className="text-xs text-zinc-600 space-y-2 pt-2">
                      <li className="flex items-center gap-2">• Missing crucial metadata tags and schedules</li>
                      <li className="flex items-center gap-2">• Bad rating loops (unanswered negative feedback)</li>
                      <li className="flex items-center gap-2">• Zero external SEO linkages or structured site maps</li>
                    </ul>
                  </div>
                )}

                {activeCompareTab === 'outreach' && (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-bold font-display text-zinc-900">Cold Spammed Emails</h3>
                    <p className="text-xs leading-relaxed text-zinc-500">
                      Agencies blast "Please buy our digital packages" to 5,000 businesses simultaneously. It looks spammy, has a 0.5% open rate, and damages your professional reputation.
                    </p>
                    <ul className="text-xs text-zinc-600 space-y-2 pt-2">
                      <li className="flex items-center gap-2">• Repetitive generic greeting pitches</li>
                      <li className="flex items-center gap-2">• Zero custom audits or proof-of-work provided</li>
                      <li className="flex items-center gap-2">• Leads flag the emails instantly as spam</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-6 border-t border-zinc-100 pt-5">
                <span className="text-[10px] text-zinc-400 font-mono uppercase font-bold tracking-wider">Estimated Client Cost</span>
                <p className="text-sm font-bold text-red-700">Hundreds of lost potential reservation calls yearly.</p>
              </div>
            </div>

            {/* The After / Client Hunter Fix card */}
            <div className="bg-zinc-950 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 flex flex-col justify-between border border-zinc-800 shadow-xl">
              <div>
                <span className="text-[10px] font-bold font-mono uppercase bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded-full">
                  After / The Client Hunter Fix
                </span>

                {activeCompareTab === 'website' && (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-bold font-display text-white">Bespoke Premium Redesigns</h3>
                    <p className="text-xs leading-relaxed text-zinc-400">
                      Launch beautiful, modern layouts using high-performance components. Show the prospect their gorgeous, secure web interface draft under our layout proposal generator.
                    </p>
                    <ul className="text-xs text-zinc-300 space-y-2 pt-2">
                      <li className="flex items-center gap-2">✔ Fast loading speeds (under 1.2 seconds)</li>
                      <li className="flex items-center gap-2">✔ High-converting mobile landing layout</li>
                      <li className="flex items-center gap-2">✔ One-click customer contact dials pre-built</li>
                    </ul>
                  </div>
                )}

                {activeCompareTab === 'rating' && (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-bold font-display text-white">Smart Metadata Audit</h3>
                    <p className="text-xs leading-relaxed text-zinc-400">
                      Our interactive checklist flags missing keywords, lists competitors' review weights, and drafts an immediate content update plan to push them back to page one.
                    </p>
                    <ul className="text-xs text-zinc-300 space-y-2 pt-2">
                      <li className="flex items-center gap-2">✔ Direct keyword density diagnosis</li>
                      <li className="flex items-center gap-2">✔ Immediate map pins alignment check</li>
                      <li className="flex items-center gap-2">✔ Competitive digital presence benchmark score</li>
                    </ul>
                  </div>
                )}

                {activeCompareTab === 'outreach' && (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-bold font-display text-white">Value-First Custom Pitches</h3>
                    <p className="text-xs leading-relaxed text-zinc-400">
                      Generate a personalized pitch detailing their exact website flaws alongside the custom layout wireframe proposal. This shows them you have already done high-quality work.
                    </p>
                    <ul className="text-xs text-zinc-300 space-y-2 pt-2">
                      <li className="flex items-center gap-2">✔ Bespoke design proposal wireframes</li>
                      <li className="flex items-center gap-2">✔ Highly personalized audit emails ready to send</li>
                      <li className="flex items-center gap-2">✔ Over 30% response rates from targeted prospects</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-6 border-t border-zinc-800 pt-5">
                <span className="text-[10px] text-zinc-500 font-mono uppercase font-bold tracking-wider">Opportunity</span>
                <p className="text-sm font-bold text-emerald-400">Sell custom website contracts starting at $1,500.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 🚀 Sleek Monetization Checklist Layout (Minimalist Card Tiers) */}
      <section className="py-24 bg-white border-b border-zinc-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 font-mono">Value Tiering</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-zinc-900 mt-2">
              Start finding local leads free
            </h2>
            <p className="text-sm text-zinc-500 mt-2">
              Begin searching local Google Map listings and check their ratings instantly. Upgrade to Pro when you need live Firebase backup, unlimited smart audits, and layout suggestions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
            
            {/* Tier 1: Free */}
            <div className="bg-[#FAFAFB] border border-zinc-200 rounded-2xl sm:rounded-3xl p-5 sm:p-8 flex flex-col justify-between hover:border-zinc-300 transition-all">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 font-mono bg-zinc-200 px-2 py-0.5 rounded-md">
                  Basic
                </span>
                <h3 className="text-base sm:text-xl font-bold font-display text-zinc-950 mt-4">Free Starter</h3>
                <p className="text-zinc-500 text-xs mt-1.5 leading-relaxed">Perfect for freelance web designers starting out locally.</p>
                
                <div className="mt-6 flex items-baseline">
                  <span className="text-2xl sm:text-3xl font-extrabold font-display text-zinc-950">$0</span>
                  <span className="text-zinc-400 text-xs ml-1">/ forever</span>
                </div>

                <div className="border-t border-zinc-200/60 my-6" />

                <ul className="space-y-3.5 text-xs text-zinc-600">
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Scan Unlimited Google Map Listings</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Check digital status of local leads</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Keep track of leads in a simple list</span>
                  </li>
                  <li className="flex items-start gap-2.5 line-through text-zinc-400">
                    <span>Smart AI website audit</span>
                  </li>
                  <li className="flex items-start gap-2.5 line-through text-zinc-400">
                    <span>Cloud backups & database sync</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={onStartApp}
                className="w-full rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold py-3 transition-all cursor-pointer text-center mt-8 active:scale-98"
              >
                Start Scanning Free
              </button>
            </div>

            {/* Tier 2: Pro */}
            <div className="bg-white border-2 border-blue-600 rounded-2xl sm:rounded-3xl p-5 sm:p-8 flex flex-col justify-between relative shadow-xl shadow-blue-600/5 transition-transform hover:scale-[1.01]">
              <div className="absolute top-4 right-4 bg-blue-600 text-white text-[9px] uppercase font-bold tracking-widest font-mono rounded-full px-2.5 py-1">
                Best Choice
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-blue-600 font-mono bg-blue-50 px-2.5 py-1 rounded-md">
                  Professional
                </span>
                <h3 className="text-base sm:text-xl font-bold font-display text-zinc-950 mt-4">Pro Hunter</h3>
                <p className="text-zinc-500 text-xs mt-1.5 leading-relaxed">Advanced tools for busy designers and agency builders.</p>
                
                <div className="mt-6 flex items-baseline">
                  <span className="text-2xl sm:text-3xl font-extrabold font-display text-zinc-950">$29</span>
                  <span className="text-zinc-400 text-xs ml-1 font-sans">/ month</span>
                </div>

                <div className="border-t border-zinc-200/60 my-6" />

                <ul className="space-y-3.5 text-xs text-zinc-600 font-medium">
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-zinc-950"><strong>Everything in Free</strong></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-zinc-950"><strong>Unlimited smart audits</strong> (find website flaws and checklist improvements)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-zinc-950"><strong>Live Cloud Database integration</strong> (save data securely to backup)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Real-time cross-device list sync</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Generate custom website ideas & outreach emails</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={onStartApp}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-3 transition-all cursor-pointer text-center mt-8 active:scale-98 shadow-md shadow-blue-600/10"
              >
                Get Professional License
              </button>
            </div>

            {/* Tier 3: Agency */}
            <div className="bg-[#FAFAFB] border border-zinc-200 rounded-2xl sm:rounded-3xl p-5 sm:p-8 flex flex-col justify-between hover:border-zinc-300 transition-all">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 font-mono bg-zinc-200 px-2 py-0.5 rounded-md">
                  Scale
                </span>
                <h3 className="text-base sm:text-xl font-bold font-display text-zinc-950 mt-4">Agency Plan</h3>
                <p className="text-zinc-500 text-xs mt-1.5 leading-relaxed">Built for teams and busy agencies scaling client acquisition.</p>
                
                <div className="mt-6 flex items-baseline">
                  <span className="text-2xl sm:text-3xl font-extrabold font-display text-zinc-950">$89</span>
                  <span className="text-zinc-400 text-xs ml-1">/ month</span>
                </div>

                <div className="border-t border-zinc-200/60 my-6" />

                <ul className="space-y-3.5 text-xs text-zinc-600">
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Everything in Pro</strong></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Up to 10 team seats with custom scopes</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Export leads to Zapier or other CRMs</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Share proposals under your own name</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={onStartApp}
                className="w-full rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold py-3 transition-all cursor-pointer text-center mt-8 active:scale-98"
              >
                Contact Agency Sales
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* 💌 Bottom Footer */}
      <footer className="py-16 border-t border-zinc-200 bg-zinc-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex flex-col items-center justify-center gap-6">
            
            {/* Attribution */}
            <div className="space-y-1">
              <p className="text-zinc-800 text-[11px] font-bold tracking-widest uppercase font-sans">
                Built with ❤️ by <span className="text-blue-600 hover:underline">Bamidele Tewogbade</span>
              </p>
              <p className="text-[10px] text-zinc-400 font-light max-w-md mx-auto">
                Helping modern agencies target, discover, analyze, and automate local client contracts seamlessly.
              </p>
            </div>

            {/* Social Handles */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <a 
                href="mailto:bishoptewogbade@gmail.com" 
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-blue-600 transition-colors font-medium border border-zinc-200 px-3 py-1.5 bg-white rounded-full shadow-xs"
                title="Send official email"
              >
                <Mail className="h-3.5 w-3.5 text-blue-500" />
                <span>bishoptewogbade@gmail.com</span>
              </a>

              <div className="flex items-center gap-3">
                <a 
                  href="https://twitter.com/btewogbade" 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-2 text-zinc-500 hover:text-sky-500 hover:border-sky-200 transition-all border border-zinc-200 bg-white rounded-full shadow-xs flex items-center justify-center"
                  title="Follow Bamidele on Twitter"
                >
                  <Twitter className="h-4 w-4" />
                </a>

                <a 
                  href="https://linkedin.com/in/btewogbade" 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-2 text-zinc-500 hover:text-blue-700 hover:border-blue-200 transition-all border border-zinc-200 bg-white rounded-full shadow-xs flex items-center justify-center"
                  title="Connect on LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Platform Brand */}
            <div className="pt-4 border-t border-zinc-200/80 w-full max-w-sm">
              <p className="text-[10px] font-extrabold tracking-wider text-zinc-450 font-mono uppercase">
                CLIENT HUNTER • SAAS ENGINE © {new Date().getFullYear()}
              </p>
            </div>

          </div>
        </div>
      </footer>

    </div>
  );
}
