import { Link, NavLink } from 'react-router-dom';
import LogOut from 'lucide-react/dist/esm/icons/log-out.mjs';
import Bookmark from 'lucide-react/dist/esm/icons/bookmark.mjs';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase.mjs';
import BrandMark from './BrandMark';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../hooks/useAuth';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors sm:flex-none ${
    isActive
      ? 'bg-white text-clay-700 shadow-sm dark:bg-sand-800 dark:text-clay-200'
      : 'text-sand-500 hover:text-sand-800 dark:text-sand-400 dark:hover:text-sand-100'
  }`;

const MinimalAvatar = () => (
  <div
    className="relative h-9 w-9 overflow-hidden rounded-full border border-sand-200 bg-gradient-to-br from-sand-100 to-clay-100 dark:border-sand-800 dark:from-sand-900 dark:to-sand-800"
    aria-label="User profile"
  >
    <span className="absolute left-1/2 top-2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-clay-400 dark:bg-clay-500" />
    <span className="absolute bottom-1.5 left-1/2 h-3.5 w-5 -translate-x-1/2 rounded-t-full bg-clay-300 dark:bg-clay-700" />
  </div>
);

const AppNav = () => {
  const { signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-sand-200/70 bg-sand-50/80 backdrop-blur-md dark:border-sand-900 dark:bg-sand-950/80">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex min-w-0 items-center gap-2">
          <Link to="/" className="group flex shrink-0 items-center gap-2.5 text-xl font-semibold tracking-tight">
            <BrandMark size="sm" interactive />
            <span>TravelPlanner</span>
          </Link>
        </div>

        <div className="order-3 flex w-full items-center justify-center gap-1 rounded-full border border-sand-200 bg-sand-100 p-1 dark:border-sand-800 dark:bg-sand-900 sm:order-none sm:w-auto">
          <NavLink to="/dashboard" className={navLinkClass}>
            <Briefcase size={16} />
            <span>My Trips</span>
          </NavLink>
          <NavLink to="/collections" className={navLinkClass}>
            <Bookmark size={16} />
            <span>Collections</span>
          </NavLink>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle variant="circle" />
          <button
            type="button"
            onClick={signOut}
            className="rounded-full p-2 text-sand-500 transition-colors hover:bg-sand-100 hover:text-clay-600 dark:text-sand-400 dark:hover:bg-sand-900 dark:hover:text-clay-300"
            aria-label="Sign out"
          >
            <LogOut size={18} />
          </button>
          <MinimalAvatar />
        </div>
      </nav>
    </header>
  );
};

export default AppNav;
