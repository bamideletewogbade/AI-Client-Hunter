import React from 'react';
import { Clock, ArrowRight, Plus, MessageSquare, Calendar, Sparkles, Trash2 } from 'lucide-react';
import type { Lead } from '../types';

interface TimelineEvent {
  id: string;
  type: 'created' | 'moved' | 'analyzed' | 'proposed' | 'pitched' | 'noted';
  timestamp: string;
  fromStatus?: string;
  toStatus?: string;
  description: string;
}

interface LeadActivityTimelineProps {
  lead: Lead;
  onClose: () => void;
}

function generateTimeline(lead: Lead): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // Creation event
  events.push({
    id: `${lead.id}-created`,
    type: 'created',
    timestamp: lead.createdAt,
    description: `Lead created in "${lead.status.toUpperCase()}" stage`,
  });

  // Add notes as "noted" events
  if (lead.notes) {
    events.push({
      id: `${lead.id}-noted-1`,
      type: 'noted',
      timestamp: lead.createdAt,
      description: lead.notes.substring(0, 120) + (lead.notes.length > 120 ? '...' : ''),
    });
  }

  // If AI analysis exists
  if (lead.aiAnalysis) {
    events.push({
      id: `${lead.id}-analyzed`,
      type: 'analyzed',
      timestamp: lead.createdAt,
      description: `AI analysis completed — Digital Maturity Score: ${lead.aiAnalysis.digitalMaturityScore}%`,
    });
  }

  // If web proposal exists
  if (lead.webDesignProposal) {
    events.push({
      id: `${lead.id}-proposed`,
      type: 'proposed',
      timestamp: lead.createdAt,
      description: `Web proposal generated: "${lead.webDesignProposal.suggestedType}" — Est. value: ${lead.webDesignProposal.estimatedValue}`,
    });
  }

  // If pitch exists
  if (lead.outreachPitch) {
    events.push({
      id: `${lead.id}-pitched`,
      type: 'pitched',
      timestamp: lead.createdAt,
      description: 'Outreach pitch generated (Email, LinkedIn, WhatsApp)',
    });
  }

  // Sort by timestamp (most recent first)
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return events;
}

const eventIcons: Record<TimelineEvent['type'], React.ReactNode> = {
  created: <Plus className="h-3 w-3" />,
  moved: <ArrowRight className="h-3 w-3" />,
  analyzed: <Sparkles className="h-3 w-3" />,
  proposed: <Calendar className="h-3 w-3" />,
  pitched: <MessageSquare className="h-3 w-3" />,
  noted: <Clock className="h-3 w-3" />,
};

const eventColors: Record<TimelineEvent['type'], string> = {
  created: 'bg-blue-100 text-blue-700 border-blue-200',
  moved: 'bg-amber-100 text-amber-700 border-amber-200',
  analyzed: 'bg-purple-100 text-purple-700 border-purple-200',
  proposed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pitched: 'bg-sky-100 text-sky-700 border-sky-200',
  noted: 'bg-zinc-100 text-zinc-600 border-zinc-200',
};

export default function LeadActivityTimeline({ lead, onClose }: LeadActivityTimelineProps) {
  const events = generateTimeline(lead);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg rounded-xl border border-zinc-200 bg-white shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-150 px-5 py-4 bg-zinc-50/80 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center">
              <Clock className="h-3 w-3 text-amber-600" />
            </div>
            <div>
              <span className="text-xs font-sans font-bold text-zinc-800 uppercase tracking-wider">Activity Timeline</span>
              <p className="text-[9px] font-mono text-zinc-500 mt-0.5 truncate max-w-[250px]">{lead.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-800 transition-all cursor-pointer"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-5 space-y-0">
          {events.length === 0 ? (
            <div className="text-center py-8 text-zinc-400 text-xs">No activity recorded yet.</div>
          ) : (
            events.map((event, idx) => (
              <div key={event.id} className="flex gap-3 relative pb-5 last:pb-0">
                {/* Timeline line connector */}
                {idx < events.length - 1 && (
                  <div className="absolute left-[15px] top-6 bottom-0 w-px bg-zinc-200" />
                )}
                
                {/* Icon bubble */}
                <div className={`h-7 w-7 rounded-full border flex items-center justify-center shrink-0 ${eventColors[event.type]}`}>
                  {eventIcons[event.type]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-wide">
                      {event.type === 'created' && 'Lead Created'}
                      {event.type === 'moved' && 'Status Changed'}
                      {event.type === 'analyzed' && 'AI Analysis'}
                      {event.type === 'proposed' && 'Web Proposal'}
                      {event.type === 'pitched' && 'Outreach Pitch'}
                      {event.type === 'noted' && 'Note Added'}
                    </span>
                    <span className="text-[8px] font-mono text-zinc-400">
                      {new Date(event.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-zinc-600 mt-0.5 leading-relaxed">{event.description}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-150 px-5 py-3 bg-zinc-50/80 shrink-0 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-[10px] font-bold text-zinc-500 hover:text-zinc-800 bg-white border border-zinc-200 hover:border-zinc-300 rounded-lg transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
