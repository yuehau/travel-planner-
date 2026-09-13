import { useEffect, useState } from 'react';
import Check from 'lucide-react/dist/esm/icons/check.mjs';
import Copy from 'lucide-react/dist/esm/icons/copy.mjs';
import Link from 'lucide-react/dist/esm/icons/link.mjs';
import Newspaper from 'lucide-react/dist/esm/icons/newspaper.mjs';
import X from 'lucide-react/dist/esm/icons/x.mjs';
import type { NewsPost, Place, PlaceLink, Trip } from '../../types/database';
import type { TravelDataClient } from '../../services/travelData';
import { shareUrlFor } from '../../services/travelData';
import { orderPlacesByLinks, placeDisplayName } from '../../utils/boardGraph';
import LoadingLink from '../LoadingLink';

type ShareDialogProps = {
  trip: Trip;
  places: Place[];
  links: PlaceLink[];
  travelData: TravelDataClient;
  isDemoMode: boolean;
  onClose: () => void;
  onTripChange: (trip: Trip) => void;
};

type Tab = 'link' | 'news';

const inputClass = 'w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-ink outline-none transition-all placeholder:text-ink-faint focus:border-primary focus:ring-2 focus:ring-primary/30';

const defaultStory = (trip: Trip, places: Place[], links: PlaceLink[]) => {
  const stops = orderPlacesByLinks(places, links).map((place) => placeDisplayName(place));
  const where = trip.region ?? 'Malaysia';
  const list = stops.length ? `Stops: ${stops.join(' → ')}.` : 'Still adding places.';
  return `Look guys, this is my plan for ${where} (${trip.destination}). ${list}\n\nWould love to hear what you'd add or skip!`;
};

/** Share a board as a public link or as a News post (which also creates the link). */
const ShareDialog = ({ trip, places, links, travelData, isDemoMode, onClose, onTripChange }: ShareDialogProps) => {
  const [tab, setTab] = useState<Tab>('link');
  const [shareToken, setShareToken] = useState<string | null>(trip.share_token);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [title, setTitle] = useState(`My plan for ${trip.destination}`);
  const [body, setBody] = useState(() => defaultStory(trip, places, links));
  const [publishedPost, setPublishedPost] = useState<NewsPost | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const shareUrl = shareToken ? shareUrlFor(shareToken) : null;

  const createLink = async () => {
    setIsWorking(true);
    setError(null);
    try {
      const result = await travelData.shareTrip(trip.id);
      setShareToken(result.share_token);
      onTripChange({ ...trip, share_token: result.share_token });
    } catch (shareError) {
      setError(shareError instanceof Error ? shareError.message : 'Could not create a share link.');
    } finally {
      setIsWorking(false);
    }
  };

  const revokeLink = async () => {
    if (!window.confirm('Revoke this link? Anyone who has it will lose access.')) return;
    setIsWorking(true);
    setError(null);
    try {
      const updated = await travelData.unshareTrip(trip.id);
      setShareToken(null);
      onTripChange(updated);
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : 'Could not revoke the link.');
    } finally {
      setIsWorking(false);
    }
  };

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Could not copy. Select the link and copy it manually.');
    }
  };

  const publish = async () => {
    setIsWorking(true);
    setError(null);
    try {
      const post = await travelData.createNewsPost({ trip_id: trip.id, title, body });
      setPublishedPost(post);
      if (post.share_token) {
        setShareToken(post.share_token);
        onTripChange({ ...trip, share_token: post.share_token });
      }
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : 'Could not publish this post.');
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-mist-950/50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-line bg-surface-raised shadow-2xl shadow-mist-950/30 animate-rise-in">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Share this plan</h2>
            <p className="text-xs text-ink-muted">{trip.destination}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-1 border-b border-line bg-surface p-1">
          {([
            ['link', 'Share as link', Link],
            ['news', 'Share as news', Newspaper],
          ] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                tab === id ? 'bg-surface-raised text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-4 p-6">
          {error && (
            <div className="rounded-xl border border-mist-500 bg-mist-100 px-4 py-3 text-sm text-danger dark:bg-mist-950/40 dark:text-mist-200">{error}</div>
          )}

          {tab === 'link' && (
            <>
              <p className="text-sm text-ink-muted">
                Anyone with the link can view this board read-only, with the route summary and a PDF download. No sign-in needed.
                {isDemoMode && ' In demo mode the link is a snapshot of the board as it is right now.'}
              </p>
              {shareUrl ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input readOnly value={shareUrl} className={`${inputClass} font-mono text-xs`} onFocus={(event) => event.currentTarget.select()} />
                    <button type="button" onClick={copyLink} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition hover:bg-primary-hover">
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <a href={shareUrl} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:text-primary-hover">Open preview ↗</a>
                    {isDemoMode ? (
                      <button type="button" onClick={createLink} disabled={isWorking} className="text-ink-muted hover:text-ink disabled:opacity-50">Refresh snapshot</button>
                    ) : (
                      <button type="button" onClick={revokeLink} disabled={isWorking} className="text-danger hover:underline disabled:opacity-50">Revoke link</button>
                    )}
                  </div>
                </div>
              ) : (
                <button type="button" onClick={createLink} disabled={isWorking} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition hover:bg-primary-hover disabled:opacity-50">
                  <Link size={16} />
                  {isWorking ? 'Creating link…' : 'Create share link'}
                </button>
              )}
            </>
          )}

          {tab === 'news' && (
            publishedPost ? (
              <div className="space-y-4 text-sm">
                <div className="rounded-2xl border border-mist-600 bg-mist-200 px-4 py-3 text-ink dark:bg-mist-900/30 dark:text-mist-100">
                  <p className="font-semibold">Published to News.</p>
                  <p className="text-ink-muted">Other travellers can now open your plan from the story and like it.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <LoadingLink to={`/news/${publishedPost.slug}`} className="rounded-xl bg-primary px-4 py-2 font-semibold text-on-primary transition hover:bg-primary-hover">View post</LoadingLink>
                  <button type="button" onClick={onClose} className="rounded-xl border border-line px-4 py-2 font-medium text-ink-muted hover:text-ink">Done</button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-ink-muted">
                  Post your plan as a story on the News page. Readers can open the read-only board and like it.
                  {isDemoMode && ' In demo mode the story stays in this browser; sign in to publish for everyone.'}
                </p>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-muted" htmlFor="share-title">Caption</label>
                  <input id="share-title" value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} maxLength={120} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-muted" htmlFor="share-body">Story</label>
                  <textarea id="share-body" rows={6} value={body} onChange={(event) => setBody(event.target.value)} className={`${inputClass} resize-none`} maxLength={4000} />
                </div>
                <button type="button" onClick={publish} disabled={isWorking || title.trim().length < 3 || body.trim().length < 3} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition hover:bg-primary-hover disabled:opacity-50">
                  <Newspaper size={16} />
                  {isWorking ? 'Publishing…' : 'Publish to News'}
                </button>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareDialog;
