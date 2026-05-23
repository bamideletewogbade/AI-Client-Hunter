import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize WebSocket server under manual upgrade architecture
const wss = new WebSocketServer({ noServer: true });

function broadcast(data: any) {
  const payload = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

wss.on('connection', (ws) => {
  console.log('CRM Real-time Pipeline WebSocket Client connected.');
  
  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message.toString());
      if (parsed.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (e) {
      // ignore
    }
  });

  ws.on('close', () => {
    console.log('CRM Real-time Pipeline WebSocket Client disconnected.');
  });
});

app.use(express.json());

// Path to CRM leads persistence storage
const DB_FILE = path.join(process.cwd(), 'leads_db.json');

// Interface definition matching Types
interface BusinessAnalysis {
  summary: string;
  digitalPresenceSummary: string;
  presenceStrength: 'low' | 'medium' | 'high';
  operationalPainPoints: string[];
  systemsNeeded: string[];
  aiOpportunities: string[];
  digitalMaturityScore: number;
}

interface WebDesignStructureSection {
  sectionName: string;
  purpose: string;
  contentHint: string;
}

interface WebDesignProposal {
  needDetectedReason: string;
  suggestedType: string;
  structure: WebDesignStructureSection[];
  heroHeadline: string;
  heroSubheadline: string;
  selectedCta: string;
  estimatedValue: string;
  readyToSellOffer: string;
}

interface OutreachPitch {
  email: string;
  linkedin: string;
  whatsapp: string;
}

interface Lead {
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

// Pre-populate some realistic initial leads if database file is empty
const INITIAL_LEADS: Lead[] = [
  {
    id: "crm-1",
    name: "Accra Oasis Dental & Wellness",
    category: "Dental Clinic",
    phone: "+233 24 123 4567",
    address: "12 ring road center, Accra, Ghana",
    rating: 4.2,
    reviewsCount: 38,
    website: null,
    mapsUrl: "https://maps.google.com/?cid=accra_oasis",
    latitude: 5.5601,
    longitude: -0.2057,
    status: "new",
    notes: "High potential client. They rely heavily on Google Maps and direct WhatsApp messages for scheduling. Receptionist mentions they get overwhelmed by bookings.",
    tags: ["No Website", "Manual Bookings", "WhatsApp Reliance", "High Value"],
    serviceType: "hybrid",
    digitalPresenceScore: 35,
    createdAt: new Date().toISOString(),
    aiAnalysis: {
      summary: "Modern dental studio in Ring Road Accra specializing in aesthetic general dentistry and family oral hygiene.",
      digitalPresenceSummary: "Very limited. No dedicated website found; listing points is missing. Currently using generic WhatsApp link for user intake and Facebook page placeholders.",
      presenceStrength: "low",
      operationalPainPoints: [
        "High friction manual booking flow via WhatsApp",
        "No structured client database or intake history",
        "Patients struggle to see prices, services, or calendar availability"
      ],
      systemsNeeded: [
        "Patient Intake and Slot Reservation Web Tool",
        "Automated WhatsApp Bot for direct scheduling reminder",
        "Google Reviews Auto-Request Pipeline"
      ],
      aiOpportunities: [
        "Intelligent booking form using Cal.com/Calendly or Custom AI Assistant that coordinates calendar spots automatically via WhatsApp.",
        "Interactive virtual reception bot on landing page to answer patient questions about copays and operating hours."
      ],
      digitalMaturityScore: 35
    },
    webDesignProposal: {
      needDetectedReason: "Tooth wellness clinic without any standalone website footprint. Relies 100% on Map reviews, losing online credibility.",
      suggestedType: "Booking & Dental Authority Platform",
      structure: [
        { sectionName: "Hero Clinic Greeting", purpose: "First Hook", contentHint: "Highlight pain-free premium teeth procedures with direct reservation links." },
        { sectionName: "Treatment Catalogue", purpose: "Services", contentHint: "List out crowns, scales, cleanings, and pricing tables explicitly." },
        { sectionName: "Meet Our Dentists", purpose: "Relatability", contentHint: "Professional portraits of credentialed staff build patient trust." },
        { sectionName: "Interactive Appoints Portal", purpose: "High Conversion Booking", contentHint: "Direct scheduler calendar widget to claim time slots on the spot." }
      ],
      heroHeadline: "Modern, Pain-Free Dentistry in the Heart of Accra",
      heroSubheadline: "Book your expert teeth session online in seconds. Convenient dental Care with Accra's top oral doctors.",
      selectedCta: "Claim Your Spot Today",
      estimatedValue: "GH₵ 12,000 + / Month in extra patients",
      readyToSellOffer: "I'll build a responsive, patient-converting reservation system website integrated with SMS/WhatsApp notifications in 7 days."
    },
    outreachPitch: {
      email: "Dear Accra Oasis Team,\n\nI noticed your brilliant reviews on Google Maps and wanted to reach out. Many locals are looking for top-tier dental care, but since you don't have a website, they can't easily find your list of services or book slots.\n\nI specialize in building quick-converting booking websites for healthcare practices in Accra. I've drafted a layout for a portal that integrates directly with a scheduling helper. This would streamline patient intake so your team isn't glued to WhatsApp all day.\n\nCan I send you a quick 2-minute mock graphic of what this would look like?\n\nBest,\nSales Engineer",
      whatsapp: "Hello Accra Oasis Dental! 👋 I found you on Maps and saw your clients rave about your care. I noticed you don't have a website for direct clinical booking. I specialize in dental schedulers that automate slot reservations. Would you like to see a free design draft I created for you?",
      linkedin: "Hi Oasis Team, I specialize in digital operational scale for medical operations in Accra. I mapped out a high-converting web portal flow for your clinic to reduce manual receptionist load. Let's connect if you're looking to scale operations this quarter!"
    }
  },
  {
    id: "crm-2",
    name: "Lagos Freight Express & Logistics",
    category: "Courier Service",
    phone: "+234 80 987 6543",
    address: "Ikeja Industrial Avenue, Lagos, Nigeria",
    rating: 3.8,
    reviewsCount: 75,
    website: "http://lagosfreightdummy.com",
    mapsUrl: "https://maps.google.com/?cid=lagos_freight",
    latitude: 6.5244,
    longitude: 3.3792,
    status: "contacted",
    notes: "They have a basic, old, non-functional website. It is slow, lacks tracking APIs, and has broken contact forms. Direct dispatch calls coordinate everything manually.",
    tags: ["Broken Website", "Manual Dispatch", "Automate Tracking", "Hot Lead"],
    serviceType: "ai_automation",
    digitalPresenceScore: 48,
    createdAt: new Date().toISOString(),
    aiAnalysis: {
      summary: "Industrial freight logistics handler in Mainland Lagos doing heavy container shipping, home packing/delivery, and corporate relocation services.",
      digitalPresenceSummary: "Weak and obsolete. Their website was built years ago, does not resize on mobile, has broken internal links, and lacks client tracking capabilities.",
      presenceStrength: "medium",
      operationalPainPoints: [
        "Dispatched loads are tracked on Excel booklets which are read manually to querying clients.",
        "Average quote response time of 4 hours via email.",
        "Customers must call dispatcher iteratively to request order status updates."
      ],
      systemsNeeded: [
        "Internal Simple Delivery Tracking DB",
        "WhatsApp AI Spot-Quote Calculator Bot",
        "Responsive Client tracking web console"
      ],
      aiOpportunities: [
        "Integrate a conversational WhatsApp quote agent: Client sends parcel dimensions and location, the AI computes price, saves dispatch, and issues receipt in 10 seconds.",
        "Automatic SMS delivery alerts mapped to delivery updates."
      ],
      digitalMaturityScore: 48
    },
    webDesignProposal: {
      needDetectedReason: "Outdated, non-functional site from 2018 with dead interactive components and no mobile-responsiveness.",
      suggestedType: "Modern Logistical Dispatch Console & Client Site",
      structure: [
        { sectionName: "Track Shipments", purpose: "Client Service", contentHint: "Search box where customers input a dispatch number and see real-time route updates." },
        { sectionName: "Instant Quote Calculator", purpose: "Lead Gen", contentHint: "Select origin, destination, weight, and instantly get estimated shipping rate." },
        { sectionName: "Services Suite", purpose: "Sales", contentHint: "Dedicated blocks for freight, warehouse space, express parcel courier." },
        { sectionName: "Corporate Inquiry Portal", purpose: "Enterprise Closing", contentHint: "Clean layout tailored for B2B contract requests." }
      ],
      heroHeadline: "Seamless Logistics & Freight Tracking Across Nigeria",
      heroSubheadline: "Request quotes faster, monitor your packages in real-time, and streamline imports with Lagos's premier warehouse partner.",
      selectedCta: "Calculate Shipping Rate",
      estimatedValue: "₦3,500,000 / Month saved in phone support and tracking friction",
      readyToSellOffer: "Let's redesign your logistics platform with client parcel tracking and an automated WhatsApp CRM module. Completed in 10 days."
    },
    outreachPitch: {
      email: "Hello Logistics Management,\n\nI was looking to coordinate a dispatch in Lagos and checked your website. I noticed it takes a long time to load on phones and does not support shipment tracking, meaning clients have to call dispatchers iteratively to track boxes.\n\nWe specialize in automated logistic tracking and mobile-responsive websites. I've created a custom concept tracking tool that could integrate into your website so clients can self-serve delivery status reviews on their phones.\n\nThis typically reduces phone call tracking checks by 65% and optimizes quote captures. Can I send a quick video demonstration of this workflow?\n\nBest,\nAutomation Architect",
      whatsapp: "Hello Lagos Freight team! 🚚 I checked your website while arranging a delivery. The parcel calculator page seems unresponsive on mobile. I help logistics businesses build simple package tracking portals that let clients self-serve. Let me know if you'd like a quick preview!",
      linkedin: "Hi, I specialize in logistics efficiency software. I designed an interactive parcel status and shipping calculation interface for Lagos Freight providers. Let me know if you would like me to share the visual layout draft."
    }
  }
];

// Load Database
let leadsDatabase: Lead[] = [];
if (fs.existsSync(DB_FILE)) {
  try {
    const rawData = fs.readFileSync(DB_FILE, 'utf-8');
    leadsDatabase = JSON.parse(rawData);
  } catch (error) {
    console.error("Error reading database file, loading defaults:", error);
    leadsDatabase = [...INITIAL_LEADS];
  }
} else {
  leadsDatabase = [...INITIAL_LEADS];
  fs.writeFileSync(DB_FILE, JSON.stringify(leadsDatabase, null, 2));
}

// Save helper
function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(leadsDatabase, null, 2));
  } catch (error) {
    console.error("Failed to persist database file:", error);
  }
}

