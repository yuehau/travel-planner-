import { useState, type FormEvent } from 'react';
import X from 'lucide-react/dist/esm/icons/x.mjs';
import type { PlaceUpdateInput } from '../../services/travelData';
import type { Place } from '../../types/database';

type PlaceEditDialogProps = {
  place: Place | null;
  dayCount: number;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (placeId: string, input: PlaceUpdateInput) => Promise<unknown>;
};

const inputClass = 'w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-ink outline-none transition-all placeholder:text-ink-faint focus:border-primary focus:ring-2 focus:ring-primary/30';
const labelClass = 'mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-muted';

/** Edits the board-specific details of a card: custom label, note, planned day and time (and name/address for custom places). */
const PlaceEditDialog = ({ place, dayCount, isSaving = false, onClose, onSave }: PlaceEditDialogProps) => {
  const [form, setForm] = useState(() => ({
    name: place?.name ?? '',
    address: place?.address ?? '',
    label: place?.label ?? '',
    notes: place?.notes ?? '',
    day: place?.day_number ? String(place.day_number) : '',
    time: place?.start_time ?? '',
  }));

  if (!place) return null;

  const isCustom = place.source === 'custom' || !place.catalog_id;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSave(place.id, {
      ...(isCustom ? { name: form.name, address: form.address } : {}),
      label: form.label,
      notes: form.notes,
      day_number: form.day ? Number(form.day) : null,
      start_time: form.time || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-mist-950/50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-line bg-surface-raised shadow-2xl shadow-mist-950/30 animate-rise-in">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Edit card</h2>
            <p className="text-xs text-ink-muted">{place.name}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {isCustom && (
            <>
              <div>
                <label className={labelClass} htmlFor="place-name">Place name</label>
                <input id="place-name" required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={isSaving} />
              </div>
              <div>
                <label className={labelClass} htmlFor="place-address">Address</label>
                <input id="place-address" className={inputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} disabled={isSaving} />
              </div>
            </>
          )}
          <div>
            <label className={labelClass} htmlFor="place-label">Custom label (optional)</label>
            <input id="place-label" className={inputClass} placeholder="e.g. Sunrise breakfast" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} disabled={isSaving} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="place-day">Day</label>
              <select id="place-day" className={inputClass} value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} disabled={isSaving}>
                <option value="">Unscheduled</option>
                {Array.from({ length: dayCount }, (_, index) => index + 1).map((day) => (
                  <option key={day} value={day}>Day {day}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="place-time">Start time</label>
              <input id="place-time" type="time" className={inputClass} value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} disabled={isSaving} />
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="place-notes">Your note</label>
            <textarea id="place-notes" rows={3} className={`${inputClass} resize-none`} placeholder="Tickets, tips, who to meet…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} disabled={isSaving} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink-muted transition hover:text-ink">Cancel</button>
            <button type="submit" disabled={isSaving} className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-on-primary transition hover:bg-primary-hover disabled:opacity-50">
              {isSaving ? 'Saving…' : 'Save card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlaceEditDialog;
