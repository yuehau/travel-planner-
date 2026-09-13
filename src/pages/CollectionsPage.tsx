import { useState } from 'react';
import Plus from 'lucide-react/dist/esm/icons/plus.mjs';
import { useNavigate } from 'react-router-dom';
import AppNav from '../components/AppNav';
import CreateTripModal from '../components/Dashboard/CreateTripModal';
import TripCollections from '../components/Dashboard/TripCollections';
import { catalogRegions } from '../data/catalog';
import { useTravelDataClient } from '../hooks/useTravelDataClient';
import type { TripCreateInput } from '../services/travelData';
import { usePageTransition } from '../hooks/usePageTransition';

const CollectionsPage = () => {
  const travelData = useTravelDataClient();
  const navigate = useNavigate();
  const { startPageTransition } = usePageTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [initialTripDestination, setInitialTripDestination] = useState('');

  const openCreateTripModal = (destination = '') => {
    setCreateError(null);
    setInitialTripDestination(destination);
    setIsModalOpen(true);
  };

  const closeCreateTripModal = () => {
    setCreateError(null);
    setInitialTripDestination('');
    setIsModalOpen(false);
  };

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
      setIsModalOpen(false);
      startPageTransition();
      navigate(`/trip/${createdTrip.id}`);
    } catch (createTripError) {
      setCreateError(createTripError instanceof Error ? createTripError.message : 'Could not create trip.');
    } finally {
      setIsCreating(false);
    }
  };

  // A saved destination that names a catalog region pre-selects it on the new trip.
  const matchedRegion = catalogRegions.find((region) => region.toLowerCase() === initialTripDestination.trim().toLowerCase()) ?? '';

  return (
    <div className="min-h-screen bg-surface text-ink transition-colors duration-300">
      <AppNav />

      <main className="mx-auto max-w-7xl px-6 py-8 pb-32">
        <div className="mb-10 max-w-2xl">
          <h1 className="mb-2 text-4xl font-bold tracking-tight">Collections</h1>
          <p className="text-ink-muted">
            Save places you have visited or want to turn into future boards.
          </p>
        </div>

        <TripCollections travelData={travelData} onPlanTrip={openCreateTripModal} />
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
          onClose={closeCreateTripModal}
          onCreate={handleCreateTrip}
          isSubmitting={isCreating}
          error={createError}
          initialDestination={initialTripDestination}
          initialRegion={matchedRegion}
        />
      )}
    </div>
  );
};

export default CollectionsPage;
