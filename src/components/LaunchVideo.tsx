import React, { useRef, useState, useEffect } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { useCurrentFrame, useVideoConfig, spring, interpolate, AbsoluteFill } from 'remotion';
import { 
  Sparkles, CalendarRange, Search, Download, Play, Pause, RotateCcw, 
  Settings, Check, Compass, ArrowRight, ArrowLeft, Filter, RefreshCw
} from 'lucide-react';

// ==========================================================
// REMOTION SUB-COMPONENTS & SCENES FOR THE LAUNCH VIDEO
// ==========================================================

// 1. Beautiful drawn pointer arrow with a pulsing hotspot bubble
function FeaturePointerArrow({ 
  startFrame, 
  arrowPath = "M 10,105 C 50,45 130,15 220,50", 
  label = "New Feature Highlighted!", 
  badgeColor = "text-yellow-450 border-yellow-500/30 bg-yellow-950/20"
}: { 
  startFrame: number; 
  arrowPath?: string; 
  label: string; 
  badgeColor?: string;
}) {
  const frame = useCurrentFrame();
  const config = useVideoConfig();

  const progress = spring({
    frame: frame - startFrame,
    fps: config.fps,
    config: { damping: 14 }
  });

  const arrowOpacity = interpolate(frame - startFrame, [0, 8, 40, 50], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  if (frame < startFrame || frame > startFrame + 50) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30" style={{ opacity: arrowOpacity }}>
      {/* Curved pointing SVG line */}
      <svg className="absolute w-full h-full inset-0 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">
        <path
          d={arrowPath}
          fill="none"
          stroke="#eab308"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="250"
          strokeDashoffset={250 * (1 - progress)}
        />
        {/* Draw arrowhead */}
        {progress > 0.85 && (
          <path
            d="M 220,50 L 205,42 M 220,50 L 210,65"
            fill="none"
            stroke="#eab308"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}
      </svg>

      {/* Pulsing Highlight Circle at arrowhead destination */}
      {progress > 0.7 && (
        <div 
          className="absolute h-8 w-8 rounded-full border border-yellow-400 bg-yellow-500/20 animate-ping"
          style={{
            left: '215px',
            top: '40px',
            transform: 'translate(-50%, -50%)'
          }}
        />
      )}

      {/* Floating Info Badge pointing here */}
      <div 
        className={`absolute rounded-xl border px-3 py-2 text-[10px] font-mono leading-relaxed font-bold shadow-2xl flex items-center gap-2 ${badgeColor}`}
        style={{
          left: '12px',
          top: '120px',
          transform: `scale(${progress})`
        }}
      >
        <Sparkles className="h-3.5 w-3.5 text-yellow-400 animate-pulse shrink-0" />
        <span>{label}</span>
      </div>
    </div>
  );
}

// 2. Scene: Title and Introduction Card
function SceneTitle() {
  const frame = useCurrentFrame();
  const config = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps: config.fps,
    config: { damping: 12, stiffness: 100 }
  });

  const subTitleSpring = spring({
    frame: frame - 15,
    fps: config.fps,
    config: { damping: 14 }
  });

  const neonRingScale = interpolate(frame, [0, 120], [0.8, 1.25], {
    extrapolateRight: 'clamp'
  });

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#09090B] relative overflow-hidden font-sans">
      {/* Background Animated Atmosphere */}
      <div 
        className="absolute w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[130px]"
        style={{ transform: `scale(${neonRingScale})` }}
      />
      
      {/* Floating Ring Decors */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <div className="border border-zinc-800 rounded-full w-[450px] h-[450px] animate-spin" style={{ animationDuration: '30s' }} />
        <div className="border border-dashed border-zinc-700 rounded-full w-[650px] h-[650px] absolute animate-spin" style={{ animationDuration: '60s', animationDirection: 'reverse' }} />
      </div>

      {/* Master Title */}
      <div className="text-center space-y-4 z-10 px-6">
        <div 
          className="h-12 w-12 rounded-xl bg-blue-600 shadow-xl shadow-blue-600/20 flex items-center justify-center mx-auto mb-5 border border-blue-400/30"
          style={{ transform: `scale(${titleSpring}) rotate(${interpolate(frame, [0, 60], [-10, 0])}deg)` }}
        >
          <Compass className="h-6 w-6 text-white" />
        </div>

        <h1 
          className="text-4xl font-black text-white tracking-widest font-sans uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400 select-none"
          style={{ transform: `scale(${titleSpring})` }}
        >
          CLIENT HUNTER
        </h1>

        <p 
          className="text-sm text-zinc-400 font-mono tracking-wider max-w-md mx-auto uppercase font-bold"
          style={{ opacity: subTitleSpring, transform: `translateY(${interpolate(frame - 15, [0, 30], [20, 0], { extrapolateLeft: 'clamp' })}px)` }}
        >
          Automated Prospecting & CRM Intelligence Pipeline
        </p>

        <div className="pt-8 flex justify-center gap-3">
          <span className="text-[9px] font-mono rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 font-bold uppercase tracking-widest">
            🤖 AI Sales agent
          </span>
          <span className="text-[9px] font-mono rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 px-3 py-1 font-bold uppercase tracking-widest">
            ⚡ Vite + Remotion
          </span>
        </div>
      </div>
    </div>
  );
}

