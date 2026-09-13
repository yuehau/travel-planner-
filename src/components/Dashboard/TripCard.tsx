import React from 'react';
import { Link } from 'react-router-dom';
import Calendar from 'lucide-react/dist/esm/icons/calendar.mjs';
import MapPin from 'lucide-react/dist/esm/icons/map-pin.mjs';
import type { TripStatus } from '../../utils/tripStatus';

interface TripCardProps {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  image?: string;
  status: TripStatus;
}

const statusBadgeClass: Record<TripStatus, string> = {
  upcoming: 'bg-white/90 text-clay-700 backdrop-blur-sm',
  active: 'bg-lagoon-500/95 text-white backdrop-blur-sm',
  past: 'bg-sand-800/60 text-sand-100 backdrop-blur-sm',
};

const TripCard: React.FC<TripCardProps> = ({ id, destination, startDate, endDate, image, status }) => {
  return (
    <Link
      to={`/trip/${id}`}
      className="group relative block overflow-hidden rounded-3xl border border-sand-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-clay-300 hover:shadow-xl hover:shadow-clay-900/5 dark:border-sand-800 dark:bg-sand-900 dark:hover:border-clay-700 dark:hover:shadow-black/30"
    >
      {/* Card Image/Placeholder */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-sand-100 via-clay-50 to-lagoon-50 dark:from-sand-800 dark:via-sand-900 dark:to-lagoon-900/40">
        {image ? (
          <img src={image} alt={destination} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-clay-300 transition-transform duration-500 group-hover:scale-110 dark:text-clay-700">
            <MapPin size={40} strokeWidth={1.25} />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${statusBadgeClass[status]}`}>
            {status}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5">
        <h3 className="mb-2 text-lg font-semibold tracking-tight transition-colors group-hover:text-clay-600 dark:group-hover:text-clay-300">
          {destination}
        </h3>
        <div className="flex items-center gap-2 text-sm font-light text-sand-500 dark:text-sand-400">
          <Calendar size={14} />
          <span>{startDate} — {endDate}</span>
        </div>
      </div>
    </Link>
  );
};

export default TripCard;
