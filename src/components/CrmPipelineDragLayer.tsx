import React from 'react';
import { useDraggable, useDroppable, DndContext, DragOverlay, DragStartEvent, DragEndEvent, DragOverEvent, closestCenter } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Lead } from '../types';

/**
 * DroppableColumn - wraps a pipeline status column as a drop target
 */
export function DroppableColumn({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`${className || ''} transition-all duration-200 ${isOver ? 'ring-2 ring-blue-400/50 ring-inset bg-blue-50/20' : ''}`}
    >
      {children}
    </div>
  );
}

/**
 * DraggableLeadCard - wraps a lead card as a draggable item
 */
export function DraggableLeadCard({
  lead,
  onSelect,
  children,
}: {
  lead: Lead;
  onSelect?: (lead: Lead) => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { lead },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : 1,
    touchAction: 'none' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        // Only trigger select if not dragging
        if (!isDragging && onSelect) onSelect(lead);
      }}
      className="cursor-grab active:cursor-grabbing"
    >
      {children}
    </div>
  );
}

/**
 * LeadDragOverlay - renders the ghost card while dragging
 */
export function LeadDragOverlay({ lead }: { lead: Lead | null }) {
  if (!lead) return null;

  const getServiceLabel = (type: Lead['serviceType']) => {
    switch (type) {
      case 'web_design': return { text: '🎨 Web Design', style: 'text-amber-800 bg-amber-50 border-amber-200/50' };
      case 'ai_automation': return { text: '🤖 AI Automation', style: 'text-sky-700 bg-sky-50 border-sky-200/50' };
      case 'hybrid': return { text: '💠 Hybrid Bundle', style: 'text-indigo-700 bg-indigo-50 border-indigo-200/50' };
    }
  };

  const service = getServiceLabel(lead.serviceType);

  return (
    <div className="rounded-xl border-2 border-blue-400 bg-white p-3.5 shadow-xl w-[220px] rotate-3">
      <h4 className="text-[11.5px] font-bold text-zinc-900 truncate">{lead.name}</h4>
      <p className="text-[9.5px] text-zinc-500 font-mono truncate mt-0.5">{lead.category}</p>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100">
        <span className={`rounded-sm px-1.5 py-px text-[8.5px] font-bold border ${service.style}`}>
          {service.text}
        </span>
        <span className="text-[9px] font-bold font-mono text-zinc-500">{lead.digitalPresenceScore}%</span>
      </div>
    </div>
  );
}

/**
 * DragDropPipelineWrapper - wraps the entire pipeline grid with DndContext
 */
export function DragDropPipelineWrapper({
  children,
  onDragEnd,
  onDragStart,
  onDragOver,
}: {
  children: React.ReactNode;
  onDragEnd: (event: DragEndEvent) => void;
  onDragStart?: (event: DragStartEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
}) {
  return (
    <DndContext
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      collisionDetection={closestCenter}
    >
      {children}
    </DndContext>
  );
}
