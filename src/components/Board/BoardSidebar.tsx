import { useMemo, useState, type FormEvent } from 'react';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down.mjs';
import GripVertical from 'lucide-react/dist/esm/icons/grip-vertical.mjs';
import MapPin from 'lucide-react/dist/esm/icons/map-pin.mjs';
import Plus from 'lucide-react/dist/esm/icons/plus.mjs';
import Search from 'lucide-react/dist/esm/icons/search.mjs';
import Star from 'lucide-react/dist/esm/icons/star.mjs';
import X from 'lucide-react/dist/esm/icons/x.mjs';
import {
  catalogCategories,
  catalogRegions,
  categoryLabels,
  searchCatalog,
  type CatalogCategory,
  type CatalogPlace,
  type CatalogRegion,
} from '../../data/catalog';
import type { PlaceCreateInput } from '../../services/travelData';
import PlaceImage from '../PlaceImage';

export const placeDragType = 'application/x-travelplanner-place';

type BoardSidebarProps = {
  defaultRegion: string | null;
  placedCatalogIds: Set<string>;
  placedCount: number;
  onAddPlace: (place: CatalogPlace) => void;
  onAddCustomPlace: (input: PlaceCreateInput) => Promise<unknown>;
  onClose: () => void;
};

const isRegion = (value: string | null): value is CatalogRegion => catalogRegions.includes(value as CatalogRegion);

const selectClass = 'w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs font-medium outline-none focus:border-primary';
const inputClass = 'w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none transition placeholder:text-ink-faint focus:border-primary focus:ring-2 focus:ring-primary/30';

const BoardSidebar = ({ defaultRegion, placedCatalogIds, placedCount, onAddPlace, onAddCustomPlace, onClose }: BoardSidebarProps) => {
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<CatalogRegion | 'all'>(isRegion(defaultRegion) ? defaultRegion : 'all');
  const [category, setCategory] = useState<CatalogCategory | 'all'>('all');
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [custom, setCustom] = useState({ name: '', address: '', latitude: '', longitude: '' });
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  const results = useMemo(() => searchCatalog(query, { region, category }), [query, region, category]);

  const handleCustomSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsAddingCustom(true);
    try {
      const latitude = custom.latitude.trim() ? Number(custom.latitude) : null;
      const longitude = custom.longitude.trim() ? Number(custom.longitude) : null;
      const created = await onAddCustomPlace({
        name: custom.name,
        address: custom.address || null,
        latitude: Number.isFinite(latitude) ? latitude : null,
        longitude: Number.isFinite(longitude) ? longitude : null,
        source: 'custom',
      });
      if (created) {
        setCustom({ name: '', address: '', latitude: '', longitude: '' });
        setIsCustomOpen(false);
      }
    } finally {
      setIsAddingCustom(false);
    }
  };

  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-line bg-surface-raised">
      <div className="border-b border-line p-4">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-widest text-ink-faint">Places in Malaysia</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-ink-faint transition hover:bg-surface-sunken hover:text-ink md:hidden"
            aria-label="Close places panel"
          >
            <X size={16} />
          </button>
        </div>
        <p className="mb-3 text-xs text-ink-muted">Drag a place onto the board, then connect the dots.</p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, city or vibe"
            className="w-full rounded-full border border-line bg-surface py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-ink-faint focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <select value={region} onChange={(event) => setRegion(event.target.value as CatalogRegion | 'all')} className={selectClass} aria-label="Filter by region">
            <option value="all">All regions</option>
            {catalogRegions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <select value={category} onChange={(event) => setCategory(event.target.value as CatalogCategory | 'all')} className={selectClass} aria-label="Filter by category">
            <option value="all">All categories</option>
            {catalogCategories.map((option) => (
              <option key={option} value={option}>{categoryLabels[option]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {results.length === 0 && (
          <p className="px-2 py-8 text-center text-sm text-ink-muted">No places match. Try another region or vibe.</p>
        )}
        <ul className="space-y-2">
          {results.map((place) => {
            const isPlaced = placedCatalogIds.has(place.id);
            return (
              <li
                key={place.id}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData(placeDragType, place.id);
                  event.dataTransfer.effectAllowed = 'move';
                }}
                className="group flex cursor-grab items-center gap-3 rounded-2xl border border-line bg-surface p-2 transition hover:border-mist-700 hover:shadow-md hover:shadow-mist-950/10 active:cursor-grabbing"
              >
                <GripVertical size={14} className="shrink-0 text-ink-faint" />
                <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-sunken">
                  <PlaceImage catalogId={place.id} fallback={place.image} width={240} className="h-full w-full object-cover" draggable={false} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold" title={place.name}>{place.name}</p>
                  <p className="flex items-center gap-1.5 text-[11px] text-ink-muted">
                    <span className="truncate">{place.city}</span>
                    <span className="inline-flex shrink-0 items-center gap-0.5">
                      <Star size={10} className="fill-accent text-accent" />
                      {place.rating.toFixed(1)}
                    </span>
                  </p>
                  {isPlaced && <span className="mt-1 inline-block rounded-full bg-mist-300 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-mist-950 dark:bg-mist-900/50 dark:text-mist-100">On board</span>}
                </div>
                <button
                  type="button"
                  onClick={() => onAddPlace(place)}
                  className="shrink-0 rounded-full p-1.5 text-ink-faint transition hover:bg-primary hover:text-on-primary"
                  aria-label={`Add ${place.name} to the board`}
                  title="Add to board"
                >
                  <Plus size={16} />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="border-t border-line">
        <button
          type="button"
          onClick={() => setIsCustomOpen((current) => !current)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-semibold text-ink transition hover:bg-surface-sunken"
          aria-expanded={isCustomOpen}
        >
          <span className="inline-flex items-center gap-2"><MapPin size={14} className="text-accent" />Add a custom place</span>
          <ChevronDown size={14} className={`transition-transform ${isCustomOpen ? 'rotate-180' : ''}`} />
        </button>
        {isCustomOpen && (
          <form onSubmit={handleCustomSubmit} className="space-y-2 px-4 pb-4 animate-rise-in">
            <input required value={custom.name} onChange={(event) => setCustom({ ...custom, name: event.target.value })} placeholder="Name, e.g. Grandma's house" className={inputClass} disabled={isAddingCustom} />
            <input value={custom.address} onChange={(event) => setCustom({ ...custom, address: event.target.value })} placeholder="Address (optional)" className={inputClass} disabled={isAddingCustom} />
            <div className="grid grid-cols-2 gap-2">
              <input value={custom.latitude} onChange={(event) => setCustom({ ...custom, latitude: event.target.value })} placeholder="Latitude" inputMode="decimal" className={inputClass} disabled={isAddingCustom} />
              <input value={custom.longitude} onChange={(event) => setCustom({ ...custom, longitude: event.target.value })} placeholder="Longitude" inputMode="decimal" className={inputClass} disabled={isAddingCustom} />
            </div>
            <button type="submit" disabled={isAddingCustom} className="w-full rounded-xl bg-primary py-2 text-sm font-semibold text-on-primary transition hover:bg-primary-hover disabled:opacity-50">
              {isAddingCustom ? 'Adding…' : 'Add to board'}
            </button>
          </form>
        )}
        <div className="border-t border-line px-4 py-3 text-[11px] text-ink-muted">
          {placedCount} {placedCount === 1 ? 'place' : 'places'} on this board · {results.length} in list
        </div>
      </div>
    </aside>
  );
};

export default BoardSidebar;
