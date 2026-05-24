import { useState, useEffect } from 'react';
import Header from './components/Header';
import DiscoveryEngine from './components/DiscoveryEngine';
import CrmPipelineWithFeatures from './components/CrmPipelineWithFeatures';
import AnalyticsPanel from './components/AnalyticsPanel';
import AIAnalyticsPage from './components/AIAnalyticsPage';
import LeadSidePanel from './components/LeadSidePanel';
import LaunchVideoPlayer from './components/LaunchVideo';
import ProductLanding from './components/ProductLanding';
import { useAuth } from './components/AuthContext';
import { AIProvider } from './components/AIContext';
import AICompanionModal from './components/AICompanionModal';
import AIAgentTraceIndicator from './components/AIAgentTraceIndicator';
import { Lead } from './types';
import { Sparkles, CalendarRange, Target, AlertCircle, Bot } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState<'guide' | 'discovery' | 'crm' | 'analytics' | 'ai-usage'>('guide');
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isAICompanionOpen, setIsAICompanionOpen] = useState(false);
  
  // Custom Firebase Sync
  const { 
    user, 
    crmLeads: firebaseLeads, 
    isConfigured, 
    saveLead: saveLeadToFirebase, 
    updateLeadStatus: updateLeadStatusFirebase, 
    updateLeadDetails: updateLeadDetailsFirebase, 
    deleteLead: deleteLeadFirebase,
  } = useAuth();

  // Local CRM leads loaded from offline server database
  const [localLeads, setLocalLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Compute active leads list dynamically
  const crmLeads = user ? firebaseLeads : localLeads;
  
  // Refresh local CRM list from database
  const loadCrmLeads = async () => {
    try {
      const response = await fetch('/api/crm/leads');
      if (response.ok) {
        const data = await response.json();
        setLocalLeads(data || []);
      } else {
        throw new Error("Could not retrieve CRM leads list.");
      }
    } catch (err: any) {
      setGlobalError(err.message || "Endpoint error connecting to backend service.");
    }
  };

  useEffect(() => {
    loadCrmLeads();
  }, []);


  // Set up real-time WebSocket syncing for pipeline state changes across devices/sessions
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: any;
    let isMounted = true;

    const connect = () => {
      // Formulate a dynamic WebSocket URL matching current browser location
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      console.log('Establishing CRM real-time WebSocket connection to:', wsUrl);
      
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('CRM real-time event received:', message);

          if (!isMounted) return;

          switch (message.type) {
            case 'lead_created':
              setLocalLeads((prev) => {
                // Idempotent guard: avoid double appending if already in list
                if (prev.some(l => l.id === message.lead.id)) {
                  return prev;
                }
                return [...prev, message.lead];
              });
              break;

            case 'lead_updated':
              setLocalLeads((prev) => prev.map((item) => (item.id === message.lead.id ? message.lead : item)));
              // Sync active drawer dynamically if the user is looking at this exact lead
              setSelectedLead((curr) => {
                if (curr && curr.id === message.lead.id) {
                  return message.lead;
                }
                return curr;
              });
              break;

            case 'lead_deleted':
              setLocalLeads((prev) => prev.filter((item) => item.id !== message.id));
              // Close active drawer dynamically if the user is looking at the deleted lead
              setSelectedLead((curr) => {
                if (curr && curr.id === message.id) {
                  return null;
                }
                return curr;
              });
              break;

            default:
              break;
          }
        } catch (err) {
          console.error('Error parsing WebSocket real-time frame:', err);
        }
      };

      ws.onclose = () => {
        if (!isMounted) return;
        console.warn('CRM real-time WebSocket connection closed. Relinking in 5 seconds...');
        reconnectTimer = setTimeout(connect, 5000);
      };

      ws.onerror = (error) => {
        console.error('CRM real-time WebSocket encountered an error:', error);
      };
    };

    connect();

    // Send gentle ping frames to keep standard Cloud Run / reverse-proxy connections from idling out
    const pingInterval = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000);

    return () => {
      isMounted = false;
      clearInterval(pingInterval);
      clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null; // Prevent reconnect loops on unmount
        ws.close();
      }
    };
  }, []);

  // Save new prospect to CRM database
  const saveLeadToCrm = async (newLead: Lead): Promise<boolean> => {
    if (user) {
      return await saveLeadToFirebase(newLead);
    }

    try {
      const response = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLead)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to commit prospect card.");
      }
      
      const addedLead = await response.json();
      setLocalLeads((prev) => [...prev, addedLead]);
      return true;
    } catch (err: any) {
      alert(err.message || "An error occurred while saving the lead.");
      return false;
    }
  };

  // Update CRM lead details (notes, tags, analysis, statuses)
  const handleUpdateCrmLead = async (updatedLead: Lead) => {
    // Maintain opened state drawer sync
    if (selectedLead && selectedLead.id === updatedLead.id) {
      setSelectedLead(updatedLead);
    }

    if (user) {
      await updateLeadDetailsFirebase(updatedLead);
      return;
    }

    // Otherwise, perform local Express DB PUT
    setLocalLeads((prev) => prev.map((item) => (item.id === updatedLead.id ? updatedLead : item)));
    try {
      await fetch(`/api/crm/leads/${updatedLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedLead),
      });
    } catch (error) {
      console.error("Failed to sync updated lead state on Express database:", error);
    }
  };

  // Modify Pipeline column state quickly
  const handleUpdateLeadStatus = async (id: string, nextStatus: Lead['status']) => {
    const lead = crmLeads.find(l => l.id === id);
    if (!lead) return;

    const updated = { ...lead, status: nextStatus };
    
    if (user) {
      await updateLeadStatusFirebase(id, nextStatus);
      return;
    }

    // Otherwise update Express DB
    setLocalLeads((prev) => prev.map((item) => (item.id === id ? updated : item)));
    try {
      await fetch(`/api/crm/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (error) {
      console.error("Failed to persist lead status transition:", error);
    }
  };

  // Delete lead
  const handleDeleteCrmLead = async (id: string) => {
    if (user) {
      const success = await deleteLeadFirebase(id);
      if (success && selectedLead && selectedLead.id === id) {
        setSelectedLead(null);
      }
      return;
    }

    try {
      const response = await fetch(`/api/crm/leads/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setLocalLeads((prev) => prev.filter((item) => item.id !== id));
        if (selectedLead && selectedLead.id === id) {
          setSelectedLead(null);
        }
      }
    } catch (err) {
      console.error("Delete call failed:", err);
    }
  };

  // Track savedNames to block duplicates in user search listings
  const savedLeadNames = crmLeads.map((item) => item.name);

  return (
    <div id="hunter-app-viewport" className="min-h-screen bg-[#FAFAFB] font-sans text-zinc-800 antialiased selection:bg-blue-600/10 selection:text-blue-600">
      
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        crmCount={crmLeads.length}
        onOpenTour={() => setIsTourOpen(true)}
      />

      {activeTab === 'guide' ? (
        <ProductLanding 
          onStartApp={() => setActiveTab('discovery')}
          isFirebaseConfigured={isConfigured}
          onConnectDatabase={() => {
            alert("To pair your Cloud Database, ensure you configure Firebase terms in the platform panel! Once live, client data will seamlessly auto-synchronize to Firestore.");
          }}
        />
      ) : (
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          
          {globalError && (
            <div className="mb-4 flex items-start gap-3 rounded-xl bg-orange-50 border border-orange-200/60 p-4 text-xs text-orange-850">
              <AlertCircle className="h-4.5 w-4.5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-950">System Analytics Status</p>
                <p className="mt-0.5 text-zinc-600">{globalError}</p>
              </div>
            </div>
          )}

          {/* Tab Layout Switching content */}
          <div id="saas-main-section">
            {activeTab === 'discovery' && (
              <DiscoveryEngine
                onSaveLead={saveLeadToCrm}
                savedLeadNames={savedLeadNames}
                onInspectLead={setSelectedLead}
                crmLeads={crmLeads}
              />
            )}

            {activeTab === 'crm' && (
              <CrmPipelineWithFeatures
                leads={crmLeads}
                onUpdateStatus={handleUpdateLeadStatus}
                onSelectLead={setSelectedLead}
                onDeleteLead={handleDeleteCrmLead}
                onAddLead={saveLeadToCrm}
                onUpdateLead={handleUpdateCrmLead}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsPanel
                leads={crmLeads}
              />
            )}

            {activeTab === 'ai-usage' && (
              <AIAnalyticsPage />
            )}
          </div>

          {/* 💌 Integrated Compact Attribution Footer */}
          <footer className="mt-16 py-8 border-t border-zinc-200/50 text-center">
            <p className="text-zinc-700 text-[10.5px] font-bold tracking-widest uppercase font-sans">
              Built with ❤️ by <span className="text-blue-600 font-extrabold hover:underline">Bamidele Tewogbade</span>
            </p>
            <div className="flex justify-center items-center gap-3.5 mt-2.5 text-[10px] font-semibold text-zinc-500 font-sans">
              <a href="mailto:bishoptewogbade@gmail.com" className="hover:text-blue-600 transition-colors">bishoptewogbade@gmail.com</a>
              <span className="text-zinc-200">•</span>
              <a href="https://twitter.com/btewogbade" target="_blank" rel="noreferrer" className="hover:text-sky-500 transition-colors">Twitter</a>
              <span className="text-zinc-200">•</span>
              <a href="https://linkedin.com/in/btewogbade" target="_blank" rel="noreferrer" className="hover:text-blue-700 transition-colors">LinkedIn</a>
            </div>
          </footer>
        </main>
      )}

      {/* Side drawer detail overlays */}
      {selectedLead && (
        <>
          {/* Overlay clicking backdrop triggers close */}
          <div
            onClick={() => setSelectedLead(null)}
            className="fixed inset-0 z-40 bg-zinc-950/60 backdrop-blur-sm"
          />
          <LeadSidePanel
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            onUpdateLead={handleUpdateCrmLead}
            onDeleteLead={crmLeads.some(l => l.id === selectedLead.id) ? handleDeleteCrmLead : undefined}
          />
        </>
      )}

      {/* AI Companion FAB — always accessible from any tab */}
      <button
        onClick={() => setIsAICompanionOpen(true)}
        className="fixed bottom-4 right-4 z-30 flex items-center justify-center w-12 h-12 
                   rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 
                   shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 
                   transition-all duration-200 cursor-pointer border border-blue-400/30"
        title="Open AI Companion"
      >
        <Bot className="w-5 h-5 text-white" />
      </button>

      {/* AI Agent Trace Indicator — floating pill bottom-left */}
      <AIAgentTraceIndicator />

      {/* AI Companion Modal — bottom sheet on mobile, panel on desktop */}
      <AICompanionModal
        isOpen={isAICompanionOpen}
        onClose={() => setIsAICompanionOpen(false)}
      />

      {/* Remotion-Powered Video Launch Tour Overlay */}
      <LaunchVideoPlayer
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AIProvider>
      <AppContent />
    </AIProvider>
  );
}
