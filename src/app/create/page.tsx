'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CircleHelp,
  FileText,
  LockKeyhole,
  Save,
  Sparkles,
  Eye,
  Coins,
  Loader2,
  X,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AppShell from '@/components/AppShell';
import ReceiptCard from '@/components/ReceiptCard';
import { useAppDispatch, useAppSelector } from '@/lib/store/store';
import { setCredits, setUser as setReduxUser } from '@/lib/store/authSlice';
import {
  defaultDraft,
  makeReceipt,
  receiptTemplates,
  type Currency,
  type ReceiptDraft,
} from '@/lib/scopeReceipt';
import { toast } from 'sonner';

export default function CreatePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const reduxUser = useAppSelector((state) => state.auth.user);

  const [draft, setDraft] = useState<ReceiptDraft>(defaultDraft);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const user = reduxUser;

  useEffect(() => {
    // If not loaded yet, fetch
    if (!reduxUser) {
      setLoadingUser(true);
      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((data) => {
          if (data.authenticated && data.user) {
            dispatch(setReduxUser(data.user));
            if (!draft.freelancerName || draft.freelancerName === 'Alex Chen') {
              setDraft((d) => ({ ...d, freelancerName: data.user.name }));
            }
          }
        })
        .catch(() => {})
        .finally(() => setLoadingUser(false));
    } else {
      if (!draft.freelancerName || draft.freelancerName === 'Alex Chen') {
        setDraft((d) => ({ ...d, freelancerName: reduxUser.name }));
      }
    }
  }, [reduxUser]);

  const update = (key: keyof ReceiptDraft, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const applyTemplate = (tmpl: typeof receiptTemplates[0]) => {
    setDraft((prev) => ({
      ...prev,
      title: tmpl.title || tmpl.name,
      deliverable: tmpl.deliverable,
      notIncluded: tmpl.notIncluded,
      price: tmpl.price,
      handoverMethod: tmpl.handoverMethod,
    }));
    toast.success(`Applied "${tmpl.name}" template`);
  };

  const handleBuyCredits = async (tier: 'three_receipts' | 'forty_nine_receipts' | 'twenty_nine_receipts') => {
    setPurchasing(tier);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: tier }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to purchase credits');
        setPurchasing(null);
        return;
      }

      if (data.checkoutUrl) {
        toast.success('Redirecting to secure checkout...', {
          action: {
            label: 'Open Checkout',
            onClick: () => {
              window.location.href = data.checkoutUrl;
            },
          },
        });
        window.location.href = data.checkoutUrl;
        return;
      }

      toast.success(data.message || 'Credits added!');
      if (typeof data.newBalance === 'number') {
        dispatch(setCredits(data.newBalance));
      }
      setShowCreditsModal(false);
    } catch {
      toast.error('Payment connection error');
    } finally {
      setPurchasing(null);
    }
  };

  const submit = async (status: 'AWAITING_CONFIRMATION' | 'DRAFT' = 'AWAITING_CONFIRMATION') => {
    const finalTitle = draft.title?.trim() || draft.deliverable.split(/[.!?]/)[0]?.slice(0, 60).trim();
    if (!finalTitle) {
      toast.error('Please enter a deliverable scope / title.');
      return;
    }
    if (!draft.deliverable.trim()) {
      toast.error('Please describe what you are delivering in the description.');
      return;
    }
    if (!draft.notIncluded.trim()) {
      toast.error('Please specify what is NOT included.');
      return;
    }
    if (!draft.deadline) {
      toast.error('Please select a target deadline.');
      return;
    }
    if (!draft.price) {
      toast.error('Please enter the agreed price.');
      return;
    }

    // If activating a non-draft receipt, check credits
    if (status === 'AWAITING_CONFIRMATION') {
      if (!user) {
        toast.error('Please log in or create a freelancer account to lock receipts');
        router.push('/login');
        return;
      }

      if (user.credits < 1) {
        setShowCreditsModal(true);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draft, title: finalTitle, status }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.needsCredits) {
          setShowCreditsModal(true);
          return;
        }
        throw new Error(data.error || 'Failed to save receipt');
      }

      if (status === 'DRAFT') {
        toast.success('Draft saved! (0 credits consumed)');
        router.push('/dashboard');
      } else {
        toast.success('ScopeReceipt activated! (1 credit consumed)');
        if (data.creditsRemaining !== undefined) {
          dispatch(setCredits(data.creditsRemaining));
        }
        router.push(`/preview/${data.publicId}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error creating receipt');
    } finally {
      setSubmitting(false);
    }
  };

  const previewReceipt = makeReceipt(draft, 'awaiting');

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12 min-w-0" data-testid="create-page">
        {/* Navigation & Credits Indicator */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs font-mono text-[#8c98a9] transition-colors hover:text-[#f4f5f8]"
          >
            <ArrowLeft className="size-4" /> Back to Dashboard
          </Link>

          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 px-3 py-1 bg-[#14171d] border border-emerald-500/20 rounded-lg text-xs font-mono text-emerald-400">
                <Coins className="w-3.5 h-3.5" />
                <span>{user.credits} Credits Available</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowLivePreview(!showLivePreview)}
              className="lg:hidden flex items-center gap-1.5 rounded-lg border border-[#232936] bg-[#14171d] px-3 py-1.5 text-xs font-medium text-[#f4f5f8] shadow-sm cursor-pointer"
            >
              <Eye className="size-3.5 text-emerald-400" />
              <span>{showLivePreview ? 'Hide Preview' : 'Show Preview'}</span>
            </button>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 min-w-0">
          {/* Form Column */}
          <div className="min-w-0">
            <div>
              <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                <LockKeyhole className="size-3" /> New ScopeReceipt
              </div>

              <h1 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight text-[#f4f5f8]">
                Lock your scope.
              </h1>

              <p className="mt-2 text-xs leading-relaxed text-[#8c98a9] max-w-lg">
                Define what you&apos;re delivering before you start. Clear boundaries prevent unbudgeted client revisions. Drafts & previews are free.
              </p>

              {/* Template Chips */}
              <div className="mt-5">
                <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#637082]">
                  <Sparkles className="size-3 text-emerald-400" /> Quick preset templates:
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {receiptTemplates.map((t) => (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => applyTemplate(t)}
                      className="rounded-lg border border-[#232936] bg-[#14171d] px-3 py-1 text-xs text-[#cbd5e1] transition-all hover:border-emerald-500/40 hover:text-emerald-400 cursor-pointer"
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Form */}
            <form
              className="mt-7 space-y-6 min-w-0"
              onSubmit={(e) => {
                e.preventDefault();
                submit('AWAITING_CONFIRMATION');
              }}
            >
              {/* Deliverable Scope (Title) */}
              <div>
                <label
                  htmlFor="title"
                  className="flex items-center justify-between font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#cbd5e1]"
                >
                  <span>Deliverable Scope (Project Title)</span>
                  <span className="font-normal normal-case tracking-normal text-xs text-emerald-400">
                    * required
                  </span>
                </label>
                <Input
                  id="title"
                  value={draft.title || ''}
                  onChange={(e) => update('title', e.target.value)}
                  placeholder="e.g. Landing Page Redesign, Mobile App UX..."
                  className="mt-2 bg-[#14171d] border-[#232936] text-[#f4f5f8] text-sm focus:border-emerald-500 placeholder-[#94a3b8]"
                  required
                />
                <p className="mt-1 text-[11px] text-[#94a3b8]">
                  The main deliverable title displayed on the receipt header.
                </p>
              </div>

              {/* Deliverable Description */}
              <div>
                <label
                  htmlFor="deliverable"
                  className="flex items-center justify-between font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#cbd5e1]"
                >
                  <span>Deliverable Description</span>
                  <span className="font-normal normal-case tracking-normal text-xs text-emerald-400">
                    * required
                  </span>
                </label>
                <Textarea
                  id="deliverable"
                  value={draft.deliverable}
                  onChange={(e) => update('deliverable', e.target.value)}
                  placeholder="Describe exactly what you are delivering in detail (e.g. 1 responsive Next.js landing page with hero, testimonials, and contact form)"
                  className="mt-2 min-h-28 resize-y bg-[#14171d] border-[#232936] text-[#f4f5f8] text-sm focus:border-emerald-500 placeholder-[#94a3b8] break-words"
                  required
                />
                <p className="mt-1 text-[11px] text-[#94a3b8]">
                  Detailed breakdown of the exact work, features, and assets included.
                </p>
              </div>

              {/* Not Included Boundary Box */}
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <label
                      htmlFor="not-included"
                      className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-amber-400"
                    >
                      Not Included (The Boundary)
                    </label>
                    <p className="mt-0.5 text-xs text-[#cbd5e1]">
                      This is where you prevent scope creep. List exclusions one per line.
                    </p>
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-amber-500/80">
                    one per line
                  </span>
                </div>
                <Textarea
                  id="not-included"
                  value={draft.notIncluded}
                  onChange={(e) => update('notIncluded', e.target.value)}
                  placeholder="Copywriting & custom illustrations&#10;Backend database integration&#10;SEO advertising & link campaigns&#10;More than 2 revision rounds"
                  className="mt-3 min-h-24 resize-y bg-[#0d0f12] border-amber-500/30 text-[#f4f5f8] text-sm focus:border-amber-400 placeholder-[#94a3b8]"
                  required
                />
              </div>

              {/* Delivery Deadline & Handover */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="deadline"
                    className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#cbd5e1]"
                  >
                    Target Deadline
                  </label>
                  <Input
                    id="deadline"
                    type="date"
                    value={draft.deadline}
                    onChange={(e) => update('deadline', e.target.value)}
                    className="mt-2 bg-[#14171d] border-[#232936] text-[#f4f5f8] text-sm focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="handover"
                    className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#cbd5e1]"
                  >
                    Handover Method
                  </label>
                  <Input
                    id="handover"
                    value={draft.handoverMethod}
                    onChange={(e) => update('handoverMethod', e.target.value)}
                    placeholder="GitHub PR, Figma link, WeTransfer..."
                    className="mt-2 bg-[#14171d] border-[#232936] text-[#f4f5f8] text-sm focus:border-emerald-500 placeholder-[#94a3b8]"
                  />
                </div>
              </div>

              {/* Price & Currency */}
              <div>
                <label className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#cbd5e1]">
                  Agreed Price
                </label>
                <div className="mt-2 flex gap-2">
                  <select
                    value={draft.currency}
                    onChange={(e) => update('currency', e.target.value as Currency)}
                    className="h-10 w-24 rounded-lg border border-[#232936] bg-[#14171d] px-3 font-mono text-xs font-semibold text-[#f4f5f8] outline-none focus:border-emerald-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="CAD">CAD ($)</option>
                    <option value="AUD">AUD ($)</option>
                  </select>

                  <Input
                    value={draft.price}
                    onChange={(e) => update('price', e.target.value.replace(/[^0-9]/g, ''))}
                    inputMode="numeric"
                    placeholder="350"
                    className="font-mono text-sm font-semibold bg-[#14171d] border-[#232936] text-[#f4f5f8] focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Client Info (Optional) */}
              <div className="border-t border-[#1e2430] pt-5">
                <div className="mb-2.5 flex items-center gap-2">
                  <FileText className="size-3.5 text-[#94a3b8]" />
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#cbd5e1]">
                    Optional Client Details
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    value={draft.clientName}
                    onChange={(e) => update('clientName', e.target.value)}
                    placeholder="Client name / company"
                    className="bg-[#14171d] border-[#232936] text-[#f4f5f8] text-xs focus:border-emerald-500 placeholder-[#94a3b8]"
                  />
                  <Input
                    type="email"
                    value={draft.clientEmail}
                    onChange={(e) => update('clientEmail', e.target.value)}
                    placeholder="Client email"
                    className="bg-[#14171d] border-[#232936] text-[#f4f5f8] text-xs focus:border-emerald-500 placeholder-[#94a3b8]"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => submit('DRAFT')}
                  disabled={submitting}
                  className="h-10 text-xs text-[#cbd5e1] hover:text-[#f4f5f8] hover:bg-[#1b2029]"
                >
                  <Save className="size-3.5 mr-1.5" /> Save as Draft (Free)
                </Button>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-10 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-5 text-xs font-semibold text-black transition-all shadow-[0_2px_0_#065f46]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <span>Lock & Share Receipt (1 Credit)</span>
                      <ArrowRight className="size-3.5 ml-1.5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Sticky Live Preview Column */}
          <div className={`lg:block ${showLivePreview ? 'block' : 'hidden'} min-w-0 max-w-full`}>
            <div className="sticky top-24 min-w-0 max-w-full">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Preview
                </span>
                <span className="text-[11px] text-[#637082]">Generated in real-time</span>
              </div>

              <div className="rounded-2xl border border-dashed border-[#283244] p-3 sm:p-4 bg-[#14171d] min-w-0 max-w-full overflow-hidden">
                <ReceiptCard receipt={previewReceipt} compact={false} />
              </div>

              <div className="mt-4 rounded-xl border border-[#232936] bg-[#101318] p-4 text-xs text-[#8c98a9]">
                <div className="flex items-start gap-2.5">
                  <CircleHelp className="size-4 text-emerald-400 mt-0.5 shrink-0" />
                  <p>
                    Recipient opens this link directly with zero accounts, passwords, or login friction.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Credit Purchase Modal */}
      {showCreditsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#14171d] border border-[#283244] rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowCreditsModal(false)}
              className="absolute top-4 right-4 text-[#94a3b8] hover:text-[#f4f5f8] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <Coins className="w-5 h-5" />
              <h3 className="font-semibold text-base text-[#f4f5f8]">ScopeReceipt Credits Needed</h3>
            </div>
            <p className="text-xs text-[#cbd5e1] mb-5">
              You currently have <strong className="text-emerald-400 font-mono">0 credits</strong>. Choose an option to activate your receipt and start sharing.
            </p>

            <div className="space-y-3">
              {/* Option 1: 3 receipts for $1 */}
              <div className="p-4 bg-[#0d0f12] border border-[#232936] rounded-lg flex items-center justify-between hover:border-[#384359] transition-all">
                <div>
                  <span className="text-xs font-semibold text-[#f4f5f8] block">Starter Pack (3 ScopeReceipts)</span>
                  <span className="text-xs font-mono text-[#cbd5e1]">$1 one-time ($0.33/ea)</span>
                </div>
                <Button
                  onClick={() => handleBuyCredits('three_receipts')}
                  disabled={purchasing !== null}
                  className="bg-[#1b2029] hover:bg-[#232936] text-[#f4f5f8] border border-[#2a3243] text-xs h-8 px-3 rounded"
                >
                  {purchasing === 'three_receipts' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    'Buy 3 ($1)'
                  )}
                </Button>
              </div>

              {/* Option 2: 49 receipts for $10 */}
              <div className="p-4 bg-[#0d0f12] border border-emerald-500/40 rounded-lg flex items-center justify-between relative hover:border-emerald-500 transition-all">
                <span className="absolute -top-2 right-4 px-1.5 py-0.2 bg-emerald-500 text-black font-mono text-[9px] font-bold rounded uppercase">
                  Best Value
                </span>
                <div>
                  <span className="text-xs font-semibold text-emerald-400 block">Pro Pack (49 ScopeReceipts)</span>
                  <span className="text-xs font-mono text-[#cbd5e1]">$10 one-time (~$0.20/ea)</span>
                </div>
                <Button
                  onClick={() => handleBuyCredits('forty_nine_receipts')}
                  disabled={purchasing !== null}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs h-8 px-3 rounded shadow-sm"
                >
                  {purchasing === 'forty_nine_receipts' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    'Buy 49 ($10)'
                  )}
                </Button>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-[#1e2430] text-[11px] text-[#94a3b8] text-center">
              No subscription required. 1 free receipt included with account. Credits never expire.
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
