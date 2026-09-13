import { NavLink } from 'react-router-dom';
import LogOut from 'lucide-react/dist/esm/icons/log-out.mjs';
import Bookmark from 'lucide-react/dist/esm/icons/bookmark.mjs';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase.mjs';
import Newspaper from 'lucide-react/dist/esm/icons/newspaper.mjs';
import BrandMark from './BrandMark';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../hooks/useAuth';
import LoadingLink from './LoadingLink';
import { usePageTransition } from '../hooks/usePageTransition';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors sm:flex-none ${
    isActive
      ? 'bg-primary text-on-primary shadow-md shadow-mist-950/15'
      : 'text-ink-muted hover:bg-surface-raised hover:text-ink'
  }`;

const ProfileAvatar = ({ name, avatarUrl }: { name: string | null; avatarUrl: string | null }) => (
  <NavLink
    to="/profile"
    className={({ isActive }) => `flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-mist-600 to-mist-800 text-sm font-bold text-on-accent transition ${
      isActive ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface' : 'hover:ring-2 hover:ring-mist-600'
    }`}
    aria-label="Your profile"
    title={name ?? 'Traveler'}
  >
    {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : (name ?? 'T').trim().charAt(0).toUpperCase()}
  </NavLink>
);

const AppNav = () => {
  const { signOut, profile, isDemoMode } = useAuth();
  const { startPageTransition } = usePageTransition();

  return (
    <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
      <div className="flex min-w-0 items-center gap-3">
        <LoadingLink to="/" className="group flex shrink-0 items-center gap-2 text-xl font-semibold tracking-tight">
          <BrandMark size="sm" interactive />
          <span>TravelPlanner</span>
        </LoadingLink>
        {isDemoMode && (
          <span className="rounded-full bg-mist-300 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-mist-950 dark:bg-mist-900/50 dark:text-mist-100">
            Demo
          </span>
        )}
      </div>

      <div className="order-3 flex w-full items-center justify-center gap-1 rounded-full border border-line bg-surface-sunken p-1 sm:order-none sm:w-auto">
        <NavLink to="/dashboard" className={navLinkClass} onClick={startPageTransition}>
          <Briefcase size={16} />
          <span>My Trips</span>
        </NavLink>
        <NavLink to="/news" className={navLinkClass} onClick={startPageTransition}>
          <Newspaper size={16} />
          <span>News</span>
        </NavLink>
        <NavLink to="/collections" className={navLinkClass} onClick={startPageTransition}>
          <Bookmark size={16} />
          <span>Collections</span>
        </NavLink>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle variant="circle" />
        <button
          type="button"
          onClick={signOut}
          className="rounded-full p-2 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut size={18} />
        </button>
        <ProfileAvatar name={profile?.full_name ?? null} avatarUrl={profile?.avatar_url ?? null} />
      </div>
    </nav>
  );
};

export default AppNav;
