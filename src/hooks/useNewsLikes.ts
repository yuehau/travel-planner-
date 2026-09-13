import { useCallback } from 'react';
import type { TravelDataClient } from '../services/travelData';
import type { NewsPost } from '../types/database';

/** Optimistic like toggle shared by the news list and post pages. */
export const useNewsLikes = (
  travelData: TravelDataClient | null,
  updatePost: (slug: string, patch: Pick<NewsPost, 'like_count' | 'liked'>) => void,
  onError: (message: string) => void,
) => useCallback(async (post: NewsPost) => {
  if (!travelData) return;

  updatePost(post.slug, { liked: !post.liked, like_count: post.like_count + (post.liked ? -1 : 1) });

  try {
    const result = await travelData.toggleNewsLike(post.slug);
    updatePost(post.slug, result);
  } catch (toggleError) {
    updatePost(post.slug, { liked: post.liked, like_count: post.like_count });
    onError(toggleError instanceof Error ? toggleError.message : 'Could not update your like.');
  }
}, [onError, travelData, updatePost]);
