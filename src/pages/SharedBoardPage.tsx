import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Calendar from 'lucide-react/dist/esm/icons/calendar.mjs';
import Download from 'lucide-react/dist/esm/icons/download.mjs';
import Eye from 'lucide-react/dist/esm/icons/eye.mjs';
import MapPin from 'lucide-react/dist/esm/icons/map-pin.mjs';
import BrandMark from '../components/BrandMark';
import LoadingLink from '../components/LoadingLink';
import LoadingSpinner from '../components/LoadingSpinner';
import ThemeToggle from '../components/ThemeToggle';
import { StaticTripBoard } from '../components/Board/TripBoard';
import { downloadTripPdf, fetchSharedBoard } from '../services/publicApi';
import type { SharedBoard } from '../types/database';
import { formatTripDate } from '../utils/tripStatus';

/** Public, read-only view of a shared plan. Works without a session. */
const SharedBoardPage = () => {
  const { token } = useParams();
  const [board, setBoard] = useState<SharedBoard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const loaded = await fetchSharedBoard(token);
        if (isMounted) setBoard(loaded);
      } catch (loadError) {
        if (isMounted) setError(loadError instanceof Error ? loadError.message : 'Could not load this plan.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handlePdf = async () => {
    if (!board) return;
    setIsExporting(true);
    setError(null);
    try {
      await downloadTripPdf({ trip: board.trip, places: board.places, links: board.links, owner: board.owner });
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'Could not export this plan.');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) return <LoadingSpinner label="Loading shared plan" fullScreen />;

  if (!board) {
    return (
      <div className="min-h-screen bg-surface text-ink">
        <main className="mx-auto max-w-2xl px-6 py-20 text-center">
          <BrandMark />
          <h1 className="mt-6 text-3xl font-bold tracking-tight">This plan isn't available</h1>
          <p className="mt-3 text-ink-muted">{error ?? 'The link may have been revoked, or it never existed.'}</p>
          <LoadingLink to="/" className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 font-semibold text-on-primary transition hover:bg-primary-hover">Plan your own trip</LoadingLink>
        </main>
      </div>
    );
  }

  const ownerName = board.owner.full_name ?? 'A traveller';
  const initial = ownerName.trim().charAt(0).toUpperCase();

  return (
    <div className="grid h-screen grid-rows-[auto_1fr] bg-surface text-ink transition-colors duration-300">
      <header className="z-30 border-b border-line bg-surface-raised/90 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 md:px-6">
          <LoadingLink to="/" className="group flex shrink-0 items-center gap-2 text-sm font-semibold tracking-tight">
            <BrandMark size="sm" interactive />
            <span className="hidden sm:inline">TravelPlanner</span>
          </LoadingLink>
          <span className="hidden h-6 w-px bg-line sm:block" />
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-mist-600 to-mist-800 text-sm font-bold text-on-accent">
              {board.owner.avatar_url ? <img src={board.owner.avatar_url} alt="" className="h-full w-full object-cover" /> : initial}
            </div>
            <div className="min-w-0">
              <h1 className="flex items-center gap-2 truncate text-lg font-bold leading-tight tracking-tight md:text-xl">
                <span className="truncate">{board.trip.destination}</span>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-mist-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-mist-950 dark:bg-mist-900/50 dark:text-mist-100">
                  <Eye size={11} />
                  Shared
                </span>
              </h1>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-muted">
                <span>by {ownerName}</span>
                {board.trip.region && <span className="inline-flex items-center gap-1"><MapPin size={12} />{board.trip.region}</span>}
                <span className="inline-flex items-center gap-1"><Calendar size={12} />{formatTripDate(board.trip.start_date)} — {formatTripDate(board.trip.end_date)}</span>
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={handlePdf} disabled={isExporting} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-raised px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-mist-700 hover:text-ink disabled:opacity-40">
              <Download size={16} />
              <span className="hidden sm:inline">{isExporting ? 'Exporting' : 'PDF'}</span>
            </button>
            <LoadingLink to="/signup" className="hidden rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:bg-primary-hover sm:inline-flex">
              Plan your own
            </LoadingLink>
            <ThemeToggle variant="circle" />
          </div>
        </div>
        {error && <div className="border-t border-mist-500 bg-mist-100 px-6 py-2 text-sm text-danger dark:bg-mist-950/40 dark:text-mist-100">{error}</div>}
      </header>
      <div className="min-h-0">
        <StaticTripBoard trip={board.trip} places={board.places} links={board.links} />
      </div>
    </div>
  );
};

export default SharedBoardPage;
