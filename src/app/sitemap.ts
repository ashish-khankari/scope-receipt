import { MetadataRoute } from 'next';
import { query } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  let dynamicReceipts: MetadataRoute.Sitemap = [];
  try {
    const rows = await query<any[]>('SELECT public_id, created_at FROM receipts WHERE status = "locked"');
    dynamicReceipts = rows.map((r) => ({
      url: `${baseUrl}/r/${r.public_id}`,
      lastModified: new Date(r.created_at),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));
  } catch (e) {
    // If DB offline during static build, continue with static routes
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/create`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.6,
    },
  ];

  return [...staticRoutes, ...dynamicReceipts];
}
