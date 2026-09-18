'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  Share2,
  Printer,
  Sparkles,
  ShieldCheck,
  MessageCircle,
  Mail,
  Loader2,
  AlertCircle
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import ReceiptCard from '@/components/ReceiptCard';
import { Button } from '@/components/ui/button';
import { publicClientLink, type ScopeReceipt } from '@/lib/scopeReceipt';
import { toast } from 'sonner';

export default function PreviewReceiptPage() {
  const { publicId } = useParams<{ publicId: string }>();
  const router = useRouter();
  const [receipt, setReceipt] = useState<ScopeReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadReceipt() {
      try {
        const res = await fetch(`/api/receipts/${publicId}`);
        const data = await res.json();
        if (data.success && data.receipt) {
          setReceipt(data.receipt);
        } else {
          toast.error('Receipt not found in database');
        }
      } catch {
        toast.error('Failed to load receipt from database');
      } finally {
        setLoading(false);
      }
    }
    if (publicId) {
      loadReceipt();
    }
  }, [publicId]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-28 text-[#8c98a9]">
          <Loader2 className="size-8 animate-spin text-emerald-400" />
          <p className="mt-3 font-mono text-xs">Loading ScopeReceipt...</p>
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
          <p className="mt-2 text-xs text-[#8c98a9]">The requested ScopeReceipt was not found.</p>
          <Link href="/create" className="mt-6 inline-block">
            <Button className="bg-[#1b2029] hover:bg-[#232936] text-xs">Create a New Receipt</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const clientUrl = publicClientLink(receipt.publicId);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(clientUrl);
    setCopied(true);
    toast.success('Client link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(
      `Hey! Here is our agreed project scope receipt before we begin: ${clientUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Scope Agreement: ${receipt.title}`);
    const body = encodeURIComponent(
      `Hi,\n\nI've created a digital ScopeReceipt outlining what's included and excluded for our project before we begin:\n\n${clientUrl}\n\nPlease review and confirm so we can kick off!\n\nBest regards,\n${receipt.freelancerName}`
    );
    window.open(`mailto:${receipt.clientEmail || ''}?subject=${subject}&body=${body}`);
  };

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12" data-testid="preview-page">
        {/* Top bar */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/create"
            className="flex items-center gap-2 text-xs font-mono text-[#8c98a9] transition-colors hover:text-[#f4f5f8]"
          >
            <ArrowLeft className="size-4" /> Create Another Receipt
          </Link>

          <div className="flex items-center gap-2 font-mono text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
            <Sparkles className="size-3.5" />
            <span>Activated · 1 Credit Consumed · Ready to Share</span>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] min-w-0">
          {/* Left: Finalized Receipt */}
          <div className="min-w-0">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#7b8798]">
                Receipt Preview
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 text-xs text-[#8c98a9] hover:text-[#f4f5f8] cursor-pointer"
              >
                <Printer className="size-3.5" /> Print
              </button>
            </div>

            <div className="bg-[#14171d] border border-[#232936] rounded-xl p-3 sm:p-5 shadow-2xl min-w-0 overflow-hidden">
              <ReceiptCard receipt={receipt} compact={false} />
            </div>
          </div>

          {/* Right: Share Card */}
          <div className="space-y-6">
            <div className="rounded-xl border border-[#232936] bg-[#14171d] p-6 sm:p-7 shadow-xl">
              <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                <Share2 className="size-3.5" />
                <span>Share with your client</span>
              </div>

              <h2 className="mt-2 text-lg font-bold text-[#f4f5f8]">
                Send confirmation link
              </h2>
              <p className="mt-1 text-xs text-[#8c98a9]">
                Your client opens the link, reviews the scope & boundaries, and locks it with zero login or password required.
              </p>

              {/* Link Box */}
              <div className="mt-5 flex items-center gap-2 rounded-lg border border-[#232936] bg-[#0d0f12] p-2">
                <input
                  type="text"
                  readOnly
                  value={clientUrl}
                  className="flex-1 bg-transparent font-mono text-xs text-[#dce2ee] outline-none px-1 select-all"
                  aria-label="Client URL"
                />
                <Button
                  size="sm"
                  onClick={copyToClipboard}
                  className="h-8 shrink-0 bg-[#1b2029] hover:bg-[#232936] text-[#f4f5f8] border border-[#2e3748] text-xs"
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5 text-emerald-400 mr-1" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5 mr-1" /> Copy
                    </>
                  )}
                </Button>
              </div>

              {/* Share Channels */}
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={shareViaWhatsApp}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#232936] bg-[#1b2029] hover:bg-[#232936] py-2 text-xs font-medium text-[#dce2ee] transition-colors cursor-pointer"
                >
                  <MessageCircle className="size-4 text-emerald-400" />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={shareViaEmail}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#232936] bg-[#1b2029] hover:bg-[#232936] py-2 text-xs font-medium text-[#dce2ee] transition-colors cursor-pointer"
                >
                  <Mail className="size-4 text-sky-400" />
                  <span>Email</span>
                </button>
              </div>

              {/* Client Simulator Action */}
              <div className="mt-6 pt-5 border-t border-[#1e2430]">
                <Link href={`/client/${receipt.publicId}`} className="block">
                  <Button
                    size="lg"
                    className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 font-bold text-xs text-black uppercase tracking-wider transition-all shadow-sm"
                  >
                    <span>View as Client & Test Confirmation</span>
                    <ExternalLink className="size-4 ml-1.5" />
                  </Button>
                </Link>
                <p className="mt-2 text-center text-[10px] text-[#637082]">
                  Opens client confirmation view. Confirms and locks receipt directly in MySQL.
                </p>
              </div>
            </div>

            {/* Guarantee Box */}
            <div className="rounded-xl border border-[#232936] bg-[#101318] p-5 text-xs text-[#8c98a9]">
              <div className="flex items-start gap-3">
                <ShieldCheck className="size-5 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-[#f4f5f8]">Zero Friction Client Experience</h4>
                  <p className="mt-1 leading-relaxed text-[#788496]">
                    Clients never need an account. They review the deliverables and lock the scope in under 30 seconds.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
