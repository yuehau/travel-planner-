import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left.mjs';
import Calendar from 'lucide-react/dist/esm/icons/calendar.mjs';
import CircleCheck from 'lucide-react/dist/esm/icons/circle-check.mjs';
import Download from 'lucide-react/dist/esm/icons/download.mjs';
import Eye from 'lucide-react/dist/esm/icons/eye.mjs';
import MapPin from 'lucide-react/dist/esm/icons/map-pin.mjs';
import PenLine from 'lucide-react/dist/esm/icons/pen-line.mjs';
import Pencil from 'lucide-react/dist/esm/icons/pencil.mjs';
import Share2 from 'lucide-react/dist/esm/icons/share-2.mjs';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2.mjs';
import BrandMark from '../components/BrandMark';
import ThemeToggle from '../components/ThemeToggle';
import CreateTripModal from '../components/Dashboard/CreateTripModal';
import LoadingSpinner from '../components/LoadingSpinner';
import LoadingLink from '../components/LoadingLink';
import TripBoard from '../components/Board/TripBoard';
import ShareDialog from '../components/Board/ShareDialog';
import { useAuth } from '../hooks/useAuth';
import { useTravelDataClient } from '../hooks/useTravelDataClient';
import { downloadTripPdf } from '../services/publicApi';
import type { Place, PlaceLink, Trip } from '../types/database';
import type { TripCreateInput } from '../services/travelData';
import { formatTripDate } from '../utils/tripStatus';
import { usePageTransition } from '../hooks/usePageTransition';

const toolbarButtonClass = 'inline-flex items-center gap-2 rounded-full border border-line bg-surface-raised px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-mist-700 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40';

