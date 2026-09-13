import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Check from 'lucide-react/dist/esm/icons/check.mjs';
import MapPin from 'lucide-react/dist/esm/icons/map-pin.mjs';
import Plus from 'lucide-react/dist/esm/icons/plus.mjs';
import Undo2 from 'lucide-react/dist/esm/icons/undo-2.mjs';
import type { TripCollection, TripCollectionStatus } from '../../types/database';
import type { TravelDataClient } from '../../services/travelData';
import ItemActions from '../ItemActions';

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
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const resetForm = () => {
    setEditingId(null);
    setDestination('');
    setNotes('');
    setStatus('want_to_go');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!travelData) return;

    setIsSaving(true);
    setError(null);

    try {
      if (editingId) {
        const item = await travelData.updateTripCollection(editingId, { destination, notes, status });
        setItems((currentItems) => currentItems.map((current) => (current.id === item.id ? item : current)));
      } else {
        const item = await travelData.createTripCollection({ destination, notes, status });
        setItems((currentItems) => [item, ...currentItems]);
      }
      resetForm();
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : 'Could not save destination.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (item: TripCollection) => {
    setEditingId(item.id);
    setDestination(item.destination);
    setNotes(item.notes ?? '');
    setStatus(item.status);
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
    if (!window.confirm(`Remove ${item.destination} from your collections?`)) return;

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
          <h2 className="text-2xl font-bold tracking-tight">Saved destinations</h2>
          <p className="text-sm text-ink-muted">Save places you have visited or want to turn into future trips.</p>
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-ink-faint">{items.length} saved</span>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-mist-500 bg-mist-100 px-4 py-3 text-sm text-danger dark:bg-mist-950/40 dark:text-mist-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-6 grid gap-3 rounded-3xl border border-line bg-surface-raised p-4 md:grid-cols-[1fr_1fr_150px_auto_auto]">
        <input
          required
          disabled={isSaving}
          value={destination}
          onChange={(event) => setDestination(event.target.value)}
          placeholder="Destination, e.g. Ipoh"
          className="rounded-xl border border-line bg-surface px-4 py-2 text-sm outline-none transition placeholder:text-ink-faint focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
        <input
          disabled={isSaving}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Notes"
          className="rounded-xl border border-line bg-surface px-4 py-2 text-sm outline-none transition placeholder:text-ink-faint focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
        <select
          disabled={isSaving}
          value={status}
          onChange={(event) => setStatus(event.target.value as TripCollectionStatus)}
          className="rounded-xl border border-line bg-surface px-4 py-2 text-sm outline-none transition placeholder:text-ink-faint focus:border-primary focus:ring-2 focus:ring-primary/30"
        >
          <option value="want_to_go">Want to go</option>
          <option value="visited">Visited</option>
        </select>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} />
          {editingId ? 'Update' : 'Save'}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={resetForm}
            className="rounded-xl border border-line bg-surface px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
          >
            Cancel
          </button>
        )}
      </form>

      {isLoading ? (
        <div className="rounded-3xl border border-line bg-surface-raised p-6 text-center text-sm text-ink-muted">
          Loading saved destinations...
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {(['want_to_go', 'visited'] as TripCollectionStatus[]).map((groupStatus) => (
            <div key={groupStatus} className="rounded-3xl border border-line bg-surface-raised p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-ink-faint">{statusLabel[groupStatus]}</h3>
                <span className="text-xs text-ink-faint">{groupedItems[groupStatus].length}</span>
              </div>

              {groupedItems[groupStatus].length === 0 ? (
                <p className="py-8 text-center text-sm text-ink-muted">Nothing saved here yet.</p>
              ) : (
                <div className="space-y-2">
                  {groupedItems[groupStatus].map((item) => (
                    <article key={item.id} className="rounded-2xl border border-line bg-surface p-4">
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-accent" />
                            <h4 className="font-semibold">{item.destination}</h4>
                          </div>
                          {item.notes && <p className="mt-2 text-sm text-ink-muted">{item.notes}</p>}
                        </div>
                        <ItemActions
                          label={item.destination}
                          onEdit={() => handleEdit(item)}
                          onDelete={() => handleDelete(item)}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onPlanTrip(item.destination)}
                          className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary transition hover:bg-primary-hover"
                        >
                          Plan trip
                        </button>
                        {item.status === 'want_to_go' ? (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item, 'visited')}
                            className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:border-mist-700 hover:text-ink"
                          >
                            <Check size={13} />
                            Mark visited
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item, 'want_to_go')}
                            className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:border-mist-700 hover:text-ink"
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
