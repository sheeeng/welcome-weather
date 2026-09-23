import assert from "node:assert/strict";
import test from "node:test";

import {
  formatOsloWeatherDetails,
  formatOsloWeatherSummary,
  getOsloForecastPeriods,
  getOsloWeather,
  getSeasonForMonth,
  getWindBarbSegments,
} from "./season.js";

test("maps seasons and wind-barb segments", () => {
  assert.equal(getSeasonForMonth(0), "winter");
  assert.equal(getSeasonForMonth(5), "summer");
  assert.equal(getSeasonForMonth(8), "autumn");
  assert.deepEqual(getWindBarbSegments(0), {
    calm: true,
    pennants: 0,
    longBarbs: 0,
    shortBarbs: 0,
  });
  assert.deepEqual(getWindBarbSegments(2.6), {
    calm: false,
    pennants: 0,
    longBarbs: 0,
    shortBarbs: 1,
  });
  assert.deepEqual(getWindBarbSegments(5.2), {
    calm: false,
    pennants: 0,
    longBarbs: 1,
    shortBarbs: 0,
  });
  assert.deepEqual(getWindBarbSegments(25.7), {
    calm: false,
    pennants: 1,
    longBarbs: 0,
    shortBarbs: 0,
  });
});

test("formats the current Oslo weather and forecast periods", () => {
  const forecast = {
    properties: {
      timeseries: [
        {
          time: "2026-09-22T12:00:00Z",
          data: {
            instant: {
              details: {
                air_pressure_at_sea_level: 1026.5,
                air_temperature: 14.4,
                cloud_area_fraction: 38.8,
                relative_humidity: 47.5,
                wind_from_direction: 199,
                wind_speed: 3.2,
              },
            },
            next_1_hours: {
              summary: { symbol_code: "fair_day" },
              details: { precipitation_amount: 0 },
            },
            next_6_hours: {
              summary: { symbol_code: "rain" },
              details: { precipitation_amount: 2.4 },
            },
            next_12_hours: {
              summary: { symbol_code: "partlycloudy_day" },
              details: {},
            },
          },
        },
      ],
    },
  };
  const weather = getOsloWeather(forecast, new Date("2026-09-22T12:20:00Z"));
  assert.deepEqual(formatOsloWeatherSummary(weather), [
    { icon: null, value: "🇳🇴 Oslo" },
    { icon: "wi-thermometer", value: "14.4°C" },
    { icon: "wi-day-sunny", value: "Few Clouds" },
    { icon: "wi-humidity", value: "47.5%" },
  ]);
  assert.deepEqual(formatOsloWeatherDetails(weather), [
    {
      label: "Wind",
      icon: "wi-strong-wind",
      value: "3.2 m/s from SSW",
      windBarb: { direction: 199, speed: 3.2 },
    },
    { label: "Pressure", icon: "wi-barometer", value: "1026.5 hPa" },
    { label: "Cloud cover", icon: "wi-cloudy", value: "38.8%" },
  ]);
  assert.equal(
    getOsloForecastPeriods(forecast, new Date("2026-09-22T12:20:00Z"))[1].icon,
    "wi-rain",
  );
});
