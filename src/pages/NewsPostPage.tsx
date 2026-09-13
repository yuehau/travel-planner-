import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left.mjs';
import MapPin from 'lucide-react/dist/esm/icons/map-pin.mjs';
import Pencil from 'lucide-react/dist/esm/icons/pencil.mjs';
import Route from 'lucide-react/dist/esm/icons/route.mjs';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2.mjs';
import AppNav from '../components/AppNav';
import LikeButton from '../components/News/LikeButton';
import { AuthorChip } from '../components/News/NewsCard';
import PostEditDialog from '../components/News/PostEditDialog';
import LoadingLink from '../components/LoadingLink';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatNewsDate, newsCategoryLabels } from '../data/news';
import { useNewsLikes } from '../hooks/useNewsLikes';
import { useTravelDataClient } from '../hooks/useTravelDataClient';
import type { NewsPostUpdateInput } from '../services/travelData';
import type { NewsPost } from '../types/database';

const NewsPostPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const travelData = useTravelDataClient();
  const [post, setPost] = useState<NewsPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!travelData || !slug) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const loaded = await travelData.getNewsPost(slug);
        if (isMounted) {
          setPost(loaded);
          if (!loaded) setError('This story was not found.');
        }
      } catch (loadError) {
        if (isMounted) setError(loadError instanceof Error ? loadError.message : 'Could not load this story.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [slug, travelData]);

  const updatePost = useCallback((_slug: string, patch: Pick<NewsPost, 'like_count' | 'liked'>) => {
    setPost((current) => (current ? { ...current, ...patch } : current));
  }, []);
  const toggleLike = useNewsLikes(travelData, updatePost, setError);

  const savePost = async (postSlug: string, input: NewsPostUpdateInput) => {
    if (!travelData) return;
    setIsSaving(true);
    setError(null);
    try {
      const updated = await travelData.updateNewsPost(postSlug, input);
      setPost(updated);
      setIsEditing(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save your story.');
    } finally {
      setIsSaving(false);
    }
  };

  const deletePost = async () => {
    if (!travelData || !post) return;
    if (!window.confirm(`Delete "${post.title}" from News?`)) return;
    try {
      await travelData.deleteNewsPost(post.slug);
      navigate('/news', { replace: true });
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete your story.');
    }
  };

  return (
    <div className="min-h-screen bg-surface text-ink transition-colors duration-300">
      <AppNav />

      <main className="mx-auto max-w-3xl px-6 py-8 pb-24">
        <LoadingLink to="/news" className="group mb-6 inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-ink">
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          All stories
        </LoadingLink>

        {isLoading && <LoadingSpinner label="Loading story" />}

        {!isLoading && error && (
          <div className="rounded-xl border border-mist-500 bg-mist-100 px-4 py-3 text-sm text-danger dark:bg-mist-950/40 dark:text-mist-200">{error}</div>
        )}

        {post && (
          <article>
            <div className="mb-6 overflow-hidden rounded-3xl border border-line shadow-lg shadow-mist-950/10">
              <img src={post.cover_image} alt="" className="aspect-[16/8] w-full object-cover" />
            </div>
            <p className="mb-3 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-ink-faint">
              <span className="rounded-full bg-mist-200 px-2 py-0.5 text-mist-950 dark:bg-mist-900/40 dark:text-mist-100">{newsCategoryLabels[post.category]}</span>
              <span className="inline-flex items-center gap-1"><MapPin size={11} />{post.city}</span>
              <span>· {formatNewsDate(post.published_at)}</span>
              {post.kind === 'trip' ? <AuthorChip post={post} /> : <span>· {post.author}</span>}
            </p>
            <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight md:text-4xl">{post.title}</h1>
            <p className="mb-6 text-lg leading-8 text-ink-muted">{post.excerpt}</p>
            <div className="mb-8 flex flex-wrap items-center gap-3">
              <LikeButton liked={post.liked} likeCount={post.like_count} onToggle={() => toggleLike(post)} size="md" />
              {post.kind === 'trip' && post.share_token && (
                <LoadingLink to={`/shared/${post.share_token}`} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:bg-primary-hover">
                  <Route size={15} />
                  Open the plan
                </LoadingLink>
              )}
              {post.is_mine && (
                <>
                  <button type="button" onClick={() => setIsEditing(true)} className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:border-mist-700">
                    <Pencil size={15} />
                    Edit
                  </button>
                  <button type="button" onClick={deletePost} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-danger transition hover:bg-mist-200">
                    <Trash2 size={15} />
                    Delete
                  </button>
                </>
              )}
            </div>
            <div className="space-y-5 text-base leading-8">
              {post.body.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-10 flex items-center justify-between rounded-2xl border border-line bg-surface-raised px-5 py-4">
              <span className="text-sm text-ink-muted">Enjoyed this one?</span>
              <LikeButton liked={post.liked} likeCount={post.like_count} onToggle={() => toggleLike(post)} size="md" />
            </div>
          </article>
        )}
      </main>

      {isEditing && post && (
        <PostEditDialog post={post} isSaving={isSaving} onClose={() => setIsEditing(false)} onSave={savePost} />
      )}
    </div>
  );
};

export default NewsPostPage;
