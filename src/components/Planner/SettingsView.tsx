import { useEffect, useState, type FormEvent } from 'react';
import Save from 'lucide-react/dist/esm/icons/save.mjs';
import type { UserSettings } from '../../types/database';
import type { TravelDataClient } from '../../services/travelData';

type SettingsViewProps = {
  travelData: TravelDataClient;
};

const SettingsView = ({ travelData }: SettingsViewProps) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const loadedSettings = await travelData.getUserSettings();
        if (isMounted) setSettings(loadedSettings);
      } catch (loadError) {
        if (isMounted) setError(loadError instanceof Error ? loadError.message : 'Could not load settings.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, [travelData]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    setError(null);
    setSavedMessage('');

    try {
      const updated = await travelData.updateUserSettings({
        theme: settings.theme,
        currency: settings.currency,
        distance_unit: settings.distance_unit,
        time_format: settings.time_format,
        dashboard_widgets: settings.dashboard_widgets,
      });
      setSettings(updated);
      setSavedMessage('Settings saved.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">Loading settings...</div>;
  }

  if (!settings) {
    return <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">Settings unavailable.</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tighter">Preferences</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Defaults used across your planning workspace.</p>
      </div>

      {error && <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {savedMessage && <div className="mb-6 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">{savedMessage}</div>}

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <label className="grid gap-1 text-sm font-medium">
          Preferred currency
          <input
            value={settings.currency}
            disabled={isSaving || travelData.isReadOnly}
            onChange={(event) => setSettings((current) => current ? { ...current, currency: event.target.value.toUpperCase().slice(0, 3) } : current)}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 outline-none ring-zinc-900 focus:ring-2 dark:border-zinc-800 dark:bg-[#0a0a0a] dark:ring-zinc-100"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Distance unit
          <select
            value={settings.distance_unit}
            disabled={isSaving || travelData.isReadOnly}
            onChange={(event) => setSettings((current) => current ? { ...current, distance_unit: event.target.value as UserSettings['distance_unit'] } : current)}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 outline-none ring-zinc-900 focus:ring-2 dark:border-zinc-800 dark:bg-[#0a0a0a] dark:ring-zinc-100"
          >
            <option value="km">Kilometers</option>
            <option value="mi">Miles</option>
          </select>
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Time format
          <select
            value={settings.time_format}
            disabled={isSaving || travelData.isReadOnly}
            onChange={(event) => setSettings((current) => current ? { ...current, time_format: event.target.value as UserSettings['time_format'] } : current)}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 outline-none ring-zinc-900 focus:ring-2 dark:border-zinc-800 dark:bg-[#0a0a0a] dark:ring-zinc-100"
          >
            <option value="12h">12-hour</option>
            <option value="24h">24-hour</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={isSaving || travelData.isReadOnly}
          className="inline-flex w-fit items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          <Save size={16} />
          Save Preferences
        </button>
      </form>
    </div>
  );
};

export default SettingsView;
