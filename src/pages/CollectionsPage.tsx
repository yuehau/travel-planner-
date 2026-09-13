import { useState } from 'react';
import Plus from 'lucide-react/dist/esm/icons/plus.mjs';
import AppNav from '../components/AppNav';
import CreateTripModal from '../components/Dashboard/CreateTripModal';
import TripCollections from '../components/Dashboard/TripCollections';
import { useTravelDataClient } from '../hooks/useTravelDataClient';
import type { TripCreateInput } from '../services/travelData';
import { useNavigate } from 'react-router-dom';

const CollectionsPage = () => {
  const travelData = useTravelDataClient();
  const navigate = useNavigate();
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
      navigate(`/trip/${createdTrip.id}`);
    } catch (createTripError) {
      setCreateError(createTripError instanceof Error ? createTripError.message : 'Could not create trip.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-stone-900 transition-colors duration-300 dark:bg-[#0a0a0a] dark:text-stone-100">
      <AppNav />

      <main className="mx-auto max-w-7xl px-6 py-12 pb-32">
        <div className="mb-10 max-w-2xl">
          <h1 className="mb-2 text-4xl font-display font-bold tracking-tighter">Collections</h1>
          <p className="text-stone-500 dark:text-stone-400">
            Save places you have visited or want to turn into future trips.
          </p>
        </div>

        <TripCollections travelData={travelData} onPlanTrip={openCreateTripModal} />
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
          onClose={closeCreateTripModal}
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

export default CollectionsPage;
