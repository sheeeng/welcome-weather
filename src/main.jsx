import { getWindBarbSegments } from "./season.js";
import { mountSeasonalScene } from "./scene.jsx";
import { fetchWeather, requestGeolocation } from "./weather.js";

const variants = {
  spring: "sakura-sunset",
  summer: "living-green",
  autumn: "maple-autumn",
  winter: "sequoia-mist",
};

function weatherIcon(icon) {
  const element = document.createElement("i");
  element.className = `wi ${icon}`;
  element.setAttribute("aria-hidden", "true");
  return element;
}

export function createWindBarb({ direction, speed }) {
  const segments = getWindBarbSegments(speed);
  const barb = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  barb.classList.add("wind-barb");
  barb.setAttribute("aria-hidden", "true");
  barb.setAttribute("viewBox", "0 0 32 32");
  barb.style.setProperty("--wind-direction", `${direction}deg`);
  if (segments.calm) {
    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle",
    );
    circle.setAttribute("cx", "16");
    circle.setAttribute("cy", "16");
    circle.setAttribute("r", "7");
    barb.append(circle);
    return barb;
  }
  const shaft = document.createElementNS("http://www.w3.org/2000/svg", "path");
  shaft.setAttribute("d", "M16 28V5");
  barb.append(shaft);
  let offset = 5;
  for (let count = 0; count < segments.pennants; count += 1, offset += 8) {
    const pennant = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "polygon",
    );
    pennant.setAttribute(
      "points",
      `16 ${offset},16 ${offset + 8},24 ${offset + 4}`,
    );
    barb.append(pennant);
  }
  for (let count = 0; count < segments.longBarbs; count += 1, offset += 4) {
    const feather = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    feather.setAttribute("d", `M16 ${offset}l8 4`);
    barb.append(feather);
  }
  if (segments.shortBarbs) {
    const feather = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    feather.setAttribute("d", `M16 ${offset}l4 2`);
    barb.append(feather);
  }
  return barb;
}

function renderWeather(weather) {
  document.documentElement.dataset.season = weather.seasonId;
  mountSeasonalScene(
    document.getElementById("seasonal-scene"),
    variants[weather.seasonId],
  );
  if (weather.isCurrentLocation) {
    document.querySelector(".intro").textContent =
      "Display weather conditions at your location.";
  } else if (weather.locationDenied) {
    document.querySelector(".intro").replaceChildren(
      "Display weather conditions at Oslo.",
      document.createElement("br"),
      "Location access was denied.",
    );
  } else {
    document.querySelector(".intro").textContent =
      "Display weather conditions at Oslo.";
  }
  const summary = document.getElementById("oslo-weather");
  summary.className = "weather-summary";
  summary.setAttribute("aria-label", weather.weatherText);
  summary.replaceChildren(
    ...weather.weatherSummary.map(({ icon, value }) => {
      const card = document.createElement("span");
      card.className = "weather-summary-item";
      if (icon) card.append(weatherIcon(icon));
      const text = document.createElement("span");
      text.textContent = value;
      card.append(text);
      return card;
    }),
  );
  document.getElementById("oslo-weather-details").replaceChildren(
    ...weather.weatherDetails.map(({ icon, label, value, windBarb }) => {
      const card = document.createElement("div");
      card.className = "weather-reading";
      card.setAttribute("aria-label", label);
      const valueElement = document.createElement("dd");
      valueElement.append(weatherIcon(icon));
      if (windBarb) valueElement.append(createWindBarb(windBarb));
      valueElement.append(value);
      card.append(valueElement);
      return card;
    }),
  );
  document.getElementById("oslo-forecast-periods").replaceChildren(
    ...weather.forecastPeriods.map(
      ({ label, icon, condition, precipitation }) => {
        const card = document.createElement("div");
        card.className = "weather-period";
        const heading = document.createElement("strong");
        heading.textContent = label;
        const line = document.createElement("span");
        line.append(weatherIcon(icon), condition);
        card.append(heading, line);
        if (precipitation) {
          const amount = document.createElement("span");
          amount.className = "weather-period-precipitation";
          amount.textContent = `${precipitation} precipitation`;
          card.append(amount);
        }
        return card;
      },
    ),
  );
  document.getElementById("oslo-forecast").hidden = false;
  const weatherAttribution = document.getElementById("oslo-weather-attribution");
  const weatherLink = weatherAttribution.querySelector("a");
  const weatherTime = document.createElement("time");
  weatherTime.dateTime = weather.time;
  weatherTime.textContent = weather.timeText;
  const forecastLine = document.createElement("span");
  forecastLine.className = "weather-forecast-time";
  forecastLine.replaceChildren("Forecast for ", weatherTime, ".");
  const sourceLine = document.createElement("span");
  sourceLine.replaceChildren("Obtained from ", weatherLink, ".");
  weatherAttribution.replaceChildren(forecastLine, sourceLine);
}

const commitSha = import.meta.env.VITE_GIT_COMMIT_SHA_8_CHAR;
if (commitSha) {
  const commitLink = document.getElementById("commit-link");
  commitLink.href = `https://github.com/sheeeng/whether-weather/commit/${commitSha}`;
  commitLink.textContent = commitSha;
}

document.querySelector(".intro").textContent = "Requesting your location…";
requestGeolocation()
  .then((coords) => {
    const locationDenied = coords === null;
    return fetchWeather(coords ?? undefined).then((weather) =>
      Object.assign(weather, { locationDenied }),
    );
  })
  .then(renderWeather)
  .catch((error) => {
    document.getElementById("oslo-weather").textContent =
      "Current weather is unavailable.";
    console.warn(`Could not refresh the forecast: ${error.message}`);
  });
