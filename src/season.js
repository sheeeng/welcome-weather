export const SEASONS = [
  {
    id: "spring",
    label: "Spring",
    variant: "sakura-sunset",
  },
  {
    id: "summer",
    label: "Summer",
    variant: "living-green",
  },
  {
    id: "autumn",
    label: "Autumn",
    variant: "maple-autumn",
  },
  {
    id: "winter",
    label: "Winter",
    variant: "sequoia-mist",
  },
];

export function getSeasonForMonth(month) {
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

export function getSeasonForDate(date = new Date()) {
  return getSeasonForMonth(date.getMonth());
}

export function getWindBarbSegments(speed) {
  let remaining = Math.round((speed * 1.94384) / 5) * 5;
  if (remaining === 0)
    return { calm: true, pennants: 0, longBarbs: 0, shortBarbs: 0 };
  const pennants = Math.floor(remaining / 50);
  remaining %= 50;
  const longBarbs = Math.floor(remaining / 10);
  return {
    calm: false,
    pennants,
    longBarbs,
    shortBarbs: remaining % 10 === 5 ? 1 : 0,
  };
}

export function getSeasonFromDailyMeans(dailyMeans, month) {
  if (dailyMeans.length < 7) {
    throw new Error("Seven daily mean temperatures are required.");
  }

  const temperatures = dailyMeans.slice(0, 7);
  if (temperatures.every((temperature) => temperature > 10)) return "summer";
  if (temperatures.every((temperature) => temperature < 0)) return "winter";
  return month >= 1 && month <= 6 ? "spring" : "autumn";
}

export function getSeasonFromForecast(forecast, now = new Date()) {
  const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Oslo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const monthFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Oslo",
    month: "numeric",
  });
  const today = dateFormatter.format(now);
  const temperaturesByDay = new Map();

  for (const entry of forecast.properties?.timeseries ?? []) {
    const temperature = entry.data?.instant?.details?.air_temperature;
    if (!Number.isFinite(temperature)) continue;
    const date = dateFormatter.format(new Date(entry.time));
    const temperatures = temperaturesByDay.get(date) ?? [];
    temperatures.push(temperature);
    temperaturesByDay.set(date, temperatures);
  }

  let days = [...temperaturesByDay.entries()].filter(([date]) => date > today);
  if (days.length < 7) days = [...temperaturesByDay.entries()];
  const dailyMeans = days
    .slice(0, 7)
    .map(
      ([, temperatures]) =>
        temperatures.reduce((total, temperature) => total + temperature, 0) /
        temperatures.length,
    );
  const osloMonth = Number(monthFormatter.format(now)) - 1;
  return getSeasonFromDailyMeans(dailyMeans, osloMonth);
}

export function getOsloWeather(forecast, now = new Date()) {
  const entries = (forecast.properties?.timeseries ?? []).filter((entry) =>
    Number.isFinite(entry.data?.instant?.details?.air_temperature),
  );
  if (entries.length === 0) {
    throw new Error("The forecast does not contain air temperature data.");
  }

  const current = entries.reduce((nearest, entry) =>
    Math.abs(new Date(entry.time) - now) <
    Math.abs(new Date(nearest.time) - now)
      ? entry
      : nearest,
  );
  const details = current.data.instant.details;
  const symbolCode =
    current.data.next_1_hours?.summary?.symbol_code ??
    current.data.next_6_hours?.summary?.symbol_code ??
    current.data.next_12_hours?.summary?.symbol_code;
  return {
    airPressureAtSeaLevel: details.air_pressure_at_sea_level,
    cloudAreaFraction: details.cloud_area_fraction,
    condition: formatWeatherCondition(symbolCode),
    conditionEmoji: getWeatherEmoji(symbolCode),
    conditionIcon: getWeatherIcon(symbolCode),
    relativeHumidity: details.relative_humidity,
    temperature: details.air_temperature,
    time: formatOsloIsoTime(new Date(current.time)),
    windFromDirection: details.wind_from_direction,
    windSpeed: details.wind_speed,
  };
}

export function getOsloForecastPeriods(forecast, now = new Date()) {
  const entries = forecast.properties?.timeseries ?? [];
  if (entries.length === 0) {
    throw new Error("The forecast does not contain time series data.");
  }

  const current = entries.reduce((nearest, entry) =>
    Math.abs(new Date(entry.time) - now) <
    Math.abs(new Date(nearest.time) - now)
      ? entry
      : nearest,
  );
  const periods = [
    ["Next Hour", "next_1_hours"],
    ["Next 6 Hours", "next_6_hours"],
    ["Next 12 Hours", "next_12_hours"],
  ];
  const numberFormatter = new Intl.NumberFormat("en", {
    maximumFractionDigits: 1,
    useGrouping: false,
  });

  return periods.map(([label, key]) => {
    const period = current.data?.[key];
    const symbolCode = period?.summary?.symbol_code;
    const precipitationAmount = period?.details?.precipitation_amount;
    return {
      label,
      condition: symbolCode
        ? toTitleCase(formatWeatherCondition(symbolCode))
        : "Unavailable",
      icon: getWeatherIcon(symbolCode),
      precipitation: Number.isFinite(precipitationAmount)
        ? `${numberFormatter.format(precipitationAmount)} mm`
        : null,
    };
  });
}

