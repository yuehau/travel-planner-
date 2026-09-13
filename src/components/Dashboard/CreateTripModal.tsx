import React, { useState } from 'react';
import X from 'lucide-react/dist/esm/icons/x.mjs';
import type { TripCreateInput } from '../../services/travelData';
import { catalogRegions, regionCoverImage } from '../../data/catalog';

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (trip: TripCreateInput) => Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
  initialRegion?: string;
  initialDestination?: string;
  initialTrip?: TripCreateInput;
  title?: string;
  submitLabel?: string;
  submittingLabel?: string;
}

const inputClass = 'w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-ink outline-none transition-all placeholder:text-ink-faint focus:border-primary focus:ring-2 focus:ring-primary/30';
const labelClass = 'mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-muted';

const CreateTripModal: React.FC<CreateTripModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  isSubmitting = false,
  error = null,
  initialRegion = '',
  initialDestination = '',
  initialTrip,
  title = 'New Trip',
  submitLabel = 'Create Trip',
  submittingLabel = 'Creating...',
}) => {
  const [formData, setFormData] = useState({
    destination: initialTrip?.destination ?? initialDestination,
    region: initialTrip?.region ?? initialRegion ?? '',
    startDate: initialTrip?.start_date ?? '',
    endDate: initialTrip?.end_date ?? '',
    description: initialTrip?.description ?? '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await onCreate({
      destination: formData.destination,
      region: formData.region || null,
      cover_image: formData.region ? regionCoverImage(formData.region) : null,
      start_date: formData.startDate,
      end_date: formData.endDate,
      description: formData.description,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-mist-950/50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-line bg-surface-raised shadow-2xl shadow-mist-950/30 animate-rise-in">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="rounded-xl border border-mist-500 bg-mist-100 px-4 py-3 text-sm text-danger dark:bg-mist-950/40 dark:text-mist-200">
              {error}
            </div>
          )}

          <div>
            <label className={labelClass} htmlFor="trip-name">Trip name</label>
            <input
              id="trip-name"
              required
              type="text"
              placeholder="e.g. Penang long weekend"
              disabled={isSubmitting}
              className={inputClass}
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="trip-region">Region</label>
            <select
              id="trip-region"
              disabled={isSubmitting}
              className={inputClass}
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            >
              <option value="">Anywhere in Malaysia</option>
              {catalogRegions.map((region) => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="trip-start">Start date</label>
              <input
                id="trip-start"
                required
                type="date"
                disabled={isSubmitting}
                className={inputClass}
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="trip-end">End date</label>
              <input
                id="trip-end"
                required
                type="date"
                disabled={isSubmitting}
                min={formData.startDate}
                className={inputClass}
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="trip-description">Description (optional)</label>
            <textarea
              id="trip-description"
              rows={3}
              placeholder="What's the vibe of this trip?"
              disabled={isSubmitting}
              className={`${inputClass} resize-none`}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full rounded-xl bg-primary py-3 font-semibold text-on-primary transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? submittingLabel : submitLabel}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateTripModal;
