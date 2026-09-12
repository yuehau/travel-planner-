export type TripStatus = 'upcoming' | 'active' | 'past';

export const getTripStatus = (startDate: string, endDate: string, now = new Date()): TripStatus => {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const tripStart = new Date(`${startDate}T00:00:00`);
  const tripEnd = new Date(`${endDate}T23:59:59`);

  if (tripEnd < today) return 'past';
  if (tripStart <= today) return 'active';

  return 'upcoming';
};

export const formatTripDate = (date: string) => {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
};
