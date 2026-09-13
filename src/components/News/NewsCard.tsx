import MapPin from 'lucide-react/dist/esm/icons/map-pin.mjs';
import Pencil from 'lucide-react/dist/esm/icons/pencil.mjs';
import Route from 'lucide-react/dist/esm/icons/route.mjs';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2.mjs';
import type { NewsPost } from '../../types/database';
import { formatNewsDate, newsCategoryLabels } from '../../data/news';
import LoadingLink from '../LoadingLink';
import LikeButton from './LikeButton';

type NewsCardProps = {
  post: NewsPost;
  onToggleLike: (post: NewsPost) => Promise<void>;
  onEdit?: (post: NewsPost) => void;
  onDelete?: (post: NewsPost) => void;
};

export const AuthorChip = ({ post }: { post: NewsPost }) => (
  <span className="inline-flex items-center gap-2 text-xs text-ink-muted">
    <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-mist-600 to-mist-800 text-[10px] font-bold text-on-accent">
      {post.author_avatar ? <img src={post.author_avatar} alt="" className="h-full w-full object-cover" /> : post.author.trim().charAt(0).toUpperCase()}
    </span>
    <span className="truncate">{post.author}</span>
  </span>
);

const NewsCard = ({ post, onToggleLike, onEdit, onDelete }: NewsCardProps) => {
  const isTripPost = post.kind === 'trip';

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-surface-raised shadow-sm shadow-mist-950/5 transition-all hover:-translate-y-1 hover:border-mist-700 hover:shadow-xl hover:shadow-mist-950/10">
      <LoadingLink to={`/news/${post.slug}`} className="relative block aspect-[16/9] overflow-hidden bg-surface-sunken">
        <img src={post.cover_image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {isTripPost && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-mist-950/75 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-mist-50">
            <Route size={11} />
            Trip plan
          </span>
        )}
      </LoadingLink>
      <div className="flex flex-1 flex-col p-5">
        <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-ink-faint">
          <span className="rounded-full bg-mist-200 px-2 py-0.5 text-mist-950 dark:bg-mist-900/40 dark:text-mist-100">{newsCategoryLabels[post.category]}</span>
          <span className="inline-flex items-center gap-1"><MapPin size={11} />{post.city}</span>
        </p>
        <LoadingLink to={`/news/${post.slug}`} className="mb-2 text-lg font-semibold leading-snug tracking-tight transition-colors hover:text-primary">
          {post.title}
        </LoadingLink>
        <p className="mb-4 line-clamp-3 text-sm leading-6 text-ink-muted">{post.excerpt}</p>
        {isTripPost && (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <AuthorChip post={post} />
            {post.share_token && (
              <LoadingLink to={`/shared/${post.share_token}`} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary transition hover:bg-primary-hover">
                <Route size={13} />
                Open plan
              </LoadingLink>
            )}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between gap-3">
          <span className="text-xs text-ink-faint">{formatNewsDate(post.published_at)}</span>
          <div className="flex items-center gap-1">
            {post.is_mine && onEdit && (
              <button type="button" onClick={() => onEdit(post)} className="rounded-full p-2 text-ink-faint transition hover:bg-surface-sunken hover:text-ink" aria-label="Edit your story" title="Edit">
                <Pencil size={14} />
              </button>
            )}
            {post.is_mine && onDelete && (
              <button type="button" onClick={() => onDelete(post)} className="rounded-full p-2 text-ink-faint transition hover:bg-mist-200 hover:text-danger" aria-label="Delete your story" title="Delete">
                <Trash2 size={14} />
              </button>
            )}
            <LikeButton liked={post.liked} likeCount={post.like_count} onToggle={() => onToggleLike(post)} />
          </div>
        </div>
      </div>
    </article>
  );
};

export default NewsCard;