// Lazy load Gemini AI Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY is not defined - functioning in standard simulation mode.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Generates incredibly high-fidelity fallback data dynamically if Google Search / Gemini credentials are missing
function getRealisticFallbacks(query: string): Lead[] {
  const searchQuery = (query || '').toLowerCase();
  
  // Extract location or keyword hints
  let city = "Lagos";
  if (searchQuery.includes("accra") || searchQuery.includes("ghana")) city = "Accra";
  else if (searchQuery.includes("london") || searchQuery.includes("uk")) city = "London";
  else if (searchQuery.includes("kumasi")) city = "Kumasi";
  else if (searchQuery.includes("nairobi") || searchQuery.includes("kenya")) city = "Nairobi";
  else if (searchQuery.includes("new york") || searchQuery.includes("ny")) city = "New York";

  let industry = "Service Provider";
  if (searchQuery.includes("dentist") || searchQuery.includes("clinic") || searchQuery.includes("hospital")) industry = "Medical";
  else if (searchQuery.includes("restaurant") || searchQuery.includes("food") || searchQuery.includes("cafe")) industry = "F&B";
  else if (searchQuery.includes("logistics") || searchQuery.includes("freight") || searchQuery.includes("delivery")) industry = "Logistics";
  else if (searchQuery.includes("school") || searchQuery.includes("academy") || searchQuery.includes("tutor")) industry = "Education";
  else if (searchQuery.includes("construction") || searchQuery.includes("builder") || searchQuery.includes("architect")) industry = "Construction";
  else if (searchQuery.includes("hotel") || searchQuery.includes("resort") || searchQuery.includes("inn")) industry = "Hospitality";

  // Coordinates anchor based on guessed city
  let coords = { lat: 6.5244, lng: 3.3792 }; // Lagos
  if (city === "Accra") coords = { lat: 5.5601, lng: -0.2057 };
  else if (city === "Kumasi") coords = { lat: 6.6906, lng: -1.6244 };
  else if (city === "London") coords = { lat: 51.5074, lng: -0.1278 };
  else if (city === "Nairobi") coords = { lat: -1.2921, lng: 36.8219 };
  else if (city === "New York") coords = { lat: 40.7128, lng: -74.0060 };

  // Define templates matching guessed industry
  const names: string[] = [];
  const webStates: (string | null)[] = [];
  const tags: string[][] = [];
  const ratings: number[] = [];
  const reviewsCounts: number[] = [];
  const categories: string[] = [];
  const phones: string[] = [];
  const addresses: string[] = [];

  const phonePrefix = city === "Accra" || city === "Kumasi" ? "+233 20 " : city === "Lagos" ? "+234 81 " : city === "London" ? "+44 20 " : "+1 212 ";

  if (industry === "Medical") {
    names.push(`Prestige Care ${city} Health`, `St. Jude Specialist Clinic`, `Central Family Care Clinic`, `${city} Dental & Orthodontic Hub`);
    categories.push("Multi-Specialty Clinic", "Physiotherapy Center", "Pediatrist Clinic", "Dental Studio");
    webStates.push(null, `http://stjude${city.toLowerCase()}.com`, null, null);
    tags.push(
      ["No Website", "Manual Inquiries", "High Value", "Receptions Busy"],
      ["Legacy Web Presence", "Slow Load Speed", "No Calendar Booking"],
      ["No Website", "Facebook Reliance", "Offline Intake Form", "Opportunity"],
      ["Missing Website", "WhatsApp Bookings", "Dental Spa Setup"]
    );
    ratings.push(3.9, 4.4, 3.6, 4.2);
    reviewsCounts.push(18, 55, 9, 31);
  } else if (industry === "F&B") {
    names.push(`${city} Spices Kitchen`, `Le Bouquet Coffee & Pastry`, `Bento Grill & Eats`, `Golden Crust Bakehouse`);
    categories.push("Fine Dining African", "Cafe & Bistro", "Seafood Grill", "Traditional Bakery");
    webStates.push(null, `http://lebouquet${city.toLowerCase()}.org`, null, null);
    tags.push(
      ["No Website", "Instagram-Only Menu", "Manual Orders", "WhatsApp Reliance"],
      ["Old WordPress Menu", "Non-Mobile Responsive", "Hard to Find Location"],
      ["No Website", "Walk-Ins Primarily", "Lacks Online Checkout", "Hot Spot"],
      ["No Website", "Popular Spot", "Local Sensation", "Web Opportunity"]
    );
    ratings.push(4.6, 4.1, 3.9, 4.8);
    reviewsCounts.push(112, 43, 27, 89);
  } else if (industry === "Logistics") {
    names.push(`SwiftDelivery Logistics ${city}`, `Speedway Freight Handlers`, `Apex Cargo Hub`, `Express Parcel Packagers`);
    categories.push("Courier & Express Mail", "Third Party Warehouse", "Freight Forwarder", "Local Moving Company");
    webStates.push(`http://swiftdeliver${city.toLowerCase()}.com`, null, null, null);
    tags.push(
      ["Has Old Site", "No Tracker Link", "Customer Call Overhead"],
      ["No Website", "Call Dispatcher Directly", "Paper Receipting", "Automation Gap"],
      ["No Website", "B2B Cargo Contracts", "Manual Spot Rates", "High Potential"],
      ["No Website", "Relying on Google Listings", "Local Delivery Team"]
    );
    ratings.push(3.3, 4.1, 3.5, 4.0);
    reviewsCounts.push(62, 14, 8, 22);
  } else {
    // Default generic templates
    names.push(`${city} Hub Enterprise`, `${city} Academy of Talents`, `Solid Foundation Builders`, `Prestige Auto Repair`);
    categories.push("Business Agency", "Vocational School", "Home Restoration Contractor", "Car Maintenance Workshop");
    webStates.push(null, `http://academy${city.toLowerCase()}.com`, null, null);
    tags.push(
      ["No Website", "Relying on Maps", "Manual Leads Intake"],
      ["Legacy Website", "No Online Syllabus", "Hard to Register", "Education API"],
      ["No Website", "Great Reviews", "Missing Showcase Gallery", "Local Builder"],
      ["No Website", "Needs Appointment Scheduler", "Premium Workshop"]
    );
    ratings.push(4.2, 4.5, 3.7, 4.6);
    reviewsCounts.push(31, 48, 12, 60);
  }

  const results: Lead[] = [];
  const maxResults = Math.min(5, names.length);

  for (let i = 0; i < maxResults; i++) {
    // Offset coordinates slightly to group them on map
    const latOffset = (Math.random() - 0.5) * 0.025;
    const lngOffset = (Math.random() - 0.5) * 0.025;
    
    const isWebsiteMissing = webStates[i] === null;
    const computedScore = isWebsiteMissing 
      ? Math.floor(25 + Math.random() * 20) // 25 - 45
      : Math.floor(45 + Math.random() * 25); // 45 - 70

    results.push({
      id: `lead-mock-${i}-${Date.now()}`,
      name: names[i],
      category: categories[i],
      phone: phonePrefix + Math.floor(1000000 + Math.random() * 9000000),
      address: `${Math.floor(10 + Math.random() * 150)} Commercial Way, ${city}`,
      rating: ratings[i],
      reviewsCount: reviewsCounts[i],
      website: webStates[i],
      mapsUrl: `https://maps.google.com/?q=${encodeURIComponent(names[i] + " " + city)}`,
      latitude: coords.lat + latOffset,
      longitude: coords.lng + lngOffset,
      status: "new",
      notes: isWebsiteMissing 
        ? "Identified with high priority due to missing official website. They are losing significant organic traffic in search results." 
        : "They have a legacy online setup. User reviews are healthy, but can optimize with automated client capture forms.",
      tags: tags[i],
      serviceType: isWebsiteMissing ? 'web_design' : (Math.random() > 0.5 ? 'ai_automation' : 'hybrid'),
      digitalPresenceScore: computedScore,
      createdAt: new Date().toISOString()
    });
  }

  return results;
}

