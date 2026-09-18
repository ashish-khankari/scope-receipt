'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  ShieldCheck,
  AlertTriangle,
  TrendingDown,
  Lock,
  Sparkles,
  Calculator,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import ReceiptCard from '@/components/ReceiptCard';
import { Button } from '@/components/ui/button';
import { defaultDraft, makeReceipt } from '@/lib/scopeReceipt';

export default function HomeClient() {
  const [locked, setLocked] = useState(true);

  // Calculator state
  const [hourlyRate, setHourlyRate] = useState(75);
  const [creepHours, setCreepHours] = useState(6);
  const annualCreepLoss = hourlyRate * creepHours * 12;

  const sampleReceipt = makeReceipt(defaultDraft, locked ? 'locked' : 'awaiting');
  if (locked) {
    sampleReceipt.lockedAt = '2026-09-16T19:14:22Z';
    sampleReceipt.clientSignature = 'Marcus Vance';
  }

  return (
    <AppShell>
      <main className="bg-[#0d0f12] text-[#f4f5f8]">
        {/* HERO SECTION */}
        <section className="hero-grid relative overflow-hidden border-b border-[#232936] pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="grid gap-14 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-16">
              {/* Hero Copy */}
              <div className="animate-rise max-w-2xl">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  Anti-Scope-Creep Utility
                </div>

                <h1 className="text-5xl font-extrabold tracking-[-0.05em] text-[#f4f5f8] sm:text-7xl lg:text-[76px] leading-[0.95]">
                  STOP SCOPE<br />
                  <span className="text-emerald-400">CREEP.</span>
                </h1>

                <p className="mt-8 text-xl leading-relaxed text-[#cbd5e1] sm:text-2xl font-normal max-w-xl">
                  Lock exactly what you&apos;re delivering <strong className="font-semibold text-[#f4f5f8]">before you start</strong>.
                </p>

                <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <Link href="/create">
                    <Button
                      size="lg"
                      className="h-14 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-8 text-base font-bold text-black shadow-[0_4px_0_#065f46] transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
                    >
                      <span>Create a Receipt (1 Free)</span>
                      <ArrowRight className="size-5 ml-1.5" />
                    </Button>
                  </Link>

                  <div className="flex flex-col">
                    <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#f4f5f8]">
                      Zero client accounts
                    </span>
                    <span className="text-xs text-[#cbd5e1] font-medium">
                      1 Free on signup · 3 for $1 · 49 for $10
                    </span>
                  </div>
                </div>

                <div className="mt-12 flex flex-wrap items-center gap-6 border-t border-[#232936] pt-8 text-xs font-medium text-[#cbd5e1]">
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-400 shrink-0" />
                    <span>1 Free Credit on Signup</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-400 shrink-0" />
                    <span>3 for $1 · 49 for $10</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-400 shrink-0" />
                    <span>Client confirms with 0 login</span>
                  </div>
                </div>
              </div>

              {/* Interactive Hero Receipt Card */}
              <div className="relative animate-rise [animation-delay:120ms] min-w-0">
                <div className="absolute -inset-4 rounded-3xl bg-emerald-500/10 blur-2xl -z-10" />

                <div className="relative rounded-2xl border border-[#283244] bg-[#14171d] p-3 sm:p-5 shadow-2xl min-w-0">
                  <ReceiptCard receipt={sampleReceipt} compact={false} />

                  {/* Interactive toggle switch on hero */}
                  <button
                    type="button"
                    onClick={() => setLocked((prev) => !prev)}
                    className="absolute -bottom-4 right-6 flex items-center gap-2 rounded-xl border border-[#333f52] bg-[#181d24] px-3.5 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[#cbd5e1] shadow-xl transition-all hover:border-emerald-400 hover:text-emerald-400 cursor-pointer"
                    title="Click to toggle between Pending and Scope Locked"
                  >
                    <span
                      className={`size-2 rounded-full transition-colors ${
                        locked ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                    <span>Preview: {locked ? 'SCOPE LOCKED' : 'AWAITING'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PROBLEM STATEMENT */}
        <section id="problem" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="max-w-2xl">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
              The Freelancer Dilemma
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#f4f5f8]">
              &ldquo;Hey, could you quickly add this one small thing?&rdquo;
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#cbd5e1] leading-relaxed">
              Scope creep rarely happens with one giant demand. It happens in ten casual Slack DMs. Before you know it, a 15-hour project turns into 35 hours — and your effective hourly rate gets cut in half.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-[#232936] bg-[#14171d] p-7 shadow-xl hover:border-[#384359] transition-all">
              <div className="flex size-11 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                <AlertTriangle className="size-5" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-[#f4f5f8]">The Ambiguity Trap</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#cbd5e1]">
                Without an explicit list of what is <em className="text-amber-400 font-medium">NOT</em> included, clients assume everything they imagine is part of the deal.
              </p>
            </div>

            <div className="rounded-xl border border-[#232936] bg-[#14171d] p-7 shadow-xl hover:border-[#384359] transition-all">
              <div className="flex size-11 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <TrendingDown className="size-5" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-[#f4f5f8]">The Awkward Negotiation</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#cbd5e1]">
                It feels confrontational to bring up 10-page contracts mid-project. A light ScopeReceipt sets expectations painlessly upfront.
              </p>
            </div>

            <div className="rounded-xl border border-[#232936] bg-[#14171d] p-7 shadow-xl hover:border-[#384359] transition-all">
              <div className="flex size-11 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <ShieldCheck className="size-5" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-[#f4f5f8]">Micro-Cost Insurance</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#cbd5e1]">
                Locking your scope in advance protects hundreds in billable hours for less than the price of a coffee.
              </p>
            </div>
          </div>
        </section>

        {/* SCOPE CREEP COST CALCULATOR */}
        <section className="border-y border-[#232936] bg-[#101318] py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-5 sm:px-8">
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                <Calculator className="size-3.5" />
                <span>Interactive Loss Calculator</span>
              </div>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#f4f5f8] sm:text-4xl">
                How much is scope creep costing you?
              </h2>
              <p className="mt-2 text-sm sm:text-base text-[#cbd5e1]">
                Calculate your estimated unbilled hours lost to unbudgeted client revisions each year.
              </p>
            </div>

            <div className="mt-12 rounded-2xl border border-[#232936] bg-[#14171d] p-6 sm:p-10 shadow-2xl">
              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <div className="flex justify-between items-center font-mono text-sm">
                    <label htmlFor="rate-slider" className="font-semibold text-[#cbd5e1]">Your Hourly Rate:</label>
                    <span className="font-bold text-lg text-emerald-400">${hourlyRate}/hr</span>
                  </div>
                  <input
                    id="rate-slider"
                    type="range"
                    min="30"
                    max="250"
                    step="5"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    className="mt-3 w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between font-mono text-[11px] text-[#cbd5e1] font-medium mt-1">
                    <span>$30/hr</span>
                    <span>$125/hr</span>
                    <span>$250/hr</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center font-mono text-sm">
                    <label htmlFor="hours-slider" className="font-semibold text-[#cbd5e1]">Unpaid Creep Hours / Month:</label>
                    <span className="font-bold text-lg text-amber-400">{creepHours} hrs/mo</span>
                  </div>
                  <input
                    id="hours-slider"
                    type="range"
                    min="1"
                    max="25"
                    step="1"
                    value={creepHours}
                    onChange={(e) => setCreepHours(Number(e.target.value))}
                    className="mt-3 w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between font-mono text-[11px] text-[#cbd5e1] font-medium mt-1">
                    <span>1 hr</span>
                    <span>12 hrs</span>
                    <span>25 hrs</span>
                  </div>
                </div>
              </div>

              {/* Output */}
              <div className="mt-8 rounded-xl border border-amber-500/30 bg-[#1f1911] p-6 text-center sm:flex sm:items-center sm:justify-between sm:text-left">
                <div>
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-amber-400">
                    Estimated Annual Lost Revenue
                  </span>
                  <div className="mt-1 font-mono text-3xl sm:text-4xl font-extrabold text-[#f4f5f8]">
                    ${annualCreepLoss.toLocaleString()} <span className="text-xs font-normal text-[#cbd5e1]">/ year</span>
                  </div>
                  <p className="mt-1 text-xs text-amber-200/80">
                    Equivalent to {creepHours * 12} billable hours worked completely for free.
                  </p>
                </div>

                <div className="mt-6 sm:mt-0">
                  <Link href="/create">
                    <Button className="h-12 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black px-6 font-bold shadow-md">
                      Lock Scope (1 Free)
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3-STEP PROCESS */}
        <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="text-center max-w-2xl mx-auto">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              Dead Simple Process
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#f4f5f8]">
              Done in 60 seconds. Locked forever.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#cbd5e1]">
              No legal jargon. No sign-up friction for your client. Just clear boundaries.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="relative rounded-2xl border border-[#232936] bg-[#14171d] p-8 shadow-xl hover:border-[#384359] transition-all">
              <div className="font-mono text-3xl font-extrabold text-emerald-400/40">01</div>
              <h3 className="mt-4 text-xl font-bold text-[#f4f5f8]">Define & Bound</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#cbd5e1]">
                Write what you are delivering and list what is explicitly NOT included (the boundary).
              </p>
            </div>

            <div className="relative rounded-2xl border border-[#232936] bg-[#14171d] p-8 shadow-xl hover:border-[#384359] transition-all">
              <div className="font-mono text-3xl font-extrabold text-emerald-400/40">02</div>
              <h3 className="mt-4 text-xl font-bold text-[#f4f5f8]">Send Private Link</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#cbd5e1]">
                Share your generated ScopeReceipt link via Slack, Email, or WhatsApp with zero account needed.
              </p>
            </div>

            <div className="relative rounded-2xl border border-[#232936] bg-[#14171d] p-8 shadow-xl hover:border-[#384359] transition-all">
              <div className="font-mono text-3xl font-extrabold text-emerald-400/40">03</div>
              <h3 className="mt-4 text-xl font-bold text-[#f4f5f8]">Lock & Timestamp</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#cbd5e1]">
                The client checks the acknowledgment and clicks &ldquo;Confirm & Lock Scope&rdquo;. Stamped forever in MySQL.
              </p>
            </div>
          </div>
        </section>

        {/* COMPARISON MATRIX */}
        <section className="border-t border-[#232936] bg-[#101318] py-20 sm:py-28">
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            <div className="text-center max-w-xl mx-auto">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                Comparison
              </span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#f4f5f8]">
                Why ScopeReceipt wins
              </h2>
            </div>

            <div className="mt-12 overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#232936] text-xs font-mono uppercase tracking-wider text-[#cbd5e1]">
                    <th className="py-4 pr-6">Feature</th>
                    <th className="py-4 px-6 text-emerald-400 font-bold bg-emerald-500/10 rounded-t-lg border-x border-t border-emerald-500/20">ScopeReceipt</th>
                    <th className="py-4 px-6">15-Page Legal Contract</th>
                    <th className="py-4 px-6">Casual Slack / DMs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232936]">
                  <tr>
                    <td className="py-4 pr-6 font-medium text-[#f4f5f8]">Setup time</td>
                    <td className="py-4 px-6 font-semibold text-emerald-400 bg-emerald-500/5 border-x border-emerald-500/20">60 seconds</td>
                    <td className="py-4 px-6 text-[#cbd5e1]">2-3 hours</td>
                    <td className="py-4 px-6 text-[#cbd5e1]">Messy thread</td>
                  </tr>
                  <tr>
                    <td className="py-4 pr-6 font-medium text-[#f4f5f8]">Client friction</td>
                    <td className="py-4 px-6 font-semibold text-emerald-400 bg-emerald-500/5 border-x border-emerald-500/20">Zero (no account needed)</td>
                    <td className="py-4 px-6 text-[#cbd5e1]">High friction</td>
                    <td className="py-4 px-6 text-[#cbd5e1]">Easy to dispute</td>
                  </tr>
                  <tr>
                    <td className="py-4 pr-6 font-medium text-[#f4f5f8]">Explicit &ldquo;NOT Included&rdquo; boundary</td>
                    <td className="py-4 px-6 font-semibold text-emerald-400 bg-emerald-500/5 border-x border-emerald-500/20">Prominently highlighted</td>
                    <td className="py-4 px-6 text-[#cbd5e1]">Buried in legalese</td>
                    <td className="py-4 px-6 text-[#cbd5e1]">Never mentioned</td>
                  </tr>
                  <tr>
                    <td className="py-4 pr-6 font-medium text-[#f4f5f8]">Digital Timestamp Proof</td>
                    <td className="py-4 px-6 font-semibold text-emerald-400 bg-emerald-500/5 border-x border-emerald-500/20">✓ Locked in MySQL</td>
                    <td className="py-4 px-6 text-[#cbd5e1]">DocuSign fee</td>
                    <td className="py-4 px-6 text-[#cbd5e1]">None</td>
                  </tr>
                  <tr>
                    <td className="py-4 pr-6 font-medium text-[#f4f5f8]">Cost</td>
                    <td className="py-4 px-6 font-semibold text-emerald-400 bg-emerald-500/5 border-x border-b border-emerald-500/20">1 Free, then 49 for $10</td>
                    <td className="py-4 px-6 text-[#cbd5e1]">$30 - $60 / mo</td>
                    <td className="py-4 px-6 text-[#cbd5e1]">Lost billable hours</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-[#232936] bg-[#14171d] py-16 sm:py-24 text-[#f4f5f8]">
          <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              Never work for free again
            </span>
            <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold tracking-tight text-[#f4f5f8]">
              Lock your next project in 60 seconds.
            </h2>
            <p className="mt-3 text-sm text-[#cbd5e1] max-w-md mx-auto">
              Start with your 1 free receipt today. Upgrade anytime: 3 for $1 or 49 for $10.
            </p>
            <div className="mt-8 flex justify-center">
              <Link href="/create">
                <Button
                  size="lg"
                  className="h-14 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-8 text-base font-bold text-black shadow-xl"
                >
                  Create a Receipt (1 Free)
                  <ArrowRight className="size-5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
