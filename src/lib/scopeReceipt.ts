export type Currency = "USD" | "EUR" | "GBP" | "INR" | "CAD" | "AUD";
export type ReceiptStatus =
  | "DRAFT"
  | "AWAITING_CONFIRMATION"
  | "LOCKED"
  | "CHANGE_REQUEST"
  | "CHANGE_APPROVED"
  | "CHANGE_DECLINED"
  | "draft"
  | "awaiting"
  | "locked";

export type ChangeRequestStatus = "PENDING" | "APPROVED" | "DECLINED" | "pending" | "approved" | "declined";

export interface ChangeRequest {
  id: string;
  description: string;
  additionalPrice: number;
  newDeadline: string;
  status: ChangeRequestStatus;
  createdAt: string;
  approvedAt?: string;
}

export interface ScopeReceipt {
  id: string;
  publicId: string;
  userId?: string;
  title: string;
  deliverable: string;
  notIncluded: string[];
  deadline: string;
  handoverMethod: string;
  price: number;
  currency: Currency;
  freelancerName: string;
  freelancerEmail?: string;
  clientName?: string;
  clientEmail?: string;
  status: ReceiptStatus;
  createdAt: string;
  lockedAt?: string;
  clientSignature?: string;
  changeRequests: ChangeRequest[];
}

const STORAGE_KEY = "scopereceipt-demo-receipts";

export const seededReceipts: ScopeReceipt[] = [
  {
    id: "rcpt_8xk29",
    publicId: "SR-8XK29",
    title: "Landing page redesign",
    deliverable: "1 high-converting responsive landing page in Next.js + Tailwind CSS with interactive hero, feature breakdown, social proof grid, and custom contact form.",
    notIncluded: [
      "Copywriting & custom brand illustrations",
      "Backend database schema & API integrations",
      "SEO link-building and Google Ads configuration",
      "More than 2 rounds of design revisions"
    ],
    deadline: "2026-09-24",
    handoverMethod: "GitHub Pull Request + Vercel Live Preview Link",
    price: 350,
    currency: "USD",
    freelancerName: "Alex Chen",
    freelancerEmail: "alex@chencreates.io",
    clientName: "Marcus Vance",
    clientEmail: "marcus@vancegrowth.co",
    status: "locked",
    createdAt: "2026-09-16T18:30:00Z",
    lockedAt: "2026-09-16T19:14:22Z",
    clientSignature: "Marcus Vance",
    changeRequests: [
      {
        id: "cr_1",
        description: "Add dark mode toggle and animated mobile navigation menu.",
        additionalPrice: 75,
        newDeadline: "2026-09-26",
        status: "approved",
        createdAt: "2026-09-17T11:00:00Z",
        approvedAt: "2026-09-17T13:45:00Z",
      }
    ]
  },
  {
    id: "rcpt_9ya14",
    publicId: "SR-9YA14",
    title: "Brand identity & logo kit",
    deliverable: "Primary vector logo mark, secondary lockup, color palette tokens, typography pairing guidelines, and export package (SVG, PNG, PDF).",
    notIncluded: [
      "Social media banner templates & ad graphics",
      "Physical packaging die-cuts & merchandise printing",
      "More than 3 initial logo aesthetic directions",
      "Trademark filing or legal search"
    ],
    deadline: "2026-09-28",
    handoverMethod: "Figma project link + Google Drive archive",
    price: 480,
    currency: "USD",
    freelancerName: "Alex Chen",
    freelancerEmail: "alex@chencreates.io",
    clientName: "Elena Rostova",
    clientEmail: "elena@lumina.studio",
    status: "awaiting",
    createdAt: "2026-09-16T14:10:00Z",
    changeRequests: []
  },
  {
    id: "rcpt_3ml82",
    publicId: "SR-3ML82",
    title: "Product demo video edit",
    deliverable: "Color-graded 1080p 60-second video with kinetic text overlays, background audio mastering, and vertical 9:16 export for social.",
    notIncluded: [
      "Original voiceover talent recording",
      "Full scriptwriting from scratch",
      "Complex 3D product motion graphics",
      "Raw project file delivery (.prproj / .aep)"
    ],
    deadline: "2026-09-22",
    handoverMethod: "Frame.io review link + WeTransfer ProRes master",
    price: 280,
    currency: "USD",
    freelancerName: "Alex Chen",
    freelancerEmail: "alex@chencreates.io",
    clientName: "Devin Cole",
    status: "locked",
    createdAt: "2026-09-14T08:30:00Z",
    lockedAt: "2026-09-14T11:42:00Z",
    clientSignature: "Devin Cole",
    changeRequests: []
  }
];

export interface ReceiptDraft {
  title?: string;
  deliverable: string;
  notIncluded: string;
  deadline: string;
  handoverMethod: string;
  price: string;
  currency: Currency;
  freelancerName?: string;
  freelancerEmail?: string;
  clientName: string;
  clientEmail: string;
}

export const defaultDraft: ReceiptDraft = {
  title: "Landing page redesign",
  deliverable: "1 responsive landing page redesign with hero section, problem/solution grid, pricing tiers, and contact form.",
  notIncluded: "Copywriting & custom stock photography\nBackend API integration / database setup\nSEO link building or ad setup\nMore than 2 rounds of revisions",
  deadline: "2026-09-25",
  handoverMethod: "GitHub Pull Request + Vercel Preview Link",
  price: "350",
  currency: "USD",
  freelancerName: "You",
  clientName: "",
  clientEmail: "",
};

