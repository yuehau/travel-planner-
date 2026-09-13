const DEFAULT_TIPS = [
  'Check live traffic conditions closer to your trip - conditions vary by region and season.',
  'Weekday mornings (7-9am) and evenings (5-7pm) are typically the busiest for city traffic in Malaysia.',
];

const TIPS_BY_KEYWORD: { keywords: string[]; tips: string[] }[] = [
  {
    keywords: ['penang'],
    tips: [
      'Traffic on the Penang Bridge and the Sultan Abdul Halim Muadzam Shah Bridge is heaviest 8-10am and 5-7:30pm on weekdays.',
      "George Town's old streets are narrow and pedestrian-heavy - walking or e-hailing beats driving there.",
      'Weekend mornings get busy around Batu Ferringhi and Penang Hill - arrive early to skip queues.',
    ],
  },
  {
    keywords: ['melaka', 'malacca'],
    tips: [
      'Jonker Street becomes pedestrian-only and very crowded on Friday-Sunday nights.',
      'Parking near Dutch Square fills up fast on weekends - the Hang Tuah or Dataran Pahlawan car parks are safer bets.',
      'The AKLEH highway into town can back up during the Friday evening rush.',
    ],
  },
];

export const getTravelTips = (destination: string): string[] => {
  const normalized = destination.toLowerCase();
  const match = TIPS_BY_KEYWORD.find((entry) => entry.keywords.some((keyword) => normalized.includes(keyword)));
  return match?.tips ?? DEFAULT_TIPS;
};
