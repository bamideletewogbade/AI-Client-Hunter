import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Lead } from '../types';

interface MapViewProps {
  leads: Lead[];
  onSelectLead?: (lead: Lead) => void;
  activeLeadId?: string;
}

export default function MapView({ leads, onSelectLead, activeLeadId }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  const activeLead = leads.find(l => l.id === activeLeadId) || null;

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Focus coordinates on the first lead with valid coordinates, or fall back to default center
    const firstValidLead = leads.find(l => l.latitude && l.longitude);
    const initialCenter: L.LatLngExpression = firstValidLead?.latitude && firstValidLead?.longitude
      ? [firstValidLead.latitude, firstValidLead.longitude]
      : [5.5601, -0.2057]; // Accra Center default fallback

    // Instantiate leaf map with a clean setup
    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: 12,
      zoomControl: true,
      scrollWheelZoom: true,
      dragging: true
    });

    // Add CartoDB Dark Matter tile layer for an elegant, high-contrast dark radar theme
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Sync Markers and Coordinate changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing markers that are no longer in the leads array
    const leadsMap = new Map(leads.map(l => [l.id, l]));
    Object.keys(markersRef.current).forEach(id => {
      if (!leadsMap.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Update or Add markers
    leads.forEach(lead => {
      if (!lead.latitude || !lead.longitude) return;

      const isSelected = activeLeadId === lead.id;
      const hasWebsite = Boolean(lead.website);

      // Custom marker icon stylized via pure Tailwind & inlined CSS for maximum pixel sharpness
      const icon = L.divIcon({
        className: 'custom-radar-marker',
        iconSize: isSelected ? [28, 28] : [18, 18],
        iconAnchor: isSelected ? [14, 14] : [9, 9],
        popupAnchor: [0, isSelected ? -14 : -9],
        html: `
          <div class="relative flex items-center justify-center" style="width: ${isSelected ? 28 : 18}px; height: ${isSelected ? 28 : 18}px; cursor: pointer;">
            ${!hasWebsite ? `
              <span class="absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-60 animate-ping"></span>
            ` : ''}
            <div className="absolute rounded-full" style="width: 100%; height: 100%; transition: all 0.3s ease;"></div>
            <span class="relative inline-flex rounded-full transition-all duration-300 ${
              isSelected 
                ? 'h-4.5 w-4.5 bg-blue-500 ring-4 ring-blue-500/40 shadow-lg' 
                : hasWebsite 
                  ? 'h-3.5 w-3.5 bg-emerald-500 ring-2 ring-emerald-500/20' 
                  : 'h-3.5 w-3.5 bg-rose-500 ring-2 ring-rose-500/20'
            }"></span>
          </div>
        `
      });

      const position: L.LatLngExpression = [lead.latitude, lead.longitude];

      if (markersRef.current[lead.id]) {
        // Marker exists, update position and icon styling
        const marker = markersRef.current[lead.id];
        marker.setLatLng(position);
        marker.setIcon(icon);
      } else {
        // Create a new interactive Leaflet marker
        const marker = L.marker(position, { icon }).addTo(map);

        // Bind interactive beautiful details popup
        const labelText = lead.website ? 'Valid Website' : 'NO WEBSITE';
        const labelColor = lead.website ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800';

        const popupContent = `
          <div class="p-2 text-zinc-900 font-sans min-w-[180px] leading-relaxed">
            <h4 class="font-bold text-xs text-zinc-900 truncate m-0" style="margin: 0 0 2px 0;">${lead.name}</h4>
            <p class="text-[10px] text-zinc-500 font-medium m-0" style="margin: 0 0 6px 0;">${lead.category}</p>
            <p class="text-[9px] text-zinc-400 italic truncate m-0" style="margin: 0 0 8px 0;">${lead.address || 'Address not listed'}</p>
            
            <div class="flex items-center justify-between border-t border-zinc-150 pt-2 mt-1">
              <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider ${labelColor}">
                ${labelText}
              </span>
              ${lead.rating ? `
                <span class="text-[10px] font-bold text-amber-500 flex items-center gap-0.5" style="margin: 0 0 0 8px;">
                  ★ ${lead.rating}
                </span>
              ` : ''}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          closeButton: false,
          className: 'leaflet-custom-radial-popup'
        });

        // Setup event streams for CRM focus syncing
        marker.on('click', () => {
          if (onSelectLead) {
            onSelectLead(lead);
          }
        });

        markersRef.current[lead.id] = marker;
      }
    });
  }, [leads, activeLeadId, onSelectLead]);

  // Autocenter and focus map on active lead when specified
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !activeLead || !activeLead.latitude || !activeLead.longitude) return;

    map.panTo([activeLead.latitude, activeLead.longitude], {
      animate: true,
      duration: 0.8
    });
    map.setZoom(14);

    // Automatically open popups for active lead
    const activeMarker = markersRef.current[activeLead.id];
    if (activeMarker) {
      setTimeout(() => {
        activeMarker.openPopup();
      }, 100);
    }
  }, [activeLeadId]);

  return (
    <div className="relative flex flex-col w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
      {/* Target Container block for leaflet instantiation */}
      <div className="relative h-[340px] w-full">
        <div id="leaflet-live-openstreetmap" ref={containerRef} className="h-full w-full z-10" />

        {/* Floating status badge on top-left of the map overlay */}
        <div className="absolute top-2.5 left-2.5 bg-zinc-950/90 border border-zinc-800/80 rounded-lg px-2.5 py-1.5 z-[1000] backdrop-blur-md pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-[10px] font-bold text-zinc-200 tracking-wide font-mono">Radar Pulse Active</span>
          </div>
        </div>
      </div>

      {/* Grounding and Map Legend Layer Section - High Contrast Accessible Text and Layout */}
      <div className="bg-[#09090B] border-t border-zinc-800 p-4 z-20">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-zinc-200 font-mono">
              Live Map Intelligent Index & Target Matrix
            </h4>
            <span className="text-[9.5px] text-blue-400 font-semibold bg-blue-950/30 border border-blue-900/50 px-2 py-0.5 rounded">
              OpenStreetMap Grounding
            </span>
          </div>

          <p className="text-[11px] text-zinc-300 leading-relaxed">
            Our specialized radar layer tracks localized businesses to diagnose digital maturity vulnerabilities. Use this interactive matrix to identify critical outreach priority:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1.5">
            {/* Red / Rose dot */}
            <div className="flex items-start gap-2.5 bg-rose-950/10 border border-rose-900/30 p-2.5 rounded-lg transition-all hover:bg-rose-950/15">
              <div className="relative flex items-center justify-center shrink-0 mt-0.5" style={{ width: '16px', height: '16px' }}>
                <span className="absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-60 animate-ping"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 ring-2 ring-rose-500/20"></span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-rose-400 block font-sans">
                  ⛔ CRITICAL: No Website / Offline
                </span>
                <span className="text-[10px] text-zinc-200 leading-snug block">
                  High-value prospects that require a professional redesign, contact flow, or mobile portfolio setup. High conversion potential.
                </span>
              </div>
            </div>

            {/* Green / Emerald dot */}
            <div className="flex items-start gap-2.5 bg-emerald-950/10 border border-emerald-900/30 p-2.5 rounded-lg transition-all hover:bg-emerald-950/15">
              <div className="flex items-center justify-center shrink-0 mt-0.5" style={{ width: '16px', height: '16px' }}>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-emerald-500/20"></span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-emerald-400 block font-sans">
                  ✅ STANDARD: Active Website
                </span>
                <span className="text-[10px] text-zinc-200 leading-snug block">
                  Existing website discovered. Lower direct agency urgency, but candidates are viable for localized SEO optimization or performance tunings.
                </span>
              </div>
            </div>

            {/* Blue / Indigo dot */}
            <div className="flex items-start gap-2.5 bg-blue-950/10 border border-blue-900/30 p-2.5 rounded-lg transition-all hover:bg-blue-950/15">
              <div className="flex items-center justify-center shrink-0 mt-0.5" style={{ width: '16px', height: '16px' }}>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 ring-4 ring-blue-500/40 shadow-md"></span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-blue-400 block font-sans">
                  🎯 ACTIVE: Inspecting Lead
                </span>
                <span className="text-[10px] text-zinc-200 leading-snug block">
                  Active target currently in focus. Click to automatically populate CRM Pipelines and generate custom redesign layouts.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