export const receiptTemplates = [
  {
    name: "Landing Page Redesign",
    title: "Landing Page Redesign",
    deliverable: "1 responsive landing page redesign with custom hero, feature benefits grid, customer testimonials, and contact form.",
    notIncluded: "Copywriting & content generation\nThird-party API / database setup\nSEO link campaigns\nMore than 2 rounds of design revisions",
    price: "350",
    handoverMethod: "GitHub PR + Live Vercel Preview",
  },
  {
    name: "Brand & Logo Identity",
    title: "Brand & Logo Identity",
    deliverable: "Primary logo mark, secondary lockup, official color palette tokens, typography rules, and vector source files (SVG, PDF, PNG).",
    notIncluded: "Social media ad banners\nPhysical packaging and print production\nMore than 3 initial creative directions\nTrademark search or registration",
    price: "450",
    handoverMethod: "Figma Link + Google Drive archive",
  },
  {
    name: "SaaS Dashboard MVP",
    title: "SaaS Dashboard MVP",
    deliverable: "React front-end interface with authenticated user dashboard, summary analytics metrics cards, and settings panel.",
    notIncluded: "Payment gateway integration (Stripe)\nCustom backend database architecture\nEmail SMTP notification server\nOngoing DevOps monitoring",
    price: "750",
    handoverMethod: "GitHub Repository with documentation",
  },
  {
    name: "Video Editing & Cuts",
    title: "Video Editing & Cuts",
    deliverable: "1x 60-second polished promo video with kinetic text motion, sound design, color grading, and 16:9 + 9:16 exports.",
    notIncluded: "On-camera filming or studio equipment\nOriginal voiceover recording\nCustom 3D character animation\nSource project file delivery",
    price: "300",
    handoverMethod: "Frame.io Review link + WeTransfer download",
  }
];

const hasWindow = () => typeof window !== "undefined";

export function getReceipts(): ScopeReceipt[] {
  if (!hasWindow()) return seededReceipts;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seededReceipts));
    return seededReceipts;
  }
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : seededReceipts;
  } catch {
    return seededReceipts;
  }
}

export function saveReceipts(receipts: ScopeReceipt[]): void {
  if (hasWindow()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts));
  }
}

export function getReceipt(publicId: string): ScopeReceipt | undefined {
  return getReceipts().find((r) => r.publicId.toUpperCase() === publicId.toUpperCase());
}

export function updateReceipt(publicId: string, update: Partial<ScopeReceipt>): ScopeReceipt | undefined {
  const receipts = getReceipts().map((receipt) =>
    receipt.publicId.toUpperCase() === publicId.toUpperCase() ? { ...receipt, ...update } : receipt
  );
  saveReceipts(receipts);
  return receipts.find((r) => r.publicId.toUpperCase() === publicId.toUpperCase());
}

export function addReceipt(receipt: ScopeReceipt): void {
  const existing = getReceipts();
  saveReceipts([receipt, ...existing.filter((item) => item.publicId !== receipt.publicId)]);
}

export function deleteReceipt(publicId: string): void {
  const filtered = getReceipts().filter((item) => item.publicId !== publicId);
  saveReceipts(filtered);
}

export function makeReceipt(draft: ReceiptDraft, status: ReceiptStatus = "awaiting"): ScopeReceipt {
  const now = new Date().toISOString();
  const publicId = `SR-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const notIncluded = draft.notIncluded
    .split("\n")
    .map((item) => item.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
  const title = draft.title?.trim() || draft.deliverable.split(/[.!?]/)[0]?.slice(0, 48).trim() || "Scope Agreement";

  return {
    id: `rcpt_${Math.random().toString(36).slice(2, 9)}`,
    publicId,
    title,
    deliverable: draft.deliverable.trim(),
    notIncluded,
    deadline: draft.deadline,
    handoverMethod: draft.handoverMethod.trim(),
    price: Number(draft.price) || 0,
    currency: draft.currency,
    freelancerName: draft.freelancerName?.trim() || "Alex Chen",
    clientName: draft.clientName.trim() || undefined,
    clientEmail: draft.clientEmail.trim() || undefined,
    status,
    createdAt: now,
    changeRequests: [],
  };
}

export function formatMoney(price: number, currency: Currency = "USD"): string {
  const currencyLocales: Record<Currency, string> = {
    USD: "en-US",
    EUR: "de-DE",
    GBP: "en-GB",
    INR: "en-IN",
    CAD: "en-CA",
    AUD: "en-AU",
  };
  return new Intl.NumberFormat(currencyLocales[currency] || "en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const parsed = dateStr.includes("T") ? new Date(dateStr) : new Date(`${dateStr}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export function publicClientLink(publicId: string): string {
  if (!hasWindow()) return `/client/${publicId}`;
  return `${window.location.origin}/client/${publicId}`;
}

export function publicLockedLink(publicId: string): string {
  if (!hasWindow()) return `/r/${publicId}`;
  return `${window.location.origin}/r/${publicId}`;
}
