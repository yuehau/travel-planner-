import { useState, type FormEvent } from 'react';
import X from 'lucide-react/dist/esm/icons/x.mjs';
import type { NewsPostUpdateInput } from '../../services/travelData';
import type { NewsPost } from '../../types/database';

type PostEditDialogProps = {
  post: NewsPost;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (slug: string, input: NewsPostUpdateInput) => Promise<unknown>;
};

const inputClass = 'w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-ink outline-none transition-all placeholder:text-ink-faint focus:border-primary focus:ring-2 focus:ring-primary/30';

/** Edits the caption and story of one of the user's own trip posts. */
const PostEditDialog = ({ post, isSaving = false, onClose, onSave }: PostEditDialogProps) => {
  const [title, setTitle] = useState(post.title);
  const [body, setBody] = useState(post.body.join('\n\n'));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSave(post.slug, { title, body });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-mist-950/50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-line bg-surface-raised shadow-2xl shadow-mist-950/30 animate-rise-in">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-lg font-semibold tracking-tight">Edit your story</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-muted" htmlFor="post-title">Caption</label>
            <input id="post-title" required minLength={3} maxLength={120} className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} disabled={isSaving} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-muted" htmlFor="post-body">Story</label>
            <textarea id="post-body" required minLength={3} maxLength={4000} rows={7} className={`${inputClass} resize-none`} value={body} onChange={(e) => setBody(e.target.value)} disabled={isSaving} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink-muted transition hover:text-ink">Cancel</button>
            <button type="submit" disabled={isSaving} className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-on-primary transition hover:bg-primary-hover disabled:opacity-50">
              {isSaving ? 'Saving…' : 'Save story'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostEditDialog;
