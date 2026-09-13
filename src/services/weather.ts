export type DailyForecast = {
  date: string;
  weatherCode: number;
  maxTempC: number;
  minTempC: number;
  precipitationChance: number;
};

type OpenMeteoResponse = {
  daily: {
    time: string[];
    weathercode: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
};

export const fetchWeatherForecast = async (latitude: number, longitude: number): Promise<DailyForecast[]> => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Could not load the weather forecast.');
  }

  const data = (await response.json()) as OpenMeteoResponse;

  return data.daily.time.map((date, index) => ({
    date,
    weatherCode: data.daily.weathercode[index],
    maxTempC: data.daily.temperature_2m_max[index],
    minTempC: data.daily.temperature_2m_min[index],
    precipitationChance: data.daily.precipitation_probability_max[index],
  }));
};

const WEATHER_EMOJI: Record<number, string> = {
  0: '☀️',
  1: '🌤️',
  2: '⛅',
  3: '☁️',
  45: '🌫️',
  48: '🌫️',
  51: '🌦️',
  53: '🌦️',
  55: '🌦️',
  61: '🌧️',
  63: '🌧️',
  65: '🌧️',
  80: '🌧️',
  81: '🌧️',
  82: '⛈️',
  95: '⛈️',
  96: '⛈️',
  99: '⛈️',
};

const WEATHER_DESCRIPTION: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mostly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Foggy',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  80: 'Rain showers',
  81: 'Rain showers',
  82: 'Violent showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm',
  99: 'Thunderstorm',
};

export const weatherEmoji = (code: number) => WEATHER_EMOJI[code] ?? '🌡️';
export const weatherDescription = (code: number) => WEATHER_DESCRIPTION[code] ?? 'Mixed conditions';
