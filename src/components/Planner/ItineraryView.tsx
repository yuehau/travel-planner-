import React, { useEffect, useState } from 'react';
import Clock from 'lucide-react/dist/esm/icons/clock.mjs';
import MapPin from 'lucide-react/dist/esm/icons/map-pin.mjs';
import MoreVertical from 'lucide-react/dist/esm/icons/more-vertical.mjs';
import Plus from 'lucide-react/dist/esm/icons/plus.mjs';
import type { ItineraryItem, Place } from '../../types/database';
import type { TravelDataClient } from '../../services/travelData';

type ItineraryViewProps = {
  tripId: string;
  travelData: TravelDataClient;
};

const formatTime = (time: string | null) => {
  if (!time) return 'Any time';

  const [hours = '0', minutes = '0'] = time.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const ItineraryView: React.FC<ItineraryViewProps> = ({ tripId, travelData }) => {
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    day_number: '1',
    activity: '',
    place_id: '',
    location: '',
    start_time: '',
    notes: '',
  });

  useEffect(() => {
    let isMounted = true;

    const loadItems = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [loadedItems, loadedPlaces] = await Promise.all([
          travelData.listItineraryItems(tripId),
          travelData.listPlaces(tripId),
        ]);
        if (isMounted) {
          setItems(loadedItems);
          setPlaces(loadedPlaces);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load itinerary.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadItems();

    return () => {
      isMounted = false;
    };
  }, [travelData, tripId]);

  const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsAdding(true);

    try {
      const item = await travelData.createItineraryItem(tripId, {
        day_number: Number(formData.day_number),
        activity: formData.activity,
        place_id: formData.place_id,
        location: formData.location,
        start_time: formData.start_time,
        notes: formData.notes,
      });
      setItems((currentItems) => [...currentItems, item]);
      setFormData({ day_number: formData.day_number, activity: '', place_id: '', location: '', start_time: '', notes: '' });
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : 'Could not add activity.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold tracking-tighter">Itinerary</h2>
        <button
          type="submit"
          form="add-itinerary-item"
          disabled={isAdding || travelData.isReadOnly}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-clay-600 dark:bg-clay-500 text-white dark:text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} />
          Add Activity
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form id="add-itinerary-item" onSubmit={handleAdd} className="grid gap-3 md:grid-cols-[110px_1fr_1fr_120px] mb-10">
        <input
          required
          disabled={isAdding || travelData.isReadOnly}
          type="number"
          min="1"
          value={formData.day_number}
          onChange={(event) => setFormData((current) => ({ ...current, day_number: event.target.value }))}
          placeholder="Day"
          className="px-4 py-2 rounded-xl border border-sand-200 dark:border-sand-800 bg-transparent outline-none focus:ring-2 ring-clay-500 dark:ring-clay-400"
        />
        <input
          required
          disabled={isAdding || travelData.isReadOnly}
          value={formData.activity}
          onChange={(event) => setFormData((current) => ({ ...current, activity: event.target.value }))}
          placeholder={travelData.isReadOnly ? 'Demo mode is read-only' : 'Activity'}
          className="px-4 py-2 rounded-xl border border-sand-200 dark:border-sand-800 bg-transparent outline-none focus:ring-2 ring-clay-500 dark:ring-clay-400"
        />
        <select
          disabled={isAdding || travelData.isReadOnly}
          value={formData.place_id}
          onChange={(event) => {
            const place = places.find((item) => item.id === event.target.value);
            setFormData((current) => ({
              ...current,
              place_id: event.target.value,
              location: place?.name ?? current.location,
            }));
          }}
          className="px-4 py-2 rounded-xl border border-sand-200 dark:border-sand-800 bg-transparent outline-none focus:ring-2 ring-clay-500 dark:ring-clay-400"
        >
          <option value="">No saved place</option>
          {places.map((place) => (
            <option key={place.id} value={place.id}>{place.name}</option>
          ))}
        </select>
        <input
          disabled={isAdding || travelData.isReadOnly}
          value={formData.location}
          onChange={(event) => setFormData((current) => ({ ...current, location: event.target.value }))}
          placeholder="Location"
          className="px-4 py-2 rounded-xl border border-sand-200 dark:border-sand-800 bg-transparent outline-none focus:ring-2 ring-clay-500 dark:ring-clay-400"
        />
        <input
          disabled={isAdding || travelData.isReadOnly}
          type="time"
          value={formData.start_time}
          onChange={(event) => setFormData((current) => ({ ...current, start_time: event.target.value }))}
          className="px-4 py-2 rounded-xl border border-sand-200 dark:border-sand-800 bg-transparent outline-none focus:ring-2 ring-clay-500 dark:ring-clay-400"
        />
        <textarea
          disabled={isAdding || travelData.isReadOnly}
          value={formData.notes}
          onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))}
          placeholder="Notes"
          rows={2}
          className="md:col-span-4 px-4 py-2 rounded-xl border border-sand-200 dark:border-sand-800 bg-transparent outline-none focus:ring-2 ring-clay-500 dark:ring-clay-400 resize-none"
        />
      </form>

      {isLoading && <div className="py-12 text-center text-sand-500 dark:text-sand-400">Loading itinerary...</div>}

      {!isLoading && items.length === 0 && (
        <div className="py-12 text-center text-sand-500 dark:text-sand-400">No activities yet.</div>
      )}

      <div className="relative space-y-8">
        {items.length > 0 && <div className="absolute left-4 top-2 bottom-2 w-px bg-sand-200 dark:bg-sand-800" />}

        {items.map((item) => (
          <div key={item.id} className="relative pl-10 group">
            <div className="absolute left-2 top-2 w-4 h-4 rounded-full bg-white dark:bg-sand-900 border-2 border-sand-900 dark:border-sand-100 z-10 group-hover:scale-125 transition-transform" />

            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs font-medium text-sand-400 dark:text-sand-500 mb-1 uppercase tracking-wider">
                  <Clock size={12} />
                  Day {item.day_number} - {formatTime(item.start_time)}
                </div>
                <h3 className="text-lg font-semibold mb-1">{item.activity}</h3>
                {item.location && (
                  <div className="flex items-center gap-1 text-sm text-sand-500 dark:text-sand-400 mb-2">
                    <MapPin size={14} />
                    {item.location}
                  </div>
                )}
                {item.notes && (
                  <p className="text-sm text-sand-500 dark:text-sand-400 font-light italic">
                    {item.notes}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="p-1 text-sand-300 dark:text-sand-700 hover:text-sand-900 dark:hover:text-sand-100 transition-colors"
                aria-label={`More options for ${item.activity}`}
              >
                <MoreVertical size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ItineraryView;
