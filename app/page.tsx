"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

interface CardButton { label: string; style?: "primary" | "default"; href?: string }
interface AdaptiveCard {
  title?: string;
  fields?: { label: string; value: string; color?: string }[];
  bullets?: string[];
  buttons?: CardButton[];
  file?: { name: string; size: string };
  statusRows?: { icon: "check" | "pending" | "clock"; text: string; color?: string }[];
}

interface Msg {
  from: "user" | "bot" | string;
  text: string;
  time: string;
  card?: AdaptiveCard;
  reactions?: string[];
  isDate?: boolean;
  thinking?: boolean;
}

interface Step {
  prompt: string;
  userMsg: Msg;
  botMsgs: Msg[];
  isAttach?: boolean;
}

interface Chat {
  id: string;
  name: string;
  initials: string;
  color: string;
  isGroup?: boolean;
  members?: string;
  section: "favorites" | "directs";
  preview: string;
  previewTime: string;
  messages: Msg[];
  steps: Step[];
}

interface FakeChat {
  name: string;
  avatar: string;
  preview: string;
  time: string;
}

interface SidebarConfig {
  urgentIds: string[];
  fakeTeam: FakeChat[];
}

/* ================================================================== */
/*  Agent name resolver                                               */
/* ================================================================== */

function agentDisplayName(_chatId: string): string {
  return "Diligent Governance Agent";
}

const FAKE_TEAM_CHATS: FakeChat[] = [
  { name: "Tom Henderson", avatar: "https://randomuser.me/api/portraits/med/men/32.jpg", preview: "Sure, I'll send the updated deck by EOD", time: "9:41 AM" },
  { name: "Priya Sharma", avatar: "https://randomuser.me/api/portraits/med/women/26.jpg", preview: "Can you review the contract redlines?", time: "Yesterday" },
  { name: "Alex Kim", avatar: "https://randomuser.me/api/portraits/med/men/75.jpg", preview: "Thanks for the heads up on the filing", time: "Yesterday" },
  { name: "Rachel Green", avatar: "https://randomuser.me/api/portraits/med/women/17.jpg", preview: "Risk register updated — see attached", time: "Yesterday" },
  { name: "Michael Torres", avatar: "https://randomuser.me/api/portraits/med/men/45.jpg", preview: "Budget approved for Q2 audit", time: "Mon" },
  { name: "Sarah Chen", avatar: "https://randomuser.me/api/portraits/med/women/51.jpg", preview: "Drafted the board resolution — LMK", time: "Mon" },
  { name: "Kevin Liu", avatar: "https://randomuser.me/api/portraits/med/men/22.jpg", preview: "FYI the vendor responded to our RFP", time: "Mon" },
  { name: "Angela Brooks", avatar: "https://randomuser.me/api/portraits/med/women/68.jpg", preview: "Lunch Thursday?", time: "Mar 7" },
];

const SIDEBAR_PER_PERSPECTIVE: Record<string, SidebarConfig> = {
  "gov-agent":         { urgentIds: ["gov-agent"], fakeTeam: FAKE_TEAM_CHATS.slice(0, 5) },
  "meeting-materials": { urgentIds: ["meeting-materials"], fakeTeam: FAKE_TEAM_CHATS.slice(0, 5) },
  "q3-portfolio":      { urgentIds: ["q3-portfolio"], fakeTeam: FAKE_TEAM_CHATS.slice(0, 5) },
};

/* ================================================================== */
/*  Conversation Data                                                  */
/* ================================================================== */

