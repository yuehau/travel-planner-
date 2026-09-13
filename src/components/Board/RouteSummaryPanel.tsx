import ListOrdered from 'lucide-react/dist/esm/icons/list-ordered.mjs';
import X from 'lucide-react/dist/esm/icons/x.mjs';
import { getCatalogPlace } from '../../data/catalog';
import type { Place, PlaceLink } from '../../types/database';
import { formatStartTime, groupPlacesByDay, orderPlacesByLinks, placeDisplayName } from '../../utils/boardGraph';
import { describeLeg } from '../../utils/routeEstimate';
import { getTransportOption } from '../../utils/transport';
import PlaceImage from '../PlaceImage';

type RouteSummaryPanelProps = {
  places: Place[];
  links: PlaceLink[];
  onOpenPlace: (place: Place) => void;
  onClose?: () => void;
};

/** Read-only itinerary list for view mode and shared boards: stops in route order, grouped by day, with legs. */
const RouteSummaryPanel = ({ places, links, onOpenPlace, onClose }: RouteSummaryPanelProps) => {
  const ordered = orderPlacesByLinks(places, links);
  const hasDays = ordered.some((place) => place.day_number);
  const groups = hasDays ? groupPlacesByDay(ordered) : [{ day: null, places: ordered }];
  const linkInto = (place: Place, previous: Place | undefined) => (
    links.find((link) => link.target_place_id === place.id && (!previous || link.source_place_id === previous.id))
    ?? links.find((link) => link.target_place_id === place.id)
  );

  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-line bg-surface-raised">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-ink-faint">
          <ListOrdered size={14} />
          Route summary
        </p>
        {onClose && (
          <button type="button" onClick={onClose} className="rounded-full p-1 text-ink-faint transition hover:bg-surface-sunken hover:text-ink md:hidden" aria-label="Close summary">
            <X size={16} />
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {ordered.length === 0 && <p className="py-8 text-center text-sm text-ink-muted">No places on this board yet.</p>}
        {groups.map((group) => (
          <section key={group.day ?? 'unscheduled'} className="mb-5">
            {hasDays && (
              <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-ink-muted">
                {group.day ? `Day ${group.day}` : 'Unscheduled'}
              </h3>
            )}
            <ol className="space-y-2">
              {group.places.map((place, index) => {
                const previous = index > 0 ? group.places[index - 1] : ordered[ordered.indexOf(place) - 1];
                const link = linkInto(place, previous);
                const source = link ? places.find((item) => item.id === link.source_place_id) : null;
                const leg = link && source ? describeLeg(source, place, link.transport_mode) : null;
                const transport = link ? getTransportOption(link.transport_mode) : null;
                const TransportIcon = transport?.icon;
                const catalogPlace = getCatalogPlace(place.catalog_id);
                return (
                  <li key={place.id}>
                    {link && source && TransportIcon && (
                      <p className="mb-1 ml-3 inline-flex items-center gap-1.5 text-[11px] text-ink-faint">
                        <TransportIcon size={12} />
                        {transport?.label} from {placeDisplayName(source)}{leg?.duration ? ` · ${leg.duration}` : ''}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenPlace(place)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-2 text-left transition hover:border-mist-700"
                    >
                      <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-sunken">
                        <PlaceImage catalogId={place.catalog_id} fallback={catalogPlace?.image ?? place.photo_url} width={240} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{placeDisplayName(place)}</p>
                        <p className="truncate text-[11px] text-ink-muted">
                          {[formatStartTime(place.start_time), catalogPlace?.city ?? place.address].filter(Boolean).join(' · ')}
                        </p>
                        {place.notes && <p className="mt-0.5 line-clamp-1 text-[11px] italic text-ink-faint">{place.notes}</p>}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </aside>
  );
};

export default RouteSummaryPanel;
