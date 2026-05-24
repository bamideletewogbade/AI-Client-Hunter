import React from 'react';
import { X, ArrowRight, Trash2, Check } from 'lucide-react';
import type { Lead } from '../types';

interface BulkActionsBarProps {
  selectedIds: string[];
  leads: Lead[];
  onClearSelection: () => void;
  onBatchMove: (targetStatus: Lead['status']) => void;
  onBatchDelete: () => void;
}

const COLUMNS: { id: Lead['status']; label: string; emoji: string }[] = [
  { id: 'new', label: 'New', emoji: '🆕' },
  { id: 'contacted', label: 'Contacted', emoji: '🔄' },
  { id: 'replied', label: 'Replied', emoji: '💬' },
  { id: 'interested', label: 'Interested', emoji: '🔥' },
  { id: 'closed', label: 'Closed Won', emoji: '💼' },
];

export default function BulkActionsBar({ selectedIds, leads, onClearSelection, onBatchMove, onBatchDelete }: BulkActionsBarProps) {
  if (selectedIds.length === 0) return null;

  const selectedLeads = leads.filter(l => selectedIds.includes(l.id));
  const currentStatuses = [...new Set(selectedLeads.map(l => l.status))];

  return (
    <div className="sticky top-0 z-30 -mx-1 px-1 animate-fade-in">
      <div className="flex items-center justify-between bg-blue-600 text-white rounded-xl px-4 py-2.5 shadow-lg shadow-blue-600/20">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClearSelection}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
            title="Clear selection"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="bg-white/20 rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-bold">
              {selectedIds.length}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Selected
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-white/70 mr-1">
            Move to:
          </span>
          {COLUMNS.filter(col => !currentStatuses.includes(col.id)).map((col) => (
            <button
              key={col.id}
              type="button"
              onClick={() => onBatchMove(col.id)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 transition-colors text-[10px] font-bold cursor-pointer"
            >
              <span>{col.emoji}</span>
              <span>{col.label}</span>
            </button>
          ))}
          <div className="h-4 w-px bg-white/20 mx-1" />
          <button
            type="button"
            onClick={onBatchDelete}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/30 hover:bg-red-500/50 transition-colors text-[10px] font-bold cursor-pointer"
          >
            <Trash2 className="h-3 w-3" />
            <span>Delete All</span>
          </button>
        </div>
      </div>
    </div>
  );
}
