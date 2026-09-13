import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import BrandMark from '../components/BrandMark';
import ThemeToggle from '../components/ThemeToggle';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right.mjs';
import Bookmark from 'lucide-react/dist/esm/icons/bookmark.mjs';
import Calendar from 'lucide-react/dist/esm/icons/calendar.mjs';
import CheckSquare from 'lucide-react/dist/esm/icons/square-check-big.mjs';
import FileText from 'lucide-react/dist/esm/icons/file-text.mjs';
import MapPin from 'lucide-react/dist/esm/icons/map-pin.mjs';
import Users from 'lucide-react/dist/esm/icons/users.mjs';
import Wallet from 'lucide-react/dist/esm/icons/wallet.mjs';

const primaryButtonClass =
  'rounded-full bg-clay-600 text-white shadow-lg shadow-clay-900/15 transition-all hover:-translate-y-0.5 hover:bg-clay-700 hover:shadow-xl hover:shadow-clay-900/20 dark:bg-clay-500 dark:hover:bg-clay-400';

const quietButtonClass =
  'rounded-full text-sand-600 transition-colors hover:bg-sand-100 hover:text-clay-700 dark:text-sand-400 dark:hover:bg-sand-900 dark:hover:text-clay-300';

const LandingPage: React.FC = () => {
  const { setDemoMode } = useAuth();
  const navigate = useNavigate();

  const handleDemoClick = () => {
    setDemoMode(true);
    navigate('/dashboard');
  };

  const capabilities = [
    {
      icon: Calendar,
      title: 'Build a daily itinerary',
      description: 'Plan each day with activities, start times, locations, saved places, and notes in one focused timeline.',
    },
    {
      icon: MapPin,
      title: 'Save places on a map',
      description: 'Search for places, save addresses and coordinates, then use them while building your schedule.',
    },
    {
      icon: Bookmark,
      title: 'Collect future ideas',
      description: 'Save destinations you have visited or want to explore later, then turn the best ones into trips.',
    },
    {
      icon: Wallet,
      title: 'Control the budget',
      description: 'Record expenses by category, separate planned from paid costs, and keep totals visible while planning.',
    },
    {
      icon: CheckSquare,
      title: 'Manage trip tasks',
      description: 'Add to-dos with due dates and priorities so documents, prep work, and travel errands do not disappear.',
    },
    {
      icon: FileText,
      title: 'Keep essentials handy',
      description: 'Save emergency contacts, hotel addresses, links, notes, and confirmation details in quick-access sections.',
    },
    {
      icon: Users,
      title: 'Invite collaborators',
      description: 'Share a trip workspace by email so friends or family can help organize the plan.',
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-sand-50 text-sand-900 transition-colors duration-300 selection:bg-clay-200 selection:text-clay-900 dark:bg-sand-950 dark:text-sand-50 dark:selection:bg-clay-800 dark:selection:text-clay-50">
      {/* Warm horizon glow behind the hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(60%_60%_at_50%_28%,rgb(243_203_185/0.85)_0%,rgb(243_203_185/0.35)_45%,rgb(243_203_185/0)_75%)] blur-3xl dark:bg-[radial-gradient(60%_60%_at_50%_28%,rgb(107_47_27/0.55)_0%,rgb(107_47_27/0.22)_45%,rgb(107_47_27/0)_75%)]"
      />

      {/* Header */}
      <header className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="group flex min-w-0 cursor-pointer items-center gap-2.5 text-lg font-semibold tracking-tight sm:text-xl">
          <BrandMark size="sm" interactive />
          <span>TravelPlanner</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          <ThemeToggle />
          <Link
            to="/signin"
            className="hidden text-sm font-medium whitespace-nowrap text-sand-600 transition-colors hover:text-clay-700 sm:inline dark:text-sand-400 dark:hover:text-clay-300"
          >
            Sign In
          </Link>
          <Link to="/signup" className={`${primaryButtonClass} whitespace-nowrap px-5 py-2 text-sm font-medium`}>
            Get Started
          </Link>
        </div>
      </header>

      <main className="relative">
        {/* Hero Section */}
        <section>
          <div className="mx-auto max-w-5xl px-6 pb-20 pt-14 text-center md:pt-20">
            <div className="mb-8 inline-flex animate-fade-in items-center gap-2 rounded-full border border-clay-200 bg-clay-50 px-3.5 py-1.5 text-xs font-medium text-clay-700 dark:border-clay-800 dark:bg-clay-900/40 dark:text-clay-200">
              <MapPin size={12} />
              <span>Plan the trip before the trip plans you</span>
            </div>
            <h1 className="mb-6 animate-rise-in text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
              One calm place for every
              <span className="bg-gradient-to-r from-clay-400 to-clay-700 bg-clip-text text-transparent dark:from-clay-200 dark:to-clay-400">
                {' '}moving part{' '}
              </span>
              of travel.
            </h1>
            <p className="mx-auto mb-10 max-w-3xl text-lg font-light leading-relaxed text-sand-600 md:text-xl dark:text-sand-300">
              TravelPlanner helps you turn loose ideas, saved places, budgets, packing lists, and last-minute tasks into a clear trip workspace. Start with a simple dashboard, then open each trip to organize the details day by day.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/signup" className={`${primaryButtonClass} group flex items-center gap-2 px-8 py-4 text-lg font-medium`}>
                Get Started
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <button type="button" onClick={handleDemoClick} className={`${quietButtonClass} px-8 py-4 text-lg font-medium`}>
                Explore Demo
              </button>
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section className="border-y border-sand-200 bg-white py-16 dark:border-sand-900 dark:bg-sand-900/30">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-10 max-w-2xl">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-clay-600 dark:text-clay-400">The workspace</p>
              <h2 className="mb-3 text-3xl font-bold leading-tight tracking-tight md:text-4xl">What you can plan</h2>
              <p className="text-base font-light leading-relaxed text-sand-600 dark:text-sand-300">
                Explore the demo without an account, then sign in when you are ready to save private trips.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {capabilities.map((capability) => {
                const Icon = capability.icon;

                return (
                  <article
                    key={capability.title}
                    className="group rounded-3xl border border-sand-200 bg-sand-50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-clay-300 hover:shadow-lg hover:shadow-clay-900/5 dark:border-sand-800 dark:bg-sand-950 dark:hover:border-clay-700 dark:hover:shadow-black/30"
                  >
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-clay-100 text-clay-600 transition-colors group-hover:bg-clay-600 group-hover:text-white dark:bg-clay-900/50 dark:text-clay-300 dark:group-hover:bg-clay-500 dark:group-hover:text-white">
                      <Icon size={22} strokeWidth={1.75} />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold tracking-tight">{capability.title}</h3>
                    <p className="text-sm font-light leading-relaxed text-sand-600 dark:text-sand-400">{capability.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Closing pitch */}
        <section className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <h2 className="mb-4 text-3xl font-bold leading-tight tracking-tight md:text-4xl">A planning workspace, not a booking app</h2>
            <p className="mb-8 text-base font-light leading-relaxed text-sand-600 dark:text-sand-300">
              Keep itineraries, places, collections, budgets, packing lists, tasks, and essentials organized in one calm space. Google sign-in saves everything privately to your account.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/signup" className={`${primaryButtonClass} inline-flex items-center justify-center gap-2 px-6 py-3 font-medium`}>
                Create Account
                <ArrowRight size={18} />
              </Link>
              <Link to="/signin" className={`${quietButtonClass} inline-flex items-center justify-center px-6 py-3 font-medium`}>
                Sign In
              </Link>
              <button type="button" onClick={handleDemoClick} className={`${quietButtonClass} inline-flex items-center justify-center px-6 py-3 font-medium`}>
                Explore Demo
              </button>
            </div>
          </div>
          <div className="rounded-3xl border border-sand-200 bg-gradient-to-br from-white to-clay-50 p-6 shadow-sm dark:border-sand-800 dark:from-sand-900 dark:to-sand-950">
            <div className="mb-6 flex items-center gap-3">
              <BrandMark />
              <div>
                <p className="font-semibold tracking-tight">Your next workspace</p>
                <p className="text-sm text-sand-500 dark:text-sand-400">Private, organized, and ready for the details.</p>
              </div>
            </div>
            <div className="grid gap-3 text-sm">
              {[
                { label: 'Saved places', value: 'Map ready' },
                { label: 'Collections', value: 'Saved' },
                { label: 'Packing and tasks', value: 'Trackable' },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-2xl border border-sand-200/70 bg-white px-4 py-3 dark:border-sand-800 dark:bg-sand-950"
                >
                  <span className="text-sand-500 dark:text-sand-400">{row.label}</span>
                  <span className="font-semibold text-clay-700 dark:text-clay-300">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-7xl border-t border-sand-200 px-6 py-10 text-center text-xs font-medium uppercase tracking-widest text-sand-400 dark:border-sand-900 dark:text-sand-600">
        © {new Date().getFullYear()} TravelPlanner - Simple. Refined.
      </footer>
    </div>
  );
};

export default LandingPage;
