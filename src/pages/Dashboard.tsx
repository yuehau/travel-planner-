import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Plus from 'lucide-react/dist/esm/icons/plus.mjs';
import Search from 'lucide-react/dist/esm/icons/search.mjs';
import AppNav from '../components/AppNav';
import { usePageTransition } from '../hooks/usePageTransition';
import { useAuth } from '../hooks/useAuth';
import { useTravelDataClient } from '../hooks/useTravelDataClient';
import type { Trip } from '../types/database';
import type { TripCreateInput } from '../services/travelData';
import { formatTripDate, getTripStatus } from '../utils/tripStatus';
import type { CatalogPlace } from '../data/catalog';
import TripCard from '../components/Dashboard/TripCard';
import CreateTripModal from '../components/Dashboard/CreateTripModal';
import PopularPlacesBanner from '../components/Dashboard/PopularPlacesBanner';
import PlaceFocusModal from '../components/Board/PlaceFocusModal';

const Dashboard: React.FC = () => {
  const { isDemoMode, profile } = useAuth();
  const travelData = useTravelDataClient();
  const navigate = useNavigate();
  const { startPageTransition } = usePageTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [initialRegion, setInitialRegion] = useState('');
  const [focusedPlace, setFocusedPlace] = useState<CatalogPlace | null>(null);

  const openCreateTripModal = (region = '') => {
    setCreateError(null);
    setInitialRegion(region);
    setFocusedPlace(null);
    setIsModalOpen(true);
  };

  useEffect(() => {
    let isMounted = true;

    const loadTrips = async () => {
      if (!travelData) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const loadedTrips = await travelData.listTrips();
        if (isMounted) {
          setTrips(loadedTrips);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load trips.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTrips();

    return () => {
      isMounted = false;
    };
  }, [travelData]);

  const handleCreateTrip = async (trip: TripCreateInput) => {
    if (!travelData) return;

    setCreateError(null);

    if (new Date(`${trip.end_date}T00:00:00`) < new Date(`${trip.start_date}T00:00:00`)) {
      setCreateError('End date must be after the start date.');
      return;
    }

    setIsCreating(true);

    try {
      const createdTrip = await travelData.createTrip(trip);
      setTrips((currentTrips) => [...currentTrips, createdTrip]);
      setIsModalOpen(false);
      startPageTransition();
      navigate(`/trip/${createdTrip.id}`);
    } catch (createTripError) {
      setCreateError(createTripError instanceof Error ? createTripError.message : 'Could not create trip.');
    } finally {
      setIsCreating(false);
    }
  };

  const filteredTrips = trips.filter((trip) => {
    const query = searchQuery.toLowerCase();
    return trip.destination.toLowerCase().includes(query) || (trip.region ?? '').toLowerCase().includes(query);
  });
  const counts = {
    upcoming: trips.filter((trip) => getTripStatus(trip.start_date, trip.end_date) === 'upcoming').length,
    active: trips.filter((trip) => getTripStatus(trip.start_date, trip.end_date) === 'active').length,
    past: trips.filter((trip) => getTripStatus(trip.start_date, trip.end_date) === 'past').length,
  };
  const firstName = (profile?.full_name ?? 'Traveler').split(' ')[0];

  return (
    <div className="min-h-screen bg-surface text-ink transition-colors duration-300">
      <AppNav />

      <main className="mx-auto max-w-7xl px-6 py-8 pb-32">
        <PopularPlacesBanner onSelectPlace={setFocusedPlace} onPlanRegion={openCreateTripModal} />

        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold tracking-tight">Hi {firstName}, your boards</h1>
            <p className="text-ink-muted">
              {isDemoMode
                ? 'Explore three sample plans. Everything you change is saved in this browser.'
                : 'Open a board to keep planning, or start a new one.'}
            </p>
          </div>

          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" size={18} />
            <input
              type="text"
              placeholder="Search trips or regions"
              className="w-full rounded-full border border-line bg-surface-raised py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-ink-faint focus:border-primary focus:ring-2 focus:ring-primary/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-mist-500 bg-mist-100 px-4 py-3 text-sm text-danger dark:bg-mist-950/40 dark:text-mist-200">
            {error}
          </div>
        )}

        <section className="mb-10 grid gap-4 sm:grid-cols-3">
          {([
            ['Upcoming', counts.upcoming, 'from-mist-200 to-mist-400 text-ink dark:from-mist-900/60 dark:to-mist-800/40 dark:text-mist-100'],
            ['Active', counts.active, 'from-mist-300 to-mist-500 text-mist-950 dark:from-mist-900/50 dark:to-mist-800/40 dark:text-mist-100'],
            ['Past', counts.past, 'from-mist-500 to-mist-700 text-ink dark:from-mist-800/50 dark:to-mist-700/40 dark:text-mist-100'],
          ] as const).map(([label, count, classes]) => (
            <div key={label} className={`rounded-2xl bg-gradient-to-br p-5 ${classes}`}>
              <p className="text-xs font-bold uppercase tracking-widest opacity-70">{label}</p>
              <p className="mt-2 text-3xl font-bold tracking-tight">{count}</p>
            </div>
          ))}
        </section>

        {isLoading ? (
          <div className="py-16 text-center text-ink-muted">Loading trips...</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTrips.map((trip) => (
              <TripCard
                key={trip.id}
                id={trip.id}
                destination={trip.destination}
                region={trip.region}
                coverImage={trip.cover_image}
                startDate={formatTripDate(trip.start_date)}
                endDate={formatTripDate(trip.end_date)}
                status={getTripStatus(trip.start_date, trip.end_date)}
                isComplete={trip.status === 'complete'}
              />
            ))}
          </div>
        )}

        {!isLoading && filteredTrips.length === 0 && (
          <div className="rounded-3xl border border-dashed border-line-strong py-16 text-center text-ink-muted">
            {searchQuery ? 'No trips match your search.' : 'No trips yet. Start one and drag places onto the board.'}
          </div>
        )}
      </main>

      <button
        type="button"
        onClick={() => openCreateTripModal()}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-4 font-semibold text-on-accent shadow-2xl shadow-mist-950/30 transition-all hover:-translate-y-0.5 hover:bg-accent-hover sm:bottom-8 sm:right-8"
      >
        <Plus size={20} />
        <span>New Trip</span>
      </button>

      {isModalOpen && (
        <CreateTripModal
          isOpen={isModalOpen}
          onClose={() => {
            setCreateError(null);
            setInitialRegion('');
            setIsModalOpen(false);
          }}
          onCreate={handleCreateTrip}
          isSubmitting={isCreating}
          error={createError}
          initialRegion={initialRegion}
        />
      )}

      <PlaceFocusModal
        catalogPlace={focusedPlace}
        onClose={() => setFocusedPlace(null)}
        action={focusedPlace ? { label: `Plan a trip in ${focusedPlace.region}`, onClick: () => openCreateTripModal(focusedPlace.region) } : undefined}
      />
    </div>
  );
};

export default Dashboard;