// Generates detailed dynamic analysis report as a high-grade backup fallback
function getDynamicAnalysis(lead: Lead): BusinessAnalysis {
  const strength = !lead.website ? "low" as const : "medium" as const;
  const mockMaturity = lead.website ? Math.floor(45 + Math.random() * 20) : Math.floor(20 + Math.random() * 20);
  
  const categoryLower = (lead.category || '').toLowerCase();
  const isMedical = categoryLower.includes("clinic") || categoryLower.includes("dent") || categoryLower.includes("health") || categoryLower.includes("physio") || categoryLower.includes("doctor") || categoryLower.includes("hospital");
  const isFood = categoryLower.includes("eat") || categoryLower.includes("rest") || categoryLower.includes("bak") || categoryLower.includes("cafe") || categoryLower.includes("food");
  const isLogistics = categoryLower.includes("delivery") || categoryLower.includes("freight") || categoryLower.includes("logis") || categoryLower.includes("cargo") || categoryLower.includes("courier");

  let summary = `Established local provider of ${lead.category || 'professional'} services. Prominent local reputation with steady customer traffic but untapped digital capability.`;
  let digitalPresenceSummary = "";
  let operationalPainPoints: string[] = [];
  let systemsNeeded: string[] = [];
  let aiOpportunities: string[] = [];

  if (lead.website) {
    digitalPresenceSummary = `Legacy web presence found at ${lead.website}. However, it lacks mobile responsive layouts, modern interactive widgets, direct reservation pipelines, and strong SEO metadata optimizing local searches.`;
  } else {
    digitalPresenceSummary = `Critically deficient. No official standalone web footprint discovered. The business relies exclusively on direct third-party list references (Google Maps/Facebook), presenting a major security and brand conversion threat in search queries.`;
  }

  if (isMedical) {
    summary = `Physician-led clinical workshop specializing in professional, high-standard ${lead.category} care in the community.`;
    operationalPainPoints = [
      "High front-desk phone congestion during peak appointment blocks",
      "Manual intake processing upon patient arrival, creating patient waiting delays",
      "Absence of an automated reviews outreach cycle, limiting search rankings"
    ];
    systemsNeeded = [
      "Patient Self-Booking Calendar Integration",
      "Digital Patient Intake & Health Form Portal",
      "Automated WhatsApp Consultation Check-In Bot"
    ];
    aiOpportunities = [
      "AI-driven patient inquiry answering bot hosted on WhatsApp to instantly handle standard operating and billing queries.",
      "Smart follow-up reminder agent predicting patient check-up cycles based on history and texting booking invites."
    ];
  } else if (isFood) {
    summary = `Bespoke local culinary brand offering handcrafted gourmet selections and quality curated menus for regional guests.`;
    operationalPainPoints = [
      lead.website ? "Outdated web menu which mismatches current prices and catalog offerings" : "Manual order coordination via phone calls and individual Instagram DMs",
      "Loss of potential catering and bulk booking leads due to lack of a structured corporate intake form",
      "High platform commission rates on local aggregate food delivery networks"
    ];
    systemsNeeded = [
      "Commission-Free Direct Online Ordering Hub",
      "Interactive Digital Catering & Events Request Module",
      "Google Reviews Booster automated script"
    ];
    aiOpportunities = [
      "Intelligent menu recommendation agent assisting web guests to build catering bundles based on guest dietary preferences.",
      "WhatsApp AI ordering concierge that receives custom item instructions, computes the price, and updates kitchen terminals."
    ];
  } else if (isLogistics) {
    summary = `Specialized transportation and supply workflow partner coordinating freight movements and local parcel distributions.`;
    operationalPainPoints = [
      "Customers calling customer service lines repeatedly to check shipment status updates",
      "Manual dispatch Excel tracking, prone to human documentation mismatch",
      "Quote response bottlenecks where customers wait hours to receive custom volume shipping rates"
    ];
    systemsNeeded = [
      "Self-Serve Package Status Tracking Tool",
      "Instant Shipping Route Quote Calculator",
      "Central Digital Fleet Management Dashboard"
    ];
    aiOpportunities = [
      "Automated price quote computation engine that analyzes parcel dimensions via WhatsApp and emails instant rate sheets.",
      "AI route intelligence assistant dispatching SMS-based progress alerts when drivers change transit nodes."
    ];
  } else {
    // Generic
    operationalPainPoints = [
      lead.website ? "Legacy contact forms frequently throwing capture errors" : "Manual appointment scheduling and customer inquiry coordination",
      "Zero client segmentation, restricting the ability to promote repeat business packages",
      "Unoptimized local search visibility, losing market share to tech-savvy competitors"
    ];
    systemsNeeded = [
      "Convertible Landing Page & Client Portal",
      "Interactive Scheduling and Reservations Booking Module",
      "Unified Customer CRM with Reviews Automation"
    ];
    aiOpportunities = [
      "Deploy an instant conversational customer support agent to capture customer leads 24/7 on the website.",
      "AI-driven marketing scheduler that auto-generates localized promo texts and targets passive client accounts."
    ];
  }

  return {
    summary,
    digitalPresenceSummary,
    presenceStrength: strength,
    operationalPainPoints,
    systemsNeeded,
    aiOpportunities,
    digitalMaturityScore: mockMaturity
  };
}

