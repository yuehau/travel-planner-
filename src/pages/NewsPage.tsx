import { useCallback, useEffect, useState } from 'react';
import Newspaper from 'lucide-react/dist/esm/icons/newspaper.mjs';
import AppNav from '../components/AppNav';
import NewsCard from '../components/News/NewsCard';
import PostEditDialog from '../components/News/PostEditDialog';
import { newsCategoryLabels } from '../data/news';
import { useNewsLikes } from '../hooks/useNewsLikes';
import { useTravelDataClient } from '../hooks/useTravelDataClient';
import type { NewsPostUpdateInput } from '../services/travelData';
import type { NewsCategory, NewsPost } from '../types/database';

const categories: Array<NewsCategory | 'all'> = ['all', 'trip', 'cafe', 'restaurant', 'attraction', 'event'];

const NewsPage = () => {
  const travelData = useTravelDataClient();
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [category, setCategory] = useState<NewsCategory | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<NewsPost | null>(null);
  const [isSavingPost, setIsSavingPost] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!travelData) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const loaded = await travelData.listNewsPosts();
        if (isMounted) setPosts(loaded);
      } catch (loadError) {
        if (isMounted) setError(loadError instanceof Error ? loadError.message : 'Could not load news.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [travelData]);

  const updatePost = useCallback((slug: string, patch: Pick<NewsPost, 'like_count' | 'liked'>) => {
    setPosts((current) => current.map((post) => (post.slug === slug ? { ...post, ...patch } : post)));
  }, []);
  const toggleLike = useNewsLikes(travelData, updatePost, setError);

  const savePost = async (slug: string, input: NewsPostUpdateInput) => {
    if (!travelData) return;
    setIsSavingPost(true);
    setError(null);
    try {
      const updated = await travelData.updateNewsPost(slug, input);
      setPosts((current) => current.map((post) => (post.slug === slug ? updated : post)));
      setEditingPost(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save your story.');
    } finally {
      setIsSavingPost(false);
    }
  };

  const deletePost = async (post: NewsPost) => {
    if (!travelData) return;
    if (!window.confirm(`Delete "${post.title}" from News?`)) return;
    setError(null);
    try {
      await travelData.deleteNewsPost(post.slug);
      setPosts((current) => current.filter((item) => item.slug !== post.slug));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete your story.');
    }
  };

  const visiblePosts = category === 'all' ? posts : posts.filter((post) => post.category === category);
  const totalLikes = posts.reduce((sum, post) => sum + post.like_count, 0);

  return (
    <div className="min-h-screen bg-surface text-ink transition-colors duration-300">
      <AppNav />

      <main className="mx-auto max-w-7xl px-6 py-8 pb-24">
        <section className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-mist-700 via-mist-500 to-mist-200 p-8 text-ink shadow-xl shadow-mist-950/15 md:p-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-mist-50/40 blur-3xl" />
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-mist-950/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest">
            <Newspaper size={14} />
            What's new in Malaysia
          </p>
          <h1 className="max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">Fresh cafés, reopened beaches and markets worth a detour.</h1>
          <p className="mt-3 max-w-xl text-sm text-ink-muted md:text-base">
            Short reads from our editorial desk and plans shared by travellers. Like a story to save it for your next board.
            {posts.length > 0 && ` ${totalLikes.toLocaleString()} likes so far.`}
          </p>
        </section>

        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setCategory(option)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                category === option ? 'bg-primary text-on-primary shadow-md shadow-mist-950/15' : 'bg-surface-raised text-ink-muted hover:text-ink'
              }`}
            >
              {option === 'all' ? 'All stories' : newsCategoryLabels[option]}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-mist-500 bg-mist-100 px-4 py-3 text-sm text-danger dark:bg-mist-950/40 dark:text-mist-200">{error}</div>
        )}

        {isLoading ? (
          <div className="py-16 text-center text-ink-muted">Loading stories...</div>
        ) : visiblePosts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line-strong py-16 text-center text-ink-muted">No stories in this category yet.</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visiblePosts.map((post) => (
              <NewsCard key={post.id} post={post} onToggleLike={toggleLike} onEdit={setEditingPost} onDelete={deletePost} />
            ))}
          </div>
        )}
      </main>

      {editingPost && (
        <PostEditDialog key={editingPost.slug} post={editingPost} isSaving={isSavingPost} onClose={() => setEditingPost(null)} onSave={savePost} />
      )}
    </div>
  );
};

export default NewsPage;