const TripBoardPage: React.FC = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { isDemoMode, profile } = useAuth();
  const { startPageTransition } = usePageTransition();
  const travelData = useTravelDataClient();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSavingTrip, setIsSavingTrip] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [tripActionError, setTripActionError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [boardState, setBoardState] = useState<{ places: Place[]; links: PlaceLink[] }>({ places: [], links: [] });
  const isViewMode = trip?.status === 'complete';

  useEffect(() => {
    let isMounted = true;

    const loadTrip = async () => {
      if (!travelData || !tripId) {
        setIsLoading(false);
        setError('Trip was not found.');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const loadedTrip = await travelData.getTrip(tripId);
        if (!isMounted) return;

        setTrip(loadedTrip);
        if (!loadedTrip) {
          setError('Trip was not found or is not available to this account.');
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load this trip.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTrip();

    return () => {
      isMounted = false;
    };
  }, [travelData, tripId]);

  const handleBoardChange = useCallback((state: { places: Place[]; links: PlaceLink[] }) => setBoardState(state), []);

  const handleUpdateTrip = async (input: TripCreateInput) => {
    if (!travelData || !trip) return;

    setIsSavingTrip(true);
    setTripActionError(null);

    try {
      const updatedTrip = await travelData.updateTrip(trip.id, input);
      setTrip(updatedTrip);
      setIsTripModalOpen(false);
    } catch (updateError) {
      setTripActionError(updateError instanceof Error ? updateError.message : 'Could not update trip.');
    } finally {
      setIsSavingTrip(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!travelData || !trip) return;
    setIsTogglingStatus(true);
    setTripActionError(null);
    try {
      const updatedTrip = await travelData.updateTrip(trip.id, { status: trip.status === 'complete' ? 'draft' : 'complete' });
      setTrip(updatedTrip);
    } catch (statusError) {
      setTripActionError(statusError instanceof Error ? statusError.message : 'Could not update the plan status.');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleDeleteTrip = async () => {
    if (!travelData || !trip) return;
    if (!window.confirm(`Delete ${trip.destination}? This removes the board and every place on it.`)) return;

    setTripActionError(null);

    try {
      await travelData.deleteTrip(trip.id);
      startPageTransition();
      navigate('/dashboard', { replace: true });
    } catch (deleteError) {
      setTripActionError(deleteError instanceof Error ? deleteError.message : 'Could not delete trip.');
    }
  };

  const handleDownloadPdf = async () => {
    if (!trip) return;

    setIsExportingPdf(true);
    setTripActionError(null);

    try {
      await downloadTripPdf({
        trip,
        places: boardState.places,
        links: boardState.links,
        owner: { full_name: profile?.full_name ?? null, avatar_url: profile?.avatar_url ?? null },
      });
    } catch (downloadError) {
      setTripActionError(downloadError instanceof Error ? downloadError.message : 'Could not export trip.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Loading Board" fullScreen />;
  }

  if (!trip || !travelData || !tripId) {
    return (
      <div className="min-h-screen bg-surface text-ink">
        <main className="mx-auto max-w-3xl px-6 py-16">
          <LoadingLink to="/dashboard" className="group mb-8 inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-ink">
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            Back to Dashboard
          </LoadingLink>
          <h1 className="mb-3 text-3xl font-bold tracking-tight">Trip unavailable</h1>
          <p className="text-ink-muted">{error ?? 'Trip was not found.'}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="grid h-screen grid-rows-[auto_1fr] bg-surface text-ink transition-colors duration-300">
      <header className="z-30 border-b border-line bg-surface-raised/90 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 md:px-6">
          <LoadingLink to="/dashboard" className="group inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-ink" aria-label="Back to Dashboard">
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            <span className="hidden sm:inline">Dashboard</span>
          </LoadingLink>
          <span className="hidden h-6 w-px bg-line sm:block" />
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark size="sm" />
            <div className="min-w-0">
              <h1 className="flex items-center gap-2 truncate text-lg font-bold leading-tight tracking-tight md:text-xl">
                <span className="truncate">{trip.destination}</span>
                {isViewMode && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-mist-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-mist-950 dark:bg-mist-900/50 dark:text-mist-100">
                    <Eye size={11} />
                    Viewing
                  </span>
                )}
              </h1>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-muted">
                {trip.region && <span className="inline-flex items-center gap-1"><MapPin size={12} />{trip.region}</span>}
                <span className="inline-flex items-center gap-1"><Calendar size={12} />{formatTripDate(trip.start_date)} — {formatTripDate(trip.end_date)}</span>
              </p>
            </div>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setIsShareOpen(true)} className={`${toolbarButtonClass} border-primary/40 text-primary hover:text-primary-hover`}>
              <Share2 size={16} />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button type="button" onClick={handleDownloadPdf} disabled={isExportingPdf} className={toolbarButtonClass}>
              <Download size={16} />
              <span className="hidden sm:inline">{isExportingPdf ? 'Exporting' : 'PDF'}</span>
            </button>
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={isTogglingStatus}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                isViewMode ? 'border border-line bg-surface-raised text-ink hover:border-mist-700' : 'bg-primary text-on-primary hover:bg-primary-hover'
              }`}
            >
              {isViewMode ? <PenLine size={16} /> : <CircleCheck size={16} />}
              <span>{isViewMode ? 'Edit plan' : 'Save & view'}</span>
            </button>
            {!isViewMode && (
              <>
                <button type="button" onClick={() => setIsTripModalOpen(true)} className={toolbarButtonClass} aria-label="Edit trip details">
                  <Pencil size={16} />
                  <span className="hidden lg:inline">Trip</span>
                </button>
                <button type="button" onClick={handleDeleteTrip} className={`${toolbarButtonClass} hover:border-danger hover:text-danger`} aria-label="Delete trip">
                  <Trash2 size={16} />
                </button>
              </>
            )}
            <ThemeToggle variant="circle" />
          </div>
        </div>
        {tripActionError && (
          <div className="border-t border-mist-500 bg-mist-100 px-6 py-2 text-sm text-danger dark:bg-mist-950/40 dark:text-mist-100">{tripActionError}</div>
        )}
      </header>

      <div className="min-h-0">
        <TripBoard key={`${trip.id}-${trip.status}`} trip={trip} travelData={travelData} readOnly={isViewMode} showSummary={isViewMode} onBoardChange={handleBoardChange} />
      </div>

      {isTripModalOpen && (
        <CreateTripModal
          isOpen={isTripModalOpen}
          onClose={() => {
            setTripActionError(null);
            setIsTripModalOpen(false);
          }}
          onCreate={handleUpdateTrip}
          isSubmitting={isSavingTrip}
          error={tripActionError}
          initialTrip={{
            destination: trip.destination,
            region: trip.region,
            start_date: trip.start_date,
            end_date: trip.end_date,
            description: trip.description ?? '',
          }}
          title="Edit Trip"
          submitLabel="Save Trip"
          submittingLabel="Saving..."
        />
      )}

      {isShareOpen && (
        <ShareDialog
          trip={trip}
          places={boardState.places}
          links={boardState.links}
          travelData={travelData}
          isDemoMode={isDemoMode}
          onClose={() => setIsShareOpen(false)}
          onTripChange={setTrip}
        />
      )}
    </div>
  );
};

export default TripBoardPage;