// Generates dynamic website proposals as high-grade backups
function getDynamicProposal(lead: Lead, analysis?: BusinessAnalysis): WebDesignProposal {
  const categoryLower = (lead.category || '').toLowerCase();
  const isMedical = categoryLower.includes("clinic") || categoryLower.includes("dent") || categoryLower.includes("health") || categoryLower.includes("physio") || categoryLower.includes("doctor") || categoryLower.includes("hospital");
  const isFood = categoryLower.includes("eat") || categoryLower.includes("rest") || categoryLower.includes("bak") || categoryLower.includes("cafe") || categoryLower.includes("food");
  const isLogistics = categoryLower.includes("delivery") || categoryLower.includes("freight") || categoryLower.includes("logis") || categoryLower.includes("cargo") || categoryLower.includes("courier");

  const needDetectedReason = lead.website
    ? `Obsolete web platform that looks broken on modern smartphone sizes and fails to provide secure booking features.`
    : `Total online invisibility. Competitors with actual websites are capturing more clients who search Google Map/general directories.`;

  let suggestedType = "Modern Business Conversion Portal";
  let structure: WebDesignStructureSection[] = [];
  let heroHeadline = `Your Premier Partner for ${lead.category || 'Professional'} Excellence`;
  let heroSubheadline = `Experience reliable, top-tier service tailored to your absolute convenience. Secure your appointment or check rates online in seconds.`;
  let selectedCta = "Book Your Session Now";
  let estimatedValue = "$1,500/mo";
  const readyToSellOffer = `I will build a high-performance, mobile-optimized business website equipped with real-time automated appointment booking and customer SMS updates in 7 days flat.`;

  const searchStr = ((lead.address || '') + " " + (lead.name || '')).toLowerCase();
  let currency = "$";
  if (searchStr.includes("accra") || searchStr.includes("ghana")) currency = "GH₵";
  else if (searchStr.includes("lagos") || searchStr.includes("nigeria")) currency = "₦";
  else if (searchStr.includes("london") || searchStr.includes("uk") || searchStr.includes("pound")) currency = "£";

  if (isMedical) {
    suggestedType = "Clinical Patient Intel-Scheduler Hub";
    structure = [
      { sectionName: "Medical Core Promise", purpose: "Patient comfort & clinical safety credential", contentHint: `Showcase certified specialists for ${lead.category}, highlight pain-free treatment policies, and provide instant reservation triggers.` },
      { sectionName: "Interactive Treatment Scheduler", purpose: "Erase front office manual calls", contentHint: "Clean, calendar-based interface where patients choose a treatment category, select their doctor, and lock a clinical slot." },
      { sectionName: "Patient Success Stories", purpose: "Social validation and clinic trust", contentHint: "High-contrast carousel of verified local Google reviews showcasing real patient experiences." },
      { sectionName: "Clinical FAQs & Pricing Care", purpose: "Reduce intake friction", contentHint: "Clear, reassuring breakdowns of standard consultations, copays, and accepted insurances." }
    ];
    heroHeadline = `State-of-the-Art ${lead.category || 'Clinical'} Care for You and Your Family`;
    heroSubheadline = `Get exceptional, certified treatments without long waiting lines or complex calling setups. Schedule your clinical appointment online in under a minute.`;
    selectedCta = "Claim My Medical Appointment Slot";
    estimatedValue = currency === "GH₵" ? "GH₵ 12,500/mo" : currency === "₦" ? "₦1,800,000/mo" : "£2,200/mo";
  } else if (isFood) {
    suggestedType = "Direct Commission-Free Delivery & Menu Engine";
    structure = [
      { sectionName: "Hero Visual Gastro Grille", purpose: "Visual taste hook & CTA", contentHint: "Ultra-crisp photography of core plated recipes with high-contrast 'Order Direct' and 'Reserve Table' action buttons." },
      { sectionName: "Interactive Live Menu Catalogue", purpose: "Drive cart checkout", contentHint: "Digital categorized menu showing price ranges, special ingredients, and instant add-to-cart mechanisms." },
      { sectionName: "Direct Table Reservation Console", purpose: "Erase manual reservation tracking", contentHint: "Simple calendar booking portal allowing patrons to claim dining tables & specify guest tallies." },
      { sectionName: "Private Events & Catering Planner", purpose: "Unlock high-margin deals", contentHint: "Custom inquiries form allowing corporate planners to select party packages and receive automated price bids." }
    ];
    heroHeadline = `Savor Handcrafted Culinary Creations Direct to Your Door`;
    heroSubheadline = `Skip the high platform delivery commissions. Order your favorite dishes direct from our chef's kitchen or book table reservations online in seconds.`;
    selectedCta = "Order Direct & Save 15%";
    estimatedValue = currency === "GH₵" ? "GH₵ 8,000/mo" : currency === "₦" ? "₦950,000/mo" : "£1,400/mo";
  } else if (isLogistics) {
    suggestedType = "Interactive Cargo Route & Dispatch Dashboard";
    structure = [
      { sectionName: "Instant Delivery Status Tracker", purpose: "Instant self-serve package location lookup", contentHint: "Clean search widget where clients type their tracking number and see their current route phase on a map." },
      { sectionName: "Freight Cargo Rate Calculator", purpose: "Drive inbound shipping orders", contentHint: "Dynamic input form where business partners input weight, parcel class, origin, and destination to get real-time price sheets." },
      { sectionName: "Our Distribution Network", purpose: "Authority & reliability showcase", contentHint: "Interactive regional maps highlighting transport nodes, warehouse storage capacities, and express flight lanes." },
      { sectionName: "Commercial Enterprise Shipping Portal", purpose: "High-volume business capture", contentHint: "Direct onboarding frame for corporate logistics contracts with bulk dispatch discounts." }
    ];
    heroHeadline = `Fast, Reliable Cargo Dispatch & Real-Time Package Tracking`;
    heroSubheadline = `Compute instant logistics quotes and monitor your items every step of the transit route. Professional delivery solutions for enterprise and local shippers.`;
    selectedCta = "Calculate Shipping Rates Instantly";
    estimatedValue = currency === "GH₵" ? "GH₵ 25,000/mo" : currency === "₦" ? "₦3,800,000/mo" : "£4,500/mo";
  } else {
    // Generic
    structure = [
      { sectionName: "Service Offer Core Promise", purpose: "Local expertise value hook", contentHint: `Bold visual of ${lead.name || 'your'} operations, highlighting certified results, speed, and immediate contact buttons.` },
      { sectionName: "Interactive Booking & Consult Form", purpose: "Erase back-and-forth appointment calls", contentHint: "Calendar interface allowing visitors to select their needed service type and lock a confirmed session." },
      { sectionName: "Visual Gallery of Completed Work", purpose: "Premium proof of work", contentHint: "High-contrast before/after grid or high-definition project showcase displaying recent work with customer satisfaction scores." },
      { sectionName: "Client Success Carousel", purpose: "Erase buyer hesitation", contentHint: "Interactive feedback grid syncing actual Google review ratings with custom text, highlighting your reliability." }
    ];
    heroHeadline = `The Community's Most Reliable ${lead.category || 'Service'} Solutions`;
    heroSubheadline = `Expert, certified service delivered on-time, every time. Book your fast consultation or request a custom quote online with our local team.`;
    selectedCta = "Schedule Your Expert Consultation";
    estimatedValue = currency === "GH₵" ? "GH₵ 6,000/mo" : currency === "₦" ? "₦800,000/mo" : "£1,200/mo";
  }

  return {
    needDetectedReason,
    suggestedType,
    structure,
    heroHeadline,
    heroSubheadline,
    selectedCta,
    estimatedValue,
    readyToSellOffer
  };
}

