import { useState } from 'react';
import Heart from 'lucide-react/dist/esm/icons/heart.mjs';

type LikeButtonProps = {
  liked: boolean;
  likeCount: number;
  onToggle: () => Promise<void>;
  size?: 'sm' | 'md';
};

const LikeButton = ({ liked, likeCount, onToggle, size = 'sm' }: LikeButtonProps) => {
  const [isPending, setIsPending] = useState(false);

  const handleClick = async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      await onToggle();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={liked}
      aria-label={liked ? 'Unlike this post' : 'Like this post'}
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold transition-all disabled:opacity-60 ${
        size === 'md' ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs'
      } ${
        liked
          ? 'border-accent bg-accent text-on-accent shadow-md shadow-mist-950/20'
          : 'border-line bg-surface-raised text-ink-muted hover:border-accent hover:text-accent-hover'
      }`}
    >
      <Heart size={size === 'md' ? 16 : 14} className={liked ? 'fill-current' : ''} />
      <span>{likeCount.toLocaleString()}</span>
    </button>
  );
};

export default LikeButton;
