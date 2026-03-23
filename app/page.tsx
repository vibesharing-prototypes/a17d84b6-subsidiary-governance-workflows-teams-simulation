"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";

/* ================================================================== */
/*  External App URLs — update these when the other apps are deployed  */
/* ================================================================== */

const WEB_BASE = "https://vs-step-1-general-counsel-alerted-m.vercel.app";
const SLACK_BASE = "https://vs-step-1-general-counsel-alerted-m.vercel.app/slack";

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
  gc:        { urgentIds: ["gc"], fakeTeam: FAKE_TEAM_CHATS },
  diana:     { urgentIds: ["diana"], fakeTeam: FAKE_TEAM_CHATS.slice(2, 7) },
  cro:       { urgentIds: ["cro"], fakeTeam: FAKE_TEAM_CHATS.slice(1, 6) },
  ceo:       { urgentIds: ["ceo"], fakeTeam: FAKE_TEAM_CHATS.slice(3, 8) },
  committee:     { urgentIds: ["committee"], fakeTeam: FAKE_TEAM_CHATS.slice(0, 5) },
  "gc-draft":      { urgentIds: ["gc-draft"], fakeTeam: FAKE_TEAM_CHATS },
  "draft-review":  { urgentIds: ["draft-review"], fakeTeam: FAKE_TEAM_CHATS.slice(1, 6) },
  "certification": { urgentIds: ["certification"], fakeTeam: FAKE_TEAM_CHATS.slice(2, 7) },
};

/* ================================================================== */
/*  Conversation Data                                                  */
/* ================================================================== */

