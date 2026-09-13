import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left.mjs';
import Check from 'lucide-react/dist/esm/icons/check.mjs';
import Clock from 'lucide-react/dist/esm/icons/clock.mjs';
import Plus from 'lucide-react/dist/esm/icons/plus.mjs';
import ShoppingCart from 'lucide-react/dist/esm/icons/shopping-cart.mjs';
import Star from 'lucide-react/dist/esm/icons/star.mjs';
import Wallet from 'lucide-react/dist/esm/icons/wallet.mjs';
import X from 'lucide-react/dist/esm/icons/x.mjs';
import AppNav from '../components/AppNav';
import { useTravelDataClient } from '../hooks/useTravelDataClient';
import {
  getAttractionsByState,
  malaysiaStates,
  type AttractionCategory,
  type MalaysiaStateId,
} from '../data/attractions';
import { getPlansByState, tierLabels, type TripPlan } from '../data/plans';
import { buildRoute, formatHour, totalCost as sumStopsCost, totalDays as countStopDays, type RouteStop } from '../utils/routeBuilder';

type View = 'states' | 'plans' | 'attractions' | 'route';

const categoryLabels: Record<AttractionCategory, string> = {
  heritage: 'Heritage',
  nature: 'Nature',
  food: 'Food',
  culture: 'Culture',
  adventure: 'Adventure',
  shopping: 'Shopping',
  beach: 'Beach',
};

const groupByDay = (stops: RouteStop[]) => {
  const byDay = new Map<number, RouteStop[]>();
  for (const stop of stops) {
    const list = byDay.get(stop.day) ?? [];
    list.push(stop);
    byDay.set(stop.day, list);
  }
  return [...byDay.entries()].sort(([a], [b]) => a - b);
};

