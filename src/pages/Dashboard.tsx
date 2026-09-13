import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CalendarClock from 'lucide-react/dist/esm/icons/calendar-clock.mjs';
import Globe2 from 'lucide-react/dist/esm/icons/globe-2.mjs';
import Plus from 'lucide-react/dist/esm/icons/plus.mjs';
import Search from 'lucide-react/dist/esm/icons/search.mjs';
import AppNav from '../components/AppNav';
import { useAuth } from '../hooks/useAuth';
import { useTravelDataClient } from '../hooks/useTravelDataClient';
import type { Trip } from '../types/database';
import type { TripCreateInput } from '../services/travelData';
import { formatTripDate, getTripStatus } from '../utils/tripStatus';
import TripCard from '../components/Dashboard/TripCard';
import CreateTripModal from '../components/Dashboard/CreateTripModal';

const Dashboard: React.FC = () => {
  const { isDemoMode } = useAuth();
  const travelData = useTravelDataClient();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [initialTripDestination, setInitialTripDestination] = useState('');

  const openCreateTripModal = (destination = '') => {
    setCreateError(null);
    setInitialTripDestination(destination);
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
      navigate(`/trip/${createdTrip.id}`);
    } catch (createTripError) {
      setCreateError(createTripError instanceof Error ? createTripError.message : 'Could not create trip.');
    } finally {
      setIsCreating(false);
    }
  };

  const filteredTrips = trips.filter(trip =>
    trip.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const activeTrips = trips.filter((trip) => getTripStatus(trip.start_date, trip.end_date) === 'active').length;
  const upcomingTrips = trips.filter((trip) => getTripStatus(trip.start_date, trip.end_date) === 'upcoming').length;
  const pastTrips = trips.filter((trip) => getTripStatus(trip.start_date, trip.end_date) === 'past').length;
  const nextTrip = trips.find((trip) => getTripStatus(trip.start_date, trip.end_date) !== 'past') ?? trips[0];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-stone-900 dark:text-stone-100 transition-colors duration-300">
      <AppNav />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 pb-32">
        <div className="mb-12">
          <div className="flex-1 w-full">
            <h1 className="text-4xl font-display font-bold tracking-tighter mb-2">Your Trips</h1>
            <p className="text-stone-500 dark:text-stone-400 font-light mb-6">
              {isDemoMode ? 'Explore the read-only demo trip data.' : 'Manage your upcoming adventures and past memories.'}
            </p>

            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input
                type="text"
                placeholder="Search destinations..."
                className="w-full pl-10 pr-4 py-2 rounded-full border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 focus:ring-2 ring-stone-900 dark:ring-stone-100 outline-none transition-all text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="mb-12 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-900">
            <p className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-stone-600">Upcoming</p>
            <p className="mt-3 text-3xl font-bold tracking-tighter">{upcomingTrips}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-900">
            <p className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-stone-600">Active</p>
            <p className="mt-3 text-3xl font-bold tracking-tighter">{activeTrips}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-900">
            <p className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-stone-600">Past</p>
            <p className="mt-3 text-3xl font-bold tracking-tighter">{pastTrips}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-900">
            <div className="mb-3 flex items-center justify-between text-stone-400 dark:text-stone-600">
              <CalendarClock size={18} />
              <Globe2 size={18} />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-stone-600">Next Focus</p>
            <p className="mt-2 truncate text-sm font-semibold">{nextTrip?.destination ?? 'Create your first trip'}</p>
          </div>
        </section>

        {/* Trip Grid */}
        {isLoading ? (
          <div className="py-16 text-center text-stone-500 dark:text-stone-400">Loading trips...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTrips.map((trip) => (
              <TripCard
                key={trip.id}
                id={trip.id}
                destination={trip.destination}
                startDate={formatTripDate(trip.start_date)}
                endDate={formatTripDate(trip.end_date)}
                status={getTripStatus(trip.start_date, trip.end_date)}
              />
            ))}
          </div>
        )}

        {!isLoading && filteredTrips.length === 0 && (
          <div className="py-16 text-center text-stone-500 dark:text-stone-400">
            {searchQuery ? 'No trips match your search.' : 'No trips yet.'}
          </div>
        )}
      </main>

      <button
        type="button"
        onClick={() => openCreateTripModal()}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-coral-500 px-6 py-4 font-semibold text-white shadow-2xl shadow-coral-500/30 transition-all hover:-translate-y-0.5 hover:opacity-90 sm:bottom-8 sm:right-8"
      >
        <Plus size={20} />
        <span>New Trip</span>
      </button>

      {isModalOpen && (
        <CreateTripModal
          isOpen={isModalOpen}
          onClose={() => {
            setCreateError(null);
            setInitialTripDestination('');
            setIsModalOpen(false);
          }}
          onCreate={handleCreateTrip}
          isSubmitting={isCreating}
          error={createError}
          isReadOnly={travelData?.isReadOnly}
          initialDestination={initialTripDestination}
        />
      )}
    </div>
  );
};

export default Dashboard;
