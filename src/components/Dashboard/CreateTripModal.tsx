import React, { useState } from 'react';
import X from 'lucide-react/dist/esm/icons/x.mjs';
import type { TripCreateInput } from '../../services/travelData';

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (trip: TripCreateInput) => Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
  isReadOnly?: boolean;
  initialDestination?: string;
}

const CreateTripModal: React.FC<CreateTripModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  isSubmitting = false,
  error = null,
  isReadOnly = false,
  initialDestination = '',
}) => {
  const [formData, setFormData] = useState({
    destination: initialDestination,
    startDate: '',
    endDate: '',
    description: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await onCreate({
      destination: formData.destination,
      start_date: formData.startDate,
      end_date: formData.endDate,
      description: formData.description,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-semibold">New Adventure</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {isReadOnly && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Demo mode is read-only. Sign in to create and save trips.
            </div>
          )}

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Destination</label>
            <input
              required
              type="text"
              placeholder="e.g. Tokyo, Japan"
              disabled={isSubmitting || isReadOnly}
              className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent focus:ring-2 ring-zinc-900 dark:ring-zinc-100 outline-none transition-all"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Start Date</label>
              <input
                required
                type="date"
                disabled={isSubmitting || isReadOnly}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent focus:ring-2 ring-zinc-900 dark:ring-zinc-100 outline-none transition-all"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">End Date</label>
              <input
                required
                type="date"
                disabled={isSubmitting || isReadOnly}
                min={formData.startDate}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent focus:ring-2 ring-zinc-900 dark:ring-zinc-100 outline-none transition-all"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Description (Optional)</label>
            <textarea
              rows={3}
              placeholder="What's the vibe of this trip?"
              disabled={isSubmitting || isReadOnly}
              className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent focus:ring-2 ring-zinc-900 dark:ring-zinc-100 outline-none transition-all resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isReadOnly}
            className="w-full py-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold hover:opacity-90 transition-opacity mt-4 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Trip'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateTripModal;
