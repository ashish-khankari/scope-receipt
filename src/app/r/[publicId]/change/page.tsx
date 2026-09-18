'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, PlusCircle, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatMoney, type ScopeReceipt } from '@/lib/scopeReceipt';
import { toast } from 'sonner';

export default function ScopeChangePage() {
  const { publicId } = useParams<{ publicId: string }>();
  const router = useRouter();

  const [receipt, setReceipt] = useState<ScopeReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState('');
  const [additionalPrice, setAdditionalPrice] = useState('75');
  const [newDeadline, setNewDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadReceipt() {
      try {
        const res = await fetch(`/api/receipts/${publicId}`);
        const data = await res.json();
        if (data.success && data.receipt) {
          setReceipt(data.receipt);
          setNewDeadline(data.receipt.deadline);
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
  }, [publicId]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-28 text-[#8c98a9]">
          <Loader2 className="size-8 animate-spin text-emerald-400" />
          <p className="mt-3 font-mono text-xs">Loading change request form...</p>
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
          <Link href="/" className="mt-4 inline-block">
            <Button className="bg-[#1b2029] hover:bg-[#232936] text-xs">Return Home</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast.error('Please describe the additional work requested.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/receipts/${receipt.publicId}/change-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          additionalPrice: Number(additionalPrice) || 0,
          newDeadline: newDeadline || receipt.deadline,
          status: 'APPROVED',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit scope change');
      }

      toast.success('Change Request recorded separately without modifying original receipt!');
      router.push(`/r/${receipt.publicId}`);
    } catch (err: any) {
      toast.error(err.message || 'Error creating change request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
        <Link
          href={`/r/${receipt.publicId}`}
          className="inline-flex items-center gap-2 text-xs font-mono text-[#8c98a9] transition-colors hover:text-[#f4f5f8] mb-6"
        >
          <ArrowLeft className="size-4" /> Back to Locked Receipt ({receipt.publicId})
        </Link>

        <div className="rounded-xl border border-[#232936] bg-[#14171d] p-6 sm:p-10 shadow-2xl">
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
            <PlusCircle className="size-4 text-amber-400" />
            <span>Change Request Form</span>
          </div>

          <h1 className="mt-2 text-xl sm:text-2xl font-bold text-[#f4f5f8] tracking-tight">
            Add Change Request to &ldquo;{receipt.title}&rdquo;
          </h1>

          <p className="mt-2 text-xs text-[#8c98a9] leading-relaxed">
            The original receipt remains immutable (${receipt.price}). This Change Request records additional scope, extra price, and revised deadlines separately.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-6">
            <div>
              <label htmlFor="cr-desc" className="block font-mono text-xs font-semibold text-[#b0bac7]">
                Description of Additional Work
              </label>
              <Textarea
                id="cr-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Tablet optimization & responsive navigation menu breakdown"
                className="mt-2 min-h-24 bg-[#0d0f12] border-[#232936] text-[#f4f5f8] text-sm focus:border-emerald-500 placeholder-[#505a69]"
                required
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="cr-price" className="block font-mono text-xs font-semibold text-[#b0bac7]">
                  Additional Price ({receipt.currency})
                </label>
                <div className="mt-2 relative">
                  <Input
                    id="cr-price"
                    type="number"
                    value={additionalPrice}
                    onChange={(e) => setAdditionalPrice(e.target.value)}
                    placeholder="75"
                    className="font-mono text-sm font-semibold pl-8 bg-[#0d0f12] border-[#232936] text-[#f4f5f8] focus:border-emerald-500"
                    required
                  />
                  <span className="absolute left-3 top-2.5 font-mono text-sm text-[#637082]">$</span>
                </div>
              </div>

              <div>
                <label htmlFor="cr-date" className="block font-mono text-xs font-semibold text-[#b0bac7]">
                  New / Revised Deadline
                </label>
                <Input
                  id="cr-date"
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="mt-2 bg-[#0d0f12] border-[#232936] text-[#f4f5f8] text-sm focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Price Preview Banner */}
            <div className="rounded-lg border border-[#232936] bg-[#0d0f12] p-4 text-xs font-mono text-[#8c98a9] space-y-1.5">
              <div className="flex justify-between items-center">
                <span>Original Immutable Receipt:</span>
                <span className="text-[#f4f5f8]">{formatMoney(receipt.price, receipt.currency)}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-400">
                <span>+ This Change Request:</span>
                <span>+{formatMoney(Number(additionalPrice) || 0, receipt.currency)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#1e2430] font-bold text-sm text-[#f4f5f8]">
                <span>Total Combined Project Scope:</span>
                <span className="text-emerald-400">{formatMoney(receipt.price + (Number(additionalPrice) || 0), receipt.currency)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <Link href={`/r/${receipt.publicId}`}>
                <Button type="button" variant="ghost" className="text-xs text-[#8c98a9] hover:text-[#f4f5f8]">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={submitting}
                className="h-10 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs px-5 rounded-lg shadow-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    <span>Recording...</span>
                  </>
                ) : (
                  <span>Record Change Request</span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </AppShell>
  );
}
