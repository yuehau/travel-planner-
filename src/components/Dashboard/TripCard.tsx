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

const TripCard: React.FC<TripCardProps> = ({ id, destination, startDate, endDate, image, status }) => {
  return (
    <Link
      to={`/trip/${id}`}
      className="group relative block overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all duration-300"
    >
      {/* Card Image/Placeholder */}
      <div className="aspect-[4/3] overflow-hidden bg-zinc-200 dark:bg-zinc-800 relative">
        {image ? (
          <img src={image} alt={destination} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-600">
            <MapPin size={40} strokeWidth={1} />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
            status === 'upcoming'
              ? 'bg-white/90 text-zinc-900 backdrop-blur-sm'
              : status === 'active'
                ? 'bg-green-500/90 text-white backdrop-blur-sm'
              : 'bg-zinc-500/50 text-white backdrop-blur-sm'
          }`}>
            {status}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5">
        <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {destination}
        </h3>
        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 font-light">
          <Calendar size={14} />
          <span>{startDate} — {endDate}</span>
        </div>
      </div>
    </Link>
  );
};

export default TripCard;
