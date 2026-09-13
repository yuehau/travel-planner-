import { z } from 'zod';
import newsJson from '../../shared/news-posts.json';
import type { NewsPost } from '../types/database';

const newsPostSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  excerpt: z.string().min(1),
  body: z.array(z.string().min(1)).min(1),
  city: z.string().min(1),
  category: z.enum(['cafe', 'restaurant', 'attraction', 'event']),
  author: z.string().min(1),
  publishedAt: z.string().min(1),
  coverImage: z.string().min(1),
  baseLikes: z.number().int().nonnegative(),
});

export type NewsSeed = z.infer<typeof newsPostSchema>;

export const newsSeeds: NewsSeed[] = z.array(newsPostSchema).parse(newsJson);

export const newsCategoryLabels: Record<NewsPost['category'], string> = {
  cafe: 'Café',
  restaurant: 'Restaurant',
  attraction: 'Attraction',
  event: 'Event',
  trip: 'Trip plan',
};

/** Shapes a seed post into the API contract with like state applied. */
export const toNewsPost = (seed: NewsSeed, likeCount: number, liked: boolean): NewsPost => ({
  id: seed.id,
  slug: seed.slug,
  title: seed.title,
  excerpt: seed.excerpt,
  body: seed.body,
  city: seed.city,
  category: seed.category,
  author: seed.author,
  published_at: seed.publishedAt,
  cover_image: seed.coverImage,
  kind: 'editorial',
  user_id: null,
  trip_id: null,
  share_token: null,
  is_mine: false,
  like_count: likeCount,
  liked,
});

/** Turns a caption into a URL slug, suffixed to stay unique. */
export const slugifyTitle = (title: string, suffix: string) => {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 48) || 'plan';
  return `${base}-${suffix}`;
};

/** Splits a free-text body into paragraphs for rendering. */
export const bodyToParagraphs = (body: string) => body.split(/\n{2,}|\r?\n/).map((line) => line.trim()).filter(Boolean);

export const formatNewsDate = (value: string) => new Intl.DateTimeFormat('en-MY', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
}).format(new Date(`${value}T00:00:00`));