const CHATS: Chat[] = [
  /* ---- 1. GC Chat ---- */
  {
    id: "gc",
    name: "Diligent Risk Agent",
    initials: "DA",
    color: "#6264A7",
    section: "favorites",
    preview: "3 emerging risks detected requiring...",
    previewTime: "10:00 AM",
    messages: [],
    steps: [
      {
        prompt: "Notify all recommended risk owners",
        userMsg: { from: "user", text: "Notify all recommended risk owners", time: "10:02 AM" },
        botMsgs: [
          { from: "bot", text: "", time: "10:02 AM", card: {
            title: "Risk Owners Assigned",
            statusRows: [
              { icon: "check", text: "Diana Reyes notified — Taiwan Strait", color: "#3FB950" },
              { icon: "check", text: "Marcus Webb notified — Vendor Breach", color: "#3FB950" },
              { icon: "check", text: "James Park notified — EU DMA", color: "#3FB950" },
            ],
            bullets: ["All 3 owners have been sent investigation requests via Teams. They'll be interviewed by the AI Risk Manager and asked to respond within 48 hours.", "I'll notify you as each investigation is completed."],
          }},
        ],
      },
    ],
  },

  /* ---- 2. Diana Reyes (Risk Owner Interview) ---- */
  {
    id: "diana",
    name: "Diligent Risk Agent",
    initials: "DA",
    color: "#6264A7",
    section: "directs",
    preview: "You've been assigned to investigate...",
    previewTime: "10:03 AM",
    messages: [],
    steps: [
      {
        prompt: "We've been diversifying since Q3. Vietnam facility is...",
        userMsg: { from: "user", text: "We've been diversifying since Q3 — the Vietnam facility was discussed in the October board materials. But realistically, TSMC still accounts for the bulk of our chip supply and there's no short-term alternative for the advanced nodes we need.", time: "10:15 AM" },
        botMsgs: [
          { from: "bot", text: "Thank you. That context about the Vietnam diversification timeline and TSMC dependency is helpful.\n\nThe AI assessment rated this as *CRITICAL* based on the 47% supplier concentration and $1.8B exposure. Do you agree with this severity level?", time: "10:15 AM", card: {
            buttons: [{ label: "Agree with CRITICAL", style: "primary" }, { label: "Should Be Lower" }, { label: "Not a Risk" }],
          }},
        ],
      },
      {
        prompt: "Agree with CRITICAL",
        userMsg: { from: "user", text: "Agree with CRITICAL", time: "10:18 AM" },
        botMsgs: [
          { from: "bot", text: "Noted. The disclosure recommendation is:\n\n*\"Add specific language addressing semiconductor supply concentration in Taiwan region, including quantified exposure and diversification timeline.\"*\n\nDo you confirm this recommendation?", time: "10:18 AM", card: {
            buttons: [{ label: "Confirm Recommendation", style: "primary" }, { label: "Request Changes" }],
          }},
        ],
      },
      {
        prompt: "Confirm recommendation",
        userMsg: { from: "user", text: "Confirm recommendation", time: "10:20 AM" },
        botMsgs: [
          { from: "bot", text: "", time: "10:20 AM", card: {
            title: "Investigation Complete",
            fields: [
              { label: "Reference", value: "INV-TAIWAN-2026-001" },
              { label: "Severity", value: "CRITICAL (confirmed)", color: "#F85149" },
              { label: "Disclosure", value: "Recommended (confirmed)", color: "#3FB950" },
            ],
            bullets: [
              "Your assessment has been sent to the Chief Risk Officer for review",
              "The General Counsel will be notified once the CRO completes their analysis",
              "You may be asked follow-up questions during the drafting process",
            ],
          }},
          { from: "bot", text: "Thank you, Diana. You're all set. I'll reach out if anything else is needed.", time: "10:20 AM" },
        ],
      },
    ],
  },

  /* ---- 3. CRO Chat ---- */
  {
    id: "cro",
    name: "Diligent Risk Agent",
    initials: "DA",
    color: "#6264A7",
    section: "directs",
    preview: "Diana Reyes has completed her risk...",
    previewTime: "10:22 AM",
    messages: [],
    steps: [
      {
        prompt: "Evaluate the response here",
        userMsg: { from: "user", text: "Evaluate the response here", time: "10:24 AM" },
        botMsgs: [
          { from: "bot", text: "Here's what Diana provided:", time: "10:24 AM", card: {
            title: "Risk Owner Investigation Review",
            fields: [
              { label: "Risk", value: "Taiwan Strait Geopolitical Tensions" },
              { label: "Investigated by", value: "Diana Reyes, VP Supply Chain" },
              { label: "Context from owner", value: "Vietnam diversification underway since Q3; TSMC still primary for advanced nodes. No short-term alternative." },
              { label: "Severity assessment", value: "Agreed with CRITICAL", color: "#F85149" },
              { label: "Disclosure recommendation", value: "Confirmed", color: "#3FB950" },
            ],
          }},
          { from: "bot", text: "Now I need your assessment. What is the *likelihood of occurrence*?\n\nFor context: your peers with supply chain exposure in the Taiwan Strait estimate a *Moderate* likelihood. However, my analysis of 14 geopolitical risk models, recent military exercise patterns, and semiconductor supply chain data indicates it's more likely *Very High* — particularly given Acme's 47% concentration with no near-term alternative.", time: "10:24 AM", card: {
            buttons: [{ label: "Very High (AI recommended)", style: "primary" }, { label: "High" }, { label: "Moderate (peer avg)" }, { label: "Low" }],
          }},
        ],
      },
      {
        prompt: "Very High",
        userMsg: { from: "user", text: "Very High", time: "10:26 AM" },
        botMsgs: [
          { from: "bot", text: "Noted — *Very High* likelihood, aligned with my recommendation.\n\nWhat about the *impact if it occurs*?\n\nMy assessment: *Severe*. At $1.8B revenue exposure across 3 business units with TSMC as the sole advanced-node supplier, a disruption would trigger production halts within 6–8 weeks. Peer companies with similar concentration have disclosed this as a material risk to shareholders.", time: "10:26 AM", card: {
            buttons: [{ label: "Severe (AI recommended)", style: "primary" }, { label: "Major" }, { label: "Moderate" }, { label: "Minor" }],
          }},
        ],
      },
      {
        prompt: "Severe",
        userMsg: { from: "user", text: "Severe", time: "10:27 AM" },
        botMsgs: [
          { from: "bot", text: "Very High likelihood + Severe impact confirms this as a top-tier risk.\n\nDiana mentioned two controls: a *supplier diversification program* and *Samsung qualification in progress*. I've verified both — the Samsung qualification is on track for Q3 but won't reduce Taiwan concentration below 30% until 2027. I'd recommend noting these controls but flagging them as *insufficient for near-term mitigation*.", time: "10:27 AM", card: {
            buttons: [{ label: "Use Diana's controls + AI note", style: "primary" }, { label: "Add my own" }],
          }},
        ],
      },
      {
        prompt: "Use Diana's controls + AI note",
        userMsg: { from: "user", text: "Use Diana's controls with your insufficiency note", time: "10:28 AM" },
        botMsgs: [
          { from: "bot", text: "Got it. One last question — any *additional context* for the 10-K draft? Key considerations, board-level messaging, or disclosure sensitivities?", time: "10:28 AM", card: {
            buttons: [{ label: "No, submit assessment", style: "primary" }, { label: "Add context" }],
          }},
        ],
      },
      {
        prompt: "No, submit assessment",
        userMsg: { from: "user", text: "No additional context needed. Submit assessment.", time: "10:30 AM" },
        botMsgs: [
          { from: "bot", text: "", time: "10:30 AM", card: {
            title: "CRO Assessment Submitted",
            statusRows: [
              { icon: "check", text: "Likelihood: Very High", color: "#F85149" },
              { icon: "check", text: "Impact: Severe", color: "#F85149" },
              { icon: "check", text: "Controls: Supplier diversification, Samsung qualification", color: "#58A6FF" },
              { icon: "check", text: "Disclosure: Confirmed — proceeding to 10-K draft", color: "#3FB950" },
            ],
            bullets: [
              "Your assessment has been sent to the General Counsel",
              "The AI writer will use Diana's context, your assessment, and the risk analysis to draft disclosure language",
            ],
          }},
          { from: "bot", text: "Assessment complete. Would you like to explore this risk further?", time: "10:30 AM", card: {
            buttons: [
              { label: "Open in Risk Essentials", style: "primary", href: `${WEB_BASE}/superhero/risk-discovery` },
              { label: "Try Risk Impact Simulator", href: `${WEB_BASE}/superhero/risk-analysis` },
            ],
          }},
        ],
      },
    ],
  },

  /* ---- 4. GC Draft Notification ---- */
  {
    id: "gc-draft",
    name: "Diligent Risk Agent",
    initials: "DA",
    color: "#6264A7",
    section: "favorites",
    preview: "The CRO has completed his evaluation...",
    previewTime: "2:30 PM",
    messages: [],
    steps: [
      {
        prompt: "Review the draft now",
        userMsg: { from: "user", text: "Let me take a look at the draft.", time: "2:35 PM" },
        botMsgs: [
          { from: "bot", text: "Opening the disclosure writer now. You can edit the draft directly, use AI to rewrite sections, or compare against peer filings.\n\nOnce you're satisfied, click **Submit Draft** — I'll route it to the CRO, Diana, and Robert Tanaka (CFO) for a final review before it goes to the CEO.", time: "2:35 PM", card: {
            buttons: [
              { label: "Open Disclosure Writer", style: "primary", href: `${WEB_BASE}/superhero/writer?risk=risk-taiwan&owner=diana-reyes` },
            ],
          }},
        ],
      },
    ],
  },

  /* ---- 6. CEO Chat ---- */
  {
    id: "ceo",
    name: "Diligent Risk Agent",
    initials: "DA",
    color: "#6264A7",
    section: "directs",
    preview: "3 risks require your disclosure approval",
    previewTime: "3:32 PM",
    messages: [],
    steps: [
      {
        prompt: "Approve all disclosures",
        userMsg: { from: "user", text: "Approve all disclosures", time: "4:30 PM" },
        botMsgs: [
          { from: "bot", text: "✅ All 3 disclosures approved.\n\nBased on the risk categories involved, I'd recommend routing to these committees for final review:\n• Audit Committee (David Patel)\n• Risk Committee (Linda Nakamura)\n• Cybersecurity Committee (Patricia Wells)\n• Compliance Committee (Michael Okafor)\n• Independent Director (James Thornton)", time: "4:30 PM", card: {
            buttons: [{ label: "Notify GC to Route to Committees", style: "primary" }, { label: "Skip Committee Review" }],
          }},
        ],
      },
      {
        prompt: "Notify GC to route to committees",
        userMsg: { from: "user", text: "Yes, notify Sarah to route to all committees", time: "4:32 PM" },
        botMsgs: [
          { from: "bot", text: "✅ The General Counsel has been notified to route materials to all 5 committee members. They'll receive review requests in the Disclosure Committee channel.\n\nYou're all set, Jennifer. I'll follow up if anything needs your attention.", time: "4:32 PM" },
        ],
      },
    ],
  },

  /* ---- 7. Disclosure Committee (Group) ---- */
  {
    id: "committee",
    name: "Disclosure Committee",
    initials: "DC",
    color: "#E3008C",
    isGroup: true,
    members: "Sarah Mitchell, David Patel, Linda Nakamura, James Thornton, Patricia Wells, Michael Okafor",
    section: "favorites",
    preview: "All 5 members have confirmed...",
    previewTime: "5:25 PM",
    messages: [],
    steps: [
      {
        prompt: "Generate the filing package",
        userMsg: { from: "user", text: "Generate the filing package", time: "5:32 PM" },
        botMsgs: [
          { from: "bot", text: "", time: "5:32 PM", card: {
            title: "EDGAR Filing Package Generated",
            statusRows: [
              { icon: "check", text: "10-K Amendment (Risk Factors) — ready", color: "#3FB950" },
              { icon: "check", text: "ERM Board Deck — final version locked", color: "#3FB950" },
              { icon: "check", text: "Audit trail — 47 events, 12 participants", color: "#3FB950" },
              { icon: "check", text: "AI verification certificate — attached", color: "#3FB950" },
            ],
            file: { name: "EDGAR_Filing_Package_2026-03-11.zip", size: "14.2 MB" },
          }},
          { from: "bot", text: "The filing package is ready in the Diligent Data Room. Sarah Mitchell and outside counsel have been notified.\n\nTotal time from risk detection to filing-ready: 7 hours 32 minutes across 12 participants.", time: "5:32 PM" },
        ],
      },
    ],
  },

  /* ---- 5. Draft Review (Group — GC, CRO, Diana, CFO) ---- */
  {
    id: "draft-review",
    name: "10-K Disclosure Draft Review",
    initials: "DR",
    color: "#6264A7",
    isGroup: true,
    members: "Sarah Mitchell, Chief Risk Officer, Diana Reyes, Robert Tanaka",
    section: "favorites",
    preview: "Sarah's first draft is ready for review...",
    previewTime: "3:35 PM",
    messages: [],
    steps: [
      {
        prompt: "Looks good — send to CEO for final sign-off.",
        userMsg: { from: "user", text: "I'm comfortable with this. Let's send to Jennifer Walsh for final sign-off.", time: "4:10 PM" },
        botMsgs: [
          { from: "bot", text: "Great — I've routed the draft to Jennifer Walsh (CEO) for final approval. She'll receive the 10-K Risk Factor Draft, supporting documentation, and the full audit trail.\n\nI'll notify this group when she responds.", time: "4:10 PM", card: {
            statusRows: [
              { icon: "check", text: "Draft sent to Jennifer Walsh (CEO)", color: "#3FB950" },
              { icon: "pending", text: "Awaiting CEO approval", color: "#F0883E" },
            ],
          }},
        ],
      },
    ],
  },

  /* ---- 8. Certification & EDGAR Filing (Group — GC, CEO, CFO) ---- */
  {
    id: "certification",
    name: "10-K Certification & Filing",
    initials: "CF",
    color: "#059669",
    isGroup: true,
    members: "Sarah Mitchell, Jennifer Walsh, Robert Tanaka",
    section: "favorites",
    preview: "Committee review complete — certification needed...",
    previewTime: "5:40 PM",
    messages: [],
    steps: [
      {
        prompt: "Continue — submit via EDGAR",
        userMsg: { from: "user", text: "Continue — let's submit.", time: "6:05 PM" },
        botMsgs: [
          { from: "bot", text: "Submitting the 10-K filing package to EDGAR now.\n\nPackage includes:\n• Updated Item 1A Risk Factors (Taiwan Strait, Vendor Breach, EU DMA)\n• Officer certifications (CEO + CFO)\n• Full audit trail and committee sign-offs\n\nI'll confirm once the filing is accepted.", time: "6:05 PM", card: {
            statusRows: [
              { icon: "check", text: "Filing package assembled", color: "#3FB950" },
              { icon: "check", text: "CEO certification — Jennifer Walsh", color: "#3FB950" },
              { icon: "check", text: "CFO certification — Robert Tanaka", color: "#3FB950" },
              { icon: "pending", text: "EDGAR submission in progress...", color: "#F0883E" },
            ],
          }},
        ],
      },
      {
        prompt: "Is the filing confirmed?",
        userMsg: { from: "user", text: "Is the filing confirmed?", time: "6:15 PM" },
        botMsgs: [
          { from: "bot", text: "", time: "6:15 PM", card: {
            title: "EDGAR Filing Accepted",
            statusRows: [
              { icon: "check", text: "10-K filing accepted by EDGAR at 6:12 PM EST", color: "#3FB950" },
              { icon: "check", text: "Accession number: 0001234567-26-000142", color: "#3FB950" },
              { icon: "check", text: "All parties notified — audit trail archived", color: "#3FB950" },
            ],
            bullets: ["The complete governance trail — from initial risk detection through committee review and officer certification — has been archived in Diligent for your records."],
          }},
        ],
      },
    ],
  },
];

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