const CHATS: Chat[] = [
  /* ---- Governance Agent — Subsidiary Director Term Expiry ---- */
  {
    id: "gov-agent",
    name: "Diligent Governance Agent",
    initials: "GA",
    color: "#0078D4",
    section: "favorites",
    preview: "Action required: board member term expiring...",
    previewTime: "9:15 AM",
    messages: [],
    steps: [
      {
        prompt: "Yes, I already have someone in mind",
        userMsg: { from: "user", text: "Yes, I already have someone in mind for the replacement.", time: "9:18 AM" },
        botMsgs: [
          { from: "bot", text: "Perfect. Could you share the nominee's full name and current role? I'll cross-check their qualifications, flag any potential conflicts of interest, and verify they meet the independence requirements for Acme Holdings Europe Ltd.", time: "9:18 AM", card: {
            buttons: [
              { label: "Enter nominee details", style: "primary" },
              { label: "Not ready yet" },
            ],
          }},
        ],
      },
      {
        prompt: "Enter nominee details",
        userMsg: { from: "user", text: "The nominee is Dr. Elena Vasquez — she's currently an independent board member at two other European subsidiaries and has 15 years of financial services experience.", time: "9:20 AM" },
        botMsgs: [
          { from: "bot", text: "Running qualification check for Dr. Elena Vasquez...", time: "9:20 AM", thinking: true },
          { from: "bot", text: "", time: "9:21 AM", card: {
            title: "Nominee Qualification Check — Dr. Elena Vasquez",
            statusRows: [
              { icon: "check", text: "Independence criteria — passed", color: "#3FB950" },
              { icon: "check", text: "No conflicts of interest detected", color: "#3FB950" },
              { icon: "check", text: "Meets EU subsidiary director requirements", color: "#3FB950" },
              { icon: "pending", text: "Board skills matrix gap analysis — pending your confirmation", color: "#F0883E" },
            ],
            bullets: [
              "Dr. Vasquez's financial services background directly addresses the current gap in the Acme Holdings Europe Ltd. board skills matrix",
              "She currently serves on 2 other boards — within the recommended maximum of 4 for non-executives",
              "I'll prepare the resolution and notify the subsidiary registrar once you confirm",
            ],
            buttons: [
              { label: "Confirm nomination & prepare resolution", style: "primary" },
              { label: "Request more details" },
            ],
          }},
        ],
      },
      {
        prompt: "Confirm nomination & prepare resolution",
        userMsg: { from: "user", text: "Confirmed — please prepare the board resolution and start the onboarding process.", time: "9:23 AM" },
        botMsgs: [
          { from: "bot", text: "", time: "9:23 AM", card: {
            title: "Resolution Prepared & Workflow Initiated",
            statusRows: [
              { icon: "check", text: "Board resolution drafted — ready for signature", color: "#3FB950" },
              { icon: "check", text: "Subsidiary registrar notified (Companies House UK)", color: "#3FB950" },
              { icon: "check", text: "Onboarding pack sent to Dr. Elena Vasquez", color: "#3FB950" },
              { icon: "clock", text: "D&O insurance update — in progress", color: "#8B8B8B" },
              { icon: "clock", text: "Director register update — scheduled for filing", color: "#8B8B8B" },
            ],
            file: { name: "Board_Resolution_Acme_Holdings_Europe_Director_Appointment.pdf", size: "84 KB" },
            bullets: ["All entities under Acme's subsidiary tree have been scanned — no other director terms expire in the next 90 days."],
          }},
          { from: "bot", text: "The resolution is ready for execution in Diligent Entities. I'll track the filing and notify you once Companies House confirms the appointment.", time: "9:23 AM" },
        ],
      },
    ],
  },

  /* ---- Q3 Portfolio — 5 Subsidiaries ---- */
  {
    id: "q3-portfolio",
    name: "Diligent Governance Agent",
    initials: "GA",
    color: "#0078D4",
    section: "favorites",
    preview: "14 Q3 governance actions across 5 entities...",
    previewTime: "10:05 AM",
    messages: [],
    steps: [
      {
        prompt: "Show me the full Q3 breakdown",
        userMsg: { from: "user", text: "Show me the full Q3 breakdown across all five entities.", time: "10:07 AM" },
        botMsgs: [
          { from: "bot", text: "Here's everything due across your subsidiary portfolio for Q3:", time: "10:07 AM", card: {
            title: "Q3 Governance Breakdown — 5 Entities",
            fields: [
              { label: "🇬🇧 Acme Holdings Europe Ltd.", value: "AGM filing · Confirmation statement · Director register update (3 actions)" },
              { label: "🇩🇪 Acme GmbH", value: "Supervisory board meeting · Annual financial statements due Sep 1 (2 actions)" },
              { label: "🇫🇷 Acme SAS", value: "Q3 board meeting · Statutory auditor report · Beneficial ownership update (3 actions)" },
              { label: "🇪🇸 Acme Iberia S.L.", value: "Director re-election (2 seats) · Annual accounts filing Sep 30 (3 actions)" },
              { label: "🇮🇹 Acme Italia S.r.l.", value: "Extraordinary general meeting · Quota transfer docs · Notary filing (3 actions)" },
            ],
            statusRows: [
              { icon: "pending", text: "4 actions overdue or due within 30 days", color: "#F85149" },
              { icon: "pending", text: "6 actions due in 31–60 days", color: "#F0883E" },
              { icon: "clock",   text: "4 actions scheduled for late Q3", color: "#8B8B8B" },
            ],
            buttons: [
              { label: "Assign tasks & confirm deadlines", style: "primary" },
              { label: "Export to governance calendar" },
            ],
          }},
        ],
      },
      {
        prompt: "Assign tasks & confirm deadlines",
        userMsg: { from: "user", text: "Go ahead and assign all tasks with recommended deadlines.", time: "10:09 AM" },
        botMsgs: [
          { from: "bot", text: "Matching tasks to owners based on entity jurisdiction and past assignments...", time: "10:09 AM", thinking: true },
          { from: "bot", text: "", time: "10:10 AM", card: {
            title: "Tasks Assigned — Q3 Portfolio",
            statusRows: [
              { icon: "check", text: "Acme Holdings Europe Ltd. → Marcus Chen · Due Jul 31", color: "#3FB950" },
              { icon: "check", text: "Acme GmbH → Lena Bauer (DE counsel) · Due Sep 1", color: "#3FB950" },
              { icon: "check", text: "Acme SAS → Claire Dupont (FR counsel) · Due Aug 15", color: "#3FB950" },
              { icon: "check", text: "Acme Iberia S.L. → Diego Ruiz (ES counsel) · Due Sep 30", color: "#3FB950" },
              { icon: "check", text: "Acme Italia S.r.l. → Giulia Marino (IT notary) · Due Aug 20", color: "#3FB950" },
            ],
            bullets: [
              "All 5 owners notified via Teams with task details and jurisdiction requirements",
              "Deadline reminders set at 14 days and 3 days before each due date",
              "Local counsel confirmed for DE, FR, ES, and IT filings",
            ],
            buttons: [
              { label: "Generate Q3 governance report", style: "primary" },
              { label: "View in Diligent Entities" },
            ],
          }},
        ],
      },
      {
        prompt: "Generate Q3 governance report",
        userMsg: { from: "user", text: "Generate the Q3 governance plan report.", time: "10:11 AM" },
        botMsgs: [
          { from: "bot", text: "", time: "10:11 AM", card: {
            title: "Q3 Governance Plan Generated",
            statusRows: [
              { icon: "check", text: "14 tasks across 5 jurisdictions documented", color: "#3FB950" },
              { icon: "check", text: "Owners, deadlines & local requirements included", color: "#3FB950" },
              { icon: "check", text: "Compliance calendar synced to Diligent Entities", color: "#3FB950" },
              { icon: "check", text: "Escalation paths defined for missed deadlines", color: "#3FB950" },
            ],
            file: { name: "Acme_Corp_Q3_Subsidiary_Governance_Plan_2026.pdf", size: "1.8 MB" },
            bullets: [
              "Report shared with General Counsel and CFO for sign-off",
              "I'll send you a weekly digest every Monday tracking completion status across all 5 entities",
            ],
          }},
          { from: "bot", text: "You're all set for Q3, Marcus. I'll monitor each entity and flag anything that falls behind or needs your direct attention.", time: "10:11 AM" },
        ],
      },
    ],
  },

  /* ---- Meeting Materials — Acme Holdings Europe Ltd. Q2 Board Meeting ---- */
  {
    id: "meeting-materials",
    name: "Diligent Governance Agent",
    initials: "GA",
    color: "#0078D4",
    section: "favorites",
    preview: "Q2 board meeting — materials due in 7 days...",
    previewTime: "9:45 AM",
    messages: [],
    steps: [
      {
        prompt: "Review & approve agenda",
        userMsg: { from: "user", text: "Yes, show me the pre-built agenda.", time: "9:47 AM" },
        botMsgs: [
          { from: "bot", text: "Here's the agenda I've drafted based on your last meeting minutes and current entity obligations:", time: "9:47 AM", card: {
            title: "Draft Agenda — Q2 Board Meeting",
            fields: [
              { label: "Item 1", value: "Approval of Q1 minutes (5 min)" },
              { label: "Item 2", value: "Director appointment ratification — Dr. Elena Vasquez (10 min)" },
              { label: "Item 3", value: "Q1 financial review — CFO presentation (20 min)" },
              { label: "Item 4", value: "GDPR annual compliance report (15 min)" },
              { label: "Item 5", value: "Any other business (10 min)" },
            ],
            bullets: [
              "Item 2 was auto-added — links to the board resolution approved on Mar 23, 2026",
              "Item 4 is required annually under Article 5 of GDPR — deadline is May 25, 2026",
            ],
            buttons: [
              { label: "Approve agenda & compile board pack", style: "primary" },
              { label: "Edit agenda" },
            ],
          }},
        ],
      },
      {
        prompt: "Approve agenda & compile board pack",
        userMsg: { from: "user", text: "Agenda looks good — compile the board pack.", time: "9:49 AM" },
        botMsgs: [
          { from: "bot", text: "Pulling documents from Diligent Entities, the finance system, and previous meeting records...", time: "9:49 AM", thinking: true },
          { from: "bot", text: "", time: "9:51 AM", card: {
            title: "Board Pack Compiled — Acme Holdings Europe Ltd.",
            statusRows: [
              { icon: "check", text: "Q1 board minutes — retrieved from Diligent", color: "#3FB950" },
              { icon: "check", text: "Director appointment resolution (Dr. Vasquez) — auto-linked", color: "#3FB950" },
              { icon: "check", text: "Q1 financial statements — pulled from finance system", color: "#3FB950" },
              { icon: "check", text: "GDPR annual compliance report — attached", color: "#3FB950" },
              { icon: "check", text: "Meeting notice & dial-in details — generated", color: "#3FB950" },
            ],
            file: { name: "Acme_Holdings_Europe_Q2_Board_Pack_May2026.pdf", size: "3.4 MB" },
            bullets: [
              "Board pack includes all 5 agenda items with supporting documents",
              "AI-generated executive summaries added to each section for faster review",
            ],
            buttons: [
              { label: "Send to board members for review", style: "primary" },
              { label: "Preview board pack" },
            ],
          }},
        ],
      },
      {
        prompt: "Send to board members for review",
        userMsg: { from: "user", text: "Send to all board members for review.", time: "9:52 AM" },
        botMsgs: [
          { from: "bot", text: "", time: "9:52 AM", card: {
            title: "Board Pack Distributed via Diligent Boards",
            statusRows: [
              { icon: "check", text: "Dr. Elena Vasquez — notified (pending first access)", color: "#3FB950" },
              { icon: "check", text: "James Hargreaves (Chair) — notified", color: "#3FB950" },
              { icon: "check", text: "Sophia Reinholt (Audit Committee) — notified", color: "#3FB950" },
              { icon: "clock", text: "Richard Blake — departing director, view-only access granted", color: "#8B8B8B" },
            ],
            bullets: [
              "Read receipts enabled — you'll be notified when each director opens the pack",
              "Automated reminder scheduled 48 hours before the meeting (May 13, 2026)",
              "All annotations and comments will be captured in the meeting audit trail",
            ],
          }},
          { from: "bot", text: "Board pack sent. I'll notify you when all members have confirmed receipt. If any director raises a query or requests a document change, I'll route it directly to you.", time: "9:52 AM" },
        ],
      },
    ],
  },

];

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