const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const travelData = useTravelDataClient();

  const [view, setView] = useState<View>('states');
  const [selectedStateId, setSelectedStateId] = useState<MalaysiaStateId | null>(null);
  const [cart, setCart] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<AttractionCategory | 'all'>('all');
  const [tripStartDate, setTripStartDate] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const selectedState = malaysiaStates.find((state) => state.id === selectedStateId) ?? null;

  const stateAttractions = useMemo(
    () => (selectedStateId ? getAttractionsByState(selectedStateId) : []),
    [selectedStateId],
  );

  const statePlans = useMemo(() => (selectedStateId ? getPlansByState(selectedStateId) : []), [selectedStateId]);

  const getPlanStats = (plan: TripPlan) => {
    const planAttractions = stateAttractions.filter((attraction) => plan.attractionIds.includes(attraction.id));
    const planRoute = buildRoute(planAttractions);
    return { cost: sumStopsCost(planRoute), days: countStopDays(planRoute), count: planAttractions.length };
  };

  const filteredAttractions = useMemo(() => {
    const list = categoryFilter === 'all' ? stateAttractions : stateAttractions.filter((attraction) => attraction.category === categoryFilter);
    return [...list].sort((a, b) => b.popularity - a.popularity);
  }, [stateAttractions, categoryFilter]);

  const availableCategories = useMemo(
    () => [...new Set(stateAttractions.map((attraction) => attraction.category))],
    [stateAttractions],
  );

  const selectedAttractions = useMemo(
    () => stateAttractions.filter((attraction) => cart.has(attraction.id)),
    [stateAttractions, cart],
  );

  const cartTotalCost = selectedAttractions.reduce((sum, attraction) => sum + attraction.estimatedCost, 0);

  const route = useMemo(() => buildRoute(selectedAttractions), [selectedAttractions]);
  const routeDays = useMemo(() => groupByDay(route), [route]);

  const toggleCart = (attractionId: string) => {
    setCart((current) => {
      const next = new Set(current);
      if (next.has(attractionId)) next.delete(attractionId);
      else next.add(attractionId);
      return next;
    });
  };

  const handleSelectState = (stateId: MalaysiaStateId) => {
    setSelectedStateId(stateId);
    setCategoryFilter('all');
    setView('plans');
  };

  const handleSelectPlan = (plan: TripPlan) => {
    setCart(new Set(plan.attractionIds));
    setView('route');
  };

  const handleCreateTrip = async () => {
    if (!travelData || !selectedState || route.length === 0 || !tripStartDate) return;

    setIsCreating(true);
    setCreateError(null);

    try {
      const days = Math.max(...route.map((stop) => stop.day));
      const startDate = new Date(`${tripStartDate}T00:00:00`);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + days - 1);

      const trip = await travelData.createTrip({
        destination: selectedState.name,
        start_date: tripStartDate,
        end_date: endDate.toISOString().slice(0, 10),
        description: `Built with Cuti²'s ${selectedState.name} explorer.`,
      });

      for (const stop of route) {
        const place = await travelData.createPlace(trip.id, {
          name: stop.attraction.name,
          address: `${selectedState.name}, Malaysia`,
          latitude: stop.attraction.latitude,
          longitude: stop.attraction.longitude,
          source: 'cuti2-explore',
          notes: stop.attraction.description,
        });

        const hour = Math.floor(stop.startHour).toString().padStart(2, '0');
        const minute = Math.round((stop.startHour % 1) * 60).toString().padStart(2, '0');

        await travelData.createItineraryNode(trip.id, {
          day_number: stop.day,
          sequence_index: stop.sequenceIndex,
          title: stop.attraction.name,
          place_id: place.id,
          node_type: stop.attraction.category === 'food' ? 'meal' : 'activity',
          start_time: `${hour}:${minute}`,
          estimated_cost: stop.attraction.estimatedCost,
          currency: 'MYR',
          notes: stop.attraction.description,
        });
      }

      navigate(`/trip/${trip.id}`);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Could not create this trip.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-stone-900 dark:text-stone-100 transition-colors duration-300">
      <AppNav />

      <main className="max-w-6xl mx-auto px-6 py-10 pb-40">
        {view === 'states' && (
          <>
            <div className="mb-10">
              <h1 className="text-4xl font-display font-bold tracking-tighter mb-2">Explore Malaysia</h1>
              <p className="text-stone-500 dark:text-stone-400 font-light">Pick a state to browse its most-loved attractions.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {malaysiaStates.map((state) => (
                <button
                  key={state.id}
                  type="button"
                  disabled={!state.available}
                  onClick={() => handleSelectState(state.id)}
                  className={`text-left rounded-2xl border p-6 transition-all ${
                    state.available
                      ? 'border-stone-200 dark:border-stone-800 hover:border-stone-900 dark:hover:border-stone-100 hover:shadow-lg cursor-pointer'
                      : 'border-stone-100 dark:border-stone-900 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="text-4xl mb-4">{state.emoji}</div>
                  <h3 className="text-xl font-semibold mb-1">{state.name}</h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400">{state.tagline}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {view === 'plans' && selectedState && (
          <>
            <button
              type="button"
              onClick={() => setView('states')}
              className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors mb-6 group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              All states
            </button>

            <div className="mb-8">
              <h1 className="text-3xl font-display font-bold tracking-tighter mb-1">
                {selectedState.emoji} {selectedState.name} plans
              </h1>
              <p className="text-stone-500 dark:text-stone-400 font-light">Pick a ready-made plan, or build your own from scratch.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 mb-8">
              {statePlans.map((plan) => {
                const stats = getPlanStats(plan);
                return (
                  <div
                    key={plan.id}
                    className={`flex flex-col rounded-2xl p-6 hover:shadow-lg transition-all ${
                      plan.tier === 'balanced'
                        ? 'border-2 border-coral-500'
                        : 'border border-stone-200 dark:border-stone-800 hover:border-stone-900 dark:hover:border-stone-100'
                    }`}
                  >
                    <span
                      className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-medium mb-3 ${
                        plan.tier === 'budget'
                          ? 'bg-coral-100 text-coral-700'
                          : plan.tier === 'balanced'
                            ? 'bg-teal-100 text-teal-700'
                            : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {tierLabels[plan.tier]}
                    </span>
                    <h3 className="text-lg font-semibold mb-1">
                      {plan.label} · {plan.name}
                    </h3>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mb-4 flex-1">{plan.description}</p>
                    <div className="flex items-center justify-between text-sm mb-4">
                      <span className="font-semibold">{stats.cost === 0 ? 'Free' : `RM${stats.cost}`}</span>
                      <span className="text-stone-500 dark:text-stone-400">
                        {stats.days} day{stats.days === 1 ? '' : 's'} · {stats.count} stops
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectPlan(plan)}
                      className="w-full py-2.5 rounded-xl text-sm font-medium bg-coral-500 text-white hover:opacity-90 transition-opacity"
                    >
                      Use this plan
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setView('attractions')}
              className="text-sm font-medium text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors underline underline-offset-4"
            >
              Or browse every attraction yourself
            </button>
          </>
        )}

        {view === 'attractions' && selectedState && (
          <>
            <button
              type="button"
              onClick={() => setView('plans')}
              className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors mb-6 group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to plans
            </button>

            <div className="mb-6">
              <h1 className="text-3xl font-display font-bold tracking-tighter mb-1">
                {selectedState.emoji} {selectedState.name}
              </h1>
              <p className="text-stone-500 dark:text-stone-400 font-light">Ranked by popularity - tap + to add to your cart.</p>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  categoryFilter === 'all'
                    ? 'bg-coral-500 text-white'
                    : 'bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                All
              </button>
              {availableCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setCategoryFilter(category)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    categoryFilter === category
                      ? 'bg-coral-500 text-white'
                      : 'bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  {categoryLabels[category]}
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAttractions.map((attraction) => {
                const inCart = cart.has(attraction.id);
                return (
                  <div
                    key={attraction.id}
                    className={`rounded-2xl border p-5 transition-all ${
                      inCart ? 'border-teal-500' : 'border-stone-200 dark:border-stone-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="text-3xl">{attraction.emoji}</div>
                      <button
                        type="button"
                        onClick={() => toggleCart(attraction.id)}
                        aria-label={inCart ? `Remove ${attraction.name} from cart` : `Add ${attraction.name} to cart`}
                        className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                          inCart
                            ? 'bg-coral-500 text-white'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
                        }`}
                      >
                        {inCart ? <Check size={16} /> : <Plus size={16} />}
                      </button>
                    </div>

                    <h3 className="text-base font-semibold mb-1">{attraction.name}</h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mb-3 line-clamp-2">{attraction.description}</p>

                    <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                      <span className="flex items-center gap-1">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        {attraction.rating.toFixed(1)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {attraction.durationHours}h
                      </span>
                      <span className="flex items-center gap-1">
                        <Wallet size={12} />
                        {attraction.estimatedCost === 0 ? 'Free' : `RM${attraction.estimatedCost}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {cart.size > 0 && (
              <div className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-6 py-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-sm">
                    <ShoppingCart size={18} />
                    <span className="font-medium">{cart.size} selected</span>
                    <span className="text-stone-500 dark:text-stone-400">· RM{cartTotalCost} estimated</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setView('route')}
                    className="px-5 py-2.5 rounded-full text-sm font-medium bg-coral-500 text-white hover:opacity-90 transition-opacity"
                  >
                    Build my route
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {view === 'route' && selectedState && (
          <>
            <button
              type="button"
              onClick={() => setView('attractions')}
              className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors mb-6 group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to attractions
            </button>

            <div className="mb-8">
              <h1 className="text-3xl font-display font-bold tracking-tighter mb-1">Your {selectedState.name} route</h1>
              <p className="text-stone-500 dark:text-stone-400 font-light">
                {routeDays.length} day{routeDays.length === 1 ? '' : 's'} · RM{cartTotalCost} estimated, ordered by distance.
              </p>
            </div>

            {createError && (
              <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{createError}</div>
            )}

            <div className="space-y-8 mb-10">
              {routeDays.map(([day, stops]) => (
                <div key={day}>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3">Day {day}</h2>
                  <div className="space-y-3">
                    {stops.map((stop) => (
                      <div
                        key={stop.attraction.id}
                        className="flex items-center gap-4 rounded-xl border border-stone-200 dark:border-stone-800 p-4"
                      >
                        <div className="text-2xl">{stop.attraction.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-1">
                            <Clock size={12} />
                            {formatHour(stop.startHour)}
                          </div>
                          <h3 className="text-sm font-semibold truncate">{stop.attraction.name}</h3>
                        </div>
                        <div className="text-sm text-stone-500 dark:text-stone-400 shrink-0">
                          {stop.attraction.estimatedCost === 0 ? 'Free' : `RM${stop.attraction.estimatedCost}`}
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleCart(stop.attraction.id)}
                          aria-label={`Remove ${stop.attraction.name}`}
                          className="shrink-0 p-1 text-stone-300 dark:text-stone-700 hover:text-red-500 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-900">
              <label className="grid gap-1 text-sm font-medium max-w-xs">
                Trip start date
                <input
                  required
                  type="date"
                  disabled={isCreating || !travelData || travelData.isReadOnly}
                  value={tripStartDate}
                  onChange={(event) => setTripStartDate(event.target.value)}
                  className="rounded-xl border border-stone-200 bg-white px-4 py-2 outline-none ring-stone-900 focus:ring-2 dark:border-stone-800 dark:bg-[#0a0a0a] dark:ring-stone-100"
                />
              </label>

              {travelData?.isReadOnly && (
                <p className="mt-3 text-sm text-amber-700 dark:text-amber-500">Demo mode is read-only. Sign in to create this trip.</p>
              )}

              <button
                type="button"
                disabled={isCreating || !travelData || travelData.isReadOnly || !tripStartDate}
                onClick={handleCreateTrip}
                className="mt-4 px-6 py-3 rounded-xl bg-coral-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreating ? 'Creating trip...' : 'Create this trip'}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default ExplorePage;
