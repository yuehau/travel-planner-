import { useEffect, useRef, useState, type FormEvent } from 'react';
import Camera from 'lucide-react/dist/esm/icons/camera.mjs';
import Heart from 'lucide-react/dist/esm/icons/heart.mjs';
import LayoutGrid from 'lucide-react/dist/esm/icons/layout-grid.mjs';
import CircleCheck from 'lucide-react/dist/esm/icons/circle-check.mjs';
import AppNav from '../components/AppNav';
import { useAuth } from '../hooks/useAuth';
import { useTravelDataClient } from '../hooks/useTravelDataClient';
import type { Gender } from '../types/database';

const genderOptions: Array<{ value: Gender; label: string }> = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  { value: 'self_describe', label: 'Self-describe' },
];

const inputClass = 'w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-ink outline-none transition-all placeholder:text-ink-faint focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-60';
const labelClass = 'mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-muted';

/** Resizes an uploaded image to a small square data URL so it can live in the profile row. */
const resizeAvatar = (file: File, size = 256) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Could not read that image.'));
  reader.onload = () => {
    const image = new Image();
    image.onerror = () => reject(new Error('Could not read that image.'));
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Could not process that image.'));
        return;
      }
      const side = Math.min(image.width, image.height);
      const sx = (image.width - side) / 2;
      const sy = (image.height - side) / 2;
      context.drawImage(image, sx, sy, side, side, 0, 0, size, size);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    image.src = String(reader.result);
  };
  reader.readAsDataURL(file);
});

