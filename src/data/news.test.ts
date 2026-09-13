import { describe, expect, it } from 'vitest';
import { formatNewsDate, newsSeeds, toNewsPost } from './news';

const covers = new Set(Object.keys(import.meta.glob('../../public/news/*.svg')).map((path) => path.replace('../../public', '')));

describe('news seeds', () => {
  it('has unique slugs and cover illustrations', () => {
    expect(newsSeeds).toHaveLength(6);
    expect(new Set(newsSeeds.map((post) => post.slug)).size).toBe(newsSeeds.length);
    for (const post of newsSeeds) {
      expect(covers.has(post.coverImage)).toBe(true);
    }
  });

  it('shapes a seed into the API contract', () => {
    const post = toNewsPost(newsSeeds[0], 130, true);
    expect(post).toMatchObject({ slug: newsSeeds[0].slug, like_count: 130, liked: true, published_at: newsSeeds[0].publishedAt });
    expect(formatNewsDate('2026-09-08')).toMatch(/2026/);
  });
});
