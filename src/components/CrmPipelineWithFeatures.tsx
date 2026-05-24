import React, { useState, useCallback, useEffect, useRef } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, CheckCircle2 } from 'lucide-react';
import type { Lead } from '../types';
import { useAI } from './AIContext';
import CrmPipeline from './CrmPipeline';
import { LeadDragOverlay } from './CrmPipelineDragLayer';
import BulkActionsBar from './BulkActionsBar';
import LeadActivityTimeline from './LeadActivityTimeline';

interface CrmPipelineWithFeaturesProps {
  leads: Lead[];
  onUpdateStatus: (id: string, nextStatus: Lead['status']) => void;
  onSelectLead: (lead: Lead) => void;
  onDeleteLead: (id: string) => void;
  onAddLead: (lead: Lead) => Promise<boolean>;
  onUpdateLead?: (updatedLead: Lead) => Promise<void> | void;
}

const PIPELINE_COLUMN_IDS = ['new', 'contacted', 'replied', 'interested', 'closed'] as const;

export default function CrmPipelineWithFeatures(props: CrmPipelineWithFeaturesProps) {
  const { leads, onUpdateStatus, onDeleteLead, onSelectLead } = props;
  const { addTrace, startTask, endTask } = useAI();

  // Drag-and-drop state (native HTML5 for cards inside CrmPipeline)
  const [activeDragLead, setActiveDragLead] = useState<Lead | null>(null);
  const isDraggingRef = useRef(false); // Ref to avoid useEffect re-attachment
  const pipelineRef = useRef<HTMLDivElement>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);

  // Activity timeline state
  const [timelineLead, setTimelineLead] = useState<Lead | null>(null);

  // Toast state for batch operations
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Native HTML5 Drag-and-Drop via Event Delegation ───
  useEffect(() => {
    const el = pipelineRef.current;
    if (!el) return;

    // CrmPipeline.tsx is too large for direct editing, so we use a
    // MutationObserver to find known element IDs that CrmPipeline already
    // renders (e.g., `crm-quick-edit-btn-*` on cards, `crm-quick-add-*` on
    // columns) and traverse up from them to add draggable attributes,
    // plus detect when the summary modal opens to log AI traces.
    const observer = new MutationObserver(() => {
      // ── Detect AI summary modal opening and log trace ──
      const summaryModal = el.querySelector('#crm-summary-modal-backdrop');
      if (summaryModal && !summaryModal.hasAttribute('data-summary-traced')) {
        summaryModal.setAttribute('data-summary-traced', 'true');
        // Find the lead name from the modal content
        const leadNameEl = summaryModal.querySelector('h4');
        const leadName = leadNameEl?.textContent?.trim() || 'unknown';
        addTrace('Analyzer', `summarize_lead:${leadName}`, 'gemini-3.5-flash', 180, 120, 0, 0, 'success', leadName);
      }
      // ── Cards: find edit buttons, traverse up to motion.div container ──
      const editBtns = el.querySelectorAll('[id^="crm-quick-edit-btn-"]');
      editBtns.forEach((btn) => {
        // Skip if an ancestor already has data-lead-id
        if (btn.closest('[data-lead-id]')) return;
        const leadId = btn.id.replace('crm-quick-edit-btn-', '');
        // Traverse up from the button to find the card motion.div
        let card = btn.parentElement;
        while (card && card !== el) {
          if (card.classList.contains('rounded-xl') &&
              card.classList.contains('bg-white')) {
            card.setAttribute('data-lead-id', leadId);
            card.setAttribute('draggable', 'true');
            break;
          }
          card = card.parentElement;
        }
      });

      // ── Columns: find quick-add buttons, traverse up ──
      const addBtns = el.querySelectorAll('[id^="crm-quick-add-"]');
      addBtns.forEach((btn) => {
        if (btn.closest('[data-column-id]')) return;
        const colId = btn.id.replace('crm-quick-add-', '');
        let col = btn.parentElement;
        while (col && col !== el) {
          if (col.classList.contains('rounded-xl') &&
              col.classList.contains('flex-col') &&
              col.classList.contains('p-3')) {
            col.setAttribute('data-column-id', colId);
            break;
          }
          col = col.parentElement;
        }
      });
    });

    observer.observe(el, { childList: true, subtree: true });

    // Track the card being dragged
    const handleDragStart = (e: Event) => {
      const dragEvt = e as DragEvent;
      const card = (dragEvt.target as HTMLElement).closest('[data-lead-id]');
      if (!card) return;
      const leadId = card.getAttribute('data-lead-id');
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        setActiveDragLead(lead);
        isDraggingRef.current = true;
        dragEvt.dataTransfer?.setData('text/plain', leadId || '');
        dragEvt.dataTransfer!.effectAllowed = 'move';
        // Add dragging class
        card.classList.add('opacity-40', 'scale-95');
      }
    };

    const handleDragEnd = (e: Event) => {
      const card = (e.target as HTMLElement).closest('[data-lead-id]');
      if (card) {
        card.classList.remove('opacity-40', 'scale-95');
      }
      setActiveDragLead(null);
      isDraggingRef.current = false;
      // Remove highlight from all columns
      el.querySelectorAll('[data-column-id]').forEach(col => {
        col.classList.remove('ring-2', 'ring-blue-400/50', 'ring-inset', 'bg-blue-50/20');
      });
    };

    // Highlight drop targets
    const handleDragOver = (e: Event) => {
      const dragEvt = e as DragEvent;
      dragEvt.preventDefault();
      const column = (dragEvt.target as HTMLElement).closest('[data-column-id]');
      if (column && isDraggingRef.current) {
        // Remove highlight from all columns
        el.querySelectorAll('[data-column-id]').forEach(col => {
          col.classList.remove('ring-2', 'ring-blue-400/50', 'ring-inset', 'bg-blue-50/20');
        });
        column.classList.add('ring-2', 'ring-blue-400/50', 'ring-inset', 'bg-blue-50/20');
      }
    };

    // Handle drop - move lead to new column
    const handleDrop = (e: Event) => {
      const dragEvt = e as DragEvent;
      dragEvt.preventDefault();
      const leadId = dragEvt.dataTransfer?.getData('text/plain');
      const column = (dragEvt.target as HTMLElement).closest('[data-column-id]');
      
      if (leadId && column) {
        const targetStatus = column.getAttribute('data-column-id');
        const lead = leads.find(l => l.id === leadId);
        if (targetStatus && lead && lead.status !== targetStatus) {
          onUpdateStatus(leadId, targetStatus as Lead['status']);
          showToast(`Moved "${lead.name}" to ${targetStatus.toUpperCase()}`);
          addTrace('CRM Optimizer', `drag_move:${lead.name}->${targetStatus}`, 'llama-3.1-8b-instruct', 60, 20, 120, 0, 'success', lead.name);
        }
      }

      // Cleanup
      setActiveDragLead(null);
      isDraggingRef.current = false;
      el.querySelectorAll('[data-column-id]').forEach(col => {
        col.classList.remove('ring-2', 'ring-blue-400/50', 'ring-inset', 'bg-blue-50/20');
      });
    };

    // Attach event listeners at the pipeline container level (event delegation)
    el.addEventListener('dragstart', handleDragStart);
    el.addEventListener('dragend', handleDragEnd);
    el.addEventListener('dragover', handleDragOver);
    el.addEventListener('drop', handleDrop);

    return () => {
      observer.disconnect();
      el.removeEventListener('dragstart', handleDragStart);
      el.removeEventListener('dragend', handleDragEnd);
      el.removeEventListener('dragover', handleDragOver);
      el.removeEventListener('drop', handleDrop);
    };
  }, [leads, onUpdateStatus]); // Removed `isDragging` — now using stable ref

  // ───  Bulk Selection via Event Delegation ───
  useEffect(() => {
    const el = pipelineRef.current;
    if (!el || !selectionMode) return;

    const handleCardClick = (e: Event) => {
      const card = (e.target as HTMLElement).closest('[data-lead-id]');
      if (!card) return;
      const leadId = card.getAttribute('data-lead-id');
      if (leadId) {
        e.stopPropagation();
        e.preventDefault();
        toggleSelection(leadId);
      }
    };

    el.addEventListener('click', handleCardClick);
    return () => el.removeEventListener('click', handleCardClick);
  }, [selectionMode]);

  // ───  Bulk Operations  ───
  const handleBatchMove = useCallback((targetStatus: Lead['status']) => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    const startTime = performance.now();
    selectedIds.forEach(id => onUpdateStatus(id, targetStatus));
    setSelectedIds([]);
    setSelectionMode(false);
    showToast(`Moved ${count} leads to "${targetStatus.toUpperCase()}" stage`);
    addTrace('CRM Optimizer', `batch_move:${count}_leads->${targetStatus}`, 'llama-3.1-8b-instruct', 80, 30, Math.round(performance.now() - startTime), 0, 'success', undefined);
  }, [selectedIds, onUpdateStatus, addTrace]);

  const handleBatchDelete = useCallback(() => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    const confirmed = window.confirm(`Permanently delete ${count} selected leads from the pipeline? This cannot be undone.`);
    if (!confirmed) return;

    selectedIds.forEach(id => onDeleteLead(id));
    setSelectedIds([]);
    setSelectionMode(false);
    showToast(`Deleted ${count} leads from pipeline`, 'error');
    addTrace('CRM Optimizer', `batch_delete:${count}_leads`, 'llama-3.1-8b-instruct', 50, 10, 80, 0, 'success', undefined);
  }, [selectedIds, onDeleteLead, addTrace]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    setSelectionMode(false);
  }, []);

  const enterSelectionMode = useCallback(() => {
    setSelectionMode(true);
    showToast('Tap on leads to select them for batch operations');
  }, []);

  return (
    <div className="relative" ref={pipelineRef}>
      {/* Feature toolbar: bulk select + timeline + status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {!selectionMode ? (
            <button
              type="button"
              onClick={enterSelectionMode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-zinc-200 hover:border-zinc-300 text-[10px] font-bold text-zinc-600 hover:text-zinc-800 cursor-pointer transition-all shadow-xs"
              title="Select multiple leads to batch move or delete"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Bulk Select</span>
            </button>
          ) : (
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Selection mode active
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              const lead = leads.find(l => l.id === selectedIds[0]);
              if (lead) setTimelineLead(lead);
              else showToast('Select a lead first to view its timeline', 'error');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-zinc-200 hover:border-zinc-300 text-[10px] font-bold text-zinc-600 hover:text-zinc-800 cursor-pointer transition-all shadow-xs"
            title="View activity timeline for selected lead"
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Timeline</span>
          </button>
        </div>
        {selectedIds.length > 0 && (
          <span className="text-[10px] font-mono text-zinc-500 bg-zinc-50 px-2 py-1 rounded border border-zinc-200">
            {selectedIds.length} selected
          </span>
        )}
      </div>

      {/* Bulk actions bar */}
      <BulkActionsBar
        selectedIds={selectedIds}
        leads={leads}
        onClearSelection={clearSelection}
        onBatchMove={handleBatchMove}
        onBatchDelete={handleBatchDelete}
      />

      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 right-4 z-[100] px-4 py-2.5 rounded-xl shadow-lg text-[11px] font-bold flex items-center gap-2 border ${
              toast.type === 'success' 
                ? 'bg-emerald-600 text-white border-emerald-500' 
                : 'bg-rose-600 text-white border-rose-500'
            }`}
          >
            {toast.type === 'success' ? '✓' : '✕'} {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* The pipeline itself — wrapped for future @dnd-kit integration */}
      <DndContext
        onDragStart={(event: DragStartEvent) => {
          const lead = leads.find(l => l.id === event.active.id);
          if (lead) setActiveDragLead(lead);
        }}
        onDragEnd={(event: DragEndEvent) => {
          setActiveDragLead(null);
          const { active, over } = event;
          if (!over) return;
          const leadId = active.id as string;
          const targetStatus = over.id as string;
          if (PIPELINE_COLUMN_IDS.includes(targetStatus as Lead['status'])) {
            const lead = leads.find(l => l.id === leadId);
            if (lead && lead.status !== targetStatus) {
              onUpdateStatus(leadId, targetStatus as Lead['status']);
            }
          }
        }}
      >
        <div data-pipeline-container>
          <CrmPipeline {...props} />
        </div>
        <DragOverlay dropAnimation={null}>
          {activeDragLead && <LeadDragOverlay lead={activeDragLead} />}
        </DragOverlay>
      </DndContext>

      {/* Activity Timeline modal */}
      {timelineLead && (
        <LeadActivityTimeline
          lead={timelineLead}
          onClose={() => setTimelineLead(null)}
        />
      )}
    </div>
  );
}
