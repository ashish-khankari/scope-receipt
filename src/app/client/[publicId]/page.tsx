'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, ShieldCheck, Lock, FileCheck2, Loader2, AlertCircle } from 'lucide-react';
import ReceiptCard from '@/components/ReceiptCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ScopeReceipt } from '@/lib/scopeReceipt';
import { toast } from 'sonner';

export default function ClientReceiptPage() {
  const { publicId } = useParams<{ publicId: string }>();
  const router = useRouter();

  const [receipt, setReceipt] = useState<ScopeReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState('');
  const [locking, setLocking] = useState(false);

  useEffect(() => {
    async function loadReceipt() {
      try {
        const res = await fetch(`/api/receipts/${publicId}`);
        const data = await res.json();
        if (data.success && data.receipt) {
          if (data.receipt.status?.toUpperCase() === 'LOCKED') {
            router.replace(`/r/${data.receipt.publicId}`);
            return;
          }
          setReceipt(data.receipt);
          setSignature(data.receipt.clientName || '');
        } else {
          toast.error('ScopeReceipt not found');
        }
      } catch {
        toast.error('Failed to load receipt');
      } finally {
        setLoading(false);
      }
    }
    if (publicId) loadReceipt();
  }, [publicId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0d0f12] text-[#8c98a9]">
        <Loader2 className="size-8 animate-spin text-emerald-400" />
        <p className="mt-3 font-mono text-xs">Loading Scope Agreement...</p>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0d0f12] text-[#f4f5f8]">
        <div className="max-w-md w-full rounded-xl border border-[#232936] bg-[#14171d] p-8 text-center shadow-xl">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold">Receipt Not Found</h2>
          <p className="mt-2 text-xs text-[#8c98a9]">This ScopeReceipt link may be invalid or expired.</p>
          <Link href="/" className="mt-5 inline-block">
            <Button className="bg-[#1b2029] hover:bg-[#232936] border border-[#2a3243] text-xs">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleConfirmAndLock = async () => {
    if (!agreed) {
      toast.error('Please check the acknowledgment box to confirm.');
      return;
    }

    setLocking(true);

    try {
      const res = await fetch(`/api/receipts/${receipt.publicId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'LOCKED',
          clientSignature: signature.trim() || receipt.clientName || 'Client Confirmed',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to lock scope');
      }

      toast.success('Scope locked permanently!');
      router.push(`/r/${receipt.publicId}`);
    } catch (err: any) {
      toast.error(err.message || 'Error confirming scope');
      setLocking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0f12] text-[#f4f5f8] py-8 px-4 sm:py-14 sm:px-6">
      {/* Client Header (No account needed) */}
      <div className="mx-auto max-w-2xl text-center mb-7">
        <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
          <FileCheck2 className="size-4" />
          <span>Scope Agreement</span>
        </div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#f4f5f8]">
          Review & Confirm Scope
        </h1>
        <p className="mt-1 text-xs text-[#cbd5e1]">
          Prepared by <strong className="font-semibold text-[#dce2ee]">{receipt.freelancerName}</strong> before commencing work. No account required.
        </p>
      </div>

      {/* Center Receipt Card */}
      <div className="mx-auto max-w-2xl min-w-0">
        <div className="bg-[#14171d] border border-[#232936] rounded-xl p-3 sm:p-5 shadow-2xl min-w-0 overflow-hidden">
          <ReceiptCard receipt={receipt} compact={false} />
        </div>

        {/* Confirmation Action Box */}
        <div className="mt-7 rounded-xl border border-[#232936] bg-[#14171d] p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-400">
            <ShieldCheck className="size-4" />
            <span>Digital Scope Acknowledgment</span>
          </div>

          <p className="mt-2 text-xs text-[#cbd5e1] leading-relaxed">
            By confirming below, you and {receipt.freelancerName} formally lock the deliverables, deadlines, and boundaries stated above. Once locked, original scope becomes immutable.
          </p>

          <div className="mt-6 space-y-4">
            {/* Signature Input */}
            <div>
              <label htmlFor="client-sig" className="font-mono text-xs font-semibold text-[#cbd5e1]">
                Your Name / Organization
              </label>
              <Input
                id="client-sig"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="e.g. Elena Rostova"
                className="mt-1.5 h-11 bg-[#0d0f12] border-[#232936] text-[#f4f5f8] text-sm focus:border-emerald-500 placeholder-[#94a3b8]"
              />
            </div>

            {/* Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 size-4 rounded accent-emerald-500 cursor-pointer"
              />
              <span className="text-xs text-[#cbd5e1] leading-snug">
                I confirm that the deliverables, exclusions (the boundary), agreed price, and target delivery above accurately represent our agreement.
              </span>
            </label>

            {/* CTA: LOCK IN SCOPE */}
            <div className="pt-3">
              <Button
                size="lg"
                onClick={handleConfirmAndLock}
                disabled={locking}
                className="w-full h-13 bg-emerald-500 hover:bg-emerald-400 text-sm font-bold uppercase tracking-wider text-black transition-all shadow-[0_2px_0_#065f46] active:scale-[0.99]"
              >
                {locking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Locking Scope...</span>
                  </>
                ) : (
                  <>
                    <Check className="size-5 mr-1.5" strokeWidth={2.5} />
                    <span>LOCK IN SCOPE</span>
                  </>
                )}
              </Button>
              <div className="mt-3 flex items-center justify-center gap-2 font-mono text-[10px] text-[#94a3b8]">
                <Lock className="size-3 text-emerald-400" />
                <span>Permanently timestamped & immutable upon confirmation</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
