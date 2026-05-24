import { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { MapPin, AlertCircle, Info } from 'lucide-react';
import { Lead } from '../types';

interface MapViewProps {
  leads: Lead[];
  onSelectLead?: (lead: Lead) => void;
  activeLeadId?: string;
}

const API_KEY =
  (process.env as any).GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

export default function MapView({ leads, onSelectLead, activeLeadId }: MapViewProps) {
  const [selectedPinLead, setSelectedPinLead] = useState<Lead | null>(null);

  // Focus coordinates on the first lead, or fall back to standard coordinates
  const defaultCenter = leads.length > 0 && leads[0].latitude && leads[0].longitude
    ? { lat: leads[0].latitude, lng: leads[0].longitude }
    : { lat: 5.5601, lng: -0.2057 }; // Accra center

  if (!hasValidKey) {
    return (
      <div className="relative flex h-[220px] sm:h-[350px] w-full flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-center">
        <div className="absolute inset-0 opacity-15 overflow-hidden rounded-xl">
          {/* A mock matrix grid pattern looking like a map */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          {leads.map((l, i) => {
            const top = 30 + (i * 15) % 60;
            const left = 20 + (i * 22) % 70;
            return (
              <div
                key={l.id}
                className="absolute flex items-center gap-1"
                style={{ top: `${top}%`, left: `${left}%` }}
              >
                <div className={`h-3 w-3 rounded-full ${l.website ? 'bg-indigo-500' : 'bg-rose-500 animate-pulse'}`}></div>
                <span className="text-[9px] text-zinc-500 bg-zinc-950 px-1 rounded truncate max-w-[80px]">{l.name}</span>
              </div>
            );
          })}
        </div>

        <div className="relative z-10 max-w-sm">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-zinc-850 border border-zinc-700 mb-3">
            <AlertCircle className="h-5 w-5 text-zinc-400" />
          </div>
          <h3 className="text-sm font-sans font-semibold text-white">Google Maps Preview Unavailable</h3>
          <p className="text-xs text-zinc-400 mt-1 mb-4 leading-relaxed">
            Specify a valid <code>GOOGLE_MAPS_PLATFORM_KEY</code> under **Settings &gt; Secrets** to render live Google places and routes on active satellite overlays.
          </p>
          <div className="rounded-lg bg-zinc-950/80 p-3 text-left border border-zinc-850">
            <p className="text-[10px] text-zinc-300 font-semibold mb-1 uppercase tracking-wide flex items-center gap-1.5">
              <Info className="h-3 w-3 text-blue-400" /> Quick Live Map Setup:
            </p>
            <ol className="list-decimal list-inside text-[9.5px] text-zinc-400 space-y-1">
              <li>Click ⚙️ **Settings** (top-right core corner).</li>
              <li>Select **Secrets**.</li>
              <li>Add name <code>GOOGLE_MAPS_PLATFORM_KEY</code> & save your API key.</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[220px] sm:h-[350px] w-full rounded-xl overflow-hidden border border-zinc-805">
      <APIProvider apiKey={API_KEY} version="weekly">
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={11}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
          gestureHandling="cooperative"
          disableDefaultUI={false}
        >
          {leads.map((p) => {
            if (!p.latitude || !p.longitude) return null;
            const isSelected = activeLeadId === p.id;
            const hasWebsite = Boolean(p.website);
            return (
              <AdvancedMarker
                key={p.id}
                position={{ lat: p.latitude, lng: p.longitude }}
                onClick={() => {
                  setSelectedPinLead(p);
                  if (onSelectLead) onSelectLead(p);
                }}
              >
                <Pin
                  background={isSelected ? '#4f46e5' : hasWebsite ? '#10b981' : '#f43f5e'}
                  glyphColor="#fff"
                  scale={isSelected ? 1.2 : 0.95}
                />
              </AdvancedMarker>
            );
          })}

          {selectedPinLead && selectedPinLead.latitude && selectedPinLead.longitude && (
            <InfoWindow
              position={{ lat: selectedPinLead.latitude, lng: selectedPinLead.longitude }}
              onCloseClick={() => setSelectedPinLead(null)}
            >
              <div className="p-1 min-w-[150px] text-zinc-900 leading-snug">
                <p className="font-bold text-xs">{selectedPinLead.name}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">{selectedPinLead.category}</p>
                <p className="text-[9px] text-zinc-400 italic mt-1">{selectedPinLead.address}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${selectedPinLead.website ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                  <span className="text-[8.5px] font-semibold text-zinc-700">
                    {selectedPinLead.website ? 'Has Website' : 'NO WEBSITE'}
                  </span>
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}
