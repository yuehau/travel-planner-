import { useEffect, useState, type FormEvent } from 'react';
import MailPlus from 'lucide-react/dist/esm/icons/mail-plus.mjs';
import Users from 'lucide-react/dist/esm/icons/users.mjs';
import type { TripMember } from '../../types/database';
import type { TravelDataClient } from '../../services/travelData';

type SharingViewProps = {
  tripId: string;
  travelData: TravelDataClient;
};

const SharingView = ({ tripId, travelData }: SharingViewProps) => {
  const [members, setMembers] = useState<TripMember[]>([]);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadMembers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const loadedMembers = await travelData.listTripMembers(tripId);
        if (isMounted) setMembers(loadedMembers);
      } catch (loadError) {
        if (isMounted) setError(loadError instanceof Error ? loadError.message : 'Could not load members.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadMembers();

    return () => {
      isMounted = false;
    };
  }, [travelData, tripId]);

  const handleInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsInviting(true);
    setError(null);

    try {
      const member = await travelData.inviteTripMember(tripId, { invited_email: email });
      setMembers((currentMembers) => [...currentMembers, member]);
      setEmail('');
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : 'Could not invite member.');
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tighter">Sharing</h2>
          <p className="mt-1 text-sm text-sand-500 dark:text-sand-400">Invite collaborators to plan this trip with you.</p>
        </div>
        <Users size={22} className="text-sand-400" />
      </div>

      {error && <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleInvite} className="mb-10 flex flex-col gap-3 sm:flex-row">
        <input
          required
          disabled={isInviting || travelData.isReadOnly}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={travelData.isReadOnly ? 'Demo mode is read-only' : 'friend@example.com'}
          className="flex-1 rounded-xl border border-sand-200 bg-transparent px-4 py-2 outline-none ring-clay-500 focus:ring-2 dark:border-sand-800 dark:ring-clay-400"
        />
        <button
          type="submit"
          disabled={isInviting || travelData.isReadOnly}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-clay-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-clay-500 dark:text-white"
        >
          <MailPlus size={16} />
          Invite
        </button>
      </form>

      {isLoading ? (
        <div className="py-12 text-center text-sand-500 dark:text-sand-400">Loading members...</div>
      ) : members.length === 0 ? (
        <div className="py-12 text-center text-sand-500 dark:text-sand-400">No members yet.</div>
      ) : (
        <div className="space-y-3">
          {members.map((member) => (
            <article key={member.id} className="flex items-center justify-between rounded-2xl border border-sand-200 bg-sand-50 p-4 dark:border-sand-800 dark:bg-sand-900">
              <div>
                <p className="font-medium">{member.invited_email}</p>
                <p className="text-sm text-sand-500 dark:text-sand-400">{member.role}</p>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-sand-400 dark:text-sand-600">{member.status}</span>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default SharingView;
