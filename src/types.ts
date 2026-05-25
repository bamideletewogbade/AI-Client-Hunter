/**
 * AI Client Hunter Types & Interfaces
 */

export interface BusinessAnalysis {
  summary: string;
  digitalPresenceSummary: string;
  presenceStrength: 'low' | 'medium' | 'high';
  operationalPainPoints: string[];
  systemsNeeded: string[];
  aiOpportunities: string[];
  digitalMaturityScore: number;
}

export interface WebDesignStructureSection {
  sectionName: string;
  purpose: string;
  contentHint: string;
}

export interface WebDesignProposal {
  needDetectedReason: string;
  suggestedType: string;
  structure: WebDesignStructureSection[];
  heroHeadline: string;
  heroSubheadline: string;
  selectedCta: string;
  estimatedValue: string;
  readyToSellOffer: string;
}

export interface OutreachPitch {
  email: string;
  linkedin: string;
  whatsapp: string;
}

export interface Lead {
  id: string;
  name: string;
  category: string;
  phone: string | null;
  address: string;
  rating: number | null;
  reviewsCount: number | null;
  website: string | null;
  mapsUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  status: 'new' | 'contacted' | 'replied' | 'interested' | 'closed';
  notes: string;
  tags: string[];
  serviceType: 'ai_automation' | 'web_design' | 'hybrid';
  digitalPresenceScore: number;
  createdAt: string;
  aiAnalysis?: BusinessAnalysis | null;
  webDesignProposal?: WebDesignProposal | null;
  outreachPitch?: OutreachPitch | null;
}

export interface DashboardStats {
  totalLeads: number;
  noWebsite: number;
  contactedLeads: number;
  repliesReceived: number;
  meetingsBooked: number;
  conversionRate: number;
  estimatedPipelineRevenue: number;
}

export interface SearchQueryConfig {
  query: string;
  location?: string;
  industry?: string;
  hasNoWebsiteOnly?: boolean;
}
