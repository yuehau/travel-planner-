import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Check from 'lucide-react/dist/esm/icons/check.mjs';
import MapPin from 'lucide-react/dist/esm/icons/map-pin.mjs';
import Plus from 'lucide-react/dist/esm/icons/plus.mjs';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2.mjs';
import Undo2 from 'lucide-react/dist/esm/icons/undo-2.mjs';
import type { TripCollection, TripCollectionStatus } from '../../types/database';
import type { TravelDataClient } from '../../services/travelData';

type TripCollectionsProps = {
  travelData: TravelDataClient | null;
  onPlanTrip: (destination: string) => void;
};

const statusLabel: Record<TripCollectionStatus, string> = {
  want_to_go: 'Want to go',
  visited: 'Visited',
};

const TripCollections = ({ travelData, onPlanTrip }: TripCollectionsProps) => {
  const [items, setItems] = useState<TripCollection[]>([]);
  const [destination, setDestination] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<TripCollectionStatus>('want_to_go');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadCollections = async () => {
      if (!travelData) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const collections = await travelData.listTripCollections();
        if (isMounted) {
          setItems(collections);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load saved destinations.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCollections();

    return () => {
      isMounted = false;
    };
  }, [travelData]);

  const groupedItems = useMemo(() => ({
    want_to_go: items.filter((item) => item.status === 'want_to_go'),
    visited: items.filter((item) => item.status === 'visited'),
  }), [items]);

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!travelData) return;

    setIsSaving(true);
    setError(null);

    try {
      const item = await travelData.createTripCollection({ destination, notes, status });
      setItems((currentItems) => [item, ...currentItems]);
      setDestination('');
      setNotes('');
      setStatus('want_to_go');
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : 'Could not save destination.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (item: TripCollection, nextStatus: TripCollectionStatus) => {
    if (!travelData) return;

    setError(null);

    try {
      const updated = await travelData.updateTripCollectionStatus(item.id, nextStatus);
      setItems((currentItems) => currentItems.map((current) => (current.id === item.id ? updated : current)));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update saved destination.');
    }
  };

  const handleDelete = async (item: TripCollection) => {
    if (!travelData) return;

    setError(null);

    try {
      await travelData.deleteTripCollection(item.id);
      setItems((currentItems) => currentItems.filter((current) => current.id !== item.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not remove saved destination.');
    }
  };

  return (
    <section className="mb-12">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tighter">Collections</h2>
          <p className="text-sm font-light text-sand-500 dark:text-sand-400">Save places you have visited or want to turn into future trips.</p>
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-sand-400 dark:text-sand-600">{items.length} saved</span>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleAdd} className="mb-6 grid gap-3 rounded-2xl border border-sand-200 bg-sand-50 p-4 dark:border-sand-800 dark:bg-sand-900 md:grid-cols-[1fr_1fr_150px_auto]">
        <input
          required
          disabled={isSaving || travelData?.isReadOnly}
          value={destination}
          onChange={(event) => setDestination(event.target.value)}
          placeholder={travelData?.isReadOnly ? 'Demo mode is read-only' : 'Destination'}
          className="rounded-xl border border-sand-200 bg-white px-4 py-2 text-sm outline-none ring-clay-500 focus:ring-2 dark:border-sand-800 dark:bg-sand-950 dark:ring-clay-400"
        />
        <input
          disabled={isSaving || travelData?.isReadOnly}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Notes"
          className="rounded-xl border border-sand-200 bg-white px-4 py-2 text-sm outline-none ring-clay-500 focus:ring-2 dark:border-sand-800 dark:bg-sand-950 dark:ring-clay-400"
        />
        <select
          disabled={isSaving || travelData?.isReadOnly}
          value={status}
          onChange={(event) => setStatus(event.target.value as TripCollectionStatus)}
          className="rounded-xl border border-sand-200 bg-white px-4 py-2 text-sm outline-none ring-clay-500 focus:ring-2 dark:border-sand-800 dark:bg-sand-950 dark:ring-clay-400"
        >
          <option value="want_to_go">Want to go</option>
          <option value="visited">Visited</option>
        </select>
        <button
          type="submit"
          disabled={isSaving || travelData?.isReadOnly}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-clay-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-clay-500 dark:text-white"
        >
          <Plus size={16} />
          Save
        </button>
      </form>

      {isLoading ? (
        <div className="rounded-2xl border border-sand-200 bg-sand-50 p-6 text-center text-sm text-sand-500 dark:border-sand-800 dark:bg-sand-900 dark:text-sand-400">
          Loading saved destinations...
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {(['want_to_go', 'visited'] as TripCollectionStatus[]).map((groupStatus) => (
            <div key={groupStatus} className="rounded-2xl border border-sand-200 bg-sand-50 p-4 dark:border-sand-800 dark:bg-sand-900">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-sand-400 dark:text-sand-600">{statusLabel[groupStatus]}</h3>
                <span className="text-xs text-sand-400 dark:text-sand-600">{groupedItems[groupStatus].length}</span>
              </div>

              {groupedItems[groupStatus].length === 0 ? (
                <p className="py-8 text-center text-sm text-sand-500 dark:text-sand-400">Nothing saved here yet.</p>
              ) : (
                <div className="space-y-2">
                  {groupedItems[groupStatus].map((item) => (
                    <article key={item.id} className="rounded-xl border border-sand-200 bg-white p-4 dark:border-sand-800 dark:bg-sand-950">
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-sand-400" />
                            <h4 className="font-semibold">{item.destination}</h4>
                          </div>
                          {item.notes && <p className="mt-2 text-sm text-sand-500 dark:text-sand-400">{item.notes}</p>}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          disabled={travelData?.isReadOnly}
                          className="rounded-full p-1.5 text-sand-300 transition-colors hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-sand-700 dark:hover:text-red-400"
                          aria-label={`Remove ${item.destination}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onPlanTrip(item.destination)}
                          className="rounded-full border border-sand-200 px-3 py-1.5 text-xs font-medium text-sand-600 transition-colors hover:text-sand-900 dark:border-sand-800 dark:text-sand-400 dark:hover:text-sand-100"
                        >
                          Plan trip
                        </button>
                        {item.status === 'want_to_go' ? (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item, 'visited')}
                            disabled={travelData?.isReadOnly}
                            className="inline-flex items-center gap-1 rounded-full border border-sand-200 px-3 py-1.5 text-xs font-medium text-sand-600 transition-colors hover:text-sand-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-sand-800 dark:text-sand-400 dark:hover:text-sand-100"
                          >
                            <Check size={13} />
                            Mark visited
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item, 'want_to_go')}
                            disabled={travelData?.isReadOnly}
                            className="inline-flex items-center gap-1 rounded-full border border-sand-200 px-3 py-1.5 text-xs font-medium text-sand-600 transition-colors hover:text-sand-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-sand-800 dark:text-sand-400 dark:hover:text-sand-100"
                          >
                            <Undo2 size={13} />
                            Want to go
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default TripCollections;
