import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days.mjs';
import type { Place } from '../../types/database';

type BoardDayBarProps = {
  dayCount: number;
  places: Place[];
  dayFilter: number | null;
  onChange: (day: number | null) => void;
};

/** Day legend for the board: click a day to spotlight its cards, "All days" to reset. */
const BoardDayBar = ({ dayCount, places, dayFilter, onChange }: BoardDayBarProps) => {
  const countFor = (day: number) => places.filter((place) => place.day_number === day).length;
  const unscheduled = places.filter((place) => !place.day_number).length;

  return (
    <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-line bg-surface-raised p-1 shadow-md shadow-mist-950/10 [scrollbar-width:none]">
      <span className="hidden items-center gap-1 px-2 text-[11px] font-bold uppercase tracking-widest text-ink-faint sm:inline-flex">
        <CalendarDays size={12} />
        Days
      </span>
      <button
        type="button"
        onClick={() => onChange(null)}
        aria-pressed={dayFilter === null}
        aria-label="Show all days"
        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${dayFilter === null ? 'bg-primary text-on-primary' : 'text-ink-muted hover:bg-surface-sunken hover:text-ink'}`}
      >
        All
      </button>
      {Array.from({ length: dayCount }, (_, index) => index + 1).map((day) => (
        <button
          key={day}
          type="button"
          onClick={() => onChange(dayFilter === day ? null : day)}
          aria-pressed={dayFilter === day}
          aria-label={`Show day ${day}`}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${dayFilter === day ? 'bg-primary text-on-primary' : 'text-ink-muted hover:bg-surface-sunken hover:text-ink'}`}
        >
          Day {day}
          <span className="ml-1 opacity-60">{countFor(day)}</span>
        </button>
      ))}
      {unscheduled > 0 && <span className="shrink-0 px-2 text-[11px] text-ink-faint">{unscheduled} unscheduled</span>}
    </div>
  );
};

export default BoardDayBar;
