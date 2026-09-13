import React from 'react';
import Calendar from 'lucide-react/dist/esm/icons/calendar.mjs';
import CircleCheck from 'lucide-react/dist/esm/icons/circle-check.mjs';
import MapPin from 'lucide-react/dist/esm/icons/map-pin.mjs';
import type { TripStatus } from '../../utils/tripStatus';
import { regionCoverImage } from '../../data/catalog';
import LoadingLink from '../LoadingLink';

interface TripCardProps {
  id: string;
  destination: string;
  region: string | null;
  coverImage: string | null;
  startDate: string;
  endDate: string;
  status: TripStatus;
  isComplete?: boolean;
}

const statusClass: Record<TripStatus, string> = {
  upcoming: 'bg-surface-raised/90 text-ink',
  active: 'bg-positive text-mist-950',
  past: 'bg-mist-950/50 text-mist-50',
};

const TripCard: React.FC<TripCardProps> = ({ id, destination, region, coverImage, startDate, endDate, status, isComplete = false }) => {
  const image = coverImage ?? regionCoverImage(region);

  return (
    <LoadingLink
      to={`/trip/${id}`}
      className="group relative block overflow-hidden rounded-3xl border border-line bg-surface-raised shadow-sm shadow-mist-950/5 transition-all duration-300 hover:-translate-y-1 hover:border-mist-700 hover:shadow-xl hover:shadow-mist-950/10"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-sunken">
        <img src={image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute right-3 top-3 flex gap-1.5">
          {isComplete && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-on-primary backdrop-blur-sm">
              <CircleCheck size={11} />
              Complete
            </span>
          )}
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm ${statusClass[status]}`}>
            {status}
          </span>
        </div>
      </div>

      <div className="p-5">
        <h3 className="mb-2 text-lg font-semibold tracking-tight transition-colors group-hover:text-primary">
          {destination}
        </h3>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
          {region && (
            <span className="flex items-center gap-1.5">
              <MapPin size={14} />
              {region}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar size={14} />
            {startDate} — {endDate}
          </span>
        </div>
      </div>
    </LoadingLink>
  );
};

export default TripCard;
