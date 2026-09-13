import React from 'react';
import { useAuth } from '../hooks/useAuth';
import BrandMark from '../components/BrandMark';
import ThemeToggle from '../components/ThemeToggle';
import LoadingLink from '../components/LoadingLink';
import { usePageTransition } from '../hooks/usePageTransition';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right.mjs';
import Bookmark from 'lucide-react/dist/esm/icons/bookmark.mjs';
import Compass from 'lucide-react/dist/esm/icons/compass.mjs';
import Heart from 'lucide-react/dist/esm/icons/heart.mjs';
import LayoutGrid from 'lucide-react/dist/esm/icons/layout-grid.mjs';
import MapPin from 'lucide-react/dist/esm/icons/map-pin.mjs';
import Newspaper from 'lucide-react/dist/esm/icons/newspaper.mjs';
import Route from 'lucide-react/dist/esm/icons/route.mjs';
import Star from 'lucide-react/dist/esm/icons/star.mjs';
import TrainFront from 'lucide-react/dist/esm/icons/train-front.mjs';
import Footprints from 'lucide-react/dist/esm/icons/footprints.mjs';
import { catalogPlaces, getCatalogPlace } from '../data/catalog';

const previewPlaces = [
  getCatalogPlace('kl-batu-caves'),
  getCatalogPlace('kl-petronas-towers'),
  getCatalogPlace('kl-jalan-alor'),
];

const MiniBoardPreview = () => (
  <div className="relative overflow-hidden rounded-3xl border border-line bg-surface-raised p-6 shadow-2xl shadow-mist-950/20 [background-image:radial-gradient(var(--board-dot)_1.4px,transparent_1.4px)] [background-size:22px_22px]">
    <div className="mb-5 flex items-center justify-between">
      <span className="rounded-full bg-surface-sunken px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-ink-muted">KL City Lights · board</span>
      <span className="text-[11px] font-semibold text-ink-faint">3 places · 2 routes</span>
    </div>
    <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
      {previewPlaces.map((place, index) => place && (
        <React.Fragment key={place.id}>
          {index > 0 && (
            <div className="flex items-center justify-center sm:flex-col">
              <span className="hidden h-px w-8 bg-primary sm:block" />
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-raised px-2.5 py-1 text-[11px] font-semibold text-ink shadow-md shadow-mist-950/10">
                {index === 1 ? <TrainFront size={12} /> : <Footprints size={12} />}
                {index === 1 ? 'Train · 35 min' : 'Walk · 20 min'}
              </span>
              <span className="hidden h-px w-8 bg-primary sm:block" />
            </div>
          )}
          <div className="overflow-hidden rounded-2xl border border-line bg-surface-raised shadow-lg shadow-mist-950/10">
            <img src={place.image} alt="" className="aspect-[16/9] w-full object-cover" />
            <div className="px-3 py-2.5">
              <p className="truncate text-sm font-semibold">{place.name}</p>
              <p className="flex items-center gap-1 text-[11px] text-ink-muted">
                {place.city}
                <Star size={10} className="ml-auto fill-accent text-accent" />
                {place.rating.toFixed(1)}
              </p>
            </div>
          </div>
        </React.Fragment>
      ))}
    </div>
  </div>
);

