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
    <div className="min-h-screen bg-white text-stone-900 transition-colors duration-300 selection:bg-stone-200 dark:bg-[#0a0a0a] dark:text-stone-100 dark:selection:bg-stone-800">
      {/* Header */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-8">
        <div className="group flex cursor-pointer items-center gap-2 text-xl font-semibold">
          <BrandMark interactive />
          <span className="font-display text-stone-900 dark:text-stone-100">Cuti²</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <ThemeToggle />
          <Link
            to="/signin"
            className="text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="text-sm font-medium px-4 py-2 rounded-full bg-coral-500 text-white hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="mx-auto max-w-5xl px-6 pb-20 pt-16 text-center md:pt-20">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600 animate-fade-in dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400">
            <MapPin size={12} />
            <span>Plan the trip before the trip plans you</span>
          </div>
          <h1 className="mb-6 font-display text-5xl font-bold leading-[1.1] md:text-7xl">
            One calm place for every moving part of travel.
          </h1>
          <p className="mx-auto mb-10 max-w-3xl text-lg font-light leading-relaxed text-stone-500 md:text-xl dark:text-stone-400">
            Cuti² helps you turn loose ideas, saved places, budgets, packing lists, and last-minute tasks into a clear trip workspace. Start with a simple dashboard, then open each trip to organize the details day by day.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/signup"
              className="group flex items-center gap-2 rounded-full bg-coral-500 px-8 py-4 text-lg font-medium text-white transition-all hover:opacity-90"
            >
              Get Started
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <button
              type="button"
              onClick={handleDemoClick}
              className="rounded-full px-8 py-4 text-lg font-medium text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
            >
              Explore Demo
            </button>
          </div>
        </section>

        <section className="border-y border-stone-100 bg-stone-50 py-16 dark:border-stone-900 dark:bg-stone-950/40">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-10 max-w-2xl">
              <h2 className="mb-3 text-3xl font-bold leading-tight md:text-4xl">What you can plan</h2>
              <p className="text-base font-light leading-relaxed text-stone-500 dark:text-stone-400">
                Explore the demo without an account, then sign in when you are ready to save private trips.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {capabilities.map((capability) => {
                const Icon = capability.icon;

                return (
                  <article key={capability.title} className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 text-stone-900 dark:bg-[#0a0a0a] dark:text-stone-100">
                      <Icon size={22} strokeWidth={1.5} />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">{capability.title}</h3>
                    <p className="text-sm font-light leading-relaxed text-stone-500 dark:text-stone-400">{capability.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <h2 className="mb-4 text-3xl font-bold leading-tight md:text-4xl">A planning workspace, not a booking app</h2>
            <p className="mb-8 text-base font-light leading-relaxed text-stone-500 dark:text-stone-400">
              Keep itineraries, places, collections, budgets, packing lists, tasks, and essentials organized in one minimalist space. Google sign-in saves everything privately to your account.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-coral-500 px-6 py-3 font-medium text-white transition-opacity hover:opacity-90"
              >
                Create Account
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/signin"
                className="inline-flex items-center justify-center rounded-full px-6 py-3 font-medium text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
              >
                Sign In
              </Link>
              <button
                type="button"
                onClick={handleDemoClick}
                className="inline-flex items-center justify-center rounded-full px-6 py-3 font-medium text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
              >
                Explore Demo
              </button>
            </div>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6 dark:border-stone-800 dark:bg-stone-900">
            <div className="mb-6 flex items-center gap-3">
              <BrandMark />
              <div>
                <p className="font-semibold">Your next workspace</p>
                <p className="text-sm text-stone-500 dark:text-stone-400">Private, organized, and ready for the details.</p>
              </div>
            </div>
            <div className="grid gap-3 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 dark:bg-[#0a0a0a]">
                <span className="text-stone-500 dark:text-stone-400">Saved places</span>
                <span className="font-semibold">Map ready</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 dark:bg-[#0a0a0a]">
                <span className="text-stone-500 dark:text-stone-400">Collections</span>
                <span className="font-semibold">Saved</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 dark:bg-[#0a0a0a]">
                <span className="text-stone-500 dark:text-stone-400">Packing and tasks</span>
                <span className="font-semibold">Trackable</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-10 border-t border-stone-100 dark:border-stone-900 text-center text-stone-400 dark:text-stone-600 text-xs tracking-widest uppercase font-medium">
        © {new Date().getFullYear()} Cuti² - Simple. Refined.
      </footer>
    </div>
  );
};

export default LandingPage;
