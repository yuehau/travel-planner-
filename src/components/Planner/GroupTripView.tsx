import { useEffect, useState, type FormEvent } from 'react';
import Users from 'lucide-react/dist/esm/icons/users.mjs';
import X from 'lucide-react/dist/esm/icons/x.mjs';
import type { Trip, TripMember } from '../../types/database';
import type { TravelDataClient } from '../../services/travelData';

type GroupTripViewProps = {
  tripId: string;
  travelData: TravelDataClient;
  trip: Trip;
};

const GroupTripView = ({ tripId, travelData, trip }: GroupTripViewProps) => {
  const [members, setMembers] = useState<TripMember[]>([]);
  const [groupOpen, setGroupOpen] = useState(trip.group_open);
  const [capacity, setCapacity] = useState(trip.group_capacity ? String(trip.group_capacity) : '4');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadMembers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const loadedMembers = await travelData.listTripMembers(tripId);
        if (isMounted) setMembers(loadedMembers);
      } catch (loadError) {
        if (isMounted) setError(loadError instanceof Error ? loadError.message : 'Could not load the group.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadMembers();

    return () => {
      isMounted = false;
    };
  }, [travelData, tripId]);

  const acceptedMembers = members.filter((member) => member.status === 'accepted');
  const joinedCount = 1 + acceptedMembers.length;

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSavedMessage('');

    try {
      await travelData.updateTripGroupSettings(tripId, {
        group_open: groupOpen,
        group_capacity: groupOpen ? Number(capacity) : null,
      });
      setSavedMessage(groupOpen ? 'This trip is now open for others to join.' : 'This trip is now private again.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save group settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    setError(null);

    try {
      await travelData.removeTripMember(memberId);
      setMembers((current) => current.filter((member) => member.id !== memberId));
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Could not remove this person.');
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tighter">Group Trip</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Open this trip's list of places for others to browse and join - instead of inviting people one by one.
          </p>
        </div>
        <Users size={22} className="text-zinc-400" />
      </div>

      {error && <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {savedMessage && <div className="mb-6 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">{savedMessage}</div>}

      <form onSubmit={handleSave} className="mb-10 grid gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <label className="flex items-center justify-between gap-4 text-sm font-medium">
          Open this trip to a group
          <input
            type="checkbox"
            disabled={isSaving || travelData.isReadOnly}
            checked={groupOpen}
            onChange={(event) => setGroupOpen(event.target.checked)}
            className="h-5 w-5 accent-zinc-900 dark:accent-zinc-100"
          />
        </label>

        {groupOpen && (
          <label className="grid gap-1 text-sm font-medium max-w-xs">
            How many people total (including you)?
            <input
              required
              type="number"
              min={joinedCount}
              disabled={isSaving || travelData.isReadOnly}
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 outline-none ring-zinc-900 focus:ring-2 dark:border-zinc-800 dark:bg-[#0a0a0a] dark:ring-zinc-100"
            />
          </label>
        )}

        {travelData.isReadOnly && (
          <p className="text-sm text-amber-700 dark:text-amber-500">Demo mode is read-only. Sign in to open this trip to a group.</p>
        )}

        <button
          type="submit"
          disabled={isSaving || travelData.isReadOnly}
          className="w-fit px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </form>

      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">
        {groupOpen ? `${joinedCount}${capacity ? ` / ${capacity}` : ''} in this group` : 'Group members'}
      </h3>

      {isLoading ? (
        <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">Loading group...</div>
      ) : acceptedMembers.length === 0 ? (
        <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">Nobody has joined yet.</div>
      ) : (
        <div className="space-y-3">
          {acceptedMembers.map((member) => (
            <article
              key={member.id}
              className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div>
                <p className="font-medium">{member.invited_email ?? 'A fellow traveler'}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Joined the group</p>
              </div>
              {!travelData.isReadOnly && (
                <button
                  type="button"
                  onClick={() => handleRemove(member.id)}
                  aria-label="Remove from group"
                  className="p-1 text-zinc-300 dark:text-zinc-700 hover:text-red-500 transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupTripView;