// Generates dynamic consulting proposal cold pitches
function getDynamicPitch(lead: Lead, analysis: BusinessAnalysis, proposal?: WebDesignProposal): OutreachPitch {
  const currentProp = proposal || getDynamicProposal(lead, analysis);
  const ratingText = lead.rating ? `${lead.rating}/5 stars from ${lead.reviewsCount} local reviews` : "great ratings";
  
  const emailSubject = lead.website 
    ? `Redesign proposal for ${lead.name} to optimize client conversions`
    : `Quick interactive layout check for ${lead.name} team`;

  const leadNameClean = (lead.name || 'your business').replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');

  const email = `Subject: ${emailSubject}

Dear ${leadNameClean} Team,

I came across your business while researching the local area and saw your excellent rating on Google Maps (${ratingText}). Your reviews show that you have a wonderful reputation for quality in the community.

However, I noticed a digital checkpoint that is currently limiting your client conversions:
${lead.website ? `The website listed on your profile has dynamic mobile-responsiveness issues, meaning local customers searching on their phones see a broken, outdated layout that doesn't support easy online bookings.` : `Your business currently does not have an official website listed on your business profile. This means local customers searching for ${lead.category} services might be choosing competitors who offer a direct booking page.`}

I specialize in building rapid, high-converting platforms specifically for ${lead.category || 'local'} providers. I actually sketched out an interactive web proposal concept specifically for ${lead.name} that solves this friction:
• It features: ${currentProp.structure.map(s => s.sectionName).slice(0, 3).join(', ')}.
• Integrated CTA: "${currentProp.selectedCta}".
• Expected Outcome: This typically streamlines customer onboarding and recaptures significant booking revenue.

I have a quick graphic concept of this mockup ready to share. Would you be open to a 2-minute screenshot review of how this looks?

Best regards,

Sales Intelligence Partner`;

  const linkedin = `Hi ${leadNameClean} team! Saw your stellar ${ratingText} and love the customer care you provide. Since you handle scheduling manually, I custom-designed an interactive patient/client scheduler website concept specifically for your category to capture more organic searches automatically. Happy to share a 2-minute screenshot mockup of the custom wireframe layout with you? Let's connect!`;

  const whatsapp = `Hello ${leadNameClean} team! 👋 Saw you has amazing local reviews (${ratingText})! I noticed you are currently taking bookings manually via WhatsApp. I actually put together a professional website & calendar booking layout specifically designed to automate client signups for ${lead.name}! Would you like me to send over the visual preview mockups for free? let me know!`;

  return {
    email,
    linkedin,
    whatsapp
  };
}