const LandingPage: React.FC = () => {
  const { setDemoMode } = useAuth();
  const { navigateWithLoading } = usePageTransition();

  const handleDemoClick = () => {
    setDemoMode(true);
    navigateWithLoading('/dashboard');
  };

  const capabilities = [
    {
      icon: LayoutGrid,
      title: 'Plan on a visual board',
      description: 'Every trip is a canvas. Drag places on, arrange them how you think, and see the whole plan at a glance.',
    },
    {
      icon: Route,
      title: 'Connect the dots',
      description: 'Draw a route between two places and pick how you will get there: walk, train, bus or car, with a rough time estimate.',
    },
    {
      icon: MapPin,
      title: `${catalogPlaces.length} Malaysian places, ready to drag`,
      description: 'Landmarks, hawker streets, beaches, tea hills and cafés across KL, Penang, Langkawi, Malacca, Cameron Highlands, Ipoh and Sabah.',
    },
    {
      icon: Compass,
      title: 'Place intel in one tap',
      description: 'Tap any card for a map, opening hours, ratings and reviews before you commit it to the plan.',
    },
    {
      icon: Newspaper,
      title: 'News from the ground',
      description: 'New cafés, reopened beach clubs and weekend markets, written short enough to read on the train.',
    },
    {
      icon: Bookmark,
      title: 'Collections for later',
      description: 'Save destinations you have visited or want to go, and turn the best ones into boards.',
    },
  ];

  return (
    <div className="min-h-screen bg-surface text-ink transition-colors duration-300 selection:bg-mist-400">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="group flex cursor-pointer items-center gap-2 text-xl font-semibold">
          <BrandMark interactive />
          <span>TravelPlanner</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          <ThemeToggle />
          <LoadingLink to="/signin" className="text-sm font-medium text-ink-muted transition-colors hover:text-ink">
            Sign In
          </LoadingLink>
          <LoadingLink to="/signup" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:bg-primary-hover">
            Get Started
          </LoadingLink>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -left-40 top-10 h-[28rem] w-[28rem] rounded-full bg-mist-600/40 blur-3xl" />
          <div className="pointer-events-none absolute -right-40 top-40 h-[28rem] w-[28rem] rounded-full bg-mist-800/20 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-12 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:pt-20">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface-raised px-3 py-1 text-xs font-semibold text-ink-muted animate-fade-in">
                <MapPin size={12} className="text-accent" />
                <span>Made for trips across Malaysia</span>
              </div>
              <h1 className="mb-6 text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">
                Plan your trip like a <span className="bg-gradient-to-r from-mist-900 to-mist-800 bg-clip-text text-transparent">flow</span>, not a spreadsheet.
              </h1>
              <p className="mb-10 max-w-xl text-lg leading-relaxed text-ink-muted">
                Drag places onto a board, connect them into a route, choose how you travel between stops, and keep the whole plan on one calm canvas.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <LoadingLink
                  to="/signup"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-4 text-base font-semibold text-on-primary shadow-lg shadow-mist-950/20 transition hover:bg-primary-hover"
                >
                  Start a board
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </LoadingLink>
                <button
                  type="button"
                  onClick={handleDemoClick}
                  className="inline-flex items-center justify-center rounded-full border border-line bg-surface-raised px-7 py-4 text-base font-semibold text-ink transition hover:border-mist-700"
                >
                  Explore the demo
                </button>
              </div>
            </div>
            <MiniBoardPreview />
          </div>
        </section>

        <section className="border-y border-line bg-surface-raised/60 py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-10 max-w-2xl">
              <h2 className="mb-3 text-3xl font-bold leading-tight tracking-tight md:text-4xl">Everything on the board</h2>
              <p className="text-base leading-relaxed text-ink-muted">
                Explore three sample boards without an account, then sign in when you want to keep your own.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {capabilities.map((capability, index) => {
                const Icon = capability.icon;
                const accents = ['from-mist-900 to-mist-800', 'from-mist-700 to-mist-800', 'from-mist-700 to-mist-900'];
                return (
                  <article key={capability.title} className="rounded-3xl border border-line bg-surface-raised p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-mist-950/10">
                    <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-mist-50 ${accents[index % accents.length]}`}>
                      <Icon size={22} strokeWidth={1.75} />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold tracking-tight">{capability.title}</h3>
                    <p className="text-sm leading-relaxed text-ink-muted">{capability.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-6 py-16 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="mb-4 text-3xl font-bold leading-tight tracking-tight md:text-4xl">A planning board, not a booking site</h2>
            <p className="mb-8 text-base leading-relaxed text-ink-muted">
              TravelPlanner helps you decide where to go and how to get between places. Bookings stay with the airlines, hotels and ticket counters. Your boards stay private to your account.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <LoadingLink to="/signup" className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-semibold text-on-accent transition hover:bg-accent-hover">
                Create account
                <ArrowRight size={18} />
              </LoadingLink>
              <LoadingLink to="/signin" className="inline-flex items-center justify-center rounded-full px-6 py-3 font-medium text-ink-muted transition-colors hover:text-ink">
                Sign in
              </LoadingLink>
            </div>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-mist-950 via-mist-900 to-mist-800 p-6 text-mist-50 shadow-xl shadow-mist-950/20">
            <div className="mb-6 flex items-center gap-3">
              <BrandMark />
              <div>
                <p className="font-semibold">Three demo boards included</p>
                <p className="text-sm text-mist-100/80">Different vibes, all drag-and-drop.</p>
              </div>
            </div>
            <div className="grid gap-3 text-sm">
              {[
                ['KL City Lights', 'Skyline, street food, rooftop sunsets'],
                ['Penang Heritage & Street Food', 'Murals, clan houses, hawker stalls'],
                ['Langkawi Island Escape', 'Mangroves, empty beaches, sky bridge'],
              ].map(([name, vibe]) => (
                <div key={name} className="flex items-center justify-between gap-3 rounded-2xl bg-mist-50/10 px-4 py-3 backdrop-blur">
                  <span className="font-semibold">{name}</span>
                  <span className="text-right text-mist-100/80">{vibe}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-1 text-xs text-mist-100/70">
                <Heart size={12} className="fill-mist-600 text-mist-600" />
                Like stories on the News page to keep track of places worth a detour.
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-7xl border-t border-line px-6 py-10 text-center text-xs font-medium uppercase tracking-widest text-ink-faint">
        © {new Date().getFullYear()} TravelPlanner · Plan the flow, enjoy the trip.
      </footer>
    </div>
  );
};

export default LandingPage;