const AVATARS: Record<string, string> = {
  "marcus-chen": "https://randomuser.me/api/portraits/med/men/41.jpg",
};

const PERSON_AVATAR: Record<string, string> = {
  "Marcus Chen": AVATARS["marcus-chen"],
};

function getInitials(name: string) { return name.split(" ").map(n => n[0]).join(""); }

function Avatar({ src, name, size = 32, className = "" }: { src?: string; name: string; size?: number; className?: string }) {
  return src ? (
    <img src={src} alt={name} className={`rounded-full object-cover shrink-0 ${className}`} style={{ width: size, height: size }} />
  ) : (
    <div className={`rounded-full flex items-center justify-center text-white font-bold shrink-0 bg-[#6264A7] ${className}`} style={{ width: size, height: size, fontSize: size * 0.3 }}>{getInitials(name)}</div>
  );
}

function DiligentAgentIcon({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`shrink-0 rounded-lg overflow-hidden ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 48 48" width={size} height={size}>
        <rect width="48" height="48" rx="8" fill="#1A1A1A"/>
        <g transform="translate(6,6) scale(0.16)">
          <path fill="#EE312E" d="M200.87,110.85c0,33.96-12.19,61.94-33.03,81.28c-0.24,0.21-0.42,0.43-0.66,0.64 c-15.5,14.13-35.71,23.52-59.24,27.11l-1.59-1.62l35.07-201.75l1.32-3.69C178.64,30.36,200.87,65.37,200.87,110.85z"/>
          <path fill="#AF292E" d="M142.75,12.83l-0.99,1.47L0.74,119.34L0,118.65c0,0,0-0.03,0-0.06V0.45h85.63c5.91,0,11.64,0.34,17.19,1.01 h0.21c14.02,1.66,26.93,5.31,38.48,10.78C141.97,12.46,142.75,12.83,142.75,12.83z"/>
          <path fill="#D3222A" d="M142.75,12.83L0,118.65v99.27v3.62h85.96c7.61,0,14.94-0.58,21.99-1.66 C107.95,219.89,142.75,12.83,142.75,12.83z"/>
        </g>
        {/* Sparkle */}
        <path d="M34 10l1.2 2.8L38 14l-2.8 1.2L34 18l-1.2-2.8L30 14l2.8-1.2z" fill="white"/>
        <path d="M39 18l0.6 1.4 1.4 0.6-1.4 0.6L39 22l-0.6-1.4L37 20l1.4-0.6z" fill="white" opacity="0.7"/>
      </svg>
    </div>
  );
}

const PERSPECTIVES = [
  { chatId: "gov-agent",         step: 1, name: "Marcus Chen", role: "Director Replacement",     avatar: AVATARS["marcus-chen"], initials: "MC", color: "#0078D4" },
  { chatId: "meeting-materials", step: 2, name: "Marcus Chen", role: "Meeting Materials",         avatar: AVATARS["marcus-chen"], initials: "MC", color: "#0078D4" },
  { chatId: "q3-portfolio",      step: 3, name: "Marcus Chen", role: "Q3 Portfolio Planning",    avatar: AVATARS["marcus-chen"], initials: "MC", color: "#0078D4" },
];

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */

const Q3_INTRO_CARD: Msg = {
  from: "bot", text: "Hi Marcus — I've completed a Q3 compliance scan across your full subsidiary portfolio.", time: "10:05 AM", card: {
    title: "Q3 Governance Scan — 5 Subsidiaries",
    fields: [
      { label: "Scan completed", value: "Today at 10:03 AM" },
      { label: "Entities scanned", value: "5 subsidiaries across 5 jurisdictions" },
      { label: "Total actions detected", value: "14 governance tasks", color: "#F0883E" },
      { label: "Quarter", value: "July 1 – September 30, 2026" },
    ],
    statusRows: [
      { icon: "pending", text: "4 actions overdue or due within 30 days", color: "#F85149" },
      { icon: "pending", text: "6 actions due in 31–60 days", color: "#F0883E" },
      { icon: "clock",   text: "4 actions scheduled for late Q3", color: "#8B8B8B" },
    ],
  },
};

const Q3_INTRO_QUESTION: Msg = {
  from: "bot", text: "I've mapped every filing deadline, board meeting, director obligation, and statutory requirement across all five entities — UK, Germany, France, Spain, and Italy. Would you like to see the full breakdown before I assign tasks and set deadlines?", time: "10:06 AM", card: {
    buttons: [
      { label: "Show me the full Q3 breakdown", style: "primary" },
      { label: "Assign everything automatically" },
      { label: "Export to governance calendar" },
    ],
  },
};

const MEETING_INTRO_CARD: Msg = {
  from: "bot", text: "Hi Marcus — I've spotted an upcoming board meeting that needs materials prepared.", time: "9:45 AM", card: {
    title: "Upcoming Board Meeting — Action Required",
    fields: [
      { label: "Entity", value: "Acme Holdings Europe Ltd." },
      { label: "Meeting", value: "Q2 Board Meeting" },
      { label: "Date", value: "May 15, 2026 (53 days away)" },
      { label: "Materials deadline", value: "May 8, 2026 (7 days to compile)", color: "#F0883E" },
    ],
    statusRows: [
      { icon: "pending", text: "Board pack not yet started", color: "#F0883E" },
      { icon: "clock", text: "4 agenda items auto-detected from entity obligations", color: "#8B8B8B" },
    ],
  },
};

const MEETING_INTRO_QUESTION: Msg = {
  from: "bot", text: "I've pre-built an agenda based on your last meeting minutes and current subsidiary obligations — including the Dr. Vasquez director ratification. Would you like to review it before I start compiling the board pack?", time: "9:46 AM", card: {
    buttons: [
      { label: "Review & approve agenda", style: "primary" },
      { label: "Build from scratch" },
      { label: "Remind me tomorrow" },
    ],
  },
};

const GOV_AGENT_INTRO_CARD: Msg = {
  from: "bot", text: "Hi Marcus — I've flagged an upcoming governance action that requires your attention.", time: "9:15 AM", card: {
    title: "Director Term Expiry — Action Required",
    fields: [
      { label: "Entity", value: "Acme Holdings Europe Ltd." },
      { label: "Director", value: "Richard Blake, Non-Executive Director" },
      { label: "Term expires", value: "June 30, 2026 (99 days)", color: "#F0883E" },
      { label: "Minimum notice required", value: "60 days before AGM" },
    ],
    statusRows: [
      { icon: "pending", text: "Replacement appointment needed before May 1, 2026", color: "#F0883E" },
      { icon: "clock", text: "Board skills matrix: finance & audit gap if not replaced", color: "#8B8B8B" },
    ],
  },
};

const GOV_AGENT_INTRO_QUESTION: Msg = {
  from: "bot", text: "Do you already know who you'd like to nominate as Richard Blake's replacement on the Acme Holdings Europe Ltd. board?", time: "9:16 AM", card: {
    buttons: [
      { label: "Yes, I have someone in mind", style: "primary" },
      { label: "No, send me recommendations" },
      { label: "Not yet decided" },
    ],
  },
};

function TeamsContent() {
  const searchParams = useSearchParams();
  const initialChat = searchParams?.get("chat") || "gov-agent";
  const [activeChat, setActiveChat] = useState(initialChat);
  const [chats, setChats] = useState<Chat[]>(CHATS);
  const [stepIdx, setStepIdx] = useState<Record<string, number>>(() => Object.fromEntries(CHATS.map(c => [c.id, 0])));
  const [sending, setSending] = useState(false);
  const [diligentPanelOpen, setDiligentPanelOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const chat = chats.find(c => c.id === activeChat)!;
  const perspective = PERSPECTIVES.find(p => p.chatId === activeChat)!;
  const sidebarCfg = SIDEBAR_PER_PERSPECTIVE[activeChat] ?? SIDEBAR_PER_PERSPECTIVE["gov-agent"];
  const currentStep = chat.steps[stepIdx[activeChat] ?? 0];
  const hasMore = (stepIdx[activeChat] ?? 0) < chat.steps.length;

  const scroll = useCallback(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, []);
  useEffect(() => { scroll(); }, [activeChat, scroll]);

  // Gov Agent intro: term expiry notification, then replacement question
  const govIntroRan = useRef(false);
  useEffect(() => {
    if (activeChat !== "gov-agent" || govIntroRan.current) return;
    govIntroRan.current = true;

    setTimeout(() => {
      setChats(prev => prev.map(c => c.id !== "gov-agent" ? c : { ...c, messages: [...c.messages, GOV_AGENT_INTRO_CARD] }));
      scroll();
    }, 600);

    setTimeout(() => {
      setChats(prev => prev.map(c => c.id !== "gov-agent" ? c : { ...c, messages: [...c.messages, GOV_AGENT_INTRO_QUESTION] }));
      scroll();
    }, 2200);
  }, [activeChat, scroll]);

  // Q3 Portfolio intro: scan results card, then question
  const q3IntroRan = useRef(false);
  useEffect(() => {
    if (activeChat !== "q3-portfolio" || q3IntroRan.current) return;
    q3IntroRan.current = true;

    setTimeout(() => {
      setChats(prev => prev.map(c => c.id !== "q3-portfolio" ? c : { ...c, messages: [...c.messages, Q3_INTRO_CARD] }));
      scroll();
    }, 600);

    setTimeout(() => {
      setChats(prev => prev.map(c => c.id !== "q3-portfolio" ? c : { ...c, messages: [...c.messages, Q3_INTRO_QUESTION] }));
      scroll();
    }, 2200);
  }, [activeChat, scroll]);

  // Meeting Materials intro: upcoming meeting notification, then agenda question
  const meetingIntroRan = useRef(false);
  useEffect(() => {
    if (activeChat !== "meeting-materials" || meetingIntroRan.current) return;
    meetingIntroRan.current = true;

    setTimeout(() => {
      setChats(prev => prev.map(c => c.id !== "meeting-materials" ? c : { ...c, messages: [...c.messages, MEETING_INTRO_CARD] }));
      scroll();
    }, 600);

    setTimeout(() => {
      setChats(prev => prev.map(c => c.id !== "meeting-materials" ? c : { ...c, messages: [...c.messages, MEETING_INTRO_QUESTION] }));
      scroll();
    }, 2200);
  }, [activeChat, scroll]);

  const handleSend = () => {
    if (!currentStep || sending) return;
    setSending(true);
    const step = currentStep;
    const chatId = activeChat;
    const nextStepNum = (stepIdx[chatId] ?? 0) + 1;
    const chatObj = chats.find(c => c.id === chatId)!;
    const isLastStep = nextStepNum >= chatObj.steps.length;
    setChats(prev => prev.map(c => c.id !== chatId ? c : { ...c, messages: [...c.messages, step.userMsg] }));
    setTimeout(scroll, 50);
    setTimeout(() => {
      const curPIdx = PERSPECTIVES.findIndex(p => p.chatId === chatId);
      const nextPerspective = PERSPECTIVES[curPIdx + 1];
      const doneMsgs: Msg[] = isLastStep && nextPerspective ? [{
        from: "system", text: `Step ${PERSPECTIVES[curPIdx]?.step ?? ""} complete — continue to Step ${nextPerspective.step}: ${nextPerspective.name}`, time: "",
      }] : [];
      setChats(prev => prev.map(c => c.id !== chatId ? c : {
        ...c,
        messages: [...c.messages, ...step.botMsgs, ...doneMsgs],
        preview: (step.botMsgs[step.botMsgs.length - 1].text || step.botMsgs[step.botMsgs.length - 1].card?.title || "").slice(0, 45) + "...",
      }));
      setStepIdx(prev => ({ ...prev, [chatId]: nextStepNum }));
      setSending(false);
      setTimeout(scroll, 50);
    }, 1200);
  };

  return (
    <div className="h-screen bg-[#F5F5F5] flex flex-col items-center p-5 gap-3">
      {/* Platform Switcher + Persona Navigator */}
      <div className="w-full max-w-[1360px] shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1 bg-white rounded-lg border border-[#DDD] p-0.5 shrink-0">
            <span className="px-3 py-1 rounded-md bg-[#6264A7] text-white text-[11px] font-semibold">Teams</span>
          </div>
          <div className="flex-1 h-px bg-[#DDD]" />
          <p className="text-[10px] text-[#AAA] shrink-0">Subsidiary Governance Workflows — select a scenario</p>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {PERSPECTIVES.map(p => {
            const isActive = p.chatId === activeChat;
            return (
              <button
                key={p.chatId}
                onClick={() => setActiveChat(p.chatId)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg min-w-0 transition-all border ${isActive ? "bg-white border-[#CCC] shadow-sm" : "bg-white/60 border-transparent hover:bg-white hover:border-[#DDD]"}`}
              >
                <div className="relative shrink-0">
                  <Avatar src={p.avatar} name={p.name} size={32} className={`${isActive ? "" : "opacity-50"}`} />
                  <span className={`absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${isActive ? "bg-[#0D1117] text-white" : "bg-[#E0E0E0] text-[#888]"}`}>{p.step}</span>
                </div>
                <div className="text-left min-w-0">
                  <p className={`text-[12px] font-semibold truncate leading-tight ${isActive ? "text-[#1D1D1D]" : "text-[#999]"}`}>{p.name}</p>
                  <p className={`text-[10px] truncate leading-tight mt-0.5 ${isActive ? "text-[#666]" : "text-[#BBB]"}`}>{p.role}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Teams App Window */}
      <div className="w-full max-w-[1360px] flex-1 min-h-0 rounded-xl overflow-hidden flex flex-col" style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.3), 0 0 0 0.5px rgba(0,0,0,0.12)" }}>
        {/* macOS Title Bar */}
        <div className="h-[32px] bg-[#292828] flex items-center px-3 shrink-0 relative border-b border-[#3b3a39]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#3b3a39] rounded px-3 py-0.5 w-[380px]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8B8B8B" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            <span className="text-[12px] text-[#8B8B8B]">Search (⌘ E)</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px] text-[#8B8B8B]">Acme Corp.</span>
            <Avatar src={perspective.avatar} name={perspective.name} size={24} />
          </div>
        </div>

        <div className="flex-1 flex min-h-0">
          {/* ====== Icon Rail ====== */}
          <div className="w-[68px] bg-[#2B2B30] flex flex-col items-center py-2 gap-0.5 shrink-0">
            {[
              { label: "Activity", d: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6", active: false },
              { label: "Chat", d: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z", active: true },
              { label: "Calendar", d: "M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18", active: false },
              { label: "OneDrive", d: "M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z", active: false },
            ].map(item => (
              <button key={item.label} className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-colors ${item.active ? "bg-[#3d3d42]" : "hover:bg-[#3d3d42]"}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={item.active ? "#fff" : "#A8A8A8"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={item.d} /></svg>
                <span className={`text-[9px] ${item.active ? "text-white" : "text-[#A8A8A8]"}`}>{item.label}</span>
              </button>
            ))}
            <button
              onClick={() => setDiligentPanelOpen(o => !o)}
              className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-colors ${diligentPanelOpen ? "bg-[#3d3d42]" : "hover:bg-[#3d3d42]"}`}
            >
              <DiligentAgentIcon size={22} />
              <span className={`leading-tight text-center ${diligentPanelOpen ? "text-white" : "text-[#A8A8A8]"}`} style={{ fontSize: "8px" }}>Diligent</span>
            </button>
            <div className="flex-1" />
            <button className="w-12 h-12 rounded-lg flex flex-col items-center justify-center gap-0.5 hover:bg-[#3d3d42] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A8A8A8" strokeWidth="1.5"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
              <span className="text-[9px] text-[#A8A8A8]">More</span>
            </button>
            <button className="w-12 h-12 rounded-lg flex flex-col items-center justify-center gap-0.5 hover:bg-[#3d3d42] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A8A8A8" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
              <span className="text-[9px] text-[#A8A8A8]">Apps</span>
            </button>
          </div>

          {diligentPanelOpen ? (
            /* ====== Diligent Agent Welcome Panel ====== */
            <div className="flex-1 flex flex-col min-h-0 bg-[#1A1A1A]">
              {/* Panel Header */}
              <div className="h-[48px] bg-[#292828] flex items-center justify-between px-4 shrink-0 border-b border-[#3b3a39]">
                <div className="flex items-center gap-2">
                  <DiligentAgentIcon size={32} />
                  <span className="text-[14px] text-white font-semibold">Diligent Governance Agent</span>
                </div>
                <button onClick={() => setDiligentPanelOpen(false)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#3d3d42] transition-colors text-[#8B8B8B] hover:text-white">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
              {/* Welcome messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                <div className="max-w-[820px] mx-auto">
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-[#333]" />
                    <span className="text-[11px] text-[#8B8B8B]">Today</span>
                    <div className="flex-1 h-px bg-[#333]" />
                  </div>
                  <div className="flex justify-start gap-2">
                    <DiligentAgentIcon size={32} className="mt-0.5 shrink-0" />
                    <div className="max-w-[70%]">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[12px] font-semibold text-white">Diligent Governance Agent</span>
                        <span className="text-[10px] text-[#8B8B8B]">Just now</span>
                      </div>
                      <div className="rounded-md px-3 py-2.5 bg-[#292828] space-y-2">
                        <p className="text-[13px] text-white leading-relaxed">Hi Marcus! I&apos;m the <strong>Diligent Governance Agent</strong> — your AI assistant for subsidiary governance, board management, and entity compliance across your full portfolio.</p>
                        <p className="text-[13px] text-white leading-relaxed">Start a conversation by asking me a question, or try one of these prompts to get started.</p>
                        <div className="pt-1 space-y-1.5">
                          {[
                            "What governance actions are due this quarter?",
                            "Help me draft a board resolution",
                            "Which subsidiaries have upcoming filing deadlines?",
                            "Who should I assign this compliance task to?",
                            "Summarize the board pack for Acme Holdings Europe",
                          ].map(prompt => (
                            <div key={prompt} className="flex items-start gap-1.5">
                              <span className="text-[#8B8B8B] text-[12px] mt-0.5 shrink-0">•</span>
                              <p className="text-[13px] text-[#58A6FF] leading-relaxed hover:underline cursor-pointer">{prompt}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Blank input */}
              <div className="bg-[#292828] border-t border-[#3b3a39] px-4 py-2 shrink-0">
                <div className="flex items-center gap-2 bg-[#3b3a39] rounded-md px-3 py-2">
                  <span className="flex-1 text-[13px] text-[#8B8B8B]">Ask the Diligent Governance Agent...</span>
                  <div className="flex items-center gap-1.5 shrink-0 text-[#555]">
                    <button className="hover:text-[#8B8B8B] transition-colors"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg></button>
                    <button className="hover:text-[#8B8B8B] transition-colors"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" /><line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" /></svg></button>
                    <button className="w-8 h-8 rounded flex items-center justify-center text-[#555] cursor-default">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (<>

          {/* ====== Chat List ====== */}
          <div className="w-[300px] bg-[#1F1F1F] border-r border-[#3b3a39] flex flex-col shrink-0 min-h-0">
            <div className="flex items-center justify-between px-4 pt-3 pb-1 shrink-0">
              <h1 className="text-[18px] font-bold text-white">Chat</h1>
              <div className="flex items-center gap-1">
                <button className="w-7 h-7 rounded flex items-center justify-center hover:bg-[#3d3d42] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A8A8A8" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                </button>
                <button className="w-7 h-7 rounded flex items-center justify-center hover:bg-[#3d3d42] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A8A8A8" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 px-3 pb-2 shrink-0">
              {["Unread", "Channels", "Chats"].map(tab => (
                <button key={tab} className={`px-2.5 py-1 rounded text-[12px] font-medium transition-colors ${tab === "Chats" ? "bg-[#3d3d42] text-white" : "text-[#A8A8A8] hover:bg-[#3d3d42]"}`}>{tab}</button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {/* URGENT */}
              <div className="px-3 py-1">
                <p className="text-[11px] text-[#F85149] font-semibold px-1 mb-1 uppercase tracking-wider">Urgent</p>
                {chats.filter(c => sidebarCfg.urgentIds.includes(c.id)).map(conv => (
                  <button key={conv.id} onClick={() => setActiveChat(conv.id)} className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-left transition-colors ${activeChat === conv.id ? "bg-[#3d3d42]" : "hover:bg-[#2d2d30]"}`}>
                    {conv.isGroup ? <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0" style={{ background: conv.color }}>{conv.initials}</div> : <DiligentAgentIcon size={36} />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-white font-semibold truncate">{conv.isGroup ? conv.name : agentDisplayName(conv.id)}</span>
                        <span className="text-[10px] text-[#F85149] shrink-0 font-medium">{conv.previewTime}</span>
                      </div>
                      <p className="text-[11px] text-[#C9D1D9] truncate mt-0.5 font-medium">{conv.preview}</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-[#6264A7] shrink-0" />
                  </button>
                ))}
              </div>

              {/* Team (fake read chats) */}
              <div className="px-3 py-1 mt-1">
                <p className="text-[11px] text-[#8B8B8B] font-semibold px-1 mb-1">Team</p>
                {sidebarCfg.fakeTeam.map(fc => (
                  <div key={fc.name} className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-left">
                    <Avatar src={fc.avatar} name={fc.name} size={36} className="opacity-70" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-[#8B8B8B] font-medium truncate">{fc.name}</span>
                        <span className="text-[10px] text-[#484F58] shrink-0">{fc.time}</span>
                      </div>
                      <p className="text-[11px] text-[#484F58] truncate mt-0.5">{fc.preview}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ====== Message Area ====== */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-[#1A1A1A]">
            {/* Chat Header */}
            <div className="h-[48px] bg-[#292828] flex items-center justify-between px-4 shrink-0 border-b border-[#3b3a39]">
              <div className="flex items-center gap-2">
                {chat.isGroup ? (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ background: chat.color }}>{chat.initials}</div>
                ) : (
                  <DiligentAgentIcon size={32} />
                )}
                <div>
                  <span className="text-[14px] text-white font-semibold">{chat.isGroup ? chat.name : agentDisplayName(chat.id)}</span>
                  {chat.isGroup && <p className="text-[10px] text-[#8B8B8B] -mt-0.5">{chat.members}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {["Chat", "Shared"].map(tab => (
                  <button key={tab} className={`px-3 py-1 text-[12px] font-medium ${tab === "Chat" ? "text-white border-b-2 border-[#6264A7]" : "text-[#8B8B8B]"}`}>{tab}</button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
              {/* Top spacer */}
              <div className="h-2" />
              <div className="max-w-[820px] mx-auto space-y-3">
                {chat.messages.map((msg, i) => {
                  if (msg.from === "system") {
                    const curPIdx = PERSPECTIVES.findIndex(p => p.chatId === activeChat);
                    const nextP = PERSPECTIVES[curPIdx + 1];
                    return (
                      <div key={i} className="flex items-center gap-3 py-3 my-2">
                        <div className="flex-1 h-px bg-[#3FB950]/30" />
                        <button
                          onClick={() => nextP && setActiveChat(nextP.chatId)}
                          className="text-[12px] text-[#3FB950] font-medium px-3 py-1.5 rounded-full border border-[#3FB950]/30 hover:bg-[#3FB950]/10 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          {msg.text} →
                        </button>
                        <div className="flex-1 h-px bg-[#3FB950]/30" />
                      </div>
                    );
                  }
                  const isUser = msg.from === "user";
                  const isBot = msg.from === "bot";
                  const personName = !isUser && !isBot ? msg.from : null;

                  return (
                    <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"} gap-2`}>
                      {/* Avatar */}
                      {!isUser && (
                        isBot ? (
                          <DiligentAgentIcon size={32} className="mt-0.5" />
                        ) : (
                          <Avatar src={PERSON_AVATAR[personName ?? ""]} name={personName ?? ""} size={32} className="mt-0.5" />
                        )
                      )}
                      <div className={`max-w-[70%] ${isUser ? "" : ""}`}>
                        {/* Sender + time */}
                        <div className={`flex items-center gap-2 mb-0.5 ${isUser ? "justify-end" : ""}`}>
                          {!isUser && <span className="text-[12px] font-semibold text-white">{isBot ? agentDisplayName(activeChat) : personName}</span>}
                          <span className="text-[10px] text-[#8B8B8B]">{msg.time}</span>
                        </div>
                        {/* Bubble */}
                        <div className={`rounded-md px-3 py-2 ${isUser ? "bg-[#6264A7]" : "bg-[#292828]"}`}>
                          {msg.thinking ? (
                            <div className="flex items-center gap-2">
                              <p className="text-[13px] text-[#A8A8A8] italic leading-relaxed">{msg.text}</p>
                              <div className="flex items-center gap-1 shrink-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#6264A7] animate-bounce" style={{ animationDelay: "0ms" }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-[#6264A7] animate-bounce" style={{ animationDelay: "150ms" }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-[#6264A7] animate-bounce" style={{ animationDelay: "300ms" }} />
                              </div>
                            </div>
                          ) : msg.text ? (
                            <p className="text-[13px] text-white leading-relaxed whitespace-pre-wrap">
                              {msg.text.split(/(\*[^*]+\*)/).map((part, pi) =>
                                part.startsWith("*") && part.endsWith("*") ? (
                                  <strong key={pi} className="font-semibold">{part.slice(1, -1)}</strong>
                                ) : (<span key={pi}>{part}</span>)
                              )}
                            </p>
                          ) : null}
                          {/* Adaptive Card */}
                          {msg.card && (
                            <div className={`${msg.text ? "mt-2" : ""} rounded-md bg-[#333333] border border-[#444] overflow-hidden`}>
                              {msg.card.title && <div className="px-3 py-2 border-b border-[#444] bg-[#3a3a3a]"><p className="text-[13px] font-bold text-white">{msg.card.title}</p></div>}
                              <div className="px-3 py-2 space-y-2">
                                {msg.card.fields && (
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                    {msg.card.fields.map((f, fi) => (
                                      <div key={fi}>
                                        <p className="text-[10px] text-[#8B8B8B] uppercase tracking-wider">{f.label}</p>
                                        <p className="text-[12px] font-medium" style={{ color: f.color ?? "#E0E0E0" }}>{f.value}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {msg.card.statusRows && (
                                  <div className="space-y-1">
                                    {msg.card.statusRows.map((sr, si) => (
                                      <div key={si} className="flex items-center gap-2">
                                        {sr.icon === "check" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={sr.color ?? "#3FB950"} strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>}
                                        {sr.icon === "pending" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={sr.color ?? "#F0883E"} strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>}
                                        {sr.icon === "clock" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={sr.color ?? "#8B8B8B"} strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>}
                                        <p className="text-[12px]" style={{ color: sr.color ?? "#E0E0E0" }}>{sr.text}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {msg.card.bullets && (
                                  <div className="space-y-0.5">
                                    {msg.card.bullets.map((b, bi) => (
                                      <div key={bi} className="flex items-start gap-1.5">
                                        <span className="text-[#8B8B8B] text-[10px] mt-px">•</span>
                                        <p className="text-[11px] text-[#C0C0C0] leading-relaxed">{b}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {msg.card.file && (
                                  <div className="flex items-center gap-3 bg-[#292828] rounded p-2">
                                    <div className="w-9 h-9 rounded bg-[#6264A7] flex items-center justify-center shrink-0">
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></svg>
                                    </div>
                                    <div>
                                      <p className="text-[12px] text-white font-medium">{msg.card.file.name}</p>
                                      <p className="text-[10px] text-[#8B8B8B]">{msg.card.file.size}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              {msg.card.buttons && (
                                <div className="flex items-center gap-2 px-3 py-2 border-t border-[#444] flex-wrap">
                                  {msg.card.buttons.map((btn, bi) => {
                                    const isLastMsg = i === chat.messages.length - 1 || (i === chat.messages.length - 2 && chat.messages[chat.messages.length - 1]?.card?.buttons);
                                    const canAdvance = isLastMsg && !sending && currentStep;
                                    const hrefWithFrom = btn.href ? btn.href + (btn.href.includes("?") ? "&from=teams" : "?from=teams") : undefined;
                                    return hrefWithFrom ? (
                                      <a key={bi} href={hrefWithFrom} className={`px-3 py-1.5 rounded text-[12px] font-medium transition-colors cursor-pointer ${btn.style === "primary" ? "bg-[#6264A7] text-white hover:bg-[#7B7FBF]" : "border border-[#555] text-[#C0C0C0] hover:bg-[#3d3d42]"}`}>
                                        {btn.label}
                                      </a>
                                    ) : (
                                      <button key={bi} onClick={canAdvance ? handleSend : undefined} className={`px-3 py-1.5 rounded text-[12px] font-medium transition-colors ${canAdvance ? "cursor-pointer" : ""} ${btn.style === "primary" ? "bg-[#6264A7] text-white hover:bg-[#7B7FBF]" : "border border-[#555] text-[#C0C0C0] hover:bg-[#3d3d42]"}`}>
                                        {btn.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {/* Reactions */}
                        {msg.reactions && (
                          <div className="flex items-center gap-1 mt-1">
                            {msg.reactions.map((r, ri) => (
                              <span key={ri} className="inline-flex items-center rounded-full bg-[#333] border border-[#444] px-1.5 py-0.5 text-[11px]">{r}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
            </div>

            {/* Input */}
            <div className="bg-[#292828] border-t border-[#3b3a39] px-4 py-2 shrink-0">
              <div className="flex items-center gap-2 bg-[#3b3a39] rounded-md px-3 py-2">
                {hasMore ? (
                  <button onClick={handleSend} className="flex-1 text-left text-[13px] text-white truncate cursor-pointer hover:text-white/80 transition-colors">{currentStep?.prompt}</button>
                ) : (() => {
                  const curIdx = PERSPECTIVES.findIndex(p => p.chatId === activeChat);
                  const next = PERSPECTIVES[curIdx + 1];
                  return next ? (
                    <button onClick={() => setActiveChat(next.chatId)} className="flex-1 text-left text-[13px] text-[#3FB950] cursor-pointer hover:text-[#3FB950]/80 transition-colors truncate">
                      ✓ Step complete — Continue to Step {next.step}: {next.name} →
                    </button>
                  ) : (
                    <span className="flex-1 text-[13px] text-[#3FB950] font-medium">✓ Workflow complete</span>
                  );
                })()}
                <div className="flex items-center gap-1.5 shrink-0 text-[#8B8B8B]">
                  <button className="hover:text-white transition-colors"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg></button>
                  <button className="hover:text-white transition-colors"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" /><line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" /></svg></button>
                  <button className="hover:text-white transition-colors"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg></button>
                  <button className="hover:text-white transition-colors"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg></button>
                  <button
                    onClick={handleSend}
                    disabled={sending || !hasMore}
                    className={`w-8 h-8 rounded flex items-center justify-center transition-all ${(!sending && hasMore) ? "bg-[#6264A7] hover:bg-[#7B7FBF] text-white cursor-pointer" : "text-[#555] cursor-default"}`}
                  >
                    {sending ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          </>)}
        </div>
      </div>
    </div>
  );
}

export default function TeamsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="h-8 w-8 border-2 border-[#6264A7] border-t-transparent rounded-full animate-spin" /></div>}>
      <TeamsContent />
    </Suspense>
  );
}
