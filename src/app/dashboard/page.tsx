'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Search,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  TrendingUp,
  FileCheck2,
  Trash2,
  Clock3,
  Loader2,
  Coins,
  History,
  UserCheck,
  Sparkles,
  ArrowUpRight,
  LogOut,
  AlertCircle,
  FileText,
  GitPullRequest
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppDispatch, useAppSelector } from '@/lib/store/store';
import { setCredits, setUser as setReduxUser, logoutUser } from '@/lib/store/authSlice';
import {
  formatDate,
  formatMoney,
  publicClientLink,
  publicLockedLink,
  type ReceiptStatus,
  type ScopeReceipt,
} from '@/lib/scopeReceipt';
import { toast } from 'sonner';

interface LedgerItem {
  id: string;
  type: string;
  credits: number;
  referenceId?: string;
  receiptId?: string;
  createdAt: string;
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'receipts';

  const dispatch = useAppDispatch();
  const reduxUser = useAppSelector((state) => state.auth.user);

  const [activeTab, setActiveTab] = useState<'receipts' | 'changes' | 'credits' | 'account'>(
    (initialTab as any) || 'receipts'
  );
  const [receipts, setReceipts] = useState<ScopeReceipt[]>([]);
  const [ledger, setLedger] = useState<LedgerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const user = reduxUser;

  // Load Auth & Data
  const loadDashboardData = async () => {
    try {
      // 1. Fetch user session
      const authRes = await fetch('/api/auth/me');
      const authData = await authRes.json();

      if (!authData.authenticated) {
        // Redirect unauthenticated user to login
        router.push('/login');
        return;
      }

      dispatch(setReduxUser(authData.user));

      // 2. Fetch receipts
      const rcptRes = await fetch('/api/receipts');
      const rcptData = await rcptRes.json();
      if (rcptData.success && Array.isArray(rcptData.receipts)) {
        setReceipts(rcptData.receipts);
      }

      // 3. Fetch credit ledger
      const ledgerRes = await fetch('/api/ledger');
      const ledgerData = await ledgerRes.json();
      if (ledgerData.success && Array.isArray(ledgerData.transactions)) {
        setLedger(ledgerData.transactions);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Handle return from Dodo Payments checkout
    const paymentStatus = searchParams.get('status');
    const reference = searchParams.get('reference');
    const tier = searchParams.get('tier');

    if (paymentStatus === 'success' && reference && tier) {
      const finalizePurchase = async () => {
        try {
          const res = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product: tier, paymentReference: reference }),
          });
          const data = await res.json();
          if (data.success) {
            toast.success(data.message || 'Payment confirmed! Credits added.');
            if (typeof data.newBalance === 'number') {
              dispatch(setCredits(data.newBalance));
            }
            loadDashboardData();
          }
        } catch (err) {
          console.error('Error confirming payment:', err);
        } finally {
          router.replace('/dashboard?tab=credits');
        }
      };

