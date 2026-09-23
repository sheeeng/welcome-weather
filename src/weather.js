import {
  formatOsloTime,
  formatOsloWeather,
  formatOsloWeatherDetails,
  formatOsloWeatherSummary,
  getOsloForecastPeriods,
  getOsloWeather,
  getSeasonFromForecast,
} from "./season.js";

export async function fetchOsloWeather() {
  const response = await fetch(
    "https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=59.9139&lon=10.7522",
  );
  if (!response.ok) throw new Error(`MET Norway returned HTTP ${response.status}.`);

  const forecast = await response.json();
  const weather = getOsloWeather(forecast);
  return {
    forecastPeriods: getOsloForecastPeriods(forecast),
    seasonId: getSeasonFromForecast(forecast),
    time: weather.time,
    timeText: formatOsloTime(new Date(weather.time)),
    weatherDetails: formatOsloWeatherDetails(weather),
    weatherSummary: formatOsloWeatherSummary(weather),
    weatherText: formatOsloWeather(weather),
  };
}
