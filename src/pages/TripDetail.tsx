import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left.mjs';
import Calendar from 'lucide-react/dist/esm/icons/calendar.mjs';
import ThemeToggle from '../components/ThemeToggle';
import ItineraryView from '../components/Planner/ItineraryView';
import MindMapView from '../components/Planner/MindMapView';
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
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-zinc-500 dark:text-zinc-400 flex items-center justify-center">
        Loading trip...
      </div>
    );
  }

  if (!trip || !travelData || !tripId) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-zinc-900 dark:text-zinc-100">
        <main className="max-w-3xl mx-auto px-6 py-16">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-8 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tighter mb-3">Trip unavailable</h1>
          <p className="text-zinc-500 dark:text-zinc-400">{error ?? 'Trip was not found.'}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      {/* Header */}
      <header className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter mb-2">{trip.destination}</h1>
            <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400 font-light">
              <span className="flex items-center gap-1"><Calendar size={14} /> {formatTripDate(trip.start_date)} — {formatTripDate(trip.end_date)}</span>
            </div>
          </div>
          {trip.description && (
            <p className="max-w-md text-right text-sm text-zinc-500 dark:text-zinc-400 font-light italic">
              {trip.description}
            </p>
          )}
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="max-w-5xl mx-auto px-6 mb-8">
        <div className="flex max-w-full gap-1 overflow-x-auto p-1 bg-zinc-100 dark:bg-zinc-900 rounded-full w-fit border border-zinc-200 dark:border-zinc-800">
          {tripTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
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
        {activeTab === 'mindmap' && <MindMapView tripId={tripId} travelData={travelData} />}
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
