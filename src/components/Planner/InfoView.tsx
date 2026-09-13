import React, { useEffect, useMemo, useState } from 'react';
import FileText from 'lucide-react/dist/esm/icons/file-text.mjs';
import Globe from 'lucide-react/dist/esm/icons/globe.mjs';
import MapPin from 'lucide-react/dist/esm/icons/map-pin.mjs';
import Phone from 'lucide-react/dist/esm/icons/phone.mjs';
import Plus from 'lucide-react/dist/esm/icons/plus.mjs';
import type { SVGProps } from 'react';
import type { Trip, TripInfo } from '../../types/database';
import type { TravelDataClient } from '../../services/travelData';
import WeatherAndTravelInfo from './WeatherAndTravelInfo';

type InfoViewProps = {
  tripId: string;
  travelData: TravelDataClient;
  trip: Trip;
};

type IconComponent = React.ComponentType<SVGProps<SVGSVGElement> & { size?: string | number }>;

const getCategoryIcon = (category: string): IconComponent => {
  const normalized = category.toLowerCase();

  if (normalized.includes('emergency') || normalized.includes('contact')) return Phone;
  if (normalized.includes('address') || normalized.includes('hotel')) return MapPin;
  if (normalized.includes('link') || normalized.includes('url')) return Globe;

  return FileText;
};

const InfoView: React.FC<InfoViewProps> = ({ tripId, travelData, trip }) => {
  const [items, setItems] = useState<TripInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: 'Confirmation',
    label: '',
    value: '',
    url: '',
  });

  useEffect(() => {
    let isMounted = true;

    const loadItems = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const loadedItems = await travelData.listTripInfos(tripId);
        if (isMounted) {
          setItems(loadedItems);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load trip essentials.');
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

  const categories = useMemo(() => Array.from(new Set(items.map((item) => item.category))), [items]);

  const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsAdding(true);

    try {
      const item = await travelData.createTripInfo(tripId, formData);
      setItems((currentItems) => [...currentItems, item]);
      setFormData((current) => ({ ...current, label: '', value: '', url: '' }));
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : 'Could not add trip info.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <WeatherAndTravelInfo tripId={tripId} travelData={travelData} trip={trip} />

      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-display font-bold tracking-tighter">Trip Essentials</h2>
        <button
          type="submit"
          form="add-trip-info"
          disabled={isAdding || travelData.isReadOnly}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-coral-500 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} />
          Add Info
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form id="add-trip-info" onSubmit={handleAdd} className="grid gap-3 md:grid-cols-[160px_1fr] mb-10">
        <input
          required
          disabled={isAdding || travelData.isReadOnly}
          value={formData.category}
          onChange={(event) => setFormData((current) => ({ ...current, category: event.target.value }))}
          placeholder="Category"
          className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-transparent outline-none focus:ring-2 ring-stone-900 dark:ring-stone-100"
        />
        <input
          required
          disabled={isAdding || travelData.isReadOnly}
          value={formData.label}
          onChange={(event) => setFormData((current) => ({ ...current, label: event.target.value }))}
          placeholder={travelData.isReadOnly ? 'Demo mode is read-only' : 'Label'}
          className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-transparent outline-none focus:ring-2 ring-stone-900 dark:ring-stone-100"
        />
        <input
          required
          disabled={isAdding || travelData.isReadOnly}
          value={formData.value}
          onChange={(event) => setFormData((current) => ({ ...current, value: event.target.value }))}
          placeholder="Value"
          className="md:col-span-2 px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-transparent outline-none focus:ring-2 ring-stone-900 dark:ring-stone-100"
        />
        <input
          disabled={isAdding || travelData.isReadOnly}
          value={formData.url}
          onChange={(event) => setFormData((current) => ({ ...current, url: event.target.value }))}
          placeholder="Optional URL"
          className="md:col-span-2 px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-transparent outline-none focus:ring-2 ring-stone-900 dark:ring-stone-100"
        />
      </form>

      {isLoading ? (
        <div className="py-12 text-center text-stone-500 dark:text-stone-400">Loading essentials...</div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-stone-500 dark:text-stone-400">No essentials saved yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((category) => {
            const Icon = getCategoryIcon(category);
            const categoryItems = items.filter((item) => item.category === category);

            return (
              <section key={category} className="p-6 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                <div className="flex items-center gap-2 text-stone-400 dark:text-stone-600 mb-4">
                  <Icon size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">{category}</span>
                </div>
                <div className="space-y-3">
                  {categoryItems.map((item) => (
                    <div key={item.id} className="flex justify-between gap-4 py-2 border-b border-stone-100 dark:border-stone-800 last:border-b-0">
                      <span className="text-sm text-stone-500">{item.label}</span>
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline text-right"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <span className="text-sm font-medium text-right">{item.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InfoView;