const AVATARS: Record<string, string> = {
  "sarah-mitchell": "https://randomuser.me/api/portraits/med/women/65.jpg",
  "diana-reyes": "https://randomuser.me/api/portraits/med/women/44.jpg",
  "chief-risk-officer": "https://randomuser.me/api/portraits/med/men/32.jpg",
  "jennifer-walsh": "https://randomuser.me/api/portraits/med/women/26.jpg",
  "marcus-webb": "https://i.pravatar.cc/150?u=marcus-webb",
  "james-park": "https://i.pravatar.cc/150?u=james-park",
  "david-patel": "https://i.pravatar.cc/150?u=david-patel",
  "linda-nakamura": "https://i.pravatar.cc/150?u=linda-nakamura",
  "james-thornton": "https://i.pravatar.cc/150?u=james-thornton",
  "patricia-wells": "https://i.pravatar.cc/150?u=patricia-wells",
  "michael-okafor": "https://i.pravatar.cc/150?u=michael-okafor",
  "robert-tanaka": "https://randomuser.me/api/portraits/med/men/52.jpg",
};

const PERSON_AVATAR: Record<string, string> = {
  "David Patel": AVATARS["david-patel"],
  "Linda Nakamura": AVATARS["linda-nakamura"],
  "James Thornton": AVATARS["james-thornton"],
  "Patricia Wells": AVATARS["patricia-wells"],
  "Michael Okafor": AVATARS["michael-okafor"],
  "Robert Tanaka": AVATARS["robert-tanaka"],
  "Sarah Mitchell": AVATARS["sarah-mitchell"],
  "Diana Reyes": AVATARS["diana-reyes"],
  "Chief Risk Officer": AVATARS["chief-risk-officer"],
  "Jennifer Walsh": AVATARS["jennifer-walsh"],
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
  { chatId: "gc",            step: 1, name: "Sarah Mitchell",       role: "General Counsel",                avatar: AVATARS["sarah-mitchell"],       initials: "SM", color: "#6264A7" },
  { chatId: "diana",         step: 2, name: "Diana Reyes",          role: "VP Supply Chain & Operations",   avatar: AVATARS["diana-reyes"],          initials: "DR", color: "#E3008C" },
  { chatId: "cro",           step: 3, name: "Chief Risk Officer",   role: "Risk Team Lead",                 avatar: AVATARS["chief-risk-officer"],   initials: "CR", color: "#00B7C3" },
  { chatId: "gc-draft",      step: 4, name: "Sarah Mitchell",       role: "GC — Draft Notification",        avatar: AVATARS["sarah-mitchell"],       initials: "SM", color: "#6264A7" },
  { chatId: "draft-review",  step: 5, name: "Sarah Mitchell",       role: "Draft Review — Group Chat",      avatar: AVATARS["sarah-mitchell"],       initials: "SM", color: "#6264A7" },
  { chatId: "ceo",           step: 6, name: "Jennifer Walsh",       role: "CEO",                            avatar: AVATARS["jennifer-walsh"],       initials: "JW", color: "#FFB900" },
  { chatId: "committee",     step: 7, name: "Disclosure Committee", role: "Board Committee Review",         avatar: undefined,                       initials: "DC", color: "#00CC6A" },
  { chatId: "certification", step: 8, name: "Sarah Mitchell",       role: "Certification & EDGAR Filing",   avatar: AVATARS["sarah-mitchell"],       initials: "SM", color: "#059669" },
];

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */

const GC_INTRO_DETECTION: Msg = {
  from: "bot", text: "", time: "10:00 AM", card: {
    title: "3 Emerging Risks Detected",
    fields: [
      { label: "Source", value: "Diligent AI Risk Scanner" },
      { label: "Scan completed", value: "Today at 9:58 AM" },
    ],
    statusRows: [
      { icon: "check", text: "Taiwan Strait Geopolitical Tensions — Critical", color: "#F85149" },
      { icon: "check", text: "Third-Party Vendor Data Breach — High", color: "#F0883E" },
      { icon: "check", text: "EU Digital Markets Act — High", color: "#F0883E" },
    ],
    bullets: [
      "All 3 risks cross the disclosure threshold based on SEC materiality guidance",
      "No current 10-K language covers these risks",
    ],
  },
};

const GC_INTRO_THINKING: Msg = {
  from: "bot", text: "Identifying risk owners based on role, domain expertise, and past assignment history...", time: "10:00 AM", thinking: true,
};

const GC_INTRO_OWNERS: Msg = {
  from: "bot", text: "Here are my recommendations:", time: "10:01 AM", card: {
    title: "Recommended Risk Owners",
    statusRows: [
      { icon: "check", text: "Taiwan Strait → Diana Reyes, VP Supply Chain", color: "#58A6FF" },
      { icon: "check", text: "Vendor Breach → Marcus Webb, CISO", color: "#58A6FF" },
      { icon: "check", text: "EU DMA → James Park, Chief Compliance Officer", color: "#58A6FF" },
    ],
    bullets: ["Risk owners will be interviewed by the Diligent AI Risk Manager to provide context, assess severity, and confirm disclosure recommendations."],
    buttons: [{ label: "Assign Recommended Owners", style: "primary" }, { label: "Choose Different Owners" }],
  },
};