// CRM Endpoints
app.get('/api/crm/leads', (req, res) => {
  res.json(leadsDatabase);
});

app.post('/api/crm/leads', (req, res) => {
  const newLead: Lead = {
    ...req.body,
    id: req.body.id || `lead-crm-${Date.now()}`,
    status: req.body.status || 'new',
    createdAt: req.body.createdAt || new Date().toISOString(),
    notes: req.body.notes || 'Saved from search results.',
    tags: req.body.tags || []
  };

  // Prevent duplicates
  const exists = leadsDatabase.some(l => l.name === newLead.name && l.address === newLead.address);
  if (exists) {
    return res.status(400).json({ error: "Lead already exists in your CRM Pipeline." });
  }

  leadsDatabase.push(newLead);
  saveDatabase();

  // Broadcast the new lead to all clients in real-time
  broadcast({ type: 'lead_created', lead: newLead });

  res.status(201).json(newLead);
});

app.put('/api/crm/leads/:id', (req, res) => {
  const { id } = req.params;
  const leadIndex = leadsDatabase.findIndex(l => l.id === id);
  if (leadIndex === -1) {
    return res.status(404).json({ error: "Lead not found in CRM database." });
  }

  leadsDatabase[leadIndex] = {
    ...leadsDatabase[leadIndex],
    ...req.body
  };

  saveDatabase();

  // Broadcast the updated lead to all clients in real-time
  broadcast({ type: 'lead_updated', lead: leadsDatabase[leadIndex] });

  res.json(leadsDatabase[leadIndex]);
});

app.delete('/api/crm/leads/:id', (req, res) => {
  const { id } = req.params;
  const leadIndex = leadsDatabase.findIndex(l => l.id === id);
  if (leadIndex === -1) {
    return res.status(404).json({ error: "Lead not found." });
  }

  leadsDatabase.splice(leadIndex, 1);
  saveDatabase();

  // Broadcast the deletion event to all clients in real-time
  broadcast({ type: 'lead_deleted', id });

  res.json({ success: true, message: "Lead removed from pipeline successfully." });
});

app.get('/api/crm/stats', (req, res) => {
  const total = leadsDatabase.length;
  const noWebsite = leadsDatabase.filter(l => !l.website).length;
  const contacted = leadsDatabase.filter(l => l.status !== 'new').length;
  const replied = leadsDatabase.filter(l => l.status === 'replied' || l.status === 'interested' || l.status === 'closed').length;
  const meeting = leadsDatabase.filter(l => l.status === 'interested' || l.status === 'closed').length;
  
  // Custom estimated conversion math
  const closedCount = leadsDatabase.filter(l => l.status === 'closed').length;
  const conversionRate = total > 0 ? Math.round((closedCount / total) * 100) : 0;
  
  // Pipeline estimated revenue based on service types:
  // web_design = GH₵/₦/$ 1,500 average, ai_automation = 2,500 average, hybrid = 4,000 progress
  const revenue = leadsDatabase.reduce((acc, lead) => {
    if (lead.status === 'closed') {
      const value = lead.serviceType === 'web_design' ? 1500 : lead.serviceType === 'ai_automation' ? 2500 : 4000;
      return acc + value;
    } else if (lead.status === 'interested') {
      const value = (lead.serviceType === 'web_design' ? 1500 : lead.serviceType === 'ai_automation' ? 2500 : 4000) * 0.5; // weighted
      return acc + value;
    }
    return acc;
  }, 0);

  res.json({
    totalLeads: total,
    noWebsite,
    contactedLeads: contacted,
    repliesReceived: replied,
    meetingsBooked: meeting,
    conversionRate,
    estimatedPipelineRevenue: revenue
  });
});

