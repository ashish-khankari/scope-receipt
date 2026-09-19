'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FileCheck2, Plus, LayoutDashboard, ShieldCheck, LogOut, Coins } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useAppSelector, useAppDispatch } from '@/lib/store/store';
import { logoutUser } from '@/lib/store/authSlice';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const handleLogoClick = (e: React.MouseEvent) => {
    if (pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network error on logout
    }
    dispatch(logoutUser());
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0f12] text-[#f4f5f8]">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 border-b border-[#273142] bg-[#14171d]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          {/* Logo / Title */}
          <Link
            href="/"
            onClick={handleLogoClick}
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-[#1c2331] border border-[#2e3b50] text-white transition-transform group-hover:scale-105 shadow-sm">
              <FileCheck2 className="size-5 text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-sm font-bold tracking-tight text-[#f4f5f8] group-hover:text-emerald-400 transition-colors">
                ScopeReceipt
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#cbd5e1]">
                Stop scope creep
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#cbd5e1]">
            {!user ? (
              <>
                <Link
                  href="/#problem"
                  className="transition-colors hover:text-[#f4f5f8]"
                >
                  Why Receipts?
                </Link>
                <Link
                  href="/#how-it-works"
                  className="transition-colors hover:text-[#f4f5f8]"
                >
                  How It Works
                </Link>
                <Link
                  href="/pricing"
                  className={cn(
                    "transition-colors hover:text-[#f4f5f8]",
                    pathname === '/pricing' && "text-emerald-400 font-semibold"
                  )}
                >
                  Credits & Pricing
                </Link>
              </>

            ) : (
              <Link
                href="/dashboard"
                className={cn(
                  "flex items-center gap-1.5 transition-colors hover:text-[#f4f5f8]",
                  pathname === '/dashboard' && "text-emerald-400 font-semibold"
                )}
              >
                <LayoutDashboard className="size-4" />
                <span>Dashboard</span>
              </Link>
            )}
          </nav>

          {/* User Auth / Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href="/dashboard?tab=credits"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#1a2230] hover:bg-[#232d3f] border border-emerald-500/30 rounded-lg font-mono text-xs text-emerald-400 font-semibold transition-colors"
                  title="Your available ScopeReceipt credits"
                >
                  <Coins className="size-3.5" />
                  <span>{user.credits} Credits</span>
                </Link>

                <Link href="/dashboard" className="md:hidden">
                  <button className="p-2 text-[#cbd5e1] hover:text-[#f4f5f8] transition-colors" aria-label="Dashboard">
                    <LayoutDashboard className="size-5" />
                  </button>
                </Link>

                <button
                  onClick={handleLogout}
                  className="hidden sm:flex items-center gap-1.5 text-xs text-[#94a3b8] hover:text-red-400 transition-colors px-2 py-1 cursor-pointer"
                  title="Log out"
                >
                  <LogOut className="size-3.5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-xs font-medium text-[#cbd5e1] hover:text-[#f4f5f8] transition-colors px-2 py-1"
                >
                  Freelancer Login
                </Link>
                <Link
                  href="/register"
                  className="hidden sm:inline-block text-xs font-semibold text-emerald-400 hover:text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Get 1 Free Receipt
                </Link>
              </div>
            )}

            <Link href="/create">
              <Button
                className="h-9 sm:h-10 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-3 sm:px-4 font-mono text-xs font-bold uppercase tracking-wider text-black transition-all shadow-[0_2px_0_#065f46] hover:-translate-y-0.5 active:scale-[0.99]"
              >
                <Plus className="size-3.5 mr-1" />
                <span>New Receipt</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <div className="flex-1 min-w-0">{children}</div>

      {/* Footer */}
      <footer className="border-t border-[#273142] bg-[#10141a] py-12 text-[#cbd5e1]">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-[#1c2331] border border-[#2e3b50] text-white">
                <FileCheck2 className="size-4 text-emerald-400" />
              </div>
              <span className="font-mono text-sm font-bold text-[#f4f5f8]">
                ScopeReceipt
              </span>
              <span className="text-xs text-[#cbd5e1]">
                — Lock what you deliver before you start.
              </span>
            </div>

            <div className="flex items-center gap-6 text-xs text-[#cbd5e1]">
              <Link href="/pricing" className="hover:text-emerald-400 transition-colors">Pricing</Link>
              <Link href="/create" className="hover:text-emerald-400 transition-colors">Create Receipt</Link>
              {!user && (
                <Link href="/login" className="hover:text-emerald-400 transition-colors">Login</Link>
              )}
            </div>
          </div>

          <div className="mt-8 border-t border-[#1e2633] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#cbd5e1]">
            <p>© {new Date().getFullYear()} ScopeReceipt. Immutable scope lock with credit ledger.</p>
            <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-400">
              <ShieldCheck className="size-4" />
              <span>Zero client accounts required</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
