'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ExternalLink, Copy, Check, X, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppSelector, useAppDispatch } from '@/lib/store/store';
import { setUser } from '@/lib/store/authSlice';
import { toast } from 'sonner';

interface Props {
  tier: 'three_receipts' | 'forty_nine_receipts';
  label: string;
  variant?: 'primary' | 'secondary';
}

export default function PricingCheckoutButton({ tier, label, variant = 'secondary' }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-initiate checkout if redirected back with ?buy=tier
  useEffect(() => {
    const buyParam = searchParams.get('buy');
    if (buyParam === tier && user && !checkoutUrl && !loading) {
      handleCheckout();
    }
  }, [searchParams, user]);

  const initiateCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: tier }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to initiate checkout');
        setLoading(false);
        return;
      }

      if (data.checkoutUrl) {
        setCheckoutUrl(data.checkoutUrl);
        toast.success('Checkout link generated!');
        // Attempt automatic redirect after short delay
        setTimeout(() => {
          window.location.href = data.checkoutUrl;
        }, 1200);
        return;
      }

      // If direct grant fallback occurred
      toast.success(data.message || 'Credits added!');
      router.push('/dashboard?tab=credits');
    } catch {
      toast.error('Network error while starting checkout.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    await initiateCheckout();
  };

  const handleGoogleQuickSignIn = async () => {
    setGoogleLoading(true);
    try {
      const mockEmail = `alex_${Date.now().toString(36)}@chencreates.io`;
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: mockEmail,
          name: 'Alex Chen',
          googleId: `google_oauth_${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.user) {
        dispatch(setUser(data.user));
        setShowAuthModal(false);
        toast.success('Signed in successfully!');
        // Continue to checkout immediately
        await initiateCheckout();
      } else {
        toast.error(data.error || 'Google sign-in failed');
      }
    } catch {
      toast.error('Network error during Google sign-in');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (checkoutUrl) {
      navigator.clipboard.writeText(checkoutUrl);
      setCopied(true);
      toast.success('Checkout link copied to clipboard');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <>
      <Button
        onClick={handleCheckout}
        disabled={loading}
        className={
          variant === 'primary'
            ? 'w-full h-11 bg-emerald-500 hover:bg-emerald-400 font-bold text-xs text-black shadow-lg shadow-emerald-500/10 active:scale-[0.99] transition-all'
            : 'w-full h-11 bg-[#1b2029] hover:bg-[#232936] border border-[#2e3748] font-semibold text-xs text-[#f4f5f8] active:scale-[0.99] transition-all'
        }
      >
        {loading ? (
          <span className="flex items-center gap-1.5">
            <Loader2 className="w-4 h-4 animate-spin text-current" />
            <span>Generating Checkout Link...</span>
          </span>
        ) : (
          <span>{label}</span>
        )}
      </Button>

      {/* MODAL: Checkout Link Ready Modal */}
      {checkoutUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-xl border border-emerald-500/40 bg-[#12151b] p-6 shadow-2xl">
            <button
              onClick={() => setCheckoutUrl(null)}
              className="absolute right-4 top-4 text-[#8c98a9] hover:text-white p-1 rounded-md"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-3 text-emerald-400 mb-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <ExternalLink className="size-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#f4f5f8]">Checkout Link Ready</h3>
                <span className="text-[11px] text-emerald-400 font-mono">Dodo Payments Hosted Checkout</span>
              </div>
            </div>

            <p className="text-xs text-[#cbd5e1] leading-relaxed mb-4">
              Your secure checkout session has been generated. You will be redirected shortly, or you can click below to open the checkout page:
            </p>

            <div className="p-3 bg-[#0d0f12] rounded-lg border border-[#232936] text-[11px] font-mono text-[#cbd5e1] break-all mb-4 select-all">
              {checkoutUrl}
            </div>

            <div className="flex flex-col gap-2">
              <a
                href={checkoutUrl}
                target="_self"
                className="w-full h-10 inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-lg transition-all shadow-lg shadow-emerald-500/10"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="size-3.5" />
              </a>

              <button
                onClick={handleCopyLink}
                className="w-full h-9 inline-flex items-center justify-center gap-2 bg-[#1b2029] hover:bg-[#232936] border border-[#2e3748] text-xs font-semibold text-[#cbd5e1] rounded-lg transition-all"
              >
                {copied ? (
                  <>
                    <Check className="size-3.5 text-emerald-400" />
                    <span>Copied Link!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5 text-[#cbd5e1]" />
                    <span>Copy Checkout Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Sign In Required Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-xl border border-[#2e3748] bg-[#14171d] p-6 shadow-2xl">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute right-4 top-4 text-[#8c98a9] hover:text-white p-1 rounded-md"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-2.5 text-emerald-400 mb-2">
              <Shield className="size-5" />
              <h3 className="font-bold text-base text-[#f4f5f8]">Sign In to Buy Receipts</h3>
            </div>

            <p className="text-xs text-[#cbd5e1] leading-relaxed mb-5">
              Please sign in so your ScopeReceipt credits can be added directly to your account upon completing checkout.
            </p>

            <div className="space-y-3">
              <Button
                onClick={handleGoogleQuickSignIn}
                disabled={googleLoading}
                className="w-full h-10 bg-white hover:bg-[#f1f3f4] text-[#1f1f1f] font-semibold text-xs border border-transparent shadow-sm flex items-center justify-center gap-2.5"
              >
                {googleLoading ? (
                  <Loader2 className="size-4 animate-spin text-gray-700" />
                ) : (
                  <svg className="size-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>1-Click Sign In with Google</span>
              </Button>

              <div className="relative my-3 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#232936]"></div>
                </div>
                <span className="relative bg-[#14171d] px-2 text-[10px] uppercase font-mono text-[#8c98a9]">
                  Or traditional sign in
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => router.push(`/login?redirect=/pricing?buy=${tier}`)}
                  className="w-full h-9 bg-[#1b2029] hover:bg-[#232936] border border-[#2e3748] text-xs font-semibold text-[#f4f5f8]"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => router.push(`/register?redirect=/pricing?buy=${tier}`)}
                  className="w-full h-9 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-semibold text-emerald-400"
                >
                  Register (+1 Free)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
