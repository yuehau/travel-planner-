import React, { useEffect, useState } from 'react';
import Car from 'lucide-react/dist/esm/icons/car.mjs';
import CloudSun from 'lucide-react/dist/esm/icons/cloud-sun.mjs';
import type { Trip } from '../../types/database';
import type { TravelDataClient } from '../../services/travelData';
import { fetchWeatherForecast, weatherEmoji, weatherDescription, type DailyForecast } from '../../services/weather';
import { getTravelTips } from '../../data/travelTips';

type WeatherAndTravelInfoProps = {
  tripId: string;
  travelData: TravelDataClient;
  trip: Trip;
};

const MAX_FORECAST_DAYS = 7;

const WeatherAndTravelInfo: React.FC<WeatherAndTravelInfoProps> = ({ tripId, travelData, trip }) => {
  const [forecast, setForecast] = useState<DailyForecast[]>([]);
  const [hasCoordinates, setHasCoordinates] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const places = await travelData.listPlaces(tripId);
        const withCoordinates = places.filter(
          (place): place is typeof place & { latitude: number; longitude: number } =>
            place.latitude !== null && place.longitude !== null,
        );

        if (withCoordinates.length === 0) {
          if (isMounted) {
            setHasCoordinates(false);
            setIsLoading(false);
          }
          return;
        }

        const averageLatitude = withCoordinates.reduce((sum, place) => sum + place.latitude, 0) / withCoordinates.length;
        const averageLongitude = withCoordinates.reduce((sum, place) => sum + place.longitude, 0) / withCoordinates.length;

        const days = await fetchWeatherForecast(averageLatitude, averageLongitude);
        if (isMounted) {
          setHasCoordinates(true);
          setForecast(days.slice(0, MAX_FORECAST_DAYS));
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load the weather forecast.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [travelData, tripId]);

  const tips = getTravelTips(trip.destination);

  return (
    <section className="mb-10 p-6 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
      <div className="flex items-center gap-2 text-stone-400 dark:text-stone-600 mb-4">
        <CloudSun size={16} />
        <span className="text-xs font-bold uppercase tracking-wider">Weather & Travel Conditions</span>
      </div>

      {isLoading && <p className="text-sm text-stone-500 dark:text-stone-400">Loading forecast...</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {!isLoading && !error && !hasCoordinates && (
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Add a place with a location (via the Places tab) to see a weather forecast here.
        </p>
      )}

      {forecast.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2 mb-5">
          {forecast.map((day) => (
            <div
              key={day.date}
              title={weatherDescription(day.weatherCode)}
              className="shrink-0 w-24 text-center rounded-xl bg-white dark:bg-[#0a0a0a] border border-stone-200 dark:border-stone-800 p-3"
            >
              <div className="text-xs text-stone-400 dark:text-stone-500 mb-1">
                {new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
              </div>
              <div className="text-2xl mb-1">{weatherEmoji(day.weatherCode)}</div>
              <div className="text-xs font-medium">
                {Math.round(day.maxTempC)}° / {Math.round(day.minTempC)}°
              </div>
              <div className="text-[10px] text-stone-400 dark:text-stone-500 mt-1">{day.precipitationChance}% rain</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-start gap-2 pt-4 border-t border-stone-200 dark:border-stone-800">
        <Car size={16} className="mt-0.5 shrink-0 text-stone-400 dark:text-stone-600" />
        <ul className="space-y-1.5 text-sm text-stone-600 dark:text-stone-400">
          {tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default WeatherAndTravelInfo;
