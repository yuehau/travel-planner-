import { memo } from 'react';
import { Handle, NodeToolbar, Position, type NodeProps } from '@xyflow/react';
import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days.mjs';
import Copy from 'lucide-react/dist/esm/icons/copy.mjs';
import MapPin from 'lucide-react/dist/esm/icons/map-pin.mjs';
import Pencil from 'lucide-react/dist/esm/icons/pencil.mjs';
import Star from 'lucide-react/dist/esm/icons/star.mjs';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2.mjs';
import { categoryLabels, getCatalogPlace } from '../../data/catalog';
import type { PlaceNode as PlaceNodeType } from '../../utils/boardGraph';
import { formatStartTime, placeDisplayName } from '../../utils/boardGraph';
import PlaceImage from '../PlaceImage';
import { useBoardActions } from './boardContext';

const handleClass = '!h-3.5 !w-3.5 !rounded-full !border-2 !border-surface-raised !bg-primary';
const toolbarButtonClass = 'inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold transition';

const PlaceNode = ({ data, selected }: NodeProps<PlaceNodeType>) => {
  const { openPlace, editPlace, duplicatePlace, removePlace, readOnly, dayFilter } = useBoardActions();
  const { place } = data;
  const catalogPlace = getCatalogPlace(place.catalog_id);
  const illustration = catalogPlace?.image ?? place.photo_url;
  const rating = catalogPlace?.rating ?? place.rating;
  const isDimmed = dayFilter !== null && place.day_number !== dayFilter;
  const schedule = [place.day_number ? `Day ${place.day_number}` : null, formatStartTime(place.start_time)].filter(Boolean).join(' · ');

  return (
    <div
      className={`w-60 overflow-hidden rounded-2xl border bg-surface-raised text-ink shadow-lg shadow-mist-950/10 transition-[opacity,box-shadow] ${
        selected ? 'border-primary ring-2 ring-primary/40' : 'border-line hover:border-mist-700'
      } ${isDimmed ? 'opacity-35' : ''}`}
    >
      {!readOnly && (
        <NodeToolbar isVisible={selected} position={Position.Top} offset={10} className="nodrag nopan">
          <div className="flex items-center gap-1 rounded-full border border-line bg-surface-raised p-1 shadow-xl shadow-mist-950/20 animate-rise-in">
            <button type="button" onClick={() => editPlace(place)} className={`${toolbarButtonClass} text-ink hover:bg-surface-sunken`}>
              <Pencil size={13} />
              Edit
            </button>
            <button type="button" onClick={() => duplicatePlace(place)} className={`${toolbarButtonClass} text-ink hover:bg-surface-sunken`}>
              <Copy size={13} />
              Duplicate
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Remove ${placeDisplayName(place)} from this board?`)) removePlace(place);
              }}
              className={`${toolbarButtonClass} text-danger hover:bg-mist-100 dark:hover:bg-mist-950/40`}
            >
              <Trash2 size={13} />
              Delete
            </button>
          </div>
        </NodeToolbar>
      )}
      <Handle type="target" position={Position.Left} className={handleClass} isConnectable={!readOnly} />
      <button
        type="button"
        onClick={() => openPlace(place)}
        className="group relative block aspect-[16/9] w-full overflow-hidden bg-surface-sunken"
        aria-label={`Open details for ${placeDisplayName(place)}`}
      >
        {illustration || place.catalog_id ? (
          <PlaceImage
            catalogId={place.catalog_id}
            fallback={illustration}
            width={480}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            draggable={false}
          />
        ) : (
          <span className="flex h-full items-center justify-center text-ink-faint"><MapPin size={28} /></span>
        )}
        {schedule && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-mist-950/75 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-mist-50">
            <CalendarDays size={11} />
            {schedule}
          </span>
        )}
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-mist-950/60 to-transparent px-3 pb-2 pt-6 text-left text-[10px] font-semibold uppercase tracking-widest text-mist-50 opacity-0 transition-opacity group-hover:opacity-100">
          View details
        </span>
      </button>
      <div className="px-3.5 py-3">
        <h3 className="truncate text-sm font-semibold" title={placeDisplayName(place)}>{placeDisplayName(place)}</h3>
        {place.label && <p className="truncate text-[11px] text-ink-faint">{place.name}</p>}
        <p className="mt-1 flex items-center gap-2 text-[11px] text-ink-muted">
          {catalogPlace ? (
            <span className="rounded-full bg-surface-sunken px-2 py-0.5 font-semibold text-ink">{categoryLabels[catalogPlace.category]}</span>
          ) : (
            <span className="rounded-full bg-surface-sunken px-2 py-0.5 font-semibold text-ink">Custom</span>
          )}
          <span className="truncate">{catalogPlace?.city ?? place.address ?? ''}</span>
          {rating !== null && rating !== undefined && (
            <span className="ml-auto inline-flex shrink-0 items-center gap-0.5 font-semibold text-ink">
              <Star size={11} className="fill-accent text-accent" />
              {rating.toFixed(1)}
            </span>
          )}
        </p>
        {place.notes && <p className="mt-2 line-clamp-2 text-[11px] italic leading-4 text-ink-muted">{place.notes}</p>}
      </div>
      <Handle type="source" position={Position.Right} className={handleClass} isConnectable={!readOnly} />
    </div>
  );
};

export default memo(PlaceNode);