// Search API utilizing Gemini Search Grounding
app.post('/api/leads/search', async (req, res) => {
  const { query, location } = req.body;
  const fullSearchQuery = location ? `${query} in ${location}` : query;
  
  if (!query) {
    return res.status(400).json({ error: "Search query string is required" });
  }

  console.log(`Processing lead discovery query in search gateway: "${fullSearchQuery}"`);
  
  const client = getGeminiClient();
  if (!client) {
    // Safe fallback mode
    const fallbacks = getRealisticFallbacks(fullSearchQuery);
    return res.json({ 
      leads: fallbacks, 
      isFallback: true, 
      notice: "Simulated response: set GEMINI_API_KEY for live sales grounding feeds." 
    });
  }

  try {
    const systemPrompt = `You are an expert sales discovery intelligence scraper.
Given the target search: "${fullSearchQuery}", perform a live web search using Google Search tools.
Locate exactly 4 to 5 REAL local business entities matching the query.
Determine if they have an active website or not. If they do not, note "website": null.
Compute a realistic Digital Presence Score from 0 to 100 (where having a great website + ratings = 85+, and no website = 25-45).
Identify key tags like 'No Website', 'Facebook relying', 'WhatsApp booking', etc.
Return a STRICT valid JSON array enclosing ONLY the matching businesses. Make sure coordinates (latitude/longitude) are realistic numerical values.
No conversational wrapper text. Do not return markdown except inside markdown response code scopes if required, but with responseMimeType: "application/json" you must return RAW clean JSON array.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: systemPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING },
              phone: { type: Type.STRING },
              address: { type: Type.STRING },
              rating: { type: Type.NUMBER },
              reviewsCount: { type: Type.INTEGER },
              website: { type: Type.STRING },
              mapsUrl: { type: Type.STRING },
              latitude: { type: Type.NUMBER },
              longitude: { type: Type.NUMBER },
              digitalPresenceScore: { type: Type.INTEGER },
              serviceType: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["name", "category", "address", "digitalPresenceScore", "serviceType", "tags"]
          }
        }
      }
    });

    const text = response.text;
    if (text) {
      const parsedLeads = JSON.parse(text.trim());
      // Append generated ID and creation time
      const finalLeads = parsedLeads.map((item: any, index: number) => ({
        ...item,
        id: `lead-found-${index}-${Date.now()}`,
        status: 'new',
        createdAt: new Date().toISOString(),
        notes: item.website ? "Identified older digital framework. Recommend interactive automated chatbots." : "Zero website presence discovered. High potential web design design offer target.",
        phone: item.phone || null,
        rating: item.rating || null,
        reviewsCount: item.reviewsCount || null,
        website: item.website || null,
        mapsUrl: item.mapsUrl || `https://maps.google.com/?q=${encodeURIComponent(item.name + " " + (location || ''))}`,
        latitude: item.latitude || 5.55 + (Math.random() - 0.5) * 0.04,
        longitude: item.longitude || -0.20 + (Math.random() - 0.5) * 0.04
      }));
      return res.json({ leads: finalLeads, isFallback: false });
    }
  } catch (error) {
    console.warn("Gemini grounding failure. Scaling to high-grade fallbacks.", error);
  }

  // Final graceful fallback if anything goes wrong (such as 429 quota exhaustion)
  const fallbacks = getRealisticFallbacks(fullSearchQuery);
  res.json({ 
    leads: fallbacks, 
    isFallback: true, 
    notice: "Standard Search quota limit hit. Seamlessly scaled to local High-Grade Offline Intelligence." 
  });
});

// Deep AI CRM Business Analyzer API
app.post('/api/leads/analyze', async (req, res) => {
  const { lead } = req.body as { lead: Lead };
  if (!lead) return res.status(400).json({ error: "Target lead data is required." });

  console.log(`Deep-analyzing business profile: "${lead.name}"`);

  const client = getGeminiClient();
  if (!client) {
    // Generate high-fidelity simulated analysis structure
    const mockAnalysis = getDynamicAnalysis(lead);
    return res.json({ 
      analysis: mockAnalysis, 
      isFallback: true, 
      fallbackReason: "Offline Mode Active" 
    });
  }

  try {
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Provide a detailed Business Summary, Digital Presence Analysis, and Operational pain point breakdown for the following business:
Name: ${lead.name}
Category: ${lead.category}
Phone: ${lead.phone || 'N/A'}
Address: ${lead.address}
Website: ${lead.website || 'None'}
Global Rating: ${lead.rating || 'N/A'} (Reviews: ${lead.reviewsCount || 0})

Map out:
1. Short 2-sentence summary of what the business does.
2. Digital presence summaries and categorized strength ("low", "medium", or "high").
3. A list of 3 specific operational pain points (e.g. manual calendar booking, WhatsApp-based receptionists bottlenecking, lack of follow-up).
4. List of 3 systems or tools needed (e.g., custom client booking portal, reviews aggregator).
5. 2 custom AI opportunity recommendations (e.g., WhatsApp AI bots, smart invoice triggers).
6. A digital maturity score (integer 0 to 100).
Return STRICT JSON matching the BusinessAnalysis structure.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            digitalPresenceSummary: { type: Type.STRING },
            presenceStrength: { type: Type.STRING, enum: ["low", "medium", "high"] },
            operationalPainPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            systemsNeeded: { type: Type.ARRAY, items: { type: Type.STRING } },
            aiOpportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
            digitalMaturityScore: { type: Type.INTEGER }
          },
          required: ["summary", "digitalPresenceSummary", "presenceStrength", "operationalPainPoints", "systemsNeeded", "aiOpportunities", "digitalMaturityScore"]
        }
      }
    });

    if (response.text) {
      return res.json({ analysis: JSON.parse(response.text.trim()), isFallback: false });
    }
  } catch (error) {
    console.warn("Gemini analyze failed. Returning high-grade backup fallback.", error);
  }

  // Graceful fallback for quota / model exceptions
  const mockAnalysis = getDynamicAnalysis(lead);
  res.json({ 
    analysis: mockAnalysis, 
    isFallback: true, 
    fallbackReason: "Gemini API Quota Exceeded. Load high-grade simulated analysis content." 
  });
});

