import { Metadata } from 'next';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: 'ScopeReceipt — Stop Scope Creep. Lock what you deliver before you start.',
  description:
    'Stop scope creep before you start. Lock deliverables and exclusions on an immutable digital receipt. No client sign-up required.',
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is a ScopeReceipt a legally binding contract?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'ScopeReceipt is a lightweight digital proof of agreement. It provides transparent written acknowledgment and timestamped boundaries to resolve disputes and avoid scope creep.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does my client need to create an account?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No account required. Your client simply opens the private link, reviews the deliverables and exclusions, and clicks Confirm & Lock Scope with zero friction.',
        },
      },
      {
        '@type': 'Question',
        name: 'What happens if the client requests changes later?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Locked receipts include a built-in Request Scope Change button. Either party can submit a formal amendment with an additional price and timeline extension.',
        },
      },
      {
        '@type': 'Question',
        name: 'How much does ScopeReceipt cost?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Every freelancer gets 1 free receipt upon registration. After that, pick 3 receipts for $1 or 49 receipts for $10. No recurring monthly subscriptions.',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <HomeClient />
    </>
  );
}
