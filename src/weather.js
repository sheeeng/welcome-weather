import {
  formatOsloTime,
  formatOsloWeather,
  formatOsloWeatherDetails,
  formatOsloWeatherSummary,
  getOsloForecastPeriods,
  getOsloWeather,
  getSeasonFromForecast,
} from "./season.js";

const OSLO = { latitude: 59.9139, longitude: 10.7522 };

export function requestGeolocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position.coords),
      () => resolve(null),
      { timeout: 8000 },
    );
  });
}

export async function fetchWeather(coords = OSLO) {
  const { latitude, longitude } = coords;
  const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${latitude.toFixed(4)}&lon=${longitude.toFixed(4)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`MET Norway returned HTTP ${response.status}.`);

  const forecast = await response.json();
  const weather = getOsloWeather(forecast);
  return {
    forecastPeriods: getOsloForecastPeriods(forecast),
    isCurrentLocation: coords !== OSLO,
    seasonId: getSeasonFromForecast(forecast),
    time: weather.time,
    timeText: formatOsloTime(new Date(weather.time)),
    weatherDetails: formatOsloWeatherDetails(weather),
    weatherSummary: formatOsloWeatherSummary(weather),
    weatherText: formatOsloWeather(weather),
  };
}

export async function fetchOsloWeather() {
  return fetchWeather(OSLO);
}