      finalizePurchase();
    }
  }, []);

  // Purchase Credits Handler (Backend controlled: three_receipts or forty_nine_receipts)
  const handlePurchaseCredits = async (tier: 'three_receipts' | 'forty_nine_receipts' | 'twenty_nine_receipts') => {
    setPurchasing(tier);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: tier }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to initiate purchase');
        setPurchasing(null);
        return;
      }

      // If Dodo hosted checkout URL is returned, redirect customer to checkout
      if (data.checkoutUrl) {
        toast.success('Redirecting to checkout...', {
          action: {
            label: 'Open Link',
            onClick: () => {
              window.location.href = data.checkoutUrl;
            },
          },
        });
        window.location.href = data.checkoutUrl;
        return;
      }

      toast.success(data.message || 'Credits successfully added!');
      // Update Redux state immediately so header and all components sync instantly
      if (typeof data.newBalance === 'number') {
        dispatch(setCredits(data.newBalance));
      }

      // Refresh ledger
      const ledgerRes = await fetch('/api/ledger');
      const ledgerData = await ledgerRes.json();
      if (ledgerData.success && Array.isArray(ledgerData.transactions)) {
        setLedger(ledgerData.transactions);
      }
    } catch {
      toast.error('Network error while processing purchase.');
    } finally {
      setPurchasing(null);
    }
  };

  const handleCopyLink = (receipt: ScopeReceipt) => {
    const isLocked = receipt.status.toUpperCase() === 'LOCKED';
    const url = isLocked ? publicLockedLink(receipt.publicId) : publicClientLink(receipt.publicId);
    navigator.clipboard.writeText(url);
    setCopiedId(receipt.publicId);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (publicId: string) => {
    if (confirm(`Are you sure you want to delete ${publicId}?`)) {
      try {
        const res = await fetch(`/api/receipts/${publicId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          toast.success('Receipt deleted');
          setReceipts((prev) => prev.filter((r) => r.publicId !== publicId));
        } else {
          toast.error(data.error || 'Failed to delete');
        }
      } catch {
        toast.error('Error deleting receipt');
      }
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    dispatch(logoutUser());
    router.push('/login');
    router.refresh();
  };

  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const normStatus = r.status.toUpperCase();
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'LOCKED' && normStatus === 'LOCKED') ||
        (statusFilter === 'AWAITING' && (normStatus === 'AWAITING' || normStatus === 'AWAITING_CONFIRMATION')) ||
        (statusFilter === 'DRAFT' && normStatus === 'DRAFT') ||
        (statusFilter === 'CHANGES' && (normStatus === 'CHANGE_REQUEST' || normStatus === 'CHANGE_APPROVED'));

      const matchesSearch =
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.publicId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.clientName && r.clientName.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesStatus && matchesSearch;
    });
  }, [receipts, statusFilter, searchQuery]);

  // All change requests flattened
  const allChangeRequests = useMemo(() => {
    const list: { receiptPublicId: string; receiptTitle: string; cr: any }[] = [];
    receipts.forEach((r) => {
      if (r.changeRequests && r.changeRequests.length > 0) {
        r.changeRequests.forEach((cr) => {
          list.push({
            receiptPublicId: r.publicId,
            receiptTitle: r.title,
            cr,
          });
        });
      }
    });
    return list;
  }, [receipts]);

  if (loading) {
    return (
      <AppShell>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-[#8c98a9]">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
          <p className="text-sm font-mono">Loading your ScopeReceipts & credit ledger...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12" data-testid="dashboard-page">
        {/* Header Title & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#232936]">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#f4f5f8]">
                ScopeReceipts
              </h1>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#18201d] border border-emerald-500/30 rounded-full text-xs font-mono font-semibold text-emerald-400">
                <Coins className="w-3.5 h-3.5" />
                <span>Credits: {user?.credits ?? 0}</span>
              </div>
            </div>
            <p className="text-xs text-[#cbd5e1] mt-1">
              Logged in as <span className="text-[#f4f5f8] font-medium">{user?.name}</span> ({user?.email})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('credits')}
              className="px-3.5 py-2 bg-[#1b2029] hover:bg-[#232936] border border-[#2b3343] rounded-lg text-xs font-medium text-[#dce2ee] transition-all flex items-center gap-2"
            >
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
              <span>Get Credits</span>
            </button>

            <Link href="/create">
              <Button className="h-9 sm:h-10 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 font-mono text-xs font-semibold uppercase tracking-wider text-black transition-all shadow-[0_2px_0_#065f46]">
                <Plus className="size-3.5 mr-1" />
                <span>New ScopeReceipt</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2 border-b border-[#1b2029]">
          <button
            onClick={() => setActiveTab('receipts')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'receipts'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-[#cbd5e1] hover:text-[#f4f5f8]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Receipts ({receipts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('changes')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'changes'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-[#cbd5e1] hover:text-[#f4f5f8]'
            }`}
          >
            <GitPullRequest className="w-3.5 h-3.5" />
            <span>Change Requests ({allChangeRequests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('credits')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'credits'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-[#cbd5e1] hover:text-[#f4f5f8]'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Credits & Billing</span>
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'account'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-[#cbd5e1] hover:text-[#f4f5f8]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Account</span>
          </button>
        </div>

        {/* TAB 1: RECEIPTS */}
        {activeTab === 'receipts' && (
          <div className="mt-6 space-y-6">
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#94a3b8]" />
                <input
                  type="text"
                  placeholder="Search by client, ID, or title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-[#14171d] border border-[#232936] rounded-lg text-xs text-[#f4f5f8] placeholder-[#94a3b8] focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'LOCKED', label: 'Locked' },
                  { id: 'AWAITING', label: 'Awaiting' },
                  { id: 'DRAFT', label: 'Drafts' },
                  { id: 'CHANGES', label: 'Changes' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                      statusFilter === tab.id
                        ? 'bg-[#232936] text-[#f4f5f8] border border-[#384359]'
                        : 'text-[#cbd5e1] hover:text-[#f4f5f8]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Receipts Table / List */}
            {filteredReceipts.length === 0 ? (
              <div className="text-center py-16 px-4 bg-[#14171d] border border-[#232936] rounded-xl">
                <FileText className="w-10 h-10 mx-auto text-[#64748b] mb-3" />
                <h3 className="text-base font-semibold text-[#f4f5f8]">No receipts found</h3>
                <p className="text-xs text-[#cbd5e1] max-w-sm mx-auto mt-1 mb-5">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your search query or filter.'
                    : 'Create your first ScopeReceipt to lock deliverables before starting work.'}
                </p>
                <Link href="/create">
                  <Button className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs h-9 px-4">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Create ScopeReceipt
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="bg-[#14171d] border border-[#232936] rounded-xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#cbd5e1]">
                    <thead className="bg-[#101318] text-[#cbd5e1] font-mono uppercase text-[10px] tracking-wider border-b border-[#232936]">
                      <tr>
                        <th className="px-5 py-3">Receipt ID</th>
                        <th className="px-5 py-3">Client</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Deliverable</th>
                        <th className="px-5 py-3 text-right">Price</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1b2029]">
                      {filteredReceipts.map((receipt) => {
                        const isLocked = receipt.status.toUpperCase() === 'LOCKED';
                        const isDraft = receipt.status.toUpperCase() === 'DRAFT';
                        const isAwaiting =
                          receipt.status.toUpperCase() === 'AWAITING' ||
                          receipt.status.toUpperCase() === 'AWAITING_CONFIRMATION';
                        const isChange =
                          receipt.status.toUpperCase() === 'CHANGE_APPROVED' ||
                          receipt.status.toUpperCase() === 'CHANGE_REQUEST';

                        return (
                          <tr key={receipt.id} className="hover:bg-[#181d25] transition-colors group">
                            <td className="px-5 py-4 font-mono font-semibold text-[#f4f5f8]">
                              <Link
                                href={isLocked ? `/r/${receipt.publicId}` : `/client/${receipt.publicId}`}
                                className="hover:text-emerald-400 transition-colors flex items-center gap-1"
                              >
                                <span>{receipt.publicId}</span>
                                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </Link>
                              <span className="text-[10px] text-[#556070] block font-normal">
                                {formatDate(receipt.createdAt)}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span className="font-medium text-[#dce2ee] block">
                                {receipt.clientName || 'Unnamed Client'}
                              </span>
                              {receipt.clientEmail && (
                                <span className="text-[10px] text-[#637082] block">{receipt.clientEmail}</span>
                              )}
                            </td>

                            <td className="px-5 py-4">
                              {isLocked && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px] font-semibold">
                                  ✓ Locked
                                </span>
                              )}
                              {isAwaiting && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[11px]">
                                  <Clock3 className="w-3 h-3" /> Awaiting Confirmation
                                </span>
                              )}
                              {isDraft && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#2a3243] text-[#a6b2c3] font-mono text-[11px]">
                                  Draft
                                </span>
                              )}
                              {isChange && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono text-[11px]">
                                  Change Approved
                                </span>
                              )}
                            </td>

                            <td className="px-5 py-4 max-w-xs">
                              <p className="truncate text-[#cbd5e1] font-medium">{receipt.title}</p>
                              <p className="truncate text-[11px] text-[#637082]">{receipt.deliverable}</p>
                            </td>

                            <td className="px-5 py-4 text-right font-mono font-bold text-[#f4f5f8]">
                              {formatMoney(receipt.price, receipt.currency)}
                              {receipt.changeRequests?.length > 0 && (
                                <span className="text-[10px] text-emerald-400 block font-normal">
                                  +{formatMoney(receipt.changeRequests.reduce((s, c) => s + c.additionalPrice, 0))} change
                                </span>
                              )}
                            </td>

                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleCopyLink(receipt)}
                                  title="Copy shareable link"
                                  className="p-1.5 rounded bg-[#101318] hover:bg-[#232936] text-[#8c98a9] hover:text-[#f4f5f8] border border-[#232936] transition-colors"
                                >
                                  {copiedId === receipt.publicId ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                <Link
                                  href={isLocked ? `/r/${receipt.publicId}` : `/client/${receipt.publicId}`}
                                  target="_blank"
                                  title={isLocked ? 'View locked proof' : 'Open client confirmation page'}
                                  className="p-1.5 rounded bg-[#101318] hover:bg-[#232936] text-[#8c98a9] hover:text-[#f4f5f8] border border-[#232936] transition-colors"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>

                                <button
                                  onClick={() => handleDelete(receipt.publicId)}
                                  title="Delete receipt"
                                  className="p-1.5 rounded bg-[#101318] hover:bg-red-500/20 text-[#637082] hover:text-red-400 border border-[#232936] transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CHANGE REQUESTS */}
        {activeTab === 'changes' && (
          <div className="mt-6 space-y-6">
            <div>
              <h2 className="text-base font-semibold text-[#f4f5f8]">Formal Change Requests</h2>
              <p className="text-xs text-[#8c98a9] mt-0.5">
                Every change request adds scope, additional price, and revised deadlines without altering the immutable original receipt.
              </p>
            </div>

            {allChangeRequests.length === 0 ? (
              <div className="text-center py-16 px-4 bg-[#14171d] border border-[#232936] rounded-xl">
                <GitPullRequest className="w-10 h-10 mx-auto text-[#424c5b] mb-3" />
                <h3 className="text-base font-semibold text-[#f4f5f8]">No change requests yet</h3>
                <p className="text-xs text-[#8c98a9] max-w-sm mx-auto mt-1">
                  When a client asks for extra work on a locked receipt, create a Change Request instead of doing free out-of-scope work.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {allChangeRequests.map(({ receiptPublicId, receiptTitle, cr }) => (
                  <div
                    key={cr.id}
                    className="p-5 bg-[#14171d] border border-[#232936] rounded-xl flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Link
                          href={`/r/${receiptPublicId}`}
                          className="font-mono text-xs text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <span>{receiptPublicId}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] uppercase font-semibold">
                          {cr.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-[#f4f5f8] mb-1">{receiptTitle}</h4>
                      <p className="text-xs text-[#9aa4b2] mb-3 bg-[#0d0f12] p-2.5 rounded border border-[#1e2430]">
                        &ldquo;{cr.description}&rdquo;
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#1e2430] text-xs">
                      <div>
                        <span className="text-[10px] text-[#637082] block uppercase font-mono">Additional Price</span>
                        <span className="font-mono font-bold text-emerald-400">
                          +{formatMoney(cr.additionalPrice)}
                        </span>
                      </div>
                      {cr.newDeadline && (
                        <div className="text-right">
                          <span className="text-[10px] text-[#637082] block uppercase font-mono">New Deadline</span>
                          <span className="font-mono text-[#dce2ee]">{cr.newDeadline}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CREDITS & BILLING (LEDGER) */}
        {activeTab === 'credits' && (
          <div className="mt-6 space-y-8">
            {/* Balance and Pricing Cards */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* Current balance card */}
              <div className="p-6 bg-[#14171d] border border-emerald-500/30 rounded-xl flex flex-col justify-between shadow-xl">
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-emerald-400 font-semibold block mb-2">
                    Available Balance
                  </span>
                  <div className="text-4xl font-bold font-mono text-[#f4f5f8] mb-1">
                    {user?.credits ?? 0}
                  </div>
                  <p className="text-xs text-[#cbd5e1]">
                    {user?.credits ?? 0} ScopeReceipt credit{user?.credits === 1 ? '' : 's'} available
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#232936] text-[11px] text-[#94a3b8]">
                  1 credit is consumed per activated ScopeReceipt. 1 free receipt included with your account.
                </div>
              </div>

              {/* Purchase 3 receipts for $1 */}
              <div className="p-6 bg-[#14171d] border border-[#232936] rounded-xl flex flex-col justify-between hover:border-[#333d4f] transition-all">
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#94a3b8] font-semibold block mb-2">
                    Starter Pack
                  </span>
                  <div className="text-3xl font-bold font-mono text-[#f4f5f8] mb-1">
                    $1
                  </div>
                  <p className="text-xs text-[#cbd5e1]">3 ScopeReceipt credits ($0.33 / receipt)</p>
                </div>

                <div className="mt-6">
                  <Button
                    onClick={() => handlePurchaseCredits('three_receipts')}
                    disabled={purchasing !== null}
                    className="w-full bg-[#1b2029] hover:bg-[#232936] text-[#f4f5f8] border border-[#2a3243] font-medium text-xs h-10 rounded-lg transition-all active:scale-[0.99]"
                  >
                    {purchasing === 'three_receipts' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        <span>Fulfilling...</span>
                      </>
                    ) : (
                      <span>Buy 3 ($1)</span>
                    )}
                  </Button>
                </div>
              </div>

              {/* Purchase 49 receipts for $10 */}
              <div className="p-6 bg-[#14171d] border border-emerald-500/40 rounded-xl flex flex-col justify-between relative shadow-xl">
                <div className="absolute -top-2.5 right-4 px-2 py-0.5 bg-emerald-500 text-black text-[10px] font-mono font-bold uppercase rounded">
                  Best Value
                </div>
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-emerald-400 font-semibold block mb-2">
                    Pro Pack
                  </span>
                  <div className="text-3xl font-bold font-mono text-[#f4f5f8] mb-1">
                    $10
                  </div>
                  <p className="text-xs text-[#cbd5e1]">49 ScopeReceipt credits (~$0.20 / receipt)</p>
                </div>

                <div className="mt-6">
                  <Button
                    onClick={() => handlePurchaseCredits('forty_nine_receipts')}
                    disabled={purchasing !== null}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs h-10 rounded-lg transition-all shadow-lg shadow-emerald-500/10 active:scale-[0.99]"
                  >
                    {purchasing === 'forty_nine_receipts' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        <span>Fulfilling...</span>
                      </>
                    ) : (
                      <span>Buy 49 ($10)</span>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Credit Ledger History Table */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-[#f4f5f8]">Credit Ledger & History</h3>
              </div>
              <p className="text-xs text-[#8c98a9] mb-4">
                Full immutable audit log of all credit purchases, receipt spends, and ledger adjustments.
              </p>

              <div className="bg-[#14171d] border border-[#232936] rounded-xl overflow-hidden shadow-lg">
                {ledger.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#637082]">
                    No transactions recorded in the ledger yet.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs text-[#8c98a9]">
                    <thead className="bg-[#101318] text-[#7b8798] font-mono uppercase text-[10px] tracking-wider border-b border-[#232936]">
                      <tr>
                        <th className="px-5 py-3">Transaction ID</th>
                        <th className="px-5 py-3">Type</th>
                        <th className="px-5 py-3">Delta</th>
                        <th className="px-5 py-3">Reference / Receipt</th>
                        <th className="px-5 py-3 text-right">Date & Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1b2029]">
                      {ledger.map((tx) => {
                        const isPositive = tx.credits > 0;
                        return (
                          <tr key={tx.id} className="hover:bg-[#181d25] transition-colors font-mono">
                            <td className="px-5 py-3.5 text-[#dce2ee]">
                              {tx.id}
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${
                                  tx.type === 'purchase'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-[#232936] text-[#9aa4b2]'
                                }`}
                              >
                                {tx.type}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 font-bold">
                              <span className={isPositive ? 'text-emerald-400' : 'text-[#8c98a9]'}>
                                {isPositive ? `+${tx.credits}` : tx.credits}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-[#8c98a9]">
                              {tx.receiptId ? (
                                <Link href={`/r/${tx.receiptId}`} className="text-emerald-400 hover:underline">
                                  {tx.receiptId}
                                </Link>
                              ) : (
                                tx.referenceId || '—'
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-right text-[#637082] text-[11px]">
                              {formatDate(tx.createdAt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ACCOUNT */}
        {activeTab === 'account' && (
          <div className="mt-6 max-w-xl space-y-6">
            <div className="p-6 bg-[#14171d] border border-[#232936] rounded-xl space-y-5">
              <h2 className="text-base font-semibold text-[#f4f5f8]">Freelancer Profile</h2>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[#637082] block font-mono uppercase text-[10px]">Name</span>
                  <span className="font-medium text-[#f4f5f8] text-sm">{user?.name}</span>
                </div>
                <div>
                  <span className="text-[#637082] block font-mono uppercase text-[10px]">Email Address</span>
                  <span className="font-medium text-[#f4f5f8] text-sm">{user?.email}</span>
                </div>
                <div>
                  <span className="text-[#637082] block font-mono uppercase text-[10px]">Account ID</span>
                  <span className="font-mono text-[#8c98a9]">{user?.id}</span>
                </div>
                <div>
                  <span className="text-[#637082] block font-mono uppercase text-[10px]">Credit Balance</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">{user?.credits} Credits</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#1e2430]">
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out of Account</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0d0f12] text-[#f4f5f8] flex items-center justify-center">
          <div className="flex items-center gap-2 font-mono text-sm text-emerald-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading Dashboard...</span>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
