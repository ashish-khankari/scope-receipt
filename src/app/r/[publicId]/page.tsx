'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Check,
  Lock,
  Printer,
  Copy,
  PlusCircle,
  ShieldCheck,
  Loader2,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import ReceiptCard from '@/components/ReceiptCard';
import { Button } from '@/components/ui/button';
import { publicLockedLink, formatDateTime, type ScopeReceipt } from '@/lib/scopeReceipt';
import { toast } from 'sonner';

export default function LockedReceiptPage() {
  const { publicId } = useParams<{ publicId: string }>();
  const [receipt, setReceipt] = useState<ScopeReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchLockedReceipt() {
      try {
        const res = await fetch(`/api/receipts/${publicId}`);
        const data = await res.json();
        if (data.success && data.receipt) {
          setReceipt(data.receipt);
        } else {
          toast.error('ScopeReceipt not found');
        }
      } catch {
        toast.error('Error fetching locked receipt');
      } finally {
        setLoading(false);
      }
    }
    if (publicId) fetchLockedReceipt();
  }, [publicId]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-28 text-[#8c98a9]">
          <Loader2 className="size-8 animate-spin text-emerald-400" />
          <p className="mt-3 font-mono text-xs">Loading Locked Scope Proof...</p>
        </div>
      </AppShell>
    );
  }

  if (!receipt) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md py-20 text-center px-4 text-[#f4f5f8]">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold">Receipt Not Found</h2>
          <p className="mt-2 text-xs text-[#8c98a9]">This ScopeReceipt could not be located.</p>
          <Link href="/" className="mt-6 inline-block">
            <Button className="bg-[#1b2029] hover:bg-[#232936] text-xs">Return Home</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const proofUrl = publicLockedLink(receipt.publicId);

  const copyProofLink = () => {
    navigator.clipboard.writeText(proofUrl);
    setCopied(true);
    toast.success('Locked proof link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12" data-testid="locked-page">
        {/* Verification Banner */}
        <div className="mb-8 rounded-xl border border-emerald-500/30 bg-[#121c17] p-5 sm:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500 text-black shrink-0 font-bold">
                <Check className="size-6" strokeWidth={3} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold text-emerald-400 tracking-tight">
                    ✓ SCOPE LOCKED
                  </h1>
                  <span className="rounded bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300 uppercase">
                    Verified Proof
                  </span>
                </div>
                <div className="text-xs text-[#a7b4c6] mt-1 space-y-0.5 font-mono">
                  <p>Confirmed on: <span className="text-[#f4f5f8] font-medium">{formatDateTime(receipt.lockedAt || receipt.createdAt)}</span></p>
                  <p>Receipt ID: <span className="text-emerald-400 font-semibold">{receipt.publicId}</span></p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="bg-[#14171d] border-[#2a3446] text-[#cbd5e1] hover:bg-[#1f2633] text-xs"
              >
                <Printer className="size-3.5 mr-1.5" />
                <span>Print / PDF</span>
              </Button>

              <Button
                size="sm"
                onClick={copyProofLink}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs shadow-sm"
              >
                {copied ? <Check className="size-3.5 mr-1" /> : <Copy className="size-3.5 mr-1" />}
                <span>{copied ? 'Copied' : 'Share Proof'}</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] min-w-0">
          {/* Main Locked Receipt Card */}
          <div className="min-w-0">
            <div className="bg-[#14171d] border border-[#232936] rounded-xl p-3 sm:p-5 shadow-2xl min-w-0 overflow-hidden">
              <ReceiptCard receipt={receipt} compact={false} />
            </div>
          </div>

          {/* Right Column: Scope Change Request */}
          <div className="space-y-6">
            {/* Scope Change Box */}
            <div className="rounded-xl border border-[#232936] bg-[#14171d] p-6 sm:p-7 shadow-xl">
              <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-amber-400">
                <PlusCircle className="size-3.5" />
                <span>Client requested additions?</span>
              </div>

              <h2 className="mt-2 text-lg font-bold text-[#f4f5f8]">
                Create Change Request
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-[#cbd5e1]">
                Has the client asked for tablet breakpoints, extra revisions, or backend integrations? Original locked scope is immutable. Submit a separate Change Request with additional price and deadline.
              </p>

              <div className="mt-5">
                <Link href={`/r/${receipt.publicId}/change`}>
                  <Button className="w-full h-11 bg-[#1b2029] hover:bg-[#232936] border border-[#2e3748] font-semibold text-xs text-[#f4f5f8] transition-all">
                    <PlusCircle className="size-4 mr-2 text-emerald-400" />
                    <span>Create Change Request (+$$)</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Verification Details Box */}
            <div className="rounded-xl border border-[#232936] bg-[#14171d] p-5 text-xs text-[#cbd5e1]">
              <div className="flex items-start gap-3">
                <ShieldCheck className="size-5 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-[#f4f5f8]">Immutable Record</h4>
                  <p className="mt-1 leading-relaxed text-[#cbd5e1]">
                    This scope URL is permanently locked. Original deliverables, price, and boundary cannot be edited.
                  </p>
                  <div className="mt-2 font-mono text-[10px] text-[#94a3b8]">
                    Receipt ID: {receipt.publicId}
                  </div>
                </div>
              </div>
            </div>

            {/* Back to Dashboard */}
            <div className="pt-2 text-center">
              <Link href="/dashboard" className="text-xs font-mono text-emerald-400 hover:underline">
                ← Return to Freelancer Dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
