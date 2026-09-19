'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, ArrowRight, CheckCircle2, AlertCircle, Sparkles, Loader2, Gift } from 'lucide-react';
import { useAppDispatch } from '@/lib/store/store';
import { setUser } from '@/lib/store/authSlice';

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validations
    if (!name.trim()) {
      setError('Please enter your full name or freelancer name.');
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-check.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create account. Please try again.');
        setLoading(false);
        return;
      }

      // Update Redux state immediately
      if (data.user) {
        dispatch(setUser(data.user));
      }

      // Registration successful -> redirect
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const redirectUrl = params?.get('redirect') || '/dashboard';
      router.push(redirectUrl);
      router.refresh();
    } catch (err) {
      setError('A network error occurred. Please check your connection.');
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      // Direct low-friction Google account initialization
      const mockGoogleName = name.trim() || 'Freelancer';
      const mockGoogleEmail = email.trim() || `user_${Date.now()}@gmail.com`;

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: mockGoogleEmail,
          name: mockGoogleName,
          googleId: `google_oauth_${Date.now()}`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Google sign-up failed.');
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

  return (
    <div className="min-h-screen bg-[#0d0f12] text-[#f4f5f8] flex flex-col justify-center items-center px-4 py-12">
      {/* Background radial accent */}
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_50%_0%,#10b981_0%,transparent_65%)]" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3 text-emerald-400 hover:text-emerald-300 transition-colors">
            <Shield className="w-6 h-6" />
            <span className="font-mono text-sm tracking-wider uppercase font-semibold text-emerald-400">ScopeReceipt</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-[#f4f5f8]">Create Freelancer Account</h1>
          <p className="text-xs text-[#cbd5e1] mt-1.5">
            Lock scopes, manage change requests, and issue binding receipt links.
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs font-semibold text-emerald-400">
            <Gift className="w-3.5 h-3.5" />
            <span>Includes 1 Free ScopeReceipt Credit</span>
          </div>
        </div>

        {/* Auth card */}
        <div className="bg-[#14171d] border border-[#232936] rounded-xl p-6 sm:p-8 shadow-2xl">
          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Continue with Google button */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
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
            <span className="px-3 text-[11px] font-mono uppercase tracking-wider text-[#94a3b8]">or register with email</span>
            <div className="flex-1 border-t border-[#232936]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#cbd5e1] mb-1.5">
                Full Name / Business Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Chen"
                className="w-full px-3.5 py-2.5 bg-[#0d0f12] border border-[#232936] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg text-sm text-[#f4f5f8] placeholder-[#94a3b8] outline-none transition-all"
              />
            </div>

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
              <label className="block text-xs font-medium text-[#cbd5e1] mb-1.5">
                Password <span className="text-[#94a3b8] font-normal">(min 6 characters)</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-[#0d0f12] border border-[#232936] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg text-sm text-[#f4f5f8] placeholder-[#94a3b8] outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#cbd5e1] mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account (Get 1 Free Credit)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Client reminder banner */}
          <div className="mt-6 pt-5 border-t border-[#1f242e] text-center">
            <p className="text-xs text-[#cbd5e1]">
              Already have an account?{' '}
              <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
                Log in
              </Link>
            </p>

            <div className="mt-4 p-2.5 bg-[#0f1217] border border-[#1b2029] rounded-lg text-[11px] text-[#cbd5e1] flex items-center gap-2 justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Clients never need an account to sign or confirm receipts.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
