import type { Metadata } from 'next';
import { Inter, IBM_Plex_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import '@/index.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'ScopeReceipt — Stop Scope Creep. Lock what you deliver before you start.',
    template: '%s | ScopeReceipt',
  },
  description:
    'Lock exactly what you are delivering before you start. The anti-scope-creep digital proof of agreement for freelancers, designers, developers, and agencies. No client account required.',
  keywords: [
    'scope creep',
    'stop scope creep',
    'freelance scope receipt',
    'scope of work',
    'digital agreement proof',
    'freelancer contract alternative',
    'client signoff',
    'client expectations',
  ],
  authors: [{ name: 'ScopeReceipt' }],
  creator: 'ScopeReceipt',
  publisher: 'ScopeReceipt',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'ScopeReceipt',
    title: 'ScopeReceipt — Stop Scope Creep',
    description: "Lock exactly what you're delivering before you start. Digital proof of agreement with zero client login.",
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ScopeReceipt — Stop Scope Creep',
    description: "Lock exactly what you're delivering before you start. Digital proof of agreement for freelancers.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

import StoreProvider from '@/lib/store/StoreProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Structured Data (JSON-LD) for Search Engines
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'http://localhost:3000/#website',
        url: 'http://localhost:3000',
        name: 'ScopeReceipt',
        description: "Lock exactly what you're delivering before you start. Stop scope creep.",
      },
      {
        '@type': 'SoftwareApplication',
        name: 'ScopeReceipt',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All',
        offers: {
          '@type': 'Offer',
          price: '1.00',
          priceCurrency: 'USD',
        },
        description: 'Anti-scope-creep digital agreement utility for independent freelancers and agencies.',
      },
    ],
  };

  return (
    <html lang="en" className={`${inter.variable} ${ibmPlexMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-[#0d0f12] text-[#f4f5f8] antialiased selection:bg-emerald-500 selection:text-black">
        <StoreProvider>
          {children}
        </StoreProvider>
        <Toaster position="top-center" richColors theme="dark" />
      </body>
    </html>
  );
}
