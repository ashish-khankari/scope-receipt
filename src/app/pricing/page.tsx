import { Metadata } from 'next';
import Link from 'next/link';
import { Check, ShieldCheck, Sparkles, Coins, ArrowRight } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import PricingCheckoutButton from './PricingButtons';

export const metadata: Metadata = {
  title: 'Credits & Pricing — ScopeReceipt',
  description:
    '1 free receipt on sign up. 3 receipts for $1, 49 receipts for $10. No monthly subscriptions. Client never needs an account.',
  alternates: {
    canonical: '/pricing',
  },
};

export default function PricingPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-20">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            <Coins className="size-3.5" />
            <span>Updated Fair Pricing</span>
          </div>

          <h1 className="mt-3 text-3xl sm:text-5xl font-extrabold text-[#f4f5f8] tracking-tight">
            1 Free Receipt. Then pay as you go.
          </h1>

          <p className="mt-3 text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
            Every new account includes 1 free ScopeReceipt. When you need more, lock deliverables for pennies with no recurring monthly subscriptions.
          </p>
        </div>

        {/* Free Banner */}
        <div className="mt-8 max-w-3xl mx-auto p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-lg">
              1
            </div>
            <div>
              <span className="font-semibold text-sm text-[#f4f5f8] block">Welcome Gift: 1 Free Receipt</span>
              <span className="text-xs text-[#cbd5e1]">Automatically credited when you create your freelancer account.</span>
            </div>
          </div>
          <Link href="/register">
            <Button className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs h-9 px-4 whitespace-nowrap">
              Claim Free Receipt <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Pricing Cards */}
        <div className="mt-10 grid gap-8 md:grid-cols-2 max-w-3xl mx-auto items-stretch">
          {/* Card 1: 3 Receipts ($1) */}
          <div className="rounded-xl border border-[#232936] bg-[#14171d] p-7 sm:p-8 shadow-xl flex flex-col justify-between hover:border-[#384359] transition-all">
            <div>
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#cbd5e1]">
                Starter Pack
              </span>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-mono text-5xl font-extrabold text-[#f4f5f8]">$1</span>
                <span className="font-mono text-xs text-[#cbd5e1]">/ 3 Receipts ($0.33/ea)</span>
              </div>
              <p className="mt-2 text-xs text-[#cbd5e1] leading-relaxed">
                Ideal for trying out ScopeReceipt on upcoming client milestones and quick sprints.
              </p>

              <div className="my-6 border-t border-[#1e2430]" />

              <ul className="space-y-3 text-xs text-[#cbd5e1]">
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-emerald-400 shrink-0" />
                  <span>3 ScopeReceipt credits</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-emerald-400 shrink-0" />
                  <span>Client confirms with 0 accounts required</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-emerald-400 shrink-0" />
                  <span>Permanent immutable timestamp proof</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-emerald-400 shrink-0" />
                  <span>Change Request tracking system</span>
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <PricingCheckoutButton
                tier="three_receipts"
                label="Buy 3 Receipts ($1)"
                variant="secondary"
              />
            </div>
          </div>

          {/* Card 2: 49 Receipts ($10) - BEST VALUE */}
          <div className="relative rounded-xl border border-emerald-500/40 bg-[#14171d] p-7 sm:p-8 shadow-2xl flex flex-col justify-between">
            <div className="absolute -top-3 right-6 rounded bg-emerald-500 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-black">
              Best Value · Save 95%
            </div>

            <div>
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Pro Pack
              </span>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-mono text-5xl font-extrabold text-[#f4f5f8]">$10</span>
                <span className="font-mono text-xs text-[#cbd5e1]">/ 49 Receipts (~$0.20/ea)</span>
              </div>
              <p className="mt-2 text-xs text-[#cbd5e1] leading-relaxed">
                For busy freelancers and agencies locking multiple deliverables every month.
              </p>

              <div className="my-6 border-t border-[#1e2430]" />

              <ul className="space-y-3 text-xs text-[#cbd5e1]">
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-emerald-400 shrink-0" />
                  <span>49 ScopeReceipt credits</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-emerald-400 shrink-0" />
                  <span>Credits never expire</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-emerald-400 shrink-0" />
                  <span>Zero client accounts required</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-emerald-400 shrink-0" />
                  <span>Full credit ledger & transaction history</span>
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <PricingCheckoutButton
                tier="forty_nine_receipts"
                label="Buy 49 Receipts ($10)"
                variant="primary"
              />
            </div>
          </div>
        </div>

        {/* Client Guarantee Callout */}
        <div className="mt-14 max-w-xl mx-auto rounded-xl border border-[#232936] bg-[#101318] p-5 text-center text-xs text-[#cbd5e1]">
          <div className="flex items-center justify-center gap-2 text-emerald-400 mb-1 font-mono text-[11px] font-semibold">
            <ShieldCheck className="size-4" />
            <span>Zero Client Friction</span>
          </div>
          <p>
            Your clients will never be asked to sign up, create an account, or enter payment details. They simply click your public receipt link and lock in scope.
          </p>
        </div>
      </main>
    </AppShell>
  );
}
