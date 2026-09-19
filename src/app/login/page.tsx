'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, ArrowRight, AlertCircle, CheckCircle2, Loader2, KeyRound } from 'lucide-react';
import { useAppDispatch } from '@/lib/store/store';
import { setUser } from '@/lib/store/authSlice';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid credentials. Please try again.');
        setLoading(false);
        return;
      }

      // Update Redux state immediately
      if (data.user) {
        dispatch(setUser(data.user));
      }

      // Successful login -> go to redirect target or dashboard
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const redirectUrl = params?.get('redirect') || '/dashboard';
      router.push(redirectUrl);
      router.refresh();
    } catch {
      setError('A network error occurred. Please check your connection.');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim() || 'alex@chencreates.io',
          name: 'Alex Chen',
          googleId: 'google_alex_default',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Google sign-in failed.');
        setGoogleLoading(false);
        return;
      }

      if (data.user) {
        dispatch(setUser(data.user));
      }

      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const redirectUrl = params?.get('redirect') || '/dashboard';
      router.push(redirectUrl);
      router.refresh();
    } catch {
      setError('Could not connect to Google services.');
      setGoogleLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail('alex@chencreates.io');
    setPassword('Password123!');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0d0f12] text-[#f4f5f8] flex flex-col justify-center items-center px-4 py-12">
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_50%_0%,#10b981_0%,transparent_65%)]" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3 text-emerald-400 hover:text-emerald-300 transition-colors">
            <Shield className="w-6 h-6" />
            <span className="font-mono text-sm tracking-wider uppercase font-semibold text-emerald-400">ScopeReceipt</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-[#f4f5f8]">Freelancer Login</h1>
          <p className="text-xs text-[#cbd5e1] mt-1.5">
            Sign in to manage your receipts, change requests, and credit ledger.
          </p>
        </div>

        <div className="bg-[#14171d] border border-[#232936] rounded-xl p-6 sm:p-8 shadow-2xl">
          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-[#1b2029] hover:bg-[#232936] border border-[#2a3243] rounded-lg text-sm font-medium text-[#f4f5f8] transition-all hover:border-[#384359] active:scale-[0.99] disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 17C3.7 20.7 7.5 23.5 12 23.5z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center my-5">
            <div className="flex-1 border-t border-[#232936]" />
            <span className="px-3 text-[11px] font-mono uppercase tracking-wider text-[#94a3b8]">or sign in with email</span>
            <div className="flex-1 border-t border-[#232936]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#cbd5e1] mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@chencreates.io"
                className="w-full px-3.5 py-2.5 bg-[#0d0f12] border border-[#232936] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg text-sm text-[#f4f5f8] placeholder-[#94a3b8] outline-none transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[#cbd5e1]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-normal"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-[#0d0f12] border border-[#232936] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg text-sm text-[#f4f5f8] placeholder-[#94a3b8] outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full mt-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm rounded-lg transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Login</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Autofill */}
          <div className="mt-5 p-3 rounded-lg bg-[#181d24] border border-[#232a36] text-xs text-[#cbd5e1] flex items-center justify-between">
            <div>
              <span className="font-mono text-[11px] text-emerald-400 block font-semibold">Quick Test Account</span>
              <span className="text-[11px] text-[#cbd5e1]">alex@chencreates.io (Password123!)</span>
            </div>
            <button
              type="button"
              onClick={fillDemo}
              className="px-2.5 py-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 rounded transition-colors"
            >
              Auto Fill
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-[#1f242e] text-center">
            <p className="text-xs text-[#cbd5e1]">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-medium">
                Create Account (1 Free Receipt)
              </Link>
            </p>

            <div className="mt-4 p-2.5 bg-[#0f1217] border border-[#1b2029] rounded-lg text-[11px] text-[#cbd5e1] flex items-center gap-2 justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Clients never need an account to confirm or view scopes.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#14171d] border border-[#28303f] rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <KeyRound className="w-5 h-5" />
              <h3 className="font-semibold text-sm text-[#f4f5f8]">Reset Password</h3>
            </div>
            <p className="text-xs text-[#cbd5e1] mb-4">
              Enter your email address to receive password reset instructions.
            </p>
            <input
              type="email"
              placeholder="alex@chencreates.io"
              defaultValue={email}
              className="w-full px-3 py-2 bg-[#0d0f12] border border-[#232936] rounded-lg text-sm text-[#f4f5f8] outline-none mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                className="px-3 py-1.5 text-xs text-[#cbd5e1] hover:text-[#f4f5f8]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Password reset link sent (test mode).');
                  setForgotOpen(false);
                }}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black rounded"
              >
                Send Reset Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