const DIANA_INTRO_CARD: Msg = {
  from: "bot", text: "Hi Diana — the General Counsel has assigned you to investigate a newly detected risk.", time: "10:03 AM", card: {
    title: "Risk Investigation: Taiwan Strait Geopolitical Tensions",
    fields: [
      { label: "Severity", value: "CRITICAL", color: "#F85149" },
      { label: "Assigned by", value: "Sarah Mitchell, General Counsel" },
      { label: "Response needed by", value: "Mar 13, 2026 (48 hours)" },
    ],
    bullets: [
      "Military exercises announced near key Taiwan shipping lanes",
      "47% of Acme's semiconductor suppliers operate in the affected region",
      "Estimated revenue exposure: $1.8B across 3 business units",
      "2 existing controls flagged as insufficient",
    ],
  },
};

const DIANA_INTRO_QUESTION: Msg = {
  from: "bot", text: "I'll guide you through a short assessment. First — what additional context can you provide about Acme's exposure to this risk? Consider supplier relationships, ongoing diversification efforts, and any board discussions.", time: "10:03 AM",
};

const CEO_INTRO: Msg = {
  from: "bot", text: "Good afternoon, Jennifer. The General Counsel has submitted 3 risk disclosures for your approval.", time: "3:32 PM", card: {
    title: "Disclosure Approval Required",
    fields: [
      { label: "Submitted by", value: "Sarah Mitchell, General Counsel" },
      { label: "Documents", value: "10-K Risk Factor Draft, ERM Board Deck" },
      { label: "AI Verification", value: "Passed — all claims substantiated", color: "#3FB950" },
    ],
    statusRows: [
      { icon: "check" as const, text: "Taiwan Strait Geopolitical Tensions — Critical", color: "#F85149" },
      { icon: "check" as const, text: "Third-Party Vendor Data Breach — High", color: "#F0883E" },
      { icon: "check" as const, text: "EU Digital Markets Act — High", color: "#F0883E" },
    ],
    buttons: [
      { label: "Approve All Disclosures", style: "primary" as const },
      { label: "Request Changes" },
      { label: "View Documents", href: `${WEB_BASE}/superhero/data-room` },
    ],
  },
};

const COMMITTEE_INTRO: Msg = {
  from: "bot", text: "The CEO has approved all 3 risk disclosures and requested committee review before EDGAR filing.", time: "4:35 PM", card: {
    title: "10-K Risk Factor Update — Committee Review",
    fields: [
      { label: "Approved by", value: "Jennifer Walsh, CEO" },
      { label: "Risks", value: "Taiwan Strait (Critical), Vendor Breach (High), EU DMA (High)" },
    ],
    bullets: [
      "Documents: 10-K Risk Factor Draft, ERM Board Deck, Context Packet",
      "AI Verification: Passed — all claims substantiated, peer benchmarks included",
      "Please review and confirm or request changes",
    ],
    buttons: [
      { label: "Review in Board Portal", style: "primary" as const, href: `${WEB_BASE}/superhero/board-governance` },
      { label: "View Context Packet", href: `${WEB_BASE}/superhero/context-packet` },
    ],
  },
};

const COMMITTEE_MEMBERS_MSGS: Msg[] = [
  { from: "David Patel", text: "Reviewed the 10-K language and ERM deck. No changes from Audit.", time: "4:50 PM", reactions: ["👍"] },
  { from: "Linda Nakamura", text: "Risk Committee review complete. The Taiwan Strait language looks thorough — good inclusion of the diversification timeline. No changes.", time: "5:00 PM" },
  { from: "James Thornton", text: "Reviewed as Independent Director. No changes requested. The peer comparison data is helpful.", time: "5:10 PM" },
  { from: "Patricia Wells", text: "Cybersecurity perspective: the vendor breach disclosure is well-scoped. No changes.", time: "5:15 PM", reactions: ["👍"] },
  { from: "Michael Okafor", text: "Compliance review complete. EU DMA language covers the key regulatory requirements. No changes.", time: "5:20 PM" },
];

const COMMITTEE_SUMMARY: Msg = {
  from: "bot", text: "", time: "5:25 PM", card: {
    title: "All Committee Reviews Complete",
    statusRows: [
      { icon: "check" as const, text: "David Patel (Audit) — No changes", color: "#3FB950" },
      { icon: "check" as const, text: "Linda Nakamura (Risk) — No changes", color: "#3FB950" },
      { icon: "check" as const, text: "James Thornton (Independent) — No changes", color: "#3FB950" },
      { icon: "check" as const, text: "Patricia Wells (Cybersecurity) — No changes", color: "#3FB950" },
      { icon: "check" as const, text: "Michael Okafor (Compliance) — No changes", color: "#3FB950" },
    ],
    bullets: ["EDGAR filing package is ready. Full audit trail preserved in Diligent Data Room."],
    buttons: [{ label: "Generate EDGAR Filing Package", style: "primary" as const }, { label: "View in Data Room", href: `${WEB_BASE}/superhero/data-room` }],
  },
};

