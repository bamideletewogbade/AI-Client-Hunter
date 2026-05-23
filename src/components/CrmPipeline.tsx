import { Lead } from '../types';
import {
  Building2, ArrowRight, ArrowLeft, RefreshCw, MessageSquare, Briefcase, PlusCircle, Plus,
  TrendingUp, Trash2, CalendarRange, Check, AlertCircle, FileText, Globe, ArrowUpDown, X, Download, Sparkles,
  Filter, ChevronDown, Upload, Pencil
} from 'lucide-react';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Robust split-based CSV parser supporting double quotes and comma delimiters
function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let insideQuote = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        cell += '"';
        i++; // skip next quote
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip LF
      }
      row.push(cell.trim());
      lines.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (cell || row.length > 0) {
    row.push(cell.trim());
    lines.push(row);
  }
  return lines.filter(l => l.length > 0 && l.some(cell => cell !== ''));
}

// Auto-detect mappings from headers
interface LeadMapping {
  name: string;
  category: string;
  website: string;
  phone: string;
  address: string;
  rating: string;
  reviewsCount: string;
  status: string;
  serviceType: string;
  digitalPresenceScore: string;
  notes: string;
}

function autoDetectMapping(headers: string[]): LeadMapping {
  const findHeader = (keywords: string[]): string => {
    const match = headers.find(h => {
      const lower = h.toLowerCase().trim();
      return keywords.some(kw => lower.includes(kw));
    });
    return match || '';
  };

  return {
    name: findHeader(['name', 'business', 'company', 'client', 'prospect', 'title', 'trade', 'shop']),
    category: findHeader(['category', 'niche', 'industry', 'type', 'sector', 'field', 'class']),
    website: findHeader(['website', 'url', 'link', 'site', 'web', 'domain']),
    phone: findHeader(['phone', 'telephone', 'mobile', 'tel', 'contact', 'cell']),
    address: findHeader(['address', 'location', 'city', 'region', 'state', 'street', 'coordinates', 'suburb']),
    rating: findHeader(['rating', 'stars', 'score', 'google rating', 'star rating']),
    reviewsCount: findHeader(['reviews', 'review count', 'ratings count', 'votes', 'reviews count']),
    status: findHeader(['status', 'stage', 'pipeline', 'deal stage']),
    serviceType: findHeader(['service', 'offer', 'deal type', 'product', 'offer type']),
    digitalPresenceScore: findHeader(['presence score', 'digital maturity', 'deficit score', 'maturity', 'presence %']),
    notes: findHeader(['notes', 'comment', 'description', 'about', 'details', 'info', 'internal notes'])
  };
}

interface CrmPipelineProps {
  leads: Lead[];
  onUpdateStatus: (id: string, nextStatus: Lead['status']) => void;
  onSelectLead: (lead: Lead) => void;
  onDeleteLead: (id: string) => void;
  onAddLead: (lead: Lead) => Promise<boolean>;
  onUpdateLead?: (updatedLead: Lead) => Promise<void> | void;
}

