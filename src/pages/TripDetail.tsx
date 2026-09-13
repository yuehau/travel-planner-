import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left.mjs';
import Calendar from 'lucide-react/dist/esm/icons/calendar.mjs';
import ThemeToggle from '../components/ThemeToggle';
import ItineraryView from '../components/Planner/ItineraryView';
import PlacesView from '../components/Planner/PlacesView';
import BudgetView from '../components/Planner/BudgetView';
import ChecklistView from '../components/Planner/ChecklistView';
import InfoView from '../components/Planner/InfoView';
import TodoView from '../components/Planner/TodoView';
import SharingView from '../components/Planner/SharingView';
import SettingsView from '../components/Planner/SettingsView';
import { useTravelDataClient } from '../hooks/useTravelDataClient';
import type { Trip } from '../types/database';
import { formatTripDate } from '../utils/tripStatus';
import { tripTabs, type TripTab } from './tripTabs';

const TripDetail: React.FC = () => {
  const { tripId } = useParams();
  const travelData = useTravelDataClient();
  const [activeTab, setActiveTab] = useState<TripTab>('itinerary');
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadTrip = async () => {
      if (!travelData || !tripId) {
        setIsLoading(false);
        setError('Trip was not found.');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const loadedTrip = await travelData.getTrip(tripId);
        if (!isMounted) return;

        setTrip(loadedTrip);
        if (!loadedTrip) {
          setError('Trip was not found or is not available to this account.');
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load this trip.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTrip();

    return () => {
      isMounted = false;
    };
  }, [travelData, tripId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand-50 font-light text-sand-500 dark:bg-sand-950 dark:text-sand-400">
        Loading trip...
      </div>
    );
  }

  if (!trip || !travelData || !tripId) {
    return (
      <div className="min-h-screen bg-sand-50 text-sand-900 dark:bg-sand-950 dark:text-sand-50">
        <main className="max-w-3xl mx-auto px-6 py-16">
          <Link
            to="/dashboard"
            className="group mb-8 inline-flex items-center gap-2 text-sm text-sand-500 transition-colors hover:text-clay-700 dark:text-sand-400 dark:hover:text-clay-300"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <h1 className="mb-3 text-3xl font-bold tracking-tight">Trip unavailable</h1>
          <p className="font-light text-sand-600 dark:text-sand-300">{error ?? 'Trip was not found.'}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-50 text-sand-900 transition-colors duration-300 dark:bg-sand-950 dark:text-sand-50">
      {/* Header */}
      <header className="relative mx-auto max-w-5xl px-6 py-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(70%_100%_at_20%_0%,rgb(250_231_221/0.9)_0%,rgb(250_231_221/0)_70%)] dark:bg-[radial-gradient(70%_100%_at_20%_0%,rgb(74_34_19/0.6)_0%,rgb(74_34_19/0)_70%)]"
        />
        <div className="relative mb-8 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="group inline-flex items-center gap-2 text-sm text-sand-500 transition-colors hover:text-clay-700 dark:text-sand-400 dark:hover:text-clay-300"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <ThemeToggle />
        </div>

        <div className="relative flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="mb-2 text-4xl font-bold tracking-tight md:text-5xl">{trip.destination}</h1>
            <div className="flex items-center gap-3 text-sm font-light text-sand-600 dark:text-sand-300">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sand-200 bg-white px-3 py-1 dark:border-sand-800 dark:bg-sand-900">
                <Calendar size={14} className="text-clay-500" />
                {formatTripDate(trip.start_date)} — {formatTripDate(trip.end_date)}
              </span>
            </div>
          </div>
          {trip.description && (
            <p className="max-w-md border-l-2 border-clay-300 pl-4 text-sm font-light italic text-sand-600 md:text-right dark:border-clay-700 dark:text-sand-400">
              {trip.description}
            </p>
          )}
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="max-w-5xl mx-auto px-6 mb-8">
        <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-sand-200 bg-sand-100 p-1 dark:border-sand-800 dark:bg-sand-900">
          {tripTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-clay-700 shadow-sm dark:bg-sand-800 dark:text-clay-200'
                    : 'text-sand-500 hover:text-sand-800 dark:text-sand-400 dark:hover:text-sand-100'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <main className="pb-24">
        {activeTab === 'itinerary' && <ItineraryView tripId={tripId} travelData={travelData} />}
        {activeTab === 'places' && <PlacesView tripId={tripId} travelData={travelData} />}
        {activeTab === 'budget' && <BudgetView tripId={tripId} travelData={travelData} />}
        {activeTab === 'checklist' && <ChecklistView tripId={tripId} travelData={travelData} />}
        {activeTab === 'todos' && <TodoView tripId={tripId} travelData={travelData} />}
        {activeTab === 'info' && <InfoView tripId={tripId} travelData={travelData} />}
        {activeTab === 'sharing' && <SharingView tripId={tripId} travelData={travelData} />}
        {activeTab === 'settings' && <SettingsView travelData={travelData} />}
      </main>
    </div>
  );
};

export default TripDetail;