// Web Design Opportunity Proposal Generator API
app.post('/api/leads/propose', async (req, res) => {
  const { lead, analysis } = req.body as { lead: Lead, analysis: BusinessAnalysis };
  if (!lead) return res.status(400).json({ error: "Target lead data is required." });

  console.log(`Creating custom Web Design Proposal for: "${lead.name}"`);

  const client = getGeminiClient();
  if (!client) {
    // Elegant fallbacks
    const mockProposal = getDynamicProposal(lead, analysis);
    return res.json({ proposal: mockProposal, isFallback: true });
  }

  try {
    const systemPrompt = `You are an expert sales design strategist.
Generate a tailored Web Design Proposition for:
Name: ${lead.name}
Category: ${lead.category}
Website Status: ${lead.website || 'No website found'}
Summary of Gaps: ${analysis?.digitalPresenceSummary || 'No existing website or poor interactive elements.'}

Prepare:
1. needDetectedReason (summarize why they urgently need a site)
2. suggestedType (e.g., 'Booking Site', 'Corporate Lead Engine', 'E-commerce platform')
3. structure (array of 4 key pages/sections, with sectionName, purpose, and contentHint)
4. heroHeadline (compelling copy)
5. heroSubheadline (compelling copy)
6. selectedCta (converting CTA button label)
7. estimatedValue (monetizable monthly impact score, e.g. "GH₵ 8,000/mo in scheduling slots" or "$2,000/mo recaptured")
8. readyToSellOffer (A concise and convincing pitch offer that the CRM operator can paste)
Return STRICT valid JSON matching the WebDesignProposal structure.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            needDetectedReason: { type: Type.STRING },
            suggestedType: { type: Type.STRING },
            structure: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sectionName: { type: Type.STRING },
                  purpose: { type: Type.STRING },
                  contentHint: { type: Type.STRING }
                },
                required: ["sectionName", "purpose", "contentHint"]
              }
            },
            heroHeadline: { type: Type.STRING },
            heroSubheadline: { type: Type.STRING },
            selectedCta: { type: Type.STRING },
            estimatedValue: { type: Type.STRING },
            readyToSellOffer: { type: Type.STRING }
          },
          required: ["needDetectedReason", "suggestedType", "structure", "heroHeadline", "heroSubheadline", "selectedCta", "estimatedValue", "readyToSellOffer"]
        }
      }
    });

    if (response.text) {
      return res.json({ proposal: JSON.parse(response.text.trim()), isFallback: false });
    }
  } catch (err) {
    console.warn("Propose Gemini failed. Rendering high-grade offline backup.", err);
  }

  // Graceful backup fallback
  const mockProposal = getDynamicProposal(lead, analysis);
  res.json({ proposal: mockProposal, isFallback: true });
});

// Pitch Copy Generator
app.post('/api/leads/pitch', async (req, res) => {
  const { lead, analysis, proposal } = req.body as { lead: Lead, analysis: BusinessAnalysis, proposal?: WebDesignProposal };
  if (!lead) return res.status(400).json({ error: "Target lead data is required." });

  console.log(`Generating pitch copy for: "${lead.name}"`);

  const client = getGeminiClient();
  if (!client) {
    const pitch = getDynamicPitch(lead, analysis, proposal);
    return res.json({ pitch, isFallback: true });
  }

  try {
    const systemPrompt = `You are a high-tier cold consulting specialist.
Write three hyper-effective, personalized outreach pitches (Email, LinkedIn message, WhatsApp message) for:
Business: ${lead.name}
Category: ${lead.category}
Contact Number: ${lead.phone || 'N/A'}
Website Status: ${lead.website ? 'Legacy website exists at ' + lead.website : 'No website found'}
Critical Paint Point: ${analysis?.operationalPainPoints?.[0] || 'Manual booking intake'}
Suggested Offer: ${proposal?.readyToSellOffer || 'Responsive booking web portal'}

Ensure:
1. They are brief, respectful of business owners' time, and highly outcome-oriented.
2. Direct references to local community reviews or ratings.
3. No fluffy marketing, zero mass-spam feel. Speak like a local software freelancer / agency peer.
Return STRICT valid JSON matching OutreachPitch structure.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            email: { type: Type.STRING, description: "With subject line and spaced paragraphs" },
            linkedin: { type: Type.STRING, description: "Short, direct hook message" },
            whatsapp: { type: Type.STRING, description: "Friendly, casual introductory message with emojis" }
          },
          required: ["email", "linkedin", "whatsapp"]
        }
      }
    });

    if (response.text) {
      return res.json({ pitch: JSON.parse(response.text.trim()), isFallback: false });
    }
  } catch (err) {
    console.warn("Pitch copy generation failed. Rendering premium backup copywriting.", err);
  }

  // Graceful backup fallback
  const pitch = getDynamicPitch(lead, analysis, proposal);
  res.json({ pitch, isFallback: true });
});

// Follow-up Generator
app.post('/api/leads/followup', async (req, res) => {
  const { lead, previousStatus, attempt } = req.body;
  if (!lead) return res.status(400).json({ error: "Lead is required." });

  const client = getGeminiClient();
  const attemptNum = attempt || 1;

  const getMockFollowup = () => {
    return {
      message: `Hi ${(lead.name || 'there').replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '')} team! 👋 Just following up on my previous note. I know you're busy serving customers. I wanted to see if you had 2 minutes to look at the quick interactive online calendar template I custom-made for your ${lead.category || 'business'} services. It would let clients self-book directly. Would you be open to reviewing it tomorrow?`
    };
  };

  if (!client) {
    return res.json({ ...getMockFollowup(), isFallback: true });
  }

  try {
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Create a follow-up outreach message (Attempt #${attemptNum}) for the business "${lead.name}" (${lead.category}).
Previous history: They were contacted with a web design or automation proposal but have not responded yet.
Keep it extremely polite, human, low-pressure, and high value. Focus on solving booking friction and saving time.
Return a simple JSON enclosing a "message" string property.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING }
          },
          required: ["message"]
        }
      }
    });
    if (response.text) {
      return res.json({ ...JSON.parse(response.text.trim()), isFallback: false });
    }
  } catch (err) {
    console.warn("Follow up generation failed. Returning mock.", err);
  }

  res.json({ ...getMockFollowup(), isFallback: true });
});

// AI CRM Lead Status Summarizer endpoint
app.post('/api/crm/leads/:id/summarize', async (req, res) => {
  const { id } = req.params;
  const lead = leadsDatabase.find(l => l.id === id);
  if (!lead) {
    return res.status(404).json({ error: "Lead not found" });
  }

  const client = getGeminiClient();

  const getFallbackSummary = () => {
    return {
      summary: `• **Stage Analysis**: Currently staged in "${lead.status.toUpperCase()}" with a digital health score of ${lead.digitalPresenceScore}%.\n• **Pain Points**: ${lead.website ? 'Legacy website active' : 'Has no website listed'} with notes: "${lead.notes}".\n• **Action Proposal**: Re-initiate contact to address specific delivery, intake or layout conversion optimizations.`
    };
  };

  if (!client) {
    return res.json({ ...getFallbackSummary(), isFallback: true });
  }

  try {
    const prompt = `You are a high-performance CRM intelligence optimizer.
Generate a concise, elite AI summary (maximum 3 bullet points, friendly but highly professional sales-focused tone) analyzing the current CRM status and recent notes of this lead. Do not include introductory text, start directly with the first bullet point. Use markdown formatting.

Lead Name: ${lead.name}
Category: ${lead.category}
Current Pipeline Stage: ${lead.status}
Service Type: ${lead.serviceType}
Digital Presence Score: ${lead.digitalPresenceScore}%
Lead Notes & Progress History: ${lead.notes}

Structure your response with:
1. Current status assessment.
2. Summary of key bottlenecks / progress signals described in the notes or presence score.
3. Recommended immediate high-conversion next action.

Return a simple JSON enclosing a "summary" string property (with nice markdown bullets inside).`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING }
          },
          required: ["summary"]
        }
      }
    });

    if (response.text) {
      return res.json({ ...JSON.parse(response.text.trim()), isFallback: false });
    }
  } catch (err) {
    console.warn("CRM Lead status summary generation failed. Returning simulation summary.", err);
  }

  res.json({ ...getFallbackSummary(), isFallback: true });
});


// Serve React application assets
async function startServer() {
  const server = createServer(app);

  if (process.env.NODE_ENV !== "production") {
    // Dev Mode via Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode serving compiled static assets
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind WebSocket upgrade handling
  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server fully operational with WebSocket support on core port ${PORT}`);
  });
}

startServer();