// Lightweight Markdown custom bullet parser for rendering AI summaries without external modules
function SimpleMarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  
  return (
    <ul className="space-y-3">
      {lines.map((line, idx) => {
        // Strip bullet markup if present at the start of the line
        const cleanLine = line.replace(/^[•\-\*]\s*/, '');
        
        // Parse highlighted bold strings (e.g. **bold item**)
        const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
        
        return (
          <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-700 leading-relaxed font-sans">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-2 shrink-0"></span>
            <div className="flex-1">
              {parts.map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <strong key={pIdx} className="font-bold text-zinc-950 font-sans mr-0.5">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                return <span key={pIdx}>{part}</span>;
              })}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function CrmPipeline({ leads, onUpdateStatus, onSelectLead, onDeleteLead, onAddLead, onUpdateLead }: CrmPipelineProps) {
  
  const [sortBy, setSortBy] = useState<'date_added' | 'digital_maturity' | 'revenue_potential'>('date_added');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [visibleColumns, setVisibleColumns] = useState<Lead['status'][]>(['new', 'contacted', 'replied', 'interested', 'closed']);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Quick-edit lead name state
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState<string>('');

  // AI summary states
  const [summarizedLead, setSummarizedLead] = useState<Lead | null>(null);
  const [aiSummaryText, setAiSummaryText] = useState<string>('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const handleOpenSummaryPopup = async (lead: Lead) => {
    setSummarizedLead(lead);
    setIsLoadingSummary(true);
    setSummaryError(null);
    setAiSummaryText('');

    try {
      const response = await fetch(`/api/crm/leads/${lead.id}/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error("Failed to load summary from database server.");
      }
      const data = await response.json();
      setAiSummaryText(data.summary || 'No summary could be generated.');
    } catch (err: any) {
      console.error(err);
      setSummaryError(err.message || 'Failed to connect to sales intelligence summary gateway.');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // Quick CRM Lead add form state
  const [activeQuickAdd, setActiveQuickAdd] = useState<Lead['status'] | null>(null);
  const [quickLeadForm, setQuickLeadForm] = useState({
    name: '',
    category: '',
    website: '',
    serviceType: 'web_design' as Lead['serviceType'],
    phone: '',
    address: '',
    rating: '',
    reviewsCount: '',
    notes: '',
    tagsRaw: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // CSV Import States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [importRows, setImportRows] = useState<string[][]>([]);
  const [importFileName, setImportFileName] = useState<string>('');
  const [importMapping, setImportMapping] = useState<LeadMapping>({
    name: '',
    category: '',
    website: '',
    phone: '',
    address: '',
    rating: '',
    reviewsCount: '',
    status: 'static:new',
    serviceType: 'static:web_design',
    digitalPresenceScore: 'static:50',
    notes: ''
  });
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importCurrentIndex, setImportCurrentIndex] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number; failed: number } | null>(null);
  const [csvParseError, setCsvParseError] = useState<string | null>(null);
  const [previewRowIndex, setPreviewRowIndex] = useState(0);

  // States for reverting imports
  const [isRevertingBatch, setIsRevertingBatch] = useState(false);
  const [revertProgress, setRevertProgress] = useState(0);

  const getValueFromRow = (row: string[], fieldMapping: string) => {
    if (!fieldMapping) return null;
    const idx = importHeaders.indexOf(fieldMapping);
    if (idx === -1) return null;
    return row[idx] || null;
  };

  const createLeadFromRow = (row: string[], batchTimestamp?: number): Lead => {
    const getValue = (fieldMapping: string) => {
      if (!fieldMapping) return null;
      const idx = importHeaders.indexOf(fieldMapping);
      if (idx === -1) return null;
      return row[idx] || null;
    };

    // Calculate rating
    let ratingVal: number | null = null;
    const rawRating = getValue(importMapping.rating);
    if (rawRating) {
      const parsed = parseFloat(rawRating);
      if (!isNaN(parsed)) ratingVal = parsed;
    }

    // reviewsCount
    let reviewsCountVal: number | null = null;
    const rawReviews = getValue(importMapping.reviewsCount);
    if (rawReviews) {
      const parsed = parseInt(rawReviews, 10);
      if (!isNaN(parsed)) reviewsCountVal = parsed;
    }

    // status
    let statusVal: Lead['status'] = 'new';
    if (importMapping.status.startsWith('static:')) {
      statusVal = importMapping.status.split(':')[1] as Lead['status'];
    } else {
      const colVal = getValue(importMapping.status);
      if (colVal) {
        const cleaned = colVal.toLowerCase().trim();
        if (['new', 'contacted', 'replied', 'interested', 'closed'].includes(cleaned)) {
          statusVal = cleaned as Lead['status'];
        }
      }
    }

    // serviceType
    let serviceTypeVal: Lead['serviceType'] = 'web_design';
    if (importMapping.serviceType.startsWith('static:')) {
      serviceTypeVal = importMapping.serviceType.split(':')[1] as Lead['serviceType'];
    } else {
      const colVal = getValue(importMapping.serviceType);
      if (colVal) {
        const cleaned = colVal.toLowerCase().trim();
        if (cleaned.includes('ai') || cleaned.includes('automation')) {
          serviceTypeVal = 'ai_automation';
        } else if (cleaned.includes('hybrid') || cleaned.includes('bundle')) {
          serviceTypeVal = 'hybrid';
        } else {
          serviceTypeVal = 'web_design';
        }
      }
    }

    // digitalPresenceScore
    let presenceScoreVal = 50;
    if (importMapping.digitalPresenceScore.startsWith('static:')) {
      presenceScoreVal = parseInt(importMapping.digitalPresenceScore.split(':')[1], 10) || 50;
    } else {
      const colVal = getValue(importMapping.digitalPresenceScore);
      if (colVal) {
        const parsed = parseInt(colVal, 10);
        if (!isNaN(parsed)) presenceScoreVal = parsed;
      }
    }

    const businessName = getValue(importMapping.name) || 'Unnamed Prospect';
    const categoryVal = getValue(importMapping.category) || 'Local Business';
    const websiteVal = getValue(importMapping.website) || null;
    const phoneVal = getValue(importMapping.phone) || null;
    const addressVal = getValue(importMapping.address) || 'Unknown Location';
    const notesVal = getValue(importMapping.notes) || 'Imported via CSV file.';

    const batchTag = batchTimestamp ? `import-batch-${batchTimestamp}` : null;
    const baseTags = websiteVal ? ['Has Website', 'Imported'] : ['No Website', 'Imported'];
    const finalTags = batchTag ? [...baseTags, batchTag] : baseTags;

    const newLead: Lead = {
      id: `lead-import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: businessName.trim(),
      category: categoryVal.trim(),
      phone: phoneVal ? phoneVal.trim() : null,
      address: addressVal.trim(),
      rating: ratingVal,
      reviewsCount: reviewsCountVal,
      website: websiteVal ? websiteVal.trim() : null,
      mapsUrl: `https://maps.google.com/?q=${encodeURIComponent(businessName.trim() + ' ' + addressVal.trim())}`,
      latitude: null,
      longitude: null,
      status: statusVal,
      notes: notesVal.trim(),
      tags: finalTags,
      serviceType: serviceTypeVal,
      digitalPresenceScore: presenceScoreVal,
      createdAt: new Date().toISOString()
    };

    return newLead;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setCsvParseError(null);
    setImportResults(null);
    setPreviewRowIndex(0);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          throw new Error("File is empty.");
        }
        const lines = parseCSV(text);
        if (lines.length < 2) {
          throw new Error("CSV must contain at least a header row and one data row.");
        }

        const headers = lines[0];
        const rows = lines.slice(1);

        setImportHeaders(headers);
        setImportRows(rows);
        
        // Auto-detect mappings
        const detected = autoDetectMapping(headers);
        setImportMapping(detected);

        // Open the mapping dialog modal
        setIsImportModalOpen(true);
      } catch (err: any) {
        setCsvParseError(err.message || "Failed to parse CSV file content.");
        setIsImportModalOpen(true); // Open modal to show error
      }
    };
    reader.readAsText(file);
    // Reset file input so same file can be uploaded again
    e.target.value = '';
  };

  const handleExecuteImport = async () => {
    if (importRows.length === 0) return;
    setIsImporting(true);
    setImportProgress(0);
    setImportTotal(importRows.length);
    setImportCurrentIndex(0);
    
    let successCount = 0;
    let failedCount = 0;
    const batchTimestamp = Date.now();

    for (let i = 0; i < importRows.length; i++) {
      const row = importRows[i];
      // Skip empty row or row with empty name
      const nameVal = getValueFromRow(row, importMapping.name);
      if (!nameVal || !nameVal.trim()) {
        failedCount++;
        continue;
      }

      setImportCurrentIndex(i + 1);
      setImportProgress(Math.round(((i + 1) / importRows.length) * 100));

      const lead = createLeadFromRow(row, batchTimestamp);
      try {
        const success = await onAddLead(lead);
        if (success) {
          successCount++;
        } else {
          failedCount++;
        }
      } catch (err) {
        console.error("Failed to import row:", row, err);
        failedCount++;
      }
      
      // Gentle pause to allow the progress bar to animate nicely and prevent server throttling
      await new Promise(resolve => setTimeout(resolve, 30));
    }

    setImportResults({ success: successCount, failed: failedCount });
    setIsImporting(false);
  };

  // Analyze leads and return information about the latest imported batch
  const getLatestImportBatch = () => {
    if (!leads || leads.length === 0) return null;
    const batchLeadsMap: Record<string, { timestamp: number; leads: Lead[] }> = {};
    
    leads.forEach(lead => {
      const batchTag = lead.tags?.find(t => t.startsWith('import-batch-'));
      if (batchTag) {
        const timestampStr = batchTag.replace('import-batch-', '');
        const timestamp = parseInt(timestampStr, 10);
        if (!isNaN(timestamp)) {
          if (!batchLeadsMap[batchTag]) {
            batchLeadsMap[batchTag] = { timestamp, leads: [] };
          }
          batchLeadsMap[batchTag].leads.push(lead);
        }
      }
    });

    const batchKeys = Object.keys(batchLeadsMap);
    if (batchKeys.length === 0) return null;

    // Find the newest batch
    let newestKey = batchKeys[0];
    let newestTimestamp = batchLeadsMap[newestKey].timestamp;

    for (let i = 1; i < batchKeys.length; i++) {
      const key = batchKeys[i];
      if (batchLeadsMap[key].timestamp > newestTimestamp) {
        newestKey = key;
        newestTimestamp = batchLeadsMap[key].timestamp;
      }
    }

    return {
      batchTag: newestKey,
      timestamp: newestTimestamp,
      leads: batchLeadsMap[newestKey].leads
    };
  };

  const latestBatch = getLatestImportBatch();

  const handleRevertLastImport = async () => {
    if (!latestBatch) return;
    const batchTime = new Date(latestBatch.timestamp).toLocaleString();
    const count = latestBatch.leads.length;
    
    const confirmMessage = `⚠️ REVERT CSV IMPORT ⚠️\n\nAre you sure you want to permanently delete all ${count} prospects imported on ${batchTime}?\n\nThis will remove them from the pipeline completely and cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsRevertingBatch(true);
    setRevertProgress(0);
    
    let deletedCount = 0;
    try {
      for (let i = 0; i < latestBatch.leads.length; i++) {
        const lead = latestBatch.leads[i];
        await onDeleteLead(lead.id);
        deletedCount++;
        setRevertProgress(Math.round(((i + 1) / latestBatch.leads.length) * 100));
        // Pause slightly to let states sync gracefully
        await new Promise(resolve => setTimeout(resolve, 20));
      }
    } catch (err) {
      console.error("Failed to fully revert import:", err);
    } finally {
      setIsRevertingBatch(false);
      setRevertProgress(0);
    }
  };

  // Helper helper to calculate revenue potential
  const getRevenuePotential = (l: Lead) => {
    switch (l.serviceType) {
      case 'web_design': return 1500;
      case 'ai_automation': return 2500;
      case 'hybrid': return 4000;
      default: return 0;
    }
  };

  // Perform sorting across our leads database
  const sortedLeads = [...leads].sort((a, b) => {
    let comp = 0;
    if (sortBy === 'date_added') {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      comp = timeA - timeB;
    } else if (sortBy === 'digital_maturity') {
      const scoreA = a.digitalPresenceScore || 0;
      const scoreB = b.digitalPresenceScore || 0;
      comp = scoreA - scoreB;
    } else if (sortBy === 'revenue_potential') {
      comp = getRevenuePotential(a) - getRevenuePotential(b);
    }
    return sortOrder === 'asc' ? comp : -comp;
  });

  // Define column properties with beautiful cohesive light theme aesthetics
  const COLUMNS: { id: Lead['status']; label: string; shortLabel: string; emoji: string; color: string; badgeColor: string; headerColor: string; indicatorColor: string }[] = [
    { 
      id: 'new', 
      label: 'New Opportunities', 
      shortLabel: 'New', 
      emoji: '🆕', 
      color: 'border-slate-205 border-slate-200 bg-slate-50/40', 
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200/80',
      headerColor: 'border-slate-200/80 bg-slate-50/40',
      indicatorColor: 'bg-slate-400'
    },
    { 
      id: 'contacted', 
      label: 'Outreach Sent', 
      shortLabel: 'Outreach', 
      emoji: '🔄', 
      color: 'border-amber-200/60 bg-amber-50/30', 
      badgeColor: 'bg-amber-100/80 text-amber-800 border-amber-200/60',
      headerColor: 'border-amber-200/50 bg-amber-50/10',
      indicatorColor: 'bg-amber-500'
    },
    { 
      id: 'replied', 
      label: 'Replied Back', 
      shortLabel: 'Replied', 
      emoji: '💬', 
      color: 'border-purple-200/60 bg-purple-50/30', 
      badgeColor: 'bg-purple-100/80 text-purple-750 text-purple-705 text-purple-700 border-purple-200/60',
      headerColor: 'border-purple-200/50 bg-purple-50/10',
      indicatorColor: 'bg-purple-500'
    },
    { 
      id: 'interested', 
      label: 'Meeting Booked', 
      shortLabel: 'Meeting', 
      emoji: '🔥', 
      color: 'border-emerald-200/60 bg-emerald-50/30', 
      badgeColor: 'bg-emerald-100/80 text-emerald-800 border-emerald-200/60',
      headerColor: 'border-emerald-200/50 bg-emerald-50/10',
      indicatorColor: 'bg-emerald-500'
    },
    { 
      id: 'closed', 
      label: 'Closed Won', 
      shortLabel: 'Closed', 
      emoji: '💼', 
      color: 'border-blue-200/70 bg-blue-50/40', 
      badgeColor: 'bg-blue-100/70 text-blue-800 border-blue-200/60',
      headerColor: 'border-blue-200/50 bg-blue-50/10',
      indicatorColor: 'bg-blue-600'
    }
  ];

  const getServiceLabel = (type: Lead['serviceType']) => {
    switch (type) {
      case 'web_design': return { text: '🎨 Web Design Offer', style: 'text-amber-800 bg-amber-50 border-amber-200/50' };
      case 'ai_automation': return { text: '🤖 AI Automation', style: 'text-sky-700 bg-sky-50 border-sky-200/50' };
      case 'hybrid': return { text: '💠 Hybrid Bundle', style: 'text-indigo-700 bg-indigo-50 border-indigo-200/50' };
    }
  };

  const handleMove = (item: Lead, direction: 'left' | 'right') => {
    const sequence: Lead['status'][] = ['new', 'contacted', 'replied', 'interested', 'closed'];
    const idx = sequence.indexOf(item.status);
    let nextIdx = idx;

    if (direction === 'left' && idx > 0) nextIdx -= 1;
    if (direction === 'right' && idx < sequence.length - 1) nextIdx += 1;

    if (nextIdx !== idx) {
      onUpdateStatus(item.id, sequence[nextIdx]);
    }
  };

  const handleSaveName = async (item: Lead) => {
    const trimmed = editingNameValue.trim();
    if (trimmed && trimmed !== item.name) {
      const updatedLead: Lead = {
        ...item,
        name: trimmed
      };
      if (onUpdateLead) {
        await onUpdateLead(updatedLead);
      }
    }
    setEditingLeadId(null);
  };

  const handleExportToCsv = () => {
    if (sortedLeads.length === 0) return;

    // Define CSV Headers
    const headers = [
      'ID',
      'Business Name',
      'Category',
      'Status',
      'Service Offer',
      'Revenue Potential ($)',
      'Digital Presence Score (%)',
      'Website',
      'Phone',
      'Address',
      'Rating',
      'Reviews Count',
      'Google Maps URL',
      'Date Added',
      'Internal Notes'
    ];

    // Map sorted leads to rows
    const rows = sortedLeads.map(l => {
      const revenue = getRevenuePotential(l);
      const serviceText = getServiceLabel(l.serviceType)?.text || l.serviceType;

      return [
        l.id,
        l.name,
        l.category,
        l.status,
        serviceText,
        revenue,
        l.digitalPresenceScore || 0,
        l.website || '',
        l.phone || '',
        l.address || '',
        l.rating || '',
        l.reviewsCount || '',
        l.mapsUrl || '',
        l.createdAt || '',
        (l.notes || '').replace(/\r?\n/g, ' ')
      ].map(val => {
        const stringVal = String(val);
        if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
          return `"${stringVal.replace(/"/g, '""')}"`;
        }
        return stringVal;
      });
    });

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `crm_pipeline_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSubmitQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLeadForm.name.trim()) {
      setValidationError("Business name is required.");
      return;
    }
    if (!quickLeadForm.category.trim()) {
      setValidationError("Category (e.g. Clinic, Cafe) is required.");
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    // If website is set, score is higher. Else lower defaults.
    const hasWeb = quickLeadForm.website.trim().length > 0;
    const computedScore = hasWeb ? 65 : 30;

    // Convert comma-separated tags to array or use default fallback tags
    const tags = quickLeadForm.tagsRaw
      ? quickLeadForm.tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
      : (hasWeb ? ["Has Website", "Custom Input"] : ["No Website", "Manual Flow", "Custom Input"]);

    const newLead: Lead = {
      id: `lead-quick-${Date.now()}`,
      name: quickLeadForm.name.trim(),
      category: quickLeadForm.category.trim(),
      phone: quickLeadForm.phone.trim() || null,
      address: quickLeadForm.address.trim() || 'Offline Address',
      rating: quickLeadForm.rating ? parseFloat(quickLeadForm.rating) : null,
      reviewsCount: quickLeadForm.reviewsCount ? parseInt(quickLeadForm.reviewsCount) : null,
      website: quickLeadForm.website.trim() || null,
      mapsUrl: `https://maps.google.com/?q=${encodeURIComponent(quickLeadForm.name.trim())}`,
      latitude: null,
      longitude: null,
      status: activeQuickAdd!,
      notes: quickLeadForm.notes.trim() || 'Manually added to CRM pipeline.',
      tags: tags,
      serviceType: quickLeadForm.serviceType,
      digitalPresenceScore: computedScore,
      createdAt: new Date().toISOString()
    };

    if (onAddLead) {
      const success = await onAddLead(newLead);
      if (success) {
        // Reset states
        setQuickLeadForm({
          name: '',
          category: '',
          website: '',
          serviceType: 'web_design',
          phone: '',
          address: '',
          rating: '',
          reviewsCount: '',
          notes: '',
          tagsRaw: ''
        });
        setActiveQuickAdd(null);
      } else {
        setValidationError("Failed to add lead. This business name may already exist in your CRM.");
      }
    }
    setIsSubmitting(false);
  };

  return (
    <div id="crm-pipeline-matrix" className="space-y-4">
      {/* Revert last import batch processing loader banner */}
      <AnimatePresence>
        {isRevertingBatch && (
          <motion.div
            id="crm-revert-processing-banner"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between text-zinc-900 leading-normal"
          >
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9 flex items-center justify-center bg-rose-100 rounded-full border border-rose-200">
                <Trash2 className="h-4 w-4 text-rose-600 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-sans font-black text-rose-900 uppercase tracking-wider">Reverting Last Import Batch</h4>
                <p className="text-[10.5px] text-rose-700">Deleting imported customer prospects and purging pipeline entries ({revertProgress}% completed)...</p>
              </div>
            </div>
            <div className="w-32 bg-rose-100 rounded-full h-2 overflow-hidden border border-rose-200">
              <div className="bg-rose-600 h-full transition-all duration-200 ease-out" style={{ width: `${revertProgress}%` }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Short Pipeline Summary stats row / Sort Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-zinc-200/80 px-4 py-3 rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-blue-600" />
          <span className="text-xs font-sans font-bold text-zinc-700 tracking-wide uppercase">Pipeline Deal Progression</span>
        </div>
        
        <div id="crm-sort-controls" className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto">
          {leads.length > 0 && (
            <>
              {/* Column Multi-Select Status Filter */}
              <div className="relative">
                <button
                  id="crm-column-filter-btn"
                  type="button"
                  onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-705 text-zinc-700 hover:text-zinc-900 transition-all text-[11px] font-sans font-bold uppercase cursor-pointer tracking-wider shadow-xs"
                  title="Filter Pipeline stage columns"
                >
                  <Filter className="h-3.5 w-3.5 text-blue-600" />
                  <span>Stages:</span>
                  <span className="bg-blue-50 text-blue-700 px-1.5 py-px rounded text-[10px] font-mono leading-none border border-blue-200/80 font-black">
                    {visibleColumns.length}/5
                  </span>
                  <ChevronDown className={`h-3 w-3 text-zinc-400 transition-transform duration-200 ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isFilterDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsFilterDropdownOpen(false)} 
                    />
                    
                    <div className="absolute right-0 mt-1.5 w-56 rounded-xl border border-zinc-200 bg-white py-2 shadow-xl z-20 animate-fade-in">
                      <div className="px-3 py-1.5 border-b border-zinc-150 flex items-center justify-between text-[9px] font-sans font-black text-zinc-400 uppercase tracking-widest bg-zinc-50">
                        <span>Column Visibility</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setVisibleColumns(['new', 'contacted', 'replied', 'interested', 'closed'])}
                            className="text-[9px] font-bold text-blue-600 hover:text-blue-700 uppercase cursor-pointer hover:underline"
                          >
                            all
                          </button>
                          <span className="text-zinc-300 font-normal">|</span>
                          <button
                            type="button"
                            onClick={() => setVisibleColumns(['contacted', 'replied', 'interested'])}
                            className="text-[9px] font-bold text-amber-600 hover:text-amber-700 uppercase cursor-pointer hover:underline"
                            title="Hide New opportunities and Closed Won stages"
                          >
                            active
                          </button>
                        </div>
                      </div>

                      <div className="p-1.5 space-y-0.5 animate-fade-in">
                        {COLUMNS.map((col) => {
                          const isChecked = visibleColumns.includes(col.id);
                          return (
                            <button
                              key={col.id}
                              type="button"
                              onClick={() => {
                                if (isChecked) {
                                  if (visibleColumns.length > 1) {
                                    setVisibleColumns(visibleColumns.filter(id => id !== col.id));
                                  }
                                } else {
                                    setVisibleColumns([...visibleColumns, col.id]);
                                }
                              }}
                              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[10.5px] font-sans font-medium transition-colors hover:bg-zinc-50 text-left cursor-pointer text-zinc-700 hover:text-zinc-950"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs select-none">{col.emoji}</span>
                                <span className="font-sans font-semibold text-zinc-800">{col.shortLabel}</span>
                              </div>
                              <div className={`h-4 w-4 rounded border flex items-center justify-center transition-all shadow-xs ${isChecked ? 'bg-blue-600 border-blue-500 text-white' : 'border-zinc-200 bg-white'}`}>
                                {isChecked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="h-4 w-px bg-zinc-200 self-center hidden sm:block" />

              <span className="text-[10px] text-zinc-400 font-sans font-bold uppercase tracking-wider">Sort List:</span>
              
              <div className="relative">
                <select
                  id="crm-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none bg-white border border-zinc-200 rounded-lg px-3 py-1.5 pr-8 text-[11px] font-medium text-zinc-700 hover:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50 cursor-pointer"
                >
                  <option value="date_added">📅 Date Added</option>
                  <option value="digital_maturity">📊 Digital Maturity</option>
                  <option value="revenue_potential">💰 Revenue Potential</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
                  <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>

              <button
                id="crm-sort-order-btn"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="flex items-center justify-center p-1.5 rounded-lg bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-500 hover:text-zinc-90 w-fit transition-colors cursor-pointer text-xs gap-1 px-2.5"
                title={sortOrder === 'asc' ? 'Ascending Order' : 'Descending Order'}
              >
                <ArrowUpDown className="h-3 w-3 text-blue-600" />
                <span className="text-[9px] uppercase font-mono font-bold text-zinc-600">{sortOrder}</span>
              </button>
            </>
          )}

          {/* Import CSV Trigger Controls (Always Accessible) */}
          <input
            type="file"
            id="crm-csv-import-file-input"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          
          <button
            id="crm-header-import-csv-btn"
            type="button"
            onClick={() => document.getElementById('crm-csv-import-file-input')?.click()}
            className="flex items-center justify-center p-1.5 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 text-emerald-750 text-emerald-700 hover:text-emerald-800 transition-all cursor-pointer text-xs gap-1.5 border-dashed"
            title="Import prospects from a CSV spreadsheet file"
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="text-[9px] uppercase font-bold tracking-wider">Import CSV</span>
          </button>

          {latestBatch && (
            <button
              id="crm-revert-last-import-btn"
              type="button"
              disabled={isRevertingBatch}
              onClick={handleRevertLastImport}
              className="flex items-center justify-center p-1.5 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 text-rose-750 text-rose-700 hover:text-rose-800 transition-all cursor-pointer text-xs gap-1.5 border-dashed disabled:opacity-40"
              title={`Permanent rollback for all ${latestBatch.leads.length} leads imported on ${new Date(latestBatch.timestamp).toLocaleString()}`}
            >
              <Trash2 className={`h-3.5 w-3.5 text-rose-600 ${isRevertingBatch ? 'animate-pulse' : ''}`} />
              <span className="text-[9px] uppercase font-bold tracking-wider">
                {isRevertingBatch ? `Reverting (${revertProgress}%)` : `Revert Last Import (${latestBatch.leads.length})`}
              </span>
            </button>
          )}

          {leads.length > 0 && (
            <button
              id="crm-export-csv-btn"
              onClick={handleExportToCsv}
              className="flex items-center justify-center p-1.5 px-2.5 rounded-lg bg-blue-50/50 hover:bg-blue-55 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 text-blue-700 hover:text-blue-800 transition-all duration-155 cursor-pointer text-xs gap-1.5 border-dashed"
              title="Export all sorted leads to CSV"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="text-[9px] uppercase font-bold tracking-wider">Export to CSV</span>
            </button>
          )}
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-14 text-center bg-white border border-zinc-200/80 rounded-xl shadow-xs">
          <CalendarRange className="h-10 w-10 text-zinc-300 mb-3 animate-pulse" />
          <h4 className="text-sm font-semibold text-zinc-900">Your Deal CRM is empty</h4>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm">
            Upload a local prospect list or search for local businesses in the "Search Leads" tab, check digital deficits, and build your pipeline.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-5">
            <button
              type="button"
              onClick={() => {
                setActiveQuickAdd('new');
                setValidationError(null);
              }}
              className="px-4 py-2 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-500 hover:shadow-md rounded-lg border border-blue-600/20 cursor-pointer flex items-center gap-1.5 uppercase tracking-wide transition-all"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Quick Add Custom Lead
            </button>
            <span className="text-[10px] text-zinc-400 font-bold uppercase select-none">or</span>
            <button
              type="button"
              onClick={() => document.getElementById('crm-csv-import-file-input')?.click()}
              className="px-4 py-2 text-[11px] font-bold text-zinc-700 hover:text-zinc-900 bg-emerald-50 hover:bg-emerald-100 hover:shadow-sm rounded-lg border border-emerald-200 cursor-pointer flex items-center gap-1.5 uppercase tracking-wide transition-all"
            >
              <Upload className="h-3.5 w-3.5 text-emerald-600 animate-bounce" />
              Upload Prospects CSV
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Quick Stage Visibility & Column Selection Row (Multi-Select Filter) */}
          <div id="crm-quick-status-filter" className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[10px] text-zinc-500 font-sans font-bold uppercase tracking-wider">Visible Stage Columns:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {COLUMNS.map((col) => {
                  const isChecked = visibleColumns.includes(col.id);
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          if (visibleColumns.length > 1) {
                            setVisibleColumns(visibleColumns.filter(id => id !== col.id));
                          }
                        } else {
                          setVisibleColumns([...visibleColumns, col.id]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-full text-[10.5px] font-semibold font-sans flex items-center gap-2 border cursor-pointer transition-all hover:scale-102 active:scale-98 ${
                        isChecked 
                          ? 'bg-blue-50 text-blue-700 border-blue-200/60 font-bold shadow-xs' 
                          : 'bg-zinc-50 text-zinc-500 border-zinc-205 border-zinc-200 hover:bg-zinc-100 hover:text-zinc-700'
                      }`}
                      title={`${isChecked ? 'Hide' : 'Show'} status column: ${col.label}`}
                    >
                      <span className="text-xs select-none">{col.emoji}</span>
                      <span>{col.shortLabel}</span>
                      <span className={`inline-block h-1.5 w-1.5 rounded-full transition-colors duration-150 ${isChecked ? 'bg-blue-600' : 'bg-transparent'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Presets list */}
            <div className="flex items-center gap-2 font-sans">
              <span className="text-[10px] text-zinc-500 font-sans font-bold uppercase tracking-wider">Quick Presets:</span>
              <div className="flex items-center bg-zinc-50 border border-zinc-200 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setVisibleColumns(['new', 'contacted', 'replied', 'interested', 'closed'])}
                  className={`px-2.5 py-0.5 rounded text-[9px] font-sans font-extrabold uppercase tracking-wide transition-all cursor-pointer ${visibleColumns.length === 5 ? 'bg-blue-50 text-blue-700 border border-blue-100 font-black' : 'text-zinc-500 hover:text-zinc-800'}`}
                >
                  Show All (5)
                </button>
                <div className="h-3.5 w-px bg-zinc-200 mx-1.5" />
                <button
                  type="button"
                  onClick={() => setVisibleColumns(['contacted', 'replied', 'interested'])}
                  className={`px-2.5 py-0.5 rounded text-[9px] font-sans font-extrabold uppercase tracking-wide transition-all cursor-pointer ${visibleColumns.length === 3 && !visibleColumns.includes('new') && !visibleColumns.includes('closed') ? 'bg-amber-50 text-amber-700 border border-amber-150 font-black' : 'text-zinc-500 hover:text-zinc-800'}`}
                  title="Hide 'New' prospects and 'Closed Won' stages to focus strictly on active engagements"
                >
                  Active Only
                </button>
              </div>
            </div>
          </div>

          <div 
            id="crm-pipeline-matrix"
            className="grid gap-3.5 items-start overflow-x-auto pb-4"
            style={{
              gridTemplateColumns: `repeat(${visibleColumns.length}, minmax(210px, 1fr))`
            }}
          >
            {COLUMNS.filter(col => visibleColumns.includes(col.id)).map((column) => {
            const columnLeads = sortedLeads.filter(l => l.status === column.id);

            return (
              <div key={column.id} className="flex flex-col space-y-2.5 min-w-[210px] first:ml-0">
                {/* Clearly Visible Stage Header above each status column */}
                <div className={`flex items-center justify-between px-3.5 py-3 border rounded-xl select-none relative overflow-hidden bg-white shadow-xs ${column.headerColor}`}>
                  {/* Color accent bar on left */}
                  <div className={`absolute top-0 bottom-0 left-0 w-[4px] ${column.indicatorColor}`} />
                  <div className="flex items-center gap-2 truncate pl-1">
                    <span className="text-xs select-none shrink-0">{column.emoji}</span>
                    <h4 className="text-[11px] font-extrabold text-zinc-900 tracking-wider font-sans uppercase">
                      {column.shortLabel}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveQuickAdd(column.id);
                        setQuickLeadForm({
                          name: '',
                          category: '',
                          website: '',
                          serviceType: 'web_design',
                          phone: '',
                          address: '',
                          rating: '',
                          reviewsCount: '',
                          notes: '',
                          tagsRaw: ''
                        });
                        setValidationError(null);
                      }}
                      className="p-1 rounded bg-white border border-zinc-200 hover:border-zinc-350 hover:bg-zinc-50 text-zinc-500 hover:text-blue-600 transition-all cursor-pointer flex items-center justify-center shadow-xs"
                      title={`Quick Add Lead to ${column.label}`}
                    >
                      <Plus className="h-3 w-3 text-blue-600 hover:text-blue-700" />
                    </button>
                    <span className={`h-4.5 px-2 flex items-center justify-center rounded text-[9.5px] font-mono leading-none font-black border ${column.badgeColor}`}>
                      {columnLeads.length}
                    </span>
                  </div>
                </div>

                {/* Status Column Container */}
                <div
                  className={`rounded-xl border p-3 flex flex-col min-h-[520px] transition-all duration-300 ${column.color}`}
                >
                  {/* Column Detail Head */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-zinc-200 mb-3 select-none">
                    <span className="text-[9px] font-mono tracking-wider font-bold text-zinc-400 uppercase">
                      {column.label}
                    </span>
                    
                    <button
                      id={`crm-quick-add-${column.id}`}
                      onClick={() => {
                        setActiveQuickAdd(column.id);
                        setQuickLeadForm({
                          name: '',
                          category: '',
                          website: '',
                          serviceType: 'web_design',
                          phone: '',
                          address: '',
                          rating: '',
                          reviewsCount: '',
                          notes: '',
                          tagsRaw: ''
                        });
                        setValidationError(null);
                      }}
                      className="p-1 rounded bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer flex items-center justify-center shadow-xs"
                      title={`Quick Add Lead to ${column.label}`}
                    >
                      <PlusCircle className="h-3.5 w-3.5 text-blue-600 hover:text-blue-705" />
                    </button>
                  </div>

                  {/* Cards rendering */}
                  <div className="flex-1 space-y-2.5">
                    <AnimatePresence mode="popLayout">
                      {columnLeads.length === 0 ? (
                        <motion.div
                          key={`empty-${column.id}`}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-zinc-200/80 rounded-lg bg-zinc-50/20"
                        >
                          <span className="text-[10px] text-zinc-400 italic">Empty Stage</span>
                        </motion.div>
                      ) : (
                        columnLeads.map((item) => {
                          const service = getServiceLabel(item.serviceType);
                          return (
                            <motion.div
                              layout
                              layoutId={item.id}
                              key={item.id}
                              initial={{ opacity: 0, scale: 0.95, y: 5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              whileHover={{ y: -3, scale: 1.015 }}
                              exit={{ opacity: 0, scale: 0.95, y: -5 }}
                              transition={{
                                type: "spring",
                                stiffness: 380,
                                damping: 30,
                                layout: { duration: 0.3, type: "spring" }
                              }}
                              className="group relative flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-3.5 hover:border-zinc-300 transition-all duration-150 shadow-xs hover:shadow-md cursor-pointer"
                            >
                              <div onClick={() => {
                                if (editingLeadId !== item.id) {
                                  onSelectLead(item);
                                }
                              }} className="space-y-1.5 animate-fade-in animate-duration-150">
                                <div className="flex items-start justify-between min-h-[22px]">
                                  {editingLeadId === item.id ? (
                                    <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        id={`crm-quick-edit-input-${item.id}`}
                                        type="text"
                                        value={editingNameValue}
                                        onChange={(e) => setEditingNameValue(e.target.value)}
                                        onKeyDown={async (e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            await handleSaveName(item);
                                          } else if (e.key === 'Escape') {
                                            e.preventDefault();
                                            setEditingLeadId(null);
                                          }
                                        }}
                                        onBlur={() => handleSaveName(item)}
                                        className="flex-1 text-[11px] font-bold text-zinc-900 border border-blue-500 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                        autoFocus
                                      />
                                      <div className="flex items-center gap-0.5 shrink-0">
                                        <button
                                          type="button"
                                          onMouseDown={(e) => {
                                            // Ensure this runs before onBlur can cancel/trigger blur on the input
                                            e.preventDefault();
                                          }}
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            await handleSaveName(item);
                                          }}
                                          className="p-1 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors cursor-pointer"
                                          title="Save changes"
                                        >
                                          <Check className="h-2.5 w-2.5 font-bold" />
                                        </button>
                                        <button
                                          type="button"
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingLeadId(null);
                                          }}
                                          className="p-1 text-zinc-500 hover:text-rose-600 bg-zinc-50 hover:bg-rose-50 rounded border border-zinc-200 transition-colors cursor-pointer"
                                          title="Cancel"
                                        >
                                          <X className="h-2.5 w-2.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between w-full group/header">
                                      <h4 className="text-[11.5px] font-bold text-zinc-900 truncate max-w-[80%] group-hover:text-blue-600 transition-colors" title={item.name}>
                                        {item.name}
                                      </h4>
                                      <button
                                        id={`crm-quick-edit-btn-${item.id}`}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingLeadId(item.id);
                                          setEditingNameValue(item.name);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-zinc-100 rounded text-zinc-400 hover:text-blue-600 transition-all cursor-pointer"
                                        title="Quick edit lead name"
                                      >
                                        <Pencil className="h-2.5 w-2.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                <p className="text-[9.5px] text-zinc-450 text-zinc-500 font-mono truncate">{item.category}</p>

                                <div className="flex items-center justify-between pt-1">
                                  <span className={`rounded-sm px-1.5 py-px text-[8.5px] font-bold border ${service.style}`}>
                                    {service.text}
                                  </span>
                                  
                                  <div className="flex items-center gap-1 text-[9px] font-bold font-mono text-zinc-505 text-zinc-500">
                                    <span className={`h-1.5 w-1.5 rounded-full ${item.website ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></span>
                                    <span>{item.digitalPresenceScore}%</span>
                                  </div>
                                </div>

                                {item.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 pt-1.5">
                                    {item.tags.slice(0, 2).map((tg) => (
                                      <span key={tg} className="text-[8.5px] rounded bg-zinc-50 px-1 py-px text-zinc-500 border border-zinc-200/50 font-mono">
                                        {tg}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Quick Card status controllers */}
                              <div className="border-t border-zinc-100 mt-3 pt-2.5 flex items-center justify-between shrink-0 select-none">
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMove(item, 'left');
                                    }}
                                    disabled={item.status === 'new'}
                                    className="p-1 rounded bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                                  >
                                    <ArrowLeft className="h-2.5 w-2.5" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMove(item, 'right');
                                    }}
                                    disabled={item.status === 'closed'}
                                    className="p-1 rounded bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                                  >
                                    <ArrowRight className="h-2.5 w-2.5" />
                                  </button>
                                </div>

                                <button
                                  id={`crm-card-summarize-${item.id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenSummaryPopup(item);
                                  }}
                                  className="p-1 px-1.5 rounded bg-blue-50 border border-blue-200 hover:bg-blue-100/80 text-blue-700 hover:text-blue-800 transition-colors cursor-pointer flex items-center gap-1.5 text-[8.5px] font-sans font-bold shadow-xs uppercase tracking-wide"
                                  title={`AI Summarize status and notes for ${item.name}`}
                                >
                                  <Sparkles className="h-2.5 w-2.5 text-blue-600 animate-pulse" />
                                  <span>SUMMARIZE</span>
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`Remove "${item.name}" from CRM pipeline?`)) {
                                      onDeleteLead(item.id);
                                    }
                                  }}
                                  className="p-1 rounded hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer border border-transparent"
                                >
                                  <Trash2 className="h-2.5 w-2.5" />
                                </button>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}

      {/* Simplified Custom Quick Add CRM Lead Modal overlay */}
      {activeQuickAdd && (
        <div id="crm-quick-add-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
          <div id="crm-quick-add-modal-container" className="relative w-full max-w-md rounded-xl border border-zinc-200 bg-white shadow-2xl overflow-hidden my-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-150 px-5 py-4 bg-zinc-55 bg-zinc-50/80">
              <div className="flex items-center gap-1.5">
                <PlusCircle className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-sans font-bold text-zinc-800 uppercase tracking-wider">
                  Quick Add Lead to {COLUMNS.find(c => c.id === activeQuickAdd)?.label}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveQuickAdd(null);
                  setValidationError(null);
                }}
                className="p-1 rounded bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-800 hover:border-zinc-300 transition-all cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitQuickAdd} className="p-5 space-y-3 pb-6 bg-white">
              {validationError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-[10px] text-rose-600 flex items-start gap-1.5 animate-fade-in">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-sans font-bold text-zinc-500 uppercase tracking-wide">Business Name <span className="text-blue-500 font-bold">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Health Clinic"
                  value={quickLeadForm.name}
                  onChange={(e) => setQuickLeadForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-850 text-zinc-805 text-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500/50 hover:border-zinc-300 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-sans font-bold text-zinc-500 uppercase tracking-wide">Category <span className="text-blue-500 font-bold">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Clinic, Restaurant"
                    value={quickLeadForm.category}
                    onChange={(e) => setQuickLeadForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500/50 hover:border-zinc-300 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-sans font-bold text-zinc-500 uppercase tracking-wide">Service Proposal</label>
                  <select
                    value={quickLeadForm.serviceType}
                    onChange={(e) => setQuickLeadForm(prev => ({ ...prev, serviceType: e.target.value as any }))}
                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500/50 hover:border-zinc-300 transition cursor-pointer"
                  >
                    <option value="web_design">🎨 Web Design Offer</option>
                    <option value="ai_automation">🤖 AI Automation</option>
                    <option value="hybrid">💠 Hybrid Bundle</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-sans font-bold text-zinc-500 uppercase tracking-wide">Website URL (Optional)</label>
                <input
                  type="url"
                  placeholder="e.g. https://www.example.com"
                  value={quickLeadForm.website}
                  onChange={(e) => setQuickLeadForm(prev => ({ ...prev, website: e.target.value }))}
                  className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500/50 hover:border-zinc-300 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-sans font-bold text-zinc-500 uppercase tracking-wide">Phone (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. +233 24 123 456"
                    value={quickLeadForm.phone}
                    onChange={(e) => setQuickLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500/50 hover:border-zinc-300 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-sans font-bold text-zinc-500 uppercase tracking-wide">Address (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Ikeja, Lagos"
                    value={quickLeadForm.address}
                    onChange={(e) => setQuickLeadForm(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500/50 hover:border-zinc-300 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-sans font-bold text-zinc-500 uppercase tracking-wide">Rating (optional)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    placeholder="e.g. 4.2"
                    value={quickLeadForm.rating}
                    onChange={(e) => setQuickLeadForm(prev => ({ ...prev, rating: e.target.value }))}
                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500/50 hover:border-zinc-300 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-sans font-bold text-zinc-500 uppercase tracking-wide">Reviews (optional)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 55"
                    value={quickLeadForm.reviewsCount}
                    onChange={(e) => setQuickLeadForm(prev => ({ ...prev, reviewsCount: e.target.value }))}
                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500/50 hover:border-zinc-300 transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-sans font-bold text-zinc-500 uppercase tracking-wide">Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Manual Flow, Busy Clinics"
                  value={quickLeadForm.tagsRaw}
                  onChange={(e) => setQuickLeadForm(prev => ({ ...prev, tagsRaw: e.target.value }))}
                  className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500/50 hover:border-zinc-300 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-sans font-bold text-zinc-500 uppercase tracking-wide">Internal Notes</label>
                <textarea
                  placeholder="Key notes regarding this prospect..."
                  rows={2}
                  value={quickLeadForm.notes}
                  onChange={(e) => setQuickLeadForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-850 text-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500/50 hover:border-zinc-300 transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-150 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveQuickAdd(null);
                    setValidationError(null);
                  }}
                  className="px-3 py-1.5 text-[10px] font-bold text-zinc-500 hover:text-zinc-800 uppercase transition-all rounded-md bg-white border border-zinc-200 hover:border-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 uppercase tracking-widest rounded-md shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-1"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin text-white" />
                      Saving...
                    </>
                  ) : (
                    'Create Lead'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Lead Status Summary Popup Overlay */}
      <AnimatePresence>
        {summarizedLead && (
          <div
            id="crm-summary-modal-backdrop"
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4 overflow-y-auto"
            onClick={() => setSummarizedLead(null)}
          >
            <motion.div
              id="crm-summary-modal-container"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-md rounded-xl border border-zinc-200 bg-white shadow-2xl overflow-hidden my-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-150 px-5 py-4 bg-zinc-50/80">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center shadow-xs">
                    <Sparkles className="h-3 w-3 text-blue-600 animate-pulse" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-sans font-bold text-zinc-800 uppercase tracking-wider">AI Sales Briefing</span>
                    <span className="text-[9px] font-mono text-zinc-450 uppercase font-black tracking-widest">Sales Intelligence Engine</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSummarizedLead(null)}
                  className="p-1 rounded bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-800 hover:border-zinc-300 transition-all cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Dynamic Content */}
              <div className="p-5 space-y-4 bg-white">
                {/* Lead Header Info Card */}
                <div className="bg-zinc-50 border border-zinc-200/80 rounded-lg p-3.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 tracking-wide">{summarizedLead.name}</h4>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{summarizedLead.category}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[8.5px] font-mono font-bold uppercase border border-blue-205 border-blue-200 bg-blue-50 text-blue-700">
                      STATUS: {summarizedLead.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-zinc-200/60">
                    <div>
                      <span className="text-[8px] font-mono uppercase text-zinc-400 block font-bold">DIGITAL PRESENCE SCORE</span>
                      <span className="text-xs font-mono font-bold text-zinc-700 flex items-center gap-1.5 mt-0.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${summarizedLead.website ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></span>
                        {summarizedLead.digitalPresenceScore}% Strength
                      </span>
                    </div>
                    <div>
                      <span className="text-[8px] font-mono uppercase text-zinc-400 block font-bold">RECOMMENDED OFFER</span>
                      <span className="text-[10px] font-sans font-bold text-zinc-700 mt-0.5 block truncate">
                        {summarizedLead.serviceType === 'web_design' ? '🎨 Custom Web Platform' : summarizedLead.serviceType === 'ai_automation' ? '🤖 AI Systems' : '💠 Hybrid Systems Box'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Summarization Output Block */}
                <div id="crm-summary-output-block" className="space-y-2.5">
                  <span className="text-[10px] font-sans font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-zinc-150 pb-1 mr-1">
                    <FileText className="h-3 w-3 text-blue-600" />
                    STATUS ANALYSIS & PROGRESS BRIEF
                  </span>

                  {isLoadingSummary ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-2.5 bg-zinc-50/50 rounded-lg border border-zinc-200/85">
                      <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest animate-pulse font-bold">Analyzing lead progression...</span>
                    </div>
                  ) : summaryError ? (
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-[10px] text-rose-600 flex items-start gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold block text-rose-700 uppercase font-mono tracking-wider">Error Loading Summary</span>
                        <p className="mt-0.5 opacity-90">{summaryError}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-zinc-50/50 border border-zinc-200 text-zinc-800">
                      <SimpleMarkdownRenderer content={aiSummaryText} />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Bar Footer */}
              <div className="flex items-center justify-end border-t border-zinc-150 px-5 py-3.5 bg-zinc-50/80 gap-2">
                <button
                  type="button"
                  onClick={() => setSummarizedLead(null)}
                  className="px-3 py-1.5 text-[10px] font-bold text-zinc-505 text-zinc-500 hover:text-zinc-800 transition-colors rounded-md bg-white border border-zinc-205 border-zinc-200 hover:border-zinc-300 cursor-pointer shadow-xs"
                >
                  Close Briefing
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenSummaryPopup(summarizedLead)}
                  disabled={isLoadingSummary}
                  className="px-3.5 py-1.5 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-500 border border-blue-500/25 shadow-sm hover:shadow disabled:opacity-40 uppercase tracking-wider rounded-md cursor-pointer flex items-center gap-1 transition-all"
                >
                  <RefreshCw className={`h-3 w-3 ${isLoadingSummary ? 'animate-spin' : ''}`} />
                  <span>Regenerate AI Brief</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CSV Import Modal Overlay */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div
            id="crm-csv-import-modal-backdrop"
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in"
            onClick={() => {
              if (!isImporting) {
                setIsImportModalOpen(false);
              }
            }}
          >
            <motion.div
              id="crm-csv-import-modal-container"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-4xl rounded-2xl border border-zinc-200 bg-white shadow-2xl overflow-hidden my-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-150 px-6 py-4 bg-zinc-50/80">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shadow-xs">
                    <Upload className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-sans font-extrabold text-zinc-900 uppercase tracking-wider">CSV Pipeline Import Wizard</h3>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
                      File: <span className="font-bold text-zinc-700">{importFileName || "Unknown"}</span> ({importRows.length} prospects parsed)
                    </p>
                  </div>
                </div>
                {!isImporting && (
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className="p-1 rounded-md bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-800 hover:border-zinc-300 transition-all cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Error State */}
              {csvParseError ? (
                <div className="p-8 text-center space-y-4">
                  <div className="h-12 w-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div className="space-y-1 max-w-md mx-auto">
                    <h4 className="text-sm font-bold text-zinc-900 tracking-wide uppercase">File Format Parsing Failure</h4>
                    <p className="text-xs text-zinc-500">
                      We were unable to process the selected CSV. The spreadsheet structure might be damaged or empty.
                    </p>
                    <div className="p-3 bg-rose-50 rounded-lg text-left text-xs font-mono text-rose-700 border border-rose-150 mt-3 break-all">
                      {csvParseError}
                    </div>
                  </div>
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => document.getElementById('crm-csv-import-file-input')?.click()}
                      className="px-4 py-2 text-xs font-bold text-zinc-700 bg-white hover:bg-zinc-50 rounded-lg border border-zinc-200 shadow-xs cursor-pointer transition"
                    >
                      Choose Another CSV File
                    </button>
                  </div>
                </div>
              ) : isImporting ? (
                /* Progress Display */
                <div className="p-10 text-center space-y-6">
                  <div className="relative h-16 w-16 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-100 animate-pulse" />
                    <RefreshCw className="h-7 w-7 text-emerald-600 animate-spin" />
                  </div>
                  <div className="space-y-2 max-w-sm mx-auto">
                    <h4 className="text-sm font-extrabold text-zinc-900 tracking-wider uppercase font-sans font-bold">
                      Importing Pipeline Prospects
                    </h4>
                    <span className="text-xs font-mono text-zinc-500 block">
                      Importing row {importCurrentIndex} of {importTotal} ({importProgress}%)
                    </span>
                    <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden border border-zinc-150 mt-2">
                      <div
                        className="bg-emerald-600 h-full transition-all duration-300 ease-out"
                        style={{ width: `${importProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : importResults ? (
                /* Import Report Card Summary */
                <div className="p-8 text-center space-y-5">
                  <div className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
                    <Check className="h-6 w-6 stroke-[3]" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-zinc-900 tracking-wide uppercase font-bold">Import Operation Completed</h4>
                    <p className="text-xs text-zinc-500">
                      Your CSV pipeline mapping has finished executing.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto p-4 bg-zinc-50 rounded-xl border border-zinc-200 mt-4">
                    <div className="p-3 bg-white rounded-lg border border-zinc-150 shadow-xs">
                      <span className="text-[10px] font-sans font-bold text-zinc-400 block uppercase">Added Accounts</span>
                      <span className="text-xl font-mono font-black text-emerald-600">{importResults.success}</span>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-zinc-150 shadow-xs">
                      <span className="text-[10px] font-sans font-bold text-zinc-400 block uppercase">Skipped Rows</span>
                      <span className="text-xl font-mono font-black text-zinc-500">{importResults.failed}</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsImportModalOpen(false);
                        setImportResults(null);
                        setImportRows([]);
                        setImportHeaders([]);
                      }}
                      className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 hover:shadow-md rounded-lg border border-blue-600/20 shadow-xs cursor-pointer transition uppercase tracking-wider"
                    >
                      Done & Close Wizard
                    </button>
                  </div>
                </div>
              ) : (
                /* Standard Mapping Workbench Column Config */
                <div className="flex flex-col md:grid md:grid-cols-12 md:divide-x md:divide-zinc-150 min-h-[460px]">
                  
                  {/* Left block (7 Columns Width): Mapping Configurations */}
                  <div className="col-span-12 md:col-span-7 p-6 overflow-y-auto max-h-[500px] space-y-5">
                    <div className="border-b border-zinc-150 pb-3 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-sans font-bold text-zinc-800 uppercase tracking-wide">Map CSV Fields to Lead Attributes</h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Select corresponding column header keys found inside your CSV.</p>
                      </div>
                      <span className="text-[9px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-150 uppercase tracking-widest">
                        Required *
                      </span>
                    </div>

                    <div className="space-y-4">
                      {/* Name mapping */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                        <label className="text-[10.5px] font-sans font-bold text-zinc-600">
                          Business Name <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <div className="sm:col-span-2">
                          <select
                            value={importMapping.name}
                            onChange={(e) => setImportMapping(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 hover:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition cursor-pointer"
                          >
                            <option value="">-- Do Not Map --</option>
                            {importHeaders.map(h => (
                              <option key={h} value={h}>CSV Column: {h}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Category mapping */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                        <label className="text-[10.5px] font-sans font-bold text-zinc-600">
                          Niche / Category
                        </label>
                        <div className="sm:col-span-2">
                          <select
                            value={importMapping.category}
                            onChange={(e) => setImportMapping(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 hover:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition cursor-pointer"
                          >
                            <option value="">-- Do Not Map (Local Business) --</option>
                            {importHeaders.map(h => (
                              <option key={h} value={h}>CSV Column: {h}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Website mapping */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                        <label className="text-[10.5px] font-sans font-bold text-zinc-600">
                          Website URL
                        </label>
                        <div className="sm:col-span-2">
                          <select
                            value={importMapping.website}
                            onChange={(e) => setImportMapping(prev => ({ ...prev, website: e.target.value }))}
                            className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 hover:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition cursor-pointer"
                          >
                            <option value="">-- Do Not Map --</option>
                            {importHeaders.map(h => (
                              <option key={h} value={h}>CSV Column: {h}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Phone mapping */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                        <label className="text-[10.5px] font-sans font-bold text-zinc-600">
                          Phone Number
                        </label>
                        <div className="sm:col-span-2">
                          <select
                            value={importMapping.phone}
                            onChange={(e) => setImportMapping(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 hover:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition cursor-pointer"
                          >
                            <option value="">-- Do Not Map --</option>
                            {importHeaders.map(h => (
                              <option key={h} value={h}>CSV Column: {h}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Address mapping */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                        <label className="text-[10.5px] font-sans font-bold text-zinc-600">
                          Location / Address
                        </label>
                        <div className="sm:col-span-2">
                          <select
                            value={importMapping.address}
                            onChange={(e) => setImportMapping(prev => ({ ...prev, address: e.target.value }))}
                            className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 hover:border-zinc-350 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition cursor-pointer"
                          >
                            <option value="">-- Do Not Map (Unknown Location) --</option>
                            {importHeaders.map(h => (
                              <option key={h} value={h}>CSV Column: {h}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Rating mapping */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                        <label className="text-[10.5px] font-sans font-bold text-zinc-600">
                          Google Rating
                        </label>
                        <div className="sm:col-span-2">
                          <select
                            value={importMapping.rating}
                            onChange={(e) => setImportMapping(prev => ({ ...prev, rating: e.target.value }))}
                            className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 hover:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition cursor-pointer"
                          >
                            <option value="">-- Do Not Map --</option>
                            {importHeaders.map(h => (
                              <option key={h} value={h}>CSV Column: {h}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Reviews Count mapping */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                        <label className="text-[10.5px] font-sans font-bold text-zinc-600">
                          Reviews Count
                        </label>
                        <div className="sm:col-span-2">
                          <select
                            value={importMapping.reviewsCount}
                            onChange={(e) => setImportMapping(prev => ({ ...prev, reviewsCount: e.target.value }))}
                            className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 hover:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition cursor-pointer"
                          >
                            <option value="">-- Do Not Map --</option>
                            {importHeaders.map(h => (
                              <option key={h} value={h}>CSV Column: {h}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Internal Notes Map */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                        <label className="text-[10.5px] font-sans font-bold text-zinc-600">
                          Internal Notes
                        </label>
                        <div className="sm:col-span-2">
                          <select
                            value={importMapping.notes}
                            onChange={(e) => setImportMapping(prev => ({ ...prev, notes: e.target.value }))}
                            className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 hover:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition cursor-pointer"
                          >
                            <option value="">-- Do Not Map (Preset note) --</option>
                            {importHeaders.map(h => (
                              <option key={h} value={h}>CSV Column: {h}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Advanced Overrides or Pipeline defaults split section */}
                      <div className="pt-3 border-t border-dashed border-zinc-150">
                        <span className="text-[10px] font-sans font-black text-zinc-400 block uppercase tracking-wider mb-2.5 font-bold">
                          Advanced Overrides & Stage Presets
                        </span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div className="space-y-1">
                            <label className="text-[9.5px] font-sans font-bold text-zinc-500 uppercase tracking-wider">
                              Initial Pipeline Stage
                            </label>
                            <select
                              value={importMapping.status}
                              onChange={(e) => setImportMapping(prev => ({ ...prev, status: e.target.value }))}
                              className="w-full bg-zinc-50 border border-zinc-200/80 rounded-lg px-2 py-1 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition cursor-pointer font-medium"
                            >
                              <optgroup label="Static Value Overrides">
                                <option value="static:new">Static Option: New opportunity</option>
                                <option value="static:contacted">Static Option: Contacted</option>
                                <option value="static:replied">Static Option: Replied</option>
                                <option value="static:interested">Static Option: Interested / Meeting</option>
                                <option value="static:closed">Static Option: Closed Won</option>
                              </optgroup>
                              {importHeaders.length > 0 && (
                                <optgroup label="Map to column header">
                                  {importHeaders.map(h => (
                                    <option key={`status-${h}`} value={h}>Map Column: {h}</option>
                                  ))}
                                </optgroup>
                              )}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9.5px] font-sans font-bold text-zinc-500 uppercase tracking-wider">
                              Proposed Service System
                            </label>
                            <select
                              value={importMapping.serviceType}
                              onChange={(e) => setImportMapping(prev => ({ ...prev, serviceType: e.target.value }))}
                              className="w-full bg-zinc-50 border border-zinc-200/80 rounded-lg px-2 py-1 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition cursor-pointer font-medium"
                            >
                              <optgroup label="Static Overrides">
                                <option value="static:web_design">🎨 Web Design System</option>
                                <option value="static:ai_automation">🤖 AI Systems & Bots</option>
                                <option value="static:hybrid">💠 Hybrid Integration Box</option>
                              </optgroup>
                              {importHeaders.length > 0 && (
                                <optgroup label="Map to column values">
                                  {importHeaders.map(h => (
                                    <option key={`service-${h}`} value={h}>Map Column: {h}</option>
                                  ))}
                                </optgroup>
                              )}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5 mt-2.5">
                          <div className="space-y-1">
                            <label className="text-[9.5px] font-sans font-bold text-zinc-500 uppercase tracking-wider">
                              Digital Presence Score
                            </label>
                            <select
                              value={importMapping.digitalPresenceScore}
                              onChange={(e) => setImportMapping(prev => ({ ...prev, digitalPresenceScore: e.target.value }))}
                              className="w-full bg-zinc-50 border border-zinc-200/80 rounded-lg px-2 py-1 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition cursor-pointer font-medium"
                            >
                              <optgroup label="Standard Scores (Presets)">
                                <option value="static:30">30% (Critical online presence gap)</option>
                                <option value="static:50">50% (Standard hybrid maturity deficit)</option>
                                <option value="static:70">70% (Average presence strength)</option>
                                <option value="static:90">90% (Good online strength)</option>
                              </optgroup>
                              {importHeaders.length > 0 && (
                                <optgroup label="Read data from column">
                                  {importHeaders.map(h => (
                                    <option key={`presence-${h}`} value={h}>Map Column: {h}</option>
                                  ))}
                                </optgroup>
                              )}
                            </select>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Right block (5 Columns Width): Verification Stage Previews */}
                  <div className="col-span-12 md:col-span-5 p-6 bg-zinc-50/70 overflow-y-auto max-h-[500px] flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-155 pb-2.5">
                        <span className="text-xs font-sans font-bold text-zinc-700 uppercase tracking-wider">Mapping Verification Preview</span>
                        
                        {/* Pagination Selector */}
                        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-zinc-200 shadow-3xs">
                          <button
                            type="button"
                            disabled={previewRowIndex === 0}
                            onClick={() => setPreviewRowIndex(prev => Math.max(0, prev - 1))}
                            className="p-1 rounded bg-white hover:bg-zinc-100 border border-zinc-200 disabled:opacity-40 disabled:hover:bg-white text-zinc-650 cursor-pointer transition text-[9px] font-black leading-none"
                            title="Previous Row"
                          >
                            ◀
                          </button>
                          <span className="text-[10px] font-mono font-bold text-zinc-500 select-none px-1">
                            {previewRowIndex + 1} / {Math.min(importRows.length, 5)}
                          </span>
                          <button
                            type="button"
                            disabled={previewRowIndex >= Math.min(importRows.length - 1, 4)}
                            onClick={() => setPreviewRowIndex(prev => Math.min(importRows.length - 1, prev + 1))}
                            className="p-1 rounded bg-white hover:bg-zinc-100 border border-zinc-200 disabled:opacity-40 disabled:hover:bg-white text-zinc-650 cursor-pointer transition text-[9px] font-black leading-none"
                            title="Next Row"
                          >
                            ▶
                          </button>
                        </div>
                      </div>

                      <p className="text-[10.5px] text-zinc-500 leading-normal">
                        Verify how row data translates into a structured prospect before importing. Analyzing row #{previewRowIndex + 1} of spreadsheet.
                      </p>

                      {/* Lead Visual Renderer card preview */}
                      {(() => {
                        const currentRow = importRows[previewRowIndex];
                        if (!currentRow) {
                          return <div className="p-4 bg-white rounded-lg border border-zinc-200 text-xs text-zinc-400 font-mono text-center">No parsed row loaded.</div>;
                        }
                        const testLead = createLeadFromRow(currentRow);
                        const isNameMapped = !!importMapping.name;

                        return (
                          <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden leading-normal">
                            {/* Card top bar */}
                            <div className="p-3.5 bg-zinc-50/50 border-b border-zinc-150/80 flex items-start justify-between">
                              <div className="space-y-0.5 truncate max-w-[70%]">
                                <span className="text-[8px] font-mono uppercase bg-zinc-200 text-zinc-700 px-1.5 py-px rounded font-bold">
                                  {testLead.category || "Local Business"}
                                </span>
                                <h5 className={`text-xs font-bold ${isNameMapped ? 'text-zinc-900' : 'text-rose-600 animate-pulse'} truncate mt-1`}>
                                  {isNameMapped ? testLead.name : "(⚠️ Choose Name mapping)"}
                                </h5>
                              </div>

                              <span className="text-[8.5px] font-mono font-bold text-blue-700 uppercase bg-blue-50 border border-blue-100/50 px-2 py-0.5 rounded shadow-3xs shrink-0">
                                {testLead.status.toUpperCase()}
                              </span>
                            </div>

                            {/* Card Content parameters */}
                            <div className="p-3.5 space-y-2.5 text-[10.5px]">
                              {/* Website details */}
                              <div className="flex items-center gap-1.5 text-zinc-600">
                                <Globe className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                                <span className="truncate">
                                  {testLead.website ? (
                                    <span className="text-blue-600 font-semibold underline">{testLead.website}</span>
                                  ) : (
                                    <span className="text-zinc-400 italic">No website (Triggers web design offer)</span>
                                  )}
                                </span>
                              </div>

                              {/* Phone details */}
                              <div className="flex items-center gap-1.5 text-zinc-600">
                                <span className="text-[10px] select-none text-zinc-400 shrink-0 font-bold font-mono">📞</span>
                                <span>{testLead.phone || <span className="text-zinc-400 italic">Not set</span>}</span>
                              </div>

                              {/* Location details */}
                              <div className="flex items-center gap-1.5 text-zinc-600">
                                <span className="text-[10px] select-none text-zinc-400 shrink-0 font-bold font-mono">📍</span>
                                <span className="truncate">{testLead.address}</span>
                              </div>

                              {/* Rating stars and counts */}
                              <div className="grid grid-cols-2 gap-2 bg-zinc-50 p-2 rounded-lg border border-zinc-150/60 font-medium">
                                <div>
                                  <span className="text-[7.5px] text-zinc-400 font-sans font-bold block uppercase tracking-wide">Google Rating</span>
                                  <span className="text-zinc-700 flex items-center gap-1 font-mono text-[10.5px] font-bold mt-0.5">
                                    ⭐ {testLead.rating !== null ? testLead.rating : 'N/A'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[7.5px] text-zinc-400 font-sans font-bold block uppercase tracking-wide">Reviews</span>
                                  <span className="text-zinc-700 font-mono text-[10.5px] font-bold mt-0.5">
                                    💬 {testLead.reviewsCount !== null ? testLead.reviewsCount : 'N/A'}
                                  </span>
                                </div>
                              </div>

                              {/* Proposal details */}
                              <div className="pt-2 border-t border-zinc-150 text-[10px] space-y-1.5">
                                <div className="flex justify-between items-center bg-blue-50/20 border border-blue-100/50 p-1.5 rounded-md">
                                  <span className="text-zinc-450 uppercase font-mono font-bold text-[8px] tracking-wide">Recommended Proposal</span>
                                  <span className="font-sans font-semibold text-zinc-700">
                                    {testLead.serviceType === 'web_design' ? 'Custom Web Platform' : testLead.serviceType === 'ai_automation' ? 'AI Systems' : 'Hybrid Systems Box'}
                                  </span>
                                </div>

                                <div className="flex justify-between items-center bg-emerald-50/20 border border-emerald-100/50 p-1.5 rounded-md">
                                  <span className="text-zinc-455 text-zinc-400 uppercase font-mono font-bold text-[8px] tracking-wide">Presence Score</span>
                                  <span className="font-mono font-bold text-emerald-700 flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                    {testLead.digitalPresenceScore}% strength
                                  </span>
                                </div>

                                <div className="p-1.5 bg-zinc-50 rounded border border-zinc-150/80">
                                  <span className="text-zinc-400 font-mono font-bold text-[7.5px] block uppercase tracking-wide">Internal Notes preview</span>
                                  <p className="text-[9.5px] text-zinc-650 line-clamp-2 mt-0.5 italic">{testLead.notes}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Quick validation warnings */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
                      <span className="text-[9px] font-mono font-bold text-amber-800 uppercase tracking-widest flex items-center gap-1">
                        ⚠️ Data Format Advisory
                      </span>
                      <p className="text-[9.5px] text-amber-700 leading-normal font-medium">
                        Rows missing a mapped Business Name value are skipped automatically. Web Designing deficits are activated for prospects missing Website URLs.
                      </p>
                    </div>

                  </div>
                </div>
              )}

              {/* Footer action bar */}
              {!isImporting && !importResults && (
                <div className="flex items-center justify-between border-t border-zinc-150 px-6 py-4 bg-zinc-50/80">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => document.getElementById('crm-csv-import-file-input')?.click()}
                      className="px-3 py-1.5 text-[10px] font-sans font-bold text-zinc-600 hover:text-zinc-800 uppercase transition bg-white border border-zinc-200 hover:border-zinc-300 rounded-lg cursor-pointer"
                    >
                      Change File
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsImportModalOpen(false)}
                      className="px-3 py-1.5 text-[10px] font-sans font-semibold text-zinc-500 hover:text-zinc-700 uppercase transition bg-transparent hover:bg-zinc-100/50 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    disabled={!importMapping.name || importRows.length === 0}
                    className="px-5 py-1.5 text-[10px] font-sans font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 uppercase tracking-widest rounded-lg shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="h-3 w-3 stroke-[3]" />
                    <span>Initiate {importRows.length} Prospects Import</span>
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
