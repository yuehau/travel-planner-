import { useEffect, useMemo, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import MapPin from 'lucide-react/dist/esm/icons/map-pin.mjs';
import Plus from 'lucide-react/dist/esm/icons/plus.mjs';
import Search from 'lucide-react/dist/esm/icons/search.mjs';
import Star from 'lucide-react/dist/esm/icons/star.mjs';
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import type { Place } from '../../types/database';
import type { TravelDataClient } from '../../services/travelData';

type PlacesViewProps = {
  tripId: string;
  travelData: TravelDataClient;
};

type SearchResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
};

const defaultCenter: [number, number] = [20, 0];

const PlacesView = ({ tripId, travelData }: PlacesViewProps) => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [manualName, setManualName] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadPlaces = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const loadedPlaces = await travelData.listPlaces(tripId);
        if (isMounted) setPlaces(loadedPlaces);
      } catch (loadError) {
        if (isMounted) setError(loadError instanceof Error ? loadError.message : 'Could not load places.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadPlaces();

    return () => {
      isMounted = false;
    };
  }, [travelData, tripId]);

  const mapCenter = useMemo<[number, number]>(() => {
    const firstGeocodedPlace = places.find((place) => place.latitude !== null && place.longitude !== null);
    return firstGeocodedPlace ? [firstGeocodedPlace.latitude ?? 0, firstGeocodedPlace.longitude ?? 0] : defaultCenter;
  }, [places]);

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query.trim())}`,
      );

      if (!response.ok) {
        throw new Error('Place search is unavailable right now.');
      }

      const data = (await response.json()) as SearchResult[];
      setResults(data);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : 'Could not search places.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveResult = async (result: SearchResult) => {
    setIsAdding(true);
    setError(null);

    try {
      const place = await travelData.createPlace(tripId, {
        name: result.name || result.display_name.split(',')[0] || 'Saved place',
        address: result.display_name,
        latitude: Number(result.lat),
        longitude: Number(result.lon),
        source: 'openstreetmap',
      });
      setPlaces((currentPlaces) => [...currentPlaces, place]);
      setResults((currentResults) => currentResults.filter((item) => item.place_id !== result.place_id));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save place.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleManualAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsAdding(true);
    setError(null);

    try {
      const place = await travelData.createPlace(tripId, {
        name: manualName,
        address: manualAddress,
        source: 'manual',
      });
      setPlaces((currentPlaces) => [...currentPlaces, place]);
      setManualName('');
      setManualAddress('');
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : 'Could not add place.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tighter">Map & Places</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Search, save, and pin the places that shape this trip.</p>
        </div>
        <form onSubmit={handleSearch} className="flex w-full gap-2 md:max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              disabled={isSearching}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search places"
              className="w-full rounded-full border border-zinc-200 bg-zinc-50 py-2 pl-10 pr-4 text-sm outline-none ring-zinc-900 transition-all focus:ring-2 dark:border-zinc-800 dark:bg-zinc-900 dark:ring-zinc-100"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {isSearching ? 'Searching' : 'Search'}
          </button>
        </form>
      </div>

      {error && <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="mb-8 h-[360px] overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <MapContainer key={`${mapCenter[0]}-${mapCenter[1]}`} center={mapCenter} zoom={places.length ? 12 : 2} className="h-full w-full">
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {places.map((place) =>
            place.latitude !== null && place.longitude !== null ? (
              <CircleMarker key={place.id} center={[place.latitude, place.longitude]} radius={8} pathOptions={{ color: '#18181b', fillColor: '#18181b', fillOpacity: 0.75 }}>
                <Popup>
                  <strong>{place.name}</strong>
                  {place.address && <p>{place.address}</p>}
                </Popup>
              </CircleMarker>
            ) : null,
          )}
        </MapContainer>
      </div>

      {results.length > 0 && (
        <section className="mb-10">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Search Results</h3>
          <div className="space-y-2">
            {results.map((result) => (
              <div key={result.place_id} className="flex items-start justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div>
                  <p className="text-sm font-semibold">{result.name || result.display_name.split(',')[0]}</p>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{result.display_name}</p>
                </div>
                <button
                  type="button"
                  disabled={isAdding || travelData.isReadOnly}
                  onClick={() => handleSaveResult(result)}
                  className="rounded-full bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  Save
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <form onSubmit={handleManualAdd} className="mb-10 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <input
          required
          disabled={isAdding || travelData.isReadOnly}
          value={manualName}
          onChange={(event) => setManualName(event.target.value)}
          placeholder={travelData.isReadOnly ? 'Demo mode is read-only' : 'Place name'}
          className="rounded-xl border border-zinc-200 bg-transparent px-4 py-2 outline-none ring-zinc-900 focus:ring-2 dark:border-zinc-800 dark:ring-zinc-100"
        />
        <input
          disabled={isAdding || travelData.isReadOnly}
          value={manualAddress}
          onChange={(event) => setManualAddress(event.target.value)}
          placeholder="Address or notes"
          className="rounded-xl border border-zinc-200 bg-transparent px-4 py-2 outline-none ring-zinc-900 focus:ring-2 dark:border-zinc-800 dark:ring-zinc-100"
        />
        <button
          type="submit"
          disabled={isAdding || travelData.isReadOnly}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          <Plus size={16} />
          Add
        </button>
      </form>

      {isLoading ? (
        <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">Loading places...</div>
      ) : places.length === 0 ? (
        <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">No places saved yet.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {places.map((place) => (
            <article key={place.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{place.name}</h3>
                  {place.address && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{place.address}</p>}
                </div>
                <MapPin size={18} className="text-zinc-400" />
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                <span>{place.source}</span>
                {place.rating !== null && (
                  <span className="inline-flex items-center gap-1">
                    <Star size={12} />
                    {place.rating}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlacesView;