const ProfilePage = () => {
  const { profile, user, updateProfile, isDemoMode } = useAuth();
  const travelData = useTravelDataClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    gender: (profile?.gender ?? '') as Gender | '',
    gender_detail: profile?.gender_detail ?? '',
    birth_date: profile?.birth_date ?? '',
    home_city: profile?.home_city ?? '',
    country: profile?.country ?? 'Malaysia',
    bio: profile?.bio ?? '',
    avatar_url: profile?.avatar_url ?? null as string | null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ boards: number; complete: number; likes: number } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!travelData) return;
      try {
        const [trips, posts] = await Promise.all([travelData.listTrips(), travelData.listNewsPosts()]);
        if (isMounted) {
          setStats({
            boards: trips.length,
            complete: trips.filter((trip) => trip.status === 'complete').length,
            likes: posts.filter((post) => post.liked).length,
          });
        }
      } catch {
        // Stats are decorative; ignore failures.
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [travelData]);

  const handleAvatar = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await resizeAvatar(file);
      if (dataUrl.length > 200_000) throw new Error('That image is too large after resizing. Try a smaller one.');
      setForm((current) => ({ ...current, avatar_url: dataUrl }));
    } catch (avatarError) {
      setError(avatarError instanceof Error ? avatarError.message : 'Could not use that image.');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);
    try {
      await updateProfile({
        full_name: form.full_name.trim() || undefined,
        gender: form.gender || null,
        gender_detail: form.gender === 'self_describe' ? form.gender_detail : null,
        birth_date: form.birth_date || null,
        home_city: form.home_city || null,
        country: form.country.trim() || 'Malaysia',
        bio: form.bio || null,
        avatar_url: form.avatar_url,
      });
      setMessage('Profile saved.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const initial = (form.full_name || profile?.full_name || 'T').trim().charAt(0).toUpperCase();
  const email = profile?.email ?? user?.email ?? '';

  return (
    <div className="min-h-screen bg-surface text-ink transition-colors duration-300">
      <AppNav />

      <main className="mx-auto max-w-4xl px-6 py-8 pb-24">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold tracking-tight">Your profile</h1>
          <p className="text-ink-muted">
            {isDemoMode ? 'Changes stay in this browser while you explore the demo.' : 'Shown on the plans and stories you share.'}
          </p>
        </div>

        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          {([
            ['Boards', stats?.boards ?? '–', LayoutGrid],
            ['Complete plans', stats?.complete ?? '–', CircleCheck],
            ['Stories liked', stats?.likes ?? '–', Heart],
          ] as const).map(([label, value, Icon]) => (
            <div key={label} className="rounded-2xl border border-line bg-surface-raised p-5">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink-faint"><Icon size={14} />{label}</p>
              <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
            </div>
          ))}
        </section>

        <form onSubmit={handleSubmit} className="grid gap-8 rounded-3xl border border-line bg-surface-raised p-6 md:grid-cols-[220px_1fr] md:p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative h-36 w-36 overflow-hidden rounded-full bg-gradient-to-br from-mist-600 to-mist-800 text-5xl font-bold text-on-accent shadow-lg shadow-mist-950/20">
              {form.avatar_url ? (
                <img src={form.avatar_url} alt="Your avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center">{initial}</span>
              )}
            </div>
            <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => handleAvatar(event.target.files?.[0])} />
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => fileInput.current?.click()} className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:border-mist-700">
                <Camera size={15} />
                Upload photo
              </button>
              {form.avatar_url && (
                <button type="button" onClick={() => setForm({ ...form, avatar_url: null })} className="rounded-full px-3 py-2 text-sm text-ink-muted hover:text-danger">Remove</button>
              )}
            </div>
            <p className="text-xs text-ink-faint">Square crop, resized to 256 px.</p>
          </div>

          <div className="space-y-5">
            {error && <div className="rounded-xl border border-mist-500 bg-mist-100 px-4 py-3 text-sm text-danger dark:bg-mist-950/40 dark:text-mist-200">{error}</div>}
            {message && <div className="rounded-xl border border-mist-600 bg-mist-200 px-4 py-3 text-sm text-ink dark:bg-mist-900/30 dark:text-mist-100">{message}</div>}

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="profile-name">Display name</label>
                <input id="profile-name" required className={inputClass} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} disabled={isSaving} maxLength={80} />
              </div>
              <div>
                <label className={labelClass} htmlFor="profile-email">Email</label>
                <input id="profile-email" className={inputClass} value={email} readOnly disabled />
              </div>
              <div>
                <label className={labelClass} htmlFor="profile-gender">Gender</label>
                <select id="profile-gender" className={inputClass} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as Gender | '' })} disabled={isSaving}>
                  <option value="">Not set</option>
                  {genderOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              {form.gender === 'self_describe' ? (
                <div>
                  <label className={labelClass} htmlFor="profile-gender-detail">In your words</label>
                  <input id="profile-gender-detail" className={inputClass} value={form.gender_detail} onChange={(e) => setForm({ ...form, gender_detail: e.target.value })} disabled={isSaving} maxLength={40} />
                </div>
              ) : (
                <div>
                  <label className={labelClass} htmlFor="profile-birth">Date of birth</label>
                  <input id="profile-birth" type="date" className={inputClass} value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} disabled={isSaving} />
                </div>
              )}
              {form.gender === 'self_describe' && (
                <div>
                  <label className={labelClass} htmlFor="profile-birth">Date of birth</label>
                  <input id="profile-birth" type="date" className={inputClass} value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} disabled={isSaving} />
                </div>
              )}
              <div>
                <label className={labelClass} htmlFor="profile-city">Home city</label>
                <input id="profile-city" className={inputClass} placeholder="e.g. Petaling Jaya" value={form.home_city} onChange={(e) => setForm({ ...form, home_city: e.target.value })} disabled={isSaving} maxLength={80} />
              </div>
              <div>
                <label className={labelClass} htmlFor="profile-country">Country</label>
                <input id="profile-country" className={inputClass} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} disabled={isSaving} maxLength={60} />
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="profile-bio">Short bio</label>
              <textarea id="profile-bio" rows={3} className={`${inputClass} resize-none`} placeholder="Slow mornings, street food, one museum per trip." value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} disabled={isSaving} maxLength={280} />
              <p className="mt-1 text-right text-xs text-ink-faint">{form.bio.length}/280</p>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={isSaving} className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-on-primary transition hover:bg-primary-hover disabled:opacity-50">
                {isSaving ? 'Saving…' : 'Save profile'}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default ProfilePage;