export function formatOsloIsoTime(date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Oslo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
      timeZoneName: "longOffset",
    })
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  );
  const offset = parts.timeZoneName.replace("GMT", "") || "Z";
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${offset}`;
}

export function formatOsloTime(date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Oslo",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZoneName: "short",
    })
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  );
  const timeZoneName = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Oslo",
    timeZoneName: "short",
  })
    .formatToParts(date)
    .find(({ type }) => type === "timeZoneName")?.value;
  return `${parts.month} ${parts.day}, ${parts.year}, at ${parts.hour}:${parts.minute} ${timeZoneName}`;
}

function formatWeatherCondition(symbolCode) {
  const conditions = {
    clearsky: "clear sky",
    cloudy: "cloudy",
    fair: "few clouds",
    fog: "fog",
    heavyrain: "heavy rain",
    heavyrainshowers: "heavy rain showers",
    heavysleet: "heavy sleet",
    heavysleetshowers: "heavy sleet showers",
    heavysnow: "heavy snow",
    heavysnowshowers: "heavy snow showers",
    lightrain: "light rain",
    lightrainshowers: "light rain showers",
    lightsleet: "light sleet",
    lightsleetshowers: "light sleet showers",
    lightsnow: "light snow",
    lightsnowshowers: "light snow showers",
    partlycloudy: "partly cloudy",
    rain: "rain",
    rainshowers: "rain showers",
    sleet: "sleet",
    sleetshowers: "sleet showers",
    snow: "snow",
    snowshowers: "snow showers",
  };
  const normalized = symbolCode?.replace(/_(day|night|polartwilight)$/, "");
  return conditions[normalized] ?? "current conditions";
}

export function formatOsloWeather(weather) {
  return `${formatOsloWeatherSummary(weather)
    .map(({ value }) => value)
    .join(" · ")}.`;
}

export function formatOsloWeatherSummary({
  condition,
  conditionIcon,
  relativeHumidity,
  temperature,
}) {
  const temperatureText = new Intl.NumberFormat("en", {
    maximumFractionDigits: 1,
  }).format(temperature);
  const conditionText = toTitleCase(condition);
  return [
    { icon: null, value: "🇳🇴 Oslo" },
    { icon: "wi-thermometer", value: `${temperatureText}°C` },
    { icon: conditionIcon, value: conditionText },
    { icon: "wi-humidity", value: formatWeatherReading(relativeHumidity, "%") },
  ];
}

export function formatOsloWeatherDetails(weather) {
  return [
    {
      label: "Wind",
      icon: "wi-strong-wind",
      value: formatWindReading(weather.windSpeed, weather.windFromDirection),
      windBarb:
        Number.isFinite(weather.windSpeed) &&
        Number.isFinite(weather.windFromDirection)
          ? { direction: weather.windFromDirection, speed: weather.windSpeed }
          : null,
    },
    {
      label: "Pressure",
      icon: "wi-barometer",
      value: formatWeatherReading(weather.airPressureAtSeaLevel, " hPa"),
    },
    {
      label: "Cloud cover",
      icon: "wi-cloudy",
      value: formatWeatherReading(weather.cloudAreaFraction, "%"),
    },
  ];
}

function formatWeatherReading(value, unit) {
  return Number.isFinite(value)
    ? `${new Intl.NumberFormat("en", { maximumFractionDigits: 1, useGrouping: false }).format(value)}${unit}`
    : "Unavailable";
}

function formatWindReading(speed, direction) {
  if (!Number.isFinite(speed)) return "Unavailable";
  const directionText = Number.isFinite(direction)
    ? ` from ${formatWindDirection(direction)}`
    : "";
  return `${formatWeatherReading(speed, " m/s")}${directionText}`;
}

function formatWindDirection(degrees) {
  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  return directions[Math.round(degrees / 22.5) % directions.length];
}

function toTitleCase(text) {
  return text.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getWeatherEmoji(symbolCode) {
  const normalized =
    symbolCode?.replace(/_(day|night|polartwilight)$/, "") ?? "";
  if (normalized === "clearsky") return "☀️";
  if (normalized === "fair") return "🌤️";
  if (normalized === "partlycloudy") return "⛅";
  if (normalized === "cloudy") return "☁️";
  if (normalized === "fog") return "🌫️";
  if (normalized.includes("snow")) return "❄️";
  if (normalized.includes("sleet")) return "🌨️";
  if (normalized.includes("rain")) return "🌧️";
  return "🌡️";
}

function getWeatherIcon(symbolCode) {
  const normalized =
    symbolCode?.replace(/_(day|night|polartwilight)$/, "") ?? "";
  const isNight = symbolCode?.endsWith("_night");
  if (["clearsky", "fair"].includes(normalized))
    return isNight ? "wi-night-clear" : "wi-day-sunny";
  if (["partlycloudy", "cloudy"].includes(normalized))
    return isNight ? "wi-night-alt-cloudy" : "wi-day-cloudy";
  if (normalized === "fog") return "wi-fog";
  if (normalized.includes("thunder")) return "wi-thunderstorm";
  if (normalized.includes("snow")) return "wi-snow";
  if (normalized.includes("sleet")) return "wi-sleet";
  if (normalized.includes("rain")) return "wi-rain";
  return "wi-na";
}

export function getSeasonDefinition(seasonId) {
  return SEASONS.find(({ id }) => id === seasonId) ?? SEASONS[0];
}