// 3. Scene: Feature 1 - Prospect Discovery
function SceneDiscovery() {
  const frame = useCurrentFrame();
  const config = useVideoConfig();

  const mapScale = spring({
    frame,
    fps: config.fps,
    config: { damping: 15 }
  });

  const cardsY = interpolate(frame, [15, 60], [100, 0], { extrapolateLeft: 'clamp' });

  return (
    <div className="w-full h-full flex flex-col justify-between bg-[#09090B] p-6 relative font-sans overflow-hidden">
      {"/* Scenario Info Header */"}
      <div className="flex items-center justify-between border-b border-zinc-850 pb-3 z-10">
        <div>
          <span className="text-[8.5px] font-mono text-blue-400 uppercase tracking-widest font-bold">CHAPTER 01</span>
          <h2 className="text-sm font-black uppercase text-white tracking-wider">Dynamic Lead Generation</h2>
        </div>
        <div className="flex items-center gap-2 bg-[#0C0C0E] px-2.5 py-1 rounded border border-zinc-800">
          <Search className="h-3 w-3 text-blue-400 animate-pulse" />
          <span className="text-[9px] font-mono text-zinc-400 uppercase font-black">Scanning Location...</span>
        </div>
      </div>

      {/* Inner Screen Mockup */}
      <div className="grid grid-cols-5 gap-4 flex-1 mt-4 items-stretch relative">
        {/* Left Simulated Maps viewport */}
        <div 
          className="col-span-2 rounded-xl border border-zinc-850 bg-zinc-900/30 overflow-hidden relative flex items-center justify-center p-2"
          style={{ transform: `scale(${mapScale})` }}
        >
          {/* Mock Map grid graphic */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="h-28 w-28 rounded-full bg-blue-500/5 absolute border border-blue-500/20 animate-pulse" />
          <div className="h-16 w-16 rounded-full bg-blue-500/10 absolute border border-blue-500/10" />
          
          <div className="h-3 w-3 rounded-full bg-blue-400 absolute border-2 border-white shadow-lg animate-bounce" style={{ top: '40%', left: '50%' }} />
          <div className="h-3 w-3 rounded-full bg-emerald-400 absolute border-2 border-white shadow-lg animate-ping" style={{ top: '65%', left: '30%' }} />
          <div className="h-3 w-3 rounded-full bg-rose-500 absolute border-2 border-white shadow-lg" style={{ top: '25%', left: '70%' }} />

          <div className="absolute bottom-2 left-2 bg-[#0C0C0E] border border-zinc-800 px-2 py-0.5 rounded text-[8px] font-mono text-zinc-500 uppercase font-bold">
            Maps Radar Module
          </div>
        </div>

        {/* Right Lead Search Cards */}
        <div 
          className="col-span-3 flex flex-col justify-center space-y-3 relative"
          style={{ transform: `translateY(${cardsY}px)` }}
        >
          {/* Mock Search Input field */}
          <div className="bg-[#0C0C0E] border border-zinc-800 rounded-lg p-2 flex items-center justify-between text-[9px] font-mono text-zinc-500">
            <span>Query: Dentist - London</span>
            <span className="text-blue-400">STATUS: COMPLETE</span>
          </div>

          {/* Lead Card 1 */}
          <div className="bg-[#0C0C0E]/70 border border-zinc-800 rounded-lg p-3 space-y-1.5 shadow-md relative">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-[11px] font-bold text-white tracking-wide">Harley Dental Center</h4>
                <p className="text-[8.5px] text-zinc-500 font-mono">Cosmetic Dentistry • Clinic</p>
              </div>
              <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded px-1.5 font-bold font-mono py-0.5">
                Saved to CRM
              </span>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-zinc-850">
              <span className="text-[8px] text-red-400 font-mono flex items-center gap-1 font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
                NO SITE DETECTED
              </span>
              <span className="text-[9px] font-mono text-zinc-400 font-bold">Presence: 35% Weak</span>
            </div>
          </div>

          {/* Lead Card 2 */}
          <div className="bg-[#0C0C0E]/70 border border-zinc-800 rounded-lg p-3 space-y-1.5 shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-[11px] font-bold text-white tracking-wide">Elite Dental Clinic</h4>
                <p className="text-[8.5px] text-zinc-500 font-mono">Orthodontic Group • WestEnd</p>
              </div>
              <span className="text-[8px] bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded px-1.5 font-bold font-mono py-0.5">
                New Prospect
              </span>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-zinc-850">
              <span className="text-[8px] text-emerald-400 font-mono flex items-center gap-1 font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                WEBSITE ALIGNED
              </span>
              <span className="text-[9px] font-mono text-white font-bold">Presence: 72% Medium</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature pointing alert arrow */}
      <FeaturePointerArrow 
        startFrame={40} 
        arrowPath="M 120,200 C 130,130 180,95 240,110" 
        label="Automated Local Presence Audit!" 
      />
    </div>
  );
}

