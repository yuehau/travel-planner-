import React, { useEffect, useState } from 'react';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down.mjs';
import MapPin from 'lucide-react/dist/esm/icons/map-pin.mjs';
import Users from 'lucide-react/dist/esm/icons/users.mjs';
import AppNav from '../components/AppNav';
import { useAuth } from '../hooks/useAuth';
import { useTravelDataClient } from '../hooks/useTravelDataClient';
import type { Place, Trip } from '../types/database';
import { formatTripDate } from '../utils/tripStatus';

const GroupTripsPage: React.FC = () => {
  const { isDemoMode } = useAuth();
  const travelData = useTravelDataClient();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [joinedTripIds, setJoinedTripIds] = useState<Set<string>>(new Set());
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);
  const [previewPlaces, setPreviewPlaces] = useState<Record<string, Place[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningTripId, setJoiningTripId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!travelData) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [openTrips, myMemberships] = await Promise.all([
          travelData.listOpenGroupTrips(),
          travelData.listMyGroupMemberships(),
        ]);

        if (!isMounted) return;

        setTrips(openTrips);
        setJoinedTripIds(new Set(myMemberships.map((member) => member.trip_id)));

        const counts = await Promise.all(openTrips.map((trip) => travelData.countGroupTripMembers(trip.id)));
        if (isMounted) {
          const countMap: Record<string, number> = {};
          openTrips.forEach((trip, index) => {
            countMap[trip.id] = counts[index];
          });
          setMemberCounts(countMap);
        }
      } catch (loadError) {
        if (isMounted) setError(loadError instanceof Error ? loadError.message : 'Could not load group trips.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [travelData]);

  const togglePreview = async (tripId: string) => {
    if (expandedTripId === tripId) {
      setExpandedTripId(null);
      return;
    }

    setExpandedTripId(tripId);

    if (!previewPlaces[tripId] && travelData) {
      try {
        const places = await travelData.previewTripPlaces(tripId);
        setPreviewPlaces((current) => ({ ...current, [tripId]: places }));
      } catch {
        // Preview is best-effort - leave the list empty on failure.
      }
    }
  };

  const handleJoin = async (trip: Trip) => {
    if (!travelData) return;

    setJoiningTripId(trip.id);
    setError(null);

    try {
      await travelData.joinGroupTrip(trip.id);
      setJoinedTripIds((current) => new Set(current).add(trip.id));
      setMemberCounts((current) => ({ ...current, [trip.id]: (current[trip.id] ?? 0) + 1 }));
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : 'Could not join this trip.');
    } finally {
      setJoiningTripId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-stone-900 dark:text-stone-100 transition-colors duration-300">
      <AppNav />

      <main className="max-w-5xl mx-auto px-6 py-10 pb-24">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold tracking-tighter mb-2">Group Trips</h1>
          <p className="text-stone-500 dark:text-stone-400 font-light">
            Browse trips other travelers have opened up, and join one if their plan looks good.
          </p>
        </div>

        {isDemoMode && (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Sign in to browse and join real group trips - demo mode has nobody else's trips to show.
          </div>
        )}

        {error && <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {isLoading ? (
          <div className="py-12 text-center text-stone-500 dark:text-stone-400">Loading group trips...</div>
        ) : trips.length === 0 ? (
          <div className="py-12 text-center text-stone-500 dark:text-stone-400">
            No open group trips yet. Open one of your own trips to a group from its Group Trip tab.
          </div>
        ) : (
          <div className="space-y-4">
            {trips.map((trip) => {
              const joined = joinedTripIds.has(trip.id);
              const count = memberCounts[trip.id] ?? 0;
              const total = 1 + count;
              const isFull = trip.group_capacity != null && total >= trip.group_capacity;
              const isExpanded = expandedTripId === trip.id;

              return (
                <article key={trip.id} className="rounded-2xl border border-stone-200 dark:border-stone-800 p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-1">{trip.destination}</h3>
                      <p className="text-sm text-stone-500 dark:text-stone-400 mb-2">
                        {formatTripDate(trip.start_date)} - {formatTripDate(trip.end_date)}
                      </p>
                      {trip.description && <p className="text-sm text-stone-500 dark:text-stone-400">{trip.description}</p>}
                    </div>

                    <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                      <span className="flex items-center gap-1 text-sm font-medium">
                        <Users size={14} />
                        {total}
                        {trip.group_capacity ? ` / ${trip.group_capacity}` : ''} joined
                      </span>
                      <button
                        type="button"
                        disabled={joined || isFull || joiningTripId === trip.id || !travelData || travelData.isReadOnly}
                        onClick={() => handleJoin(trip)}
                        className="px-5 py-2 rounded-full text-sm font-medium bg-coral-500 text-white hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {joined ? 'Joined ✓' : isFull ? 'Full' : joiningTripId === trip.id ? 'Joining...' : 'Join'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => togglePreview(trip.id)}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                  >
                    <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    {isExpanded ? 'Hide the list of places' : 'Preview the list of places'}
                  </button>

                  {isExpanded && (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {(previewPlaces[trip.id] ?? []).length === 0 ? (
                        <p className="text-sm text-stone-500 dark:text-stone-400">No places saved to this trip yet.</p>
                      ) : (
                        (previewPlaces[trip.id] ?? []).map((place) => (
                          <div key={place.id} className="flex items-center gap-2 rounded-xl bg-stone-50 dark:bg-stone-900 px-3 py-2 text-sm">
                            <MapPin size={14} className="shrink-0 text-stone-400" />
                            <span className="truncate">{place.name}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default GroupTripsPage;
