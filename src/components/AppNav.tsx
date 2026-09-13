import { Link, NavLink } from 'react-router-dom';
import LogOut from 'lucide-react/dist/esm/icons/log-out.mjs';
import Bookmark from 'lucide-react/dist/esm/icons/bookmark.mjs';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase.mjs';
import Compass from 'lucide-react/dist/esm/icons/compass.mjs';
import Users from 'lucide-react/dist/esm/icons/users.mjs';
import BrandMark from './BrandMark';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../hooks/useAuth';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors sm:flex-none ${
    isActive
      ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-800 dark:text-stone-100'
      : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
  }`;

const MinimalAvatar = () => (
  <div
    className="relative h-8 w-8 overflow-hidden rounded-full border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-900"
    aria-label="User profile"
  >
    <span className="absolute left-1/2 top-1.5 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-stone-400 dark:bg-stone-500" />
    <span className="absolute bottom-1.5 left-1/2 h-3.5 w-5 -translate-x-1/2 rounded-t-full bg-stone-300 dark:bg-stone-600" />
  </div>
);

const AppNav = () => {
  const { signOut } = useAuth();

  return (
    <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-6">
      <div className="flex min-w-0 items-center gap-2">
        <Link to="/" className="group flex shrink-0 items-center gap-2 text-xl font-semibold tracking-tight">
          <BrandMark size="sm" interactive />
          <span className="font-display">Cuti²</span>
        </Link>
      </div>

      <div className="order-3 flex w-full items-center justify-center gap-1 rounded-full border border-stone-200 bg-stone-100 p-1 dark:border-stone-800 dark:bg-stone-900 sm:order-none sm:w-auto">
        <NavLink to="/dashboard" className={navLinkClass}>
          <Briefcase size={16} />
          <span>My Trips</span>
        </NavLink>
        <NavLink to="/explore" className={navLinkClass}>
          <Compass size={16} />
          <span>Explore</span>
        </NavLink>
        <NavLink to="/groups" className={navLinkClass}>
          <Users size={16} />
          <span>Group Trips</span>
        </NavLink>
        <NavLink to="/collections" className={navLinkClass}>
          <Bookmark size={16} />
          <span>Collections</span>
        </NavLink>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle variant="circle" />
        <button
          type="button"
          onClick={signOut}
          className="rounded-full p-2 text-stone-500 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
          aria-label="Sign out"
        >
          <LogOut size={18} />
        </button>
        <MinimalAvatar />
      </div>
    </nav>
  );
};

export default AppNav;