// 4. Scene: Feature 2 - Kanban Board & Columns Filtering
function SceneKanban() {
  const frame = useCurrentFrame();
  const config = useVideoConfig();

  const slideFactor = spring({
    frame,
    fps: config.fps,
    config: { damping: 15 }
  });

  const hideFirstCol = frame > 45; // Simulated toggling action

  return (
    <div className="w-full h-full flex flex-col justify-between bg-[#09090B] p-6 relative font-sans overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-850 pb-3 z-10">
        <div>
          <span className="text-[8.5px] font-mono text-blue-400 uppercase tracking-widest font-bold">CHAPTER 02</span>
          <h2 className="text-sm font-black uppercase text-white tracking-wider">Visual CRM Pipeline & Filter controls</h2>
        </div>
        
        {/* Mock Stage toggle controller */}
        <div className="flex items-center gap-1.5 bg-[#0C0C0E] border border-zinc-800 p-1 rounded-lg">
          <Filter className="h-3 w-3 text-blue-400" />
          <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase mr-1">Toggled:</span>
          <span className={`text-[8.5px] font-mono px-1.5 rounded border transition-colors ${hideFirstCol ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
            {hideFirstCol ? '3 Columns Active' : 'All 5 columns'}
          </span>
        </div>
      </div>

      {"/* Simulated Kanban grid panel */"}
      <div className="grid grid-cols-3 gap-3 flex-1 mt-4 items-stretch relative">
        {/* Columns */}
        
        {/* Column 1 - New (Hides during filter toggle demo) */}
        {!hideFirstCol ? (
          <div className="bg-[#0C0C0E]/50 border border-zinc-850 rounded-xl p-2.5 flex flex-col justify-between h-full transition-all duration-200">
            <div className="flex items-center justify-between pb-1.5 border-b border-zinc-850">
              <span className="text-[9px] font-mono uppercase font-black text-white">🆕 New Leads</span>
              <span className="bg-zinc-900 border border-zinc-800 text-zinc-400 h-4 px-1 rounded flex items-center justify-center text-[9px]">2</span>
            </div>
            
            <div className="bg-[#09090B] border border-zinc-850 rounded p-2 text-[9px] space-y-1">
              <div className="text-white font-bold leading-none">Apex Orthos</div>
              <p className="text-[8px] text-zinc-500 font-mono">Category: Medical</p>
            </div>
            <div className="bg-[#09090B] border border-zinc-850 rounded p-2 text-[9px] space-y-1">
              <div className="text-white font-bold leading-none">Bridge Lawyers</div>
              <p className="text-[8px] text-zinc-500 font-mono">Category: Legal</p>
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-zinc-850/40 rounded-xl flex items-center justify-center p-4 bg-[#09090B]/10">
            <span className="text-[8px] font-mono text-zinc-650 italic">Column Hidden by Filter Toggle</span>
          </div>
        )}

        {/* Column 2 - Contacted */}
        <div className="bg-[#0C0C0E]/50 border border-zinc-850 rounded-xl p-2.5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-850">
            <span className="text-[9px] font-mono uppercase font-black text-amber-400">🔄 Contacted</span>
            <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 h-4 px-1 rounded flex items-center justify-center text-[9px]">1</span>
          </div>
          
          <div className="bg-[#09090B] border border-zinc-700/60 rounded p-2 text-[9px] space-y-1 shadow-md">
            <div className="text-white font-bold leading-none flex items-center justify-between">
              <span>Harley Dental</span>
              <span className="text-[7.5px] bg-red-500/15 border border-red-500/20 text-red-400 px-1 rounded">Urgent</span>
            </div>
            <p className="text-[8px] text-zinc-500 font-mono">Mail Sent: 1 day ago</p>
          </div>

          <div className="h-10 text-[8px] text-zinc-650 italic flex items-center justify-center border border-dashed border-zinc-850/40 rounded">
            Stage Container Empty
          </div>
        </div>

        {/* Column 3 - Interested / Meeting */}
        <div className="bg-[#0C0C0E]/50 border border-zinc-850 rounded-xl p-2.5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-850">
            <span className="text-[9px] font-mono uppercase font-black text-emerald-400">🔥 Meeting</span>
            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 h-4 px-1.5 rounded flex items-center justify-center text-[9px] font-mono font-black">1</span>
          </div>
          
          <div className="bg-[#09090B] border border-zinc-800 rounded p-2 text-[9px] space-y-1">
            <div className="text-white font-bold leading-none">Global Tech Ltd</div>
            <p className="text-[8px] text-zinc-500 font-mono">Proposal Draft Ready</p>
          </div>

          <div className="h-10 text-[8px] text-zinc-650 italic flex items-center justify-center border border-dashed border-zinc-850/40 rounded">
            Stage Container Empty
          </div>
        </div>
      </div>

      {/* Pointing visual pointer on column toggler filter */}
      <FeaturePointerArrow 
        startFrame={30} 
        arrowPath="M 240,60 C 265,35 285,15 285,25" 
        label="Hide stages with visual Multi-Select toggle!" 
        badgeColor="text-amber-450 border-amber-500/30 bg-amber-950/20"
      />
    </div>
  );
}

// 5. Scene: Feature 3 - AI Status Summarizer Overlay
function SceneSummary() {
  const frame = useCurrentFrame();
  const config = useVideoConfig();

  const modalScale = spring({
    frame: frame - 20,
    fps: config.fps,
    config: { damping: 14 }
  });

  const textOpacity = interpolate(frame, [30, 75], [0, 1], { extrapolateLeft: 'clamp' });

  return (
    <div className="w-full h-full flex flex-col justify-between bg-[#09090B] p-6 relative font-sans overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
        <div>
          <span className="text-[8.5px] font-mono text-blue-400 uppercase tracking-widest font-bold">CHAPTER 03</span>
          <h2 className="text-sm font-black uppercase text-white tracking-wider">AI Sales Briefing Insights</h2>
        </div>
        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
      </div>

      {/* Main Container showing simulated card trigger clicking */}
      <div className="flex-1 flex items-center justify-center mt-4 relative">
        {/* Background Card representation */}
        <div className="blur-[1px] opacity-40 bg-[#0C0C0E] border border-zinc-800 rounded-xl p-4 w-60 space-y-2 text-[9px]">
          <h5 className="font-bold text-white">Harley Dental</h5>
          <p className="text-zinc-500 font-mono leading-relaxed">Local SEO strategy is completely missing. Website needs update. Contacted last week.</p>
        </div>

        {/* AI briefing floating modal pops up in center */}
        {frame >= 20 && (
          <div 
            className="absolute rounded-xl border border-blue-900/40 bg-[#0C0C0E] shadow-[0_0_35px_rgba(0,0,0,0.8)] max-w-sm w-9/12 overflow-hidden"
            style={{ transform: `scale(${modalScale})`, filter: 'drop-shadow(0 0 15px rgba(59,130,246,0.15))' }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between bg-zinc-950 border-b border-zinc-850 px-3.5 py-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-blue-400 animate-pulse" />
                <span className="text-[9.5px] font-mono text-zinc-100 uppercase tracking-wider font-black">AI Briefing Generated</span>
              </div>
              <span className="text-[7.5px] bg-blue-500/10 text-blue-400 px-1.5 rounded uppercase font-bold border border-blue-500/20 font-mono scale-90">LIVE ENGINE</span>
            </div>

            {/* Modal Content */}
            <div className="p-3.5 space-y-2.5">
              <div className="text-[10px] text-zinc-200 leading-relaxed font-sans space-y-2" style={{ opacity: textOpacity }}>
                <div className="flex items-start gap-1.5">
                  <span className="h-1 w-1 bg-blue-400 rounded-full mt-1.5 shrink-0" />
                  <p><strong>Stage Diagnostics:</strong> Staged in <strong>OUTREACH</strong> stage with a weak presence of 35%.</p>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="h-1 w-1 bg-blue-400 rounded-full mt-1.5 shrink-0" />
                  <p><strong>Bottleneck:</strong> Lacks valid SSL and mobile layout, which represents an immediate visual hook.</p>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="h-1 w-1 bg-blue-400 rounded-full mt-1.5 shrink-0" />
                  <p><strong>Proposed Action:</strong> Pitch a mobile web platform with custom integration tools.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <FeaturePointerArrow 
        startFrame={22} 
        arrowPath="M 235,135 C 210,135 150,115 150,125" 
        label="Generate instant sales insights in 1-Click!" 
        badgeColor="text-blue-400 border-blue-500/30 bg-blue-950/20"
      />
    </div>
  );
}

// 6. Scene: Feature 4 - Export CSV
function SceneExport() {
  const frame = useCurrentFrame();
  const config = useVideoConfig();

  const compileProgress = spring({
    frame,
    fps: config.fps,
    config: { damping: 15 }
  });

  const arrowY = interpolate(frame, [30, 60], [-40, 0], { extrapolateLeft: 'clamp' });
  const checkScale = spring({
    frame: frame - 40,
    fps: config.fps,
    config: { damping: 10 }
  });

  return (
    <div className="w-full h-full flex flex-col justify-between bg-[#09090B] p-6 relative font-sans overflow-hidden">
      {"/* Header */"}
      <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
        <div>
          <span className="text-[8.5px] font-mono text-blue-400 uppercase tracking-widest font-bold">CHAPTER 04</span>
          <h2 className="text-sm font-black uppercase text-white tracking-wider">Spreadsheet Compilations</h2>
        </div>
        <div className="flex items-center gap-1.5 bg-blue-950/25 px-2.5 py-1 rounded border border-blue-900/30">
          <Download className="h-3 w-3 text-blue-400 animate-bounce" />
          <span className="text-[9px] font-mono text-blue-400 font-bold uppercase uppercase">Export CSV</span>
        </div>
      </div>

      {/* Main visualization Grid compiler */}
      <div className="flex-1 flex flex-col justify-center items-center space-y-4 relative">
        <div className="text-center font-mono space-y-1">
          <span className="text-[8.5px] text-zinc-500 tracking-wider">COMPILING DYNAMIC ACTIVE ROWS</span>
          <div className="text-xs text-white font-bold font-mono">
            {compileProgress < 0.95 
              ? `Processing Lead matrix: ${Math.round(compileProgress * 100)}% ...` 
              : 'COMPILE COMPLETED SUCCESSFUL'}
          </div>
        </div>

        {/* Mock spreadsheet UI drawing in */}
        <div className="w-[85%] border border-zinc-800 bg-[#0C0C0E] rounded-xl overflow-hidden p-2 shadow-2xl space-y-1 bg-opacity-70">
          <div className="grid grid-cols-4 gap-2 bg-zinc-950 border-b border-zinc-850 p-1.5 rounded-lg text-[8px] font-mono text-zinc-500 font-bold uppercase select-none">
            <span>CLIENT COMPANY</span>
            <span>STAGE</span>
            <span>PRESENCE</span>
            <span>EST POTENTIAL</span>
          </div>

          <div 
            className="grid grid-cols-4 gap-2 p-1.5 rounded text-[8px] font-mono text-zinc-300 border border-zinc-900 transition-colors"
            style={{ opacity: compileProgress > 0.25 ? 1 : 0.15 }}
          >
            <span className="text-white font-bold">Harley Dental</span>
            <span className="text-amber-400">OUTREACH</span>
            <span>35%</span>
            <span className="text-emerald-400">$3,400</span>
          </div>

          <div 
            className="grid grid-cols-4 gap-2 p-1.5 rounded text-[8px] font-mono text-zinc-300 border border-zinc-900"
            style={{ opacity: compileProgress > 0.55 ? 1 : 0.15 }}
          >
            <span className="text-white font-bold">Global Tech</span>
            <span className="text-emerald-400">MEETING</span>
            <span>72%</span>
            <span className="text-emerald-400">$9,500</span>
          </div>

          {/* Download Completion Banner pop up */}
          {frame >= 40 && (
            <div 
              className="mt-4 p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-[9.5px] leading-relaxed text-emerald-400 flex items-center justify-between"
              style={{ transform: `scale(${checkScale})` }}
            >
              <div className="flex items-center gap-1.5">
                <div className="h-4.5 w-4.5 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold shrink-0">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>Compiled & exported: <strong>crm_pipeline_export_2026.csv</strong></span>
              </div>
              <span className="text-[8px] border border-emerald-500/25 px-1.5 py-0.5 rounded font-mono font-bold uppercase shrink-0">SAVED</span>
            </div>
          )}
        </div>
      </div>

      <FeaturePointerArrow 
        startFrame={15} 
        arrowPath="M 230,140 C 270,140 290,120 290,90" 
        label="Download all filtered lead listings in 1 second!" 
      />
    </div>
  );
}

// 7. Scene: Outro sleek branding card
function SceneOutro() {
  const frame = useCurrentFrame();
  const config = useVideoConfig();

  const outroSpring = spring({
    frame,
    fps: config.fps,
    config: { damping: 15 }
  });

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#09090B] via-[#0C0C0E] to-[#050507] relative overflow-hidden font-sans text-center px-10">
      <div 
        className="absolute w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px]"
        style={{ transform: `scale(${interpolate(frame, [0, 100], [0.9, 1.3])})` }}
      />

      <div className="space-y-4 z-10 max-w-sm">
        <div 
          className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4 border border-blue-400/20 shadow-lg shadow-blue-500/15"
          style={{ transform: `scale(${outroSpring})` }}
        >
          <Compass className="h-5 w-5 text-white" />
        </div>

        <h3 className="text-xl font-black uppercase tracking-wider text-white">READY TO SCALE YOUR LEADS?</h3>
        
        <p className="text-xs text-zinc-400 font-sans leading-relaxed">
          Uncover prospects, review digital presence vulnerabilities, send outreach logs, and coordinate pipeline deals seamlessly.
        </p>

        <div className="pt-6 border-t border-zinc-850/60 mt-4 text-[9px] font-mono text-zinc-500 uppercase font-black tracking-wide">
          BUILD • ADAPT • OPTIMIZE
        </div>
      </div>
    </div>
  );
}

// THE CENTRAL REMOTION VIDEO COMPOSITION (600 frames = 20 seconds @ 30fps)
export function LaunchVideoComposition() {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill className="bg-[#09090B] text-white overflow-hidden">
      {/* 0s - 4s (Frames 0 - 120): Intro */}
      {frame >= 0 && frame < 120 && <SceneTitle />}

      {"/* 4s - 8s (Frames 121 - 240): Discovery Engine search */"}
      {frame >= 120 && frame < 240 && <SceneDiscovery />}

      {/* 8s - 12s (Frames 241 - 360): Pipeline and Multi select Filter */}
      {frame >= 240 && frame < 360 && <SceneKanban />}

      {/* 12s - 16s (Frames 361 - 480): AI Summarizers */}
      {frame >= 360 && frame < 480 && <SceneSummary />}

      {/* 16s - 20s (Frames 481 - 600): CSV Exporter & Outro */}
      {frame >= 480 && frame <= 600 && (
        <>
          {frame < 550 ? <SceneExport /> : <SceneOutro />}
        </>
      )}
    </AbsoluteFill>
  );
}


// ==========================================================
// THE LAUNCH VIDEO PLAYER PANEL MODAL WINDOW (PRO PREVIEWER)
// ==========================================================

interface LaunchVideoPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CHAPTERS = [
  { id: 'intro', label: '01. Intro & Concept', startFrame: 0, description: 'Overview of Hunter automation' },
  { id: 'discovery', label: '02. Presence Radar', startFrame: 120, description: 'Local Map data lead generation' },
  { id: 'kanban', label: '03. Matrix Pipeline', startFrame: 240, description: 'Sleek pipeline toggling filter' },
  { id: 'summary', label: '04. AI Sales Briefing', startFrame: 360, description: '1-Click CRM intelligence generation' },
  { id: 'export', label: '05. Spreadsheet Export', startFrame: 480, description: 'CompileVisible visible CSV records' }
];

export default function LaunchVideoPlayer({ isOpen, onClose }: LaunchVideoPlayerProps) {
  const playerRef = useRef<PlayerRef>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);

  // Sync isplaying state changes with ref play loops
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      if (playerRef.current) {
        const frame = playerRef.current.getCurrentFrame();
        if (typeof frame === 'number') {
          setCurrentFrame(frame);
        }
        setIsPlaying(playerRef.current.isPlaying());
      }
    }, 150);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePlayToggle = () => {
    if (playerRef.current) {
      if (playerRef.current.isPlaying()) {
        playerRef.current.pause();
        setIsPlaying(false);
      } else {
        playerRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleReset = () => {
    if (playerRef.current) {
      playerRef.current.seekTo(0);
      playerRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleJumpToChapter = (startFrame: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(startFrame);
      playerRef.current.play();
      setIsPlaying(true);
    }
  };

  // Identify current subtitle or Chapter stage text based on currentFrame position
  const getActiveChapterInfo = () => {
    for (let i = CHAPTERS.length - 1; i >= 0; i--) {
      if (currentFrame >= CHAPTERS[i].startFrame) {
        return CHAPTERS[i];
      }
    }
    return CHAPTERS[0];
  };

  const activeChap = getActiveChapterInfo();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl rounded-2xl border border-zinc-800 bg-[#09090B] shadow-[0_0_65px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col my-8 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar branding */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-850 bg-[#0C0C0E]/75">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded bg-blue-600 flex items-center justify-center border border-blue-500/20 shadow-md">
              <Compass className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-xs font-sans font-black text-white uppercase tracking-wider block">Remotion Production Canvas</span>
              <p className="text-[9px] font-mono text-zinc-500 uppercase font-black">20-Second Dynamic Product Launch Video Code</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[8.5px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-widest scale-95">
              Vite Pre-Rendered
            </span>
            <button
              id="remotion-close-btn"
              onClick={onClose}
              className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white cursor-pointer transition-all text-xs"
              title="Close Player"
            >
              Close Live Tour
            </button>
          </div>
        </div>

        {/* Dynamic Dual columns layout: Player on left, chapter indicators on right */}
        <div className="grid grid-cols-1 md:grid-cols-12 border-b border-zinc-850 bg-[#060608]">
          
          {/* Remotion Canvas Video player box */}
          <div className="col-span-1 md:col-span-8 p-6 flex flex-col justify-center items-center relative border-r border-zinc-900">
            {/* Cinematic simulated Monitor border frame */}
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-zinc-800 bg-zinc-950 shadow-2xl">
              <Player
                ref={playerRef}
                component={LaunchVideoComposition}
                durationInFrames={600}
                fps={30}
                compositionWidth={1280}
                compositionHeight={720}
                style={{
                  width: '100%',
                  height: '100%',
                }}
                controls={false}
                loop={true}
              />

              {/* Glowing Overlay Indicator */}
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 bg-[#0C0C0E]/90 px-2 py-1 rounded-md border border-zinc-850 text-[10px] font-mono select-none pointer-events-none text-zinc-300">
                <span className={`h-1.5 w-1.5 rounded-full ${isPlaying ? 'bg-emerald-500 animate-ping' : 'bg-zinc-500'}`} />
                <span>FPS: 30</span>
                <span className="text-zinc-500">|</span>
                <span>Frame: {currentFrame}/600</span>
              </div>
            </div>

            {/* Custom Interactive Player Status Tool Bar */}
            <div className="w-full flex items-center justify-between mt-4 bg-[#0C0C0E]/95 border border-zinc-850 rounded-xl p-3 shadow-md gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePlayToggle}
                  className={`p-2 rounded-lg transition-all cursor-pointer border flex items-center justify-center ${isPlaying ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white' : 'bg-blue-600 border-blue-500/20 hover:bg-blue-500 text-white shadow-md'}`}
                  title={isPlaying ? "Pause Preview" : "Play Tour Composition"}
                >
                  {isPlaying ? <Pause className="h-4.5 w-4.5" /> : <Play className="h-4.5 w-4.5 fill-white stroke-none" />}
                </button>
                <button
                  onClick={handleReset}
                  className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                  title="Restart video"
                >
                  <RotateCcw className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Progress track slider timeline */}
              <div className="flex-1 flex items-center gap-2">
                <span className="text-[9.5px] font-mono text-zinc-500">0:{(Math.floor(currentFrame / 30)).toString().padStart(2, '0')}</span>
                <div 
                  className="flex-1 h-1.5 bg-zinc-900 rounded-full overflow-hidden relative border border-zinc-850/50 cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const percent = clickX / rect.width;
                    const targetFrame = Math.round(percent * 600);
                    if (playerRef.current) {
                      playerRef.current.seekTo(targetFrame);
                    }
                  }}
                >
                  <div 
                    className="absolute top-0 bottom-0 left-0 bg-blue-500 transition-all duration-100" 
                    style={{ width: `${(currentFrame / 600) * 100}%` }}
                  />
                </div>
                <span className="text-[9.5px] font-mono text-zinc-400 font-bold">0:20</span>
              </div>
            </div>
          </div>

          {"/* Dynamic Interactive Chapter Sidebar */"}
          <div className="col-span-1 md:col-span-4 p-5 flex flex-col justify-between bg-[#08080A]">
            <div className="space-y-4">
              <span className="text-[10px] font-sans font-black text-zinc-500 uppercase tracking-widest block border-b border-zinc-850 pb-2">
                Launch Chapter Guide
              </span>
              
              <div className="space-y-2">
                {CHAPTERS.map((chap) => {
                  const isActive = activeChap.id === chap.id;
                  return (
                    <button
                      key={chap.id}
                      onClick={() => handleJumpToChapter(chap.startFrame)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${
                        isActive 
                          ? 'bg-blue-950/20 text-blue-400 border-blue-900/60 shadow-lg' 
                          : 'bg-zinc-950/40 text-zinc-400 border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/40 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-sans font-bold leading-none ${isActive ? 'text-blue-400' : 'text-zinc-300'}`}>
                          {chap.label}
                        </span>
                        {isActive && (
                          <span className="h-3.5 w-3.5 rounded-full bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-[10px] scale-90 text-blue-400 font-bold animate-pulse">
                            ●
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] text-zinc-500 font-mono italic truncate">
                        {chap.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Simulated Active Output text details */}
            <div className="mt-6 p-4 rounded-xl border border-zinc-850 bg-zinc-950/50 space-y-1.5">
              <span className="text-[8.5px] font-mono text-zinc-600 uppercase font-black tracking-widest block">ACTIVE FEATURE PREVIEW</span>
              <h5 className="text-[10.5px] font-bold text-white uppercase">{activeChap.label.split('. ')[1] || activeChap.label}</h5>
              <p className="text-[9.5px] text-zinc-400 leading-relaxed font-sans mt-1">
                {activeChap.id === 'intro' ? 'The system triggers a deep audit, analyzing locations and capturing digital score details automatically.' : 
                 activeChap.id === 'discovery' ? 'Radar radar scanning uncovers dentists, plumbers or local targets that need immediate conversion optimizations.' : 
                 activeChap.id === 'kanban' ? 'Toggle specific rows dynamically with the new Multi-Select view to narrow focus on target opportunities.' : 
                 activeChap.id === 'summary' ? 'Click on cards to generate instant Gemini sales strategies & pitch options automatically.' : 
                 'Save visible pipeline matrix targets immediately in a fully-complied formatted CSV file ready for import.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer info bar */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-[#0C0C0E]/75">
          <div className="text-[9.5px] font-mono text-zinc-500">
            Powered by <strong className="text-zinc-400">@remotion/player</strong> &middot; Direct UI rendering
          </div>
          <button
            onClick={() => {
              if (playerRef.current) {
                playerRef.current.seekTo(0);
                setIsPlaying(true);
                playerRef.current.play();
              }
            }}
            className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white bg-blue-650 hover:bg-blue-600 rounded-lg cursor-pointer transition-colors shadow-md hover:shadow-lg border border-blue-500/35"
          >
            Play Entire Product Tour
          </button>
        </div>
      </div>
    </div>
  );
}