const CRO_INTRO: Msg = {
  from: "bot", text: "The risk owner interview for *Taiwan Strait Geopolitical Tensions* is complete. Diana Reyes has provided her assessment and confirmed the disclosure recommendation.\n\nWhat would you like to do?", time: "10:22 AM", card: {
    buttons: [
      { label: "Evaluate the response here", style: "primary" },
      { label: "Open Risk Essentials", href: `${WEB_BASE}/superhero/risk-discovery` },
      { label: "Try Risk Impact Simulator", href: `${WEB_BASE}/superhero/risk-analysis` },
    ],
  },
};

function TeamsContent() {
  const searchParams = useSearchParams();
  const initialChat = searchParams?.get("chat") || "gc";
  const [activeChat, setActiveChat] = useState(initialChat);
  const [chats, setChats] = useState<Chat[]>(CHATS);
  const [stepIdx, setStepIdx] = useState<Record<string, number>>(() => Object.fromEntries(CHATS.map(c => [c.id, 0])));
  const [sending, setSending] = useState(false);
  const [gcIntroPhase, setGcIntroPhase] = useState(0); // 0=empty, 2=thinking, 3=owners shown
  const endRef = useRef<HTMLDivElement>(null);
  const introStarted = useRef(false);

  const chat = chats.find(c => c.id === activeChat)!;
  const perspective = PERSPECTIVES.find(p => p.chatId === activeChat)!;
  const sidebarCfg = SIDEBAR_PER_PERSPECTIVE[activeChat] ?? SIDEBAR_PER_PERSPECTIVE.gc;
  const currentStep = chat.steps[stepIdx[activeChat] ?? 0];
  const hasMore = (stepIdx[activeChat] ?? 0) < chat.steps.length;

  const scroll = useCallback(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, []);
  useEffect(() => { scroll(); }, [activeChat, scroll]);

  // GC intro: detection card -> thinking -> owners card, all automatic
  useEffect(() => {
    if (introStarted.current) return;
    introStarted.current = true;

    setTimeout(() => {
      setChats(prev => prev.map(c => c.id !== "gc" ? c : { ...c, messages: [...c.messages, GC_INTRO_DETECTION] }));
      scroll();
    }, 800);

    setTimeout(() => {
      setChats(prev => prev.map(c => c.id !== "gc" ? c : { ...c, messages: [...c.messages, GC_INTRO_THINKING] }));
      setGcIntroPhase(2);
      scroll();
    }, 2500);

    setTimeout(() => {
      setChats(prev => prev.map(c => c.id !== "gc" ? c : {
        ...c,
        messages: c.messages.filter(m => !m.thinking).concat(GC_INTRO_OWNERS),
      }));
      setGcIntroPhase(3);
      scroll();
    }, 5000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Diana intro: animate in when her tab is first opened
  const dianaIntroRan = useRef(false);
  useEffect(() => {
    if (activeChat !== "diana" || dianaIntroRan.current) return;
    dianaIntroRan.current = true;

    setTimeout(() => {
      setChats(prev => prev.map(c => c.id !== "diana" ? c : { ...c, messages: [...c.messages, DIANA_INTRO_CARD] }));
      scroll();
    }, 600);

    setTimeout(() => {
      setChats(prev => prev.map(c => c.id !== "diana" ? c : { ...c, messages: [...c.messages, DIANA_INTRO_QUESTION] }));
      scroll();
    }, 2200);
  }, [activeChat, scroll]);

  // CRO intro: animate in when their tab is first opened
  const croIntroRan = useRef(false);
  useEffect(() => {
    if (activeChat !== "cro" || croIntroRan.current) return;
    croIntroRan.current = true;

    setTimeout(() => {
      setChats(prev => prev.map(c => c.id !== "cro" ? c : { ...c, messages: [...c.messages, CRO_INTRO] }));
      scroll();
    }, 600);
  }, [activeChat, scroll]);

  // GC Draft Notification intro: Sarah gets pinged that CRO is done
  const gcDraftIntroRan = useRef(false);
  useEffect(() => {
    if (activeChat !== "gc-draft" || gcDraftIntroRan.current) return;
    gcDraftIntroRan.current = true;

    setTimeout(() => {
      setChats(prev => prev.map(c => c.id !== "gc-draft" ? c : { ...c, messages: [...c.messages,
        { from: "bot", text: "", time: "2:25 PM", card: {
          title: "CRO Evaluation Complete — Taiwan Strait Risk",
          fields: [
            { label: "Risk", value: "Taiwan Strait — Semiconductor Supply Chain" },
            { label: "CRO Assessment", value: "HIGH likelihood · CRITICAL impact" },
            { label: "Risk Owner", value: "Diana Reyes — interview completed" },
          ],
          statusRows: [
            { icon: "check", text: "Diana Reyes completed risk owner interview", color: "#3FB950" },
            { icon: "check", text: "CRO severity assessment submitted", color: "#3FB950" },
            { icon: "check", text: "Moody's geopolitical signals integrated", color: "#3FB950" },
            { icon: "check", text: "Peer benchmark analysis complete", color: "#3FB950" },
          ],
        }},
      ]}));
      scroll();
    }, 600);

    setTimeout(() => {
      setChats(prev => prev.map(c => c.id !== "gc-draft" ? c : { ...c, messages: [...c.messages,
        { from: "bot", text: "Sarah — all inputs are in. Diana completed her risk owner interview, the CRO has assessed the severity as HIGH likelihood / CRITICAL impact, and I've cross-referenced Moody's signals and peer filings.\n\nI've already drafted a 10-K risk factor disclosure for the Taiwan Strait semiconductor supply chain risk. It incorporates all of the above — you can review, edit, and refine it before routing for approval.", time: "2:26 PM", card: {
          buttons: [
            { label: "Review Draft", style: "primary", href: `${WEB_BASE}/superhero/writer?risk=risk-taiwan&owner=diana-reyes` },
            { label: "Remind me at 1pm" },
          ],
        }},
      ]}));
      scroll();
    }, 2200);

  }, [activeChat, scroll]);

  // CEO intro: animate in when their tab is first opened
  const ceoIntroRan = useRef(false);
  useEffect(() => {
    if (activeChat !== "ceo" || ceoIntroRan.current) return;
    ceoIntroRan.current = true;

    setTimeout(() => {
      setChats(prev => prev.map(c => c.id !== "ceo" ? c : { ...c, messages: [...c.messages, CEO_INTRO] }));
      scroll();
    }, 600);
  }, [activeChat, scroll]);

  // Committee intro: bot announcement, then members respond one by one
  const committeeIntroRan = useRef(false);
  useEffect(() => {
    if (activeChat !== "committee" || committeeIntroRan.current) return;
    committeeIntroRan.current = true;

    setTimeout(() => {
      setChats(prev => prev.map(c => c.id !== "committee" ? c : { ...c, messages: [...c.messages, COMMITTEE_INTRO] }));
      scroll();
    }, 600);

    COMMITTEE_MEMBERS_MSGS.forEach((msg, i) => {
      setTimeout(() => {
        setChats(prev => prev.map(c => c.id !== "committee" ? c : { ...c, messages: [...c.messages, msg] }));
        scroll();
      }, 1800 + i * 800);
    });

    setTimeout(() => {
      setChats(prev => prev.map(c => c.id !== "committee" ? c : { ...c, messages: [...c.messages, COMMITTEE_SUMMARY] }));
      scroll();
    }, 1800 + COMMITTEE_MEMBERS_MSGS.length * 800 + 600);
  }, [activeChat, scroll]);

  const draftReviewIntroRan = useRef(false);
  useEffect(() => {
    if (activeChat !== "draft-review" || draftReviewIntroRan.current) return;
    draftReviewIntroRan.current = true;

    setTimeout(() => {
      setChats(prev => prev.map(c => c.id !== "draft-review" ? c : { ...c, messages: [...c.messages,
        { from: "bot", text: "", time: "3:35 PM", card: {
          title: "10-K Disclosure Draft — Ready for Review",
          fields: [
            { label: "Risk", value: "Taiwan Strait — Semiconductor Supply Chain" },
            { label: "Drafted by", value: "Sarah Mitchell (General Counsel)" },
            { label: "Sources", value: "Diana Reyes interview, CRO assessment, Moody's signals, peer benchmarks" },
          ],
          statusRows: [
            { icon: "check", text: "Draft submitted by Sarah Mitchell at 3:30 PM", color: "#3FB950" },
            { icon: "pending", text: "Awaiting review from CRO, Diana Reyes, and Robert Tanaka", color: "#F0883E" },
          ],
          buttons: [
            { label: "View the 10-K Draft", style: "primary", href: `${WEB_BASE}/superhero/writer?risk=risk-taiwan&owner=diana-reyes` },
          ],
        }},
        { from: "bot", text: "Sarah has completed and submitted her first draft of the Taiwan Strait 10-K risk factor disclosure. I've compiled it using Diana's risk owner interview, the CRO's severity assessment, Moody's geopolitical signals, and peer benchmarks.\n\nI need each of you to review before it goes back to Sarah for final approval and CEO routing. Please flag anything that needs revision.", time: "3:35 PM" },
      ]}));
      scroll();
    }, 600);

    setTimeout(() => {
      setChats(prev => prev.map(c => c.id !== "draft-review" ? c : { ...c, messages: [...c.messages,
        { from: "Diana Reyes", text: "I've reviewed the draft — the supplier concentration numbers are accurate and the diversification timeline matches what we discussed in the October board materials. The only thing I'd flag is we should mention the Vietnam facility qualification is already underway, not just \"being evaluated.\"", time: "3:42 PM" },
      ]}));
      scroll();
    }, 2400);

    setTimeout(() => {
      setChats(prev => prev.map(c => c.id !== "draft-review" ? c : { ...c, messages: [...c.messages,
        { from: "Chief Risk Officer", text: "Looks solid. The severity language aligns with our internal assessment — HIGH likelihood, CRITICAL impact. I'd keep the current phrasing. Diana's point about Vietnam is valid; let's update that.", time: "3:48 PM" },
      ]}));
      scroll();
    }, 3800);

    setTimeout(() => {
      setChats(prev => prev.map(c => c.id !== "draft-review" ? c : { ...c, messages: [...c.messages,
        { from: "Robert Tanaka", text: "From a financial reporting perspective, the 47% concentration figure needs to tie back to our supplier audit data — I've confirmed it does. The materiality threshold language is appropriate. No issues from my side.", time: "3:55 PM" },
      ]}));
      scroll();
    }, 5200);

    setTimeout(() => {
      setChats(prev => prev.map(c => c.id !== "draft-review" ? c : { ...c, messages: [...c.messages,
        { from: "bot", text: "All reviewers have weighed in. Here's the summary:", time: "3:56 PM", card: {
          title: "Review Complete — 1 Minor Edit Suggested",
          statusRows: [
            { icon: "check", text: "Diana Reyes — Approved with minor edit (Vietnam language)", color: "#3FB950" },
            { icon: "check", text: "Chief Risk Officer — Approved, no changes", color: "#3FB950" },
            { icon: "check", text: "Robert Tanaka (CFO) — Approved, no changes", color: "#3FB950" },
          ],
          bullets: ["Diana suggests updating \"evaluation of alternative sourcing regions\" to \"active qualification of alternative suppliers in Vietnam\" to reflect current status."],
        }},
      ]}));
      scroll();
    }, 6400);
  }, [activeChat, scroll]);

  // Certification intro: AI announces committee is done, prompts CEO/CFO to certify
  const certIntroRan = useRef(false);
  useEffect(() => {
    if (activeChat !== "certification" || certIntroRan.current) return;
    certIntroRan.current = true;

    setTimeout(() => {
      setChats(prev => prev.map(c => c.id !== "certification" ? c : { ...c, messages: [...c.messages,
        { from: "bot", text: "", time: "5:40 PM", card: {
          title: "Disclosure Committee Review Complete",
          fields: [
            { label: "Committee", value: "All 5 members reviewed — no changes" },
            { label: "Documents", value: "10-K Risk Factors, ERM Deck, Context Packets" },
            { label: "Board Review", value: "Approved in Diligent Boards" },
          ],
          statusRows: [
            { icon: "check", text: "Disclosure Committee — all members approved", color: "#3FB950" },
            { icon: "check", text: "Board book materials reviewed and approved", color: "#3FB950" },
            { icon: "pending", text: "Officer certifications required before EDGAR filing", color: "#F0883E" },
          ],
        }},
        { from: "bot", text: "Everything has been reviewed and approved. Before I can submit the 10-K filing to EDGAR, I need officer certifications from Jennifer (CEO) and Robert (CFO) under SOX Sections 302 and 906.\n\nJennifer, Robert — please confirm your certification below.", time: "5:41 PM" },
      ]}));
      scroll();
    }, 600);

    setTimeout(() => {
      setChats(prev => prev.map(c => c.id !== "certification" ? c : { ...c, messages: [...c.messages,
        { from: "Jennifer Walsh", text: "I've reviewed the updated 10-K risk factors, the ERM board deck, and all supporting context packets. I certify that the disclosures are accurate and complete to the best of my knowledge.\n\nSOX Section 302 / 906 — certified.", time: "5:50 PM" },
      ]}));
      scroll();
    }, 2400);

    setTimeout(() => {
      setChats(prev => prev.map(c => c.id !== "certification" ? c : { ...c, messages: [...c.messages,
        { from: "Robert Tanaka", text: "Confirmed from the financial reporting side. The materiality thresholds and concentration figures tie to our audited supplier data. SOX Section 302 / 906 — certified.", time: "5:55 PM" },
      ]}));
      scroll();
    }, 3800);

    setTimeout(() => {
      setChats(prev => prev.map(c => c.id !== "certification" ? c : { ...c, messages: [...c.messages,
        { from: "bot", text: "Both officer certifications received. I'm ready to assemble and submit the filing package to EDGAR.\n\nThe package includes the updated 10-K risk factors, all officer certifications, and the complete audit trail from risk detection through committee approval.", time: "5:58 PM", card: {
          title: "Ready to File",
          statusRows: [
            { icon: "check", text: "CEO certification — Jennifer Walsh", color: "#3FB950" },
            { icon: "check", text: "CFO certification — Robert Tanaka", color: "#3FB950" },
            { icon: "check", text: "Filing package assembled", color: "#3FB950" },
          ],
          buttons: [
            { label: "Continue — Submit via EDGAR", style: "primary" },
            { label: "Cancel" },
          ],
        }},
      ]}));
      scroll();
    }, 5200);
  }, [activeChat, scroll]);

  const handleSend = () => {
    if (activeChat === "gc" && gcIntroPhase < 3) return;
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
            <a href={SLACK_BASE} className="px-3 py-1 rounded-md text-[11px] font-medium text-[#888] hover:bg-[#F0F0F0] transition-colors">Slack</a>
          </div>
          <div className="h-4 w-px bg-[#DDD] mx-1" />
          <a href="/gc" className="text-[11px] text-[#6264A7] hover:underline font-medium whitespace-nowrap">GC End-to-End →</a>
          <div className="flex-1 h-px bg-[#DDD]" />
          <p className="text-[10px] text-[#AAA] shrink-0">Select a persona to see their perspective</p>
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
                        <span className="text-[13px] text-white font-semibold truncate">{conv.id === "gc" || conv.id === "diana" || conv.id === "cro" || conv.id === "ceo" ? "Diligent Risk Agent" : conv.name}</span>
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
                  <span className="text-[14px] text-white font-semibold">{chat.id === "gc" ? "Diligent Risk Agent" : chat.id === "diana" ? "Diligent Risk Agent" : chat.id === "cro" ? "Diligent Risk Agent" : chat.id === "ceo" ? "Diligent Risk Agent" : chat.name}</span>
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
                          {!isUser && <span className="text-[12px] font-semibold text-white">{isBot ? "Diligent Risk Agent" : personName}</span>}
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
                {activeChat === "gc" && gcIntroPhase < 3 ? (
                  <span className="flex-1 text-[13px] text-[#8B8B8B]">Type a message</span>
                ) : hasMore ? (
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
                    disabled={sending || (activeChat === "gc" && gcIntroPhase < 3) || !hasMore}
                    className={`w-8 h-8 rounded flex items-center justify-center transition-all ${(!sending && !(activeChat === "gc" && gcIntroPhase < 3) && hasMore) ? "bg-[#6264A7] hover:bg-[#7B7FBF] text-white cursor-pointer" : "text-[#555] cursor-default"}`}
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
