# Standalone Weather Application Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task by task. Steps use checkbox syntax for tracking.

**Goal:** Build a standalone Oslo weather application with the seasonal Three.js background, Weather Icons, and a National Weather Service style wind barb.

**Architecture:** Use Vite and React only to mount the copied background scene. Keep weather retrieval, formatting, and DOM rendering in focused JavaScript modules. A single MET Norway compact forecast request supplies current observations, short forecast periods, and seasonal scene selection.

**Tech Stack:** Vite 8.2.2, React 18.2.0, Node.js test runner, MET Norway Locationforecast API, Weather Icons 2.0.12 CDN stylesheet, copied Three UI seasonal shader assets.

**Spec:** `docs/superpowers/specs/2026-09-23-weather-application-design.md`

## Global Constraints

- Use the MET Norway compact location forecast endpoint for Oslo coordinates 59.9139, 10.7522.
- Keep React limited to the copied background scene mount.
- Use Weather Icons 2.0.12 for all weather metrics except the inline SVG wind barb.
- Use National Weather Service wind-barb semantics with speeds rounded to five knots.
- Keep visible weather icon and value groups centered inside their cards.
- Keep explicit dark foreground colors for the light seasonal wash and preserve dark-mode support.
- Retain accessible text and accessible names for decorative icon-only labels.
- Do not add a server, credentials, analytics, persistence, or a weather-location selector.

---

## File Structure

- `package.json`: Vite, React, and project scripts.
- `vite.config.js`: React integration, copied shader HTML handling, and static-relative build output.
- `index.html`: Application shell and the weather card layout.
- `src/season.js`: Forecast parsing, condition-to-icon mapping, weather formatting, and seasonal selection.
- `src/weather.js`: MET Norway request boundary and normalized view model.
- `src/main.jsx`: DOM rendering, error state, Weather Icon creation, NWS wind-barb SVG creation, and scene scheduling.
- `src/scene.jsx`: React mount wrapper for the copied seasonal scene.
- `src/shaders/threeui.css`: Copied scene stylesheet.
- `src/shaders/sylva-living-world/`: Copied seasonal scene component and raw shader assets.
- `src/season.test.js`: Unit tests for weather and seasonal formatting.
- `README.md`: Local run, test, build, data source, and icon attribution instructions.

### Task 1: Create the Vite Project Shell

**Files:**

- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/scene.jsx`
- Create: `src/shaders/threeui.css`
- Create: `src/shaders/sylva-living-world/SylvaLivingWorldScene.tsx`
- Copy: `src/shaders/sylva-living-world/sources/inner-green-3d.html`
- Create: `.gitignore`

**Interfaces:**

- Produces: `mountSeasonalScene(container: Element, variant: string): void`.
- Produces: Vite commands `npm run dev`, `npm test`, and `npm run build`.

- [ ] **Step 1: Create the package manifest**

```json
{
  "private": true,
  "type": "module",
  "scripts": {
    "build": "vite build",
    "dev": "vite",
    "test": "node --test"
  },
  "dependencies": {
    "@vitejs/plugin-react": "6.1.1",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "vite": "8.2.2"
  }
}
```

- [ ] **Step 2: Copy the background assets from the source project**

Run:

```bash
cp -R "/Users/leonardlee/github/sheeeng/slides/seasonal/src/shaders" "src/shaders"
```

- [ ] **Step 3: Create the Vite configuration**

```js
import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    {
      name: "remove-unused-sylva-font",
      enforce: "pre",
      load(identifier) {
        if (!identifier.endsWith("inner-green-3d.html?raw")) return null;
        const source = readFileSync(identifier.slice(0, -4), "utf8").replace(
          /@font-face\s*\{[^}]*lexend-latin\.woff2[^}]*\}/,
          "",
        );
        return `export default ${JSON.stringify(source)};`;
      },
    },
    react(),
  ],
  base: "./",
});
```

- [ ] **Step 4: Create the scene mount wrapper**

```jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { SylvaLivingWorldScene } from "./shaders/sylva-living-world/SylvaLivingWorldScene";
import "./shaders/threeui.css";

let root;

export function mountSeasonalScene(container, variant) {
  root ??= createRoot(container);
  root.render(
    <React.StrictMode>
      <SylvaLivingWorldScene variant={variant} />
    </React.StrictMode>,
  );
}
```

- [ ] **Step 5: Create the semantic application shell**

Add `#seasonal-scene`, a `main` weather panel, summary and detail containers,
forecast containers, source attribution, and a loading message. Include the
Weather Icons 2.0.12 CDN stylesheet. Use placeholder container identifiers:
`oslo-weather`, `oslo-weather-details`, `oslo-forecast`,
`oslo-forecast-periods`, and `oslo-weather-attribution`.

- [ ] **Step 6: Add the ignore rules**

```gitignore
node_modules/
dist/
```

- [ ] **Step 7: Install dependencies and build the empty shell**

Run: `npm install && npm run build`

Expected: Vite completes the build without an application entry error.

- [ ] **Step 8: Commit the project shell**

```bash
git add .gitignore package.json package-lock.json vite.config.js index.html src
git commit --signoff --message "feat: add weather application shell"
```

### Task 2: Add Forecast Parsing and Formatting

**Files:**

- Create: `src/season.js`
- Create: `src/season.test.js`

**Interfaces:**

- Produces: `getSeasonFromForecast(forecast, now): string`.
- Produces: `getOsloWeather(forecast, now): WeatherReading`.
- Produces: `getOsloForecastPeriods(forecast, now): ForecastPeriod[]`.
- Produces: `formatOsloWeatherSummary(weather): Array<{ icon: string | null, value: string }>`.
- Produces: `formatOsloWeatherDetails(weather): Array<{ label: string, icon: string, value: string, windBarb?: { direction: number, speed: number } | null }>`.

- [ ] **Step 1: Write the failing seasonal mapping test**

```js
test("maps Northern Hemisphere meteorological seasons", () => {
  assert.equal(getSeasonForMonth(0), "winter");
  assert.equal(getSeasonForMonth(5), "summer");
  assert.equal(getSeasonForMonth(8), "autumn");
});
```

- [ ] **Step 2: Run the test to verify failure**

Run: `node --test src/season.test.js`

Expected: FAIL because `src/season.js` does not exist.

- [ ] **Step 3: Implement the season definitions and mappings**

```js
export const SEASONS = [
  { id: "spring", variant: "sakura-sunset" },
  { id: "summer", variant: "living-green" },
  { id: "autumn", variant: "maple-autumn" },
  { id: "winter", variant: "sequoia-mist" },
];

export function getSeasonForMonth(month) {
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}
```

- [ ] **Step 4: Run the test to verify success**

Run: `node --test src/season.test.js`

Expected: PASS.

- [ ] **Step 5: Add the failing weather-view-model test**

Use a one-entry forecast fixture with `fair_day`, 14.4 degrees Celsius,
47.5 percent humidity, 3.2 metres per second wind from 199 degrees, 1026.5
hPa, 38.8 percent cloud cover, and forecast precipitation values. Assert:

```js
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
```

- [ ] **Step 6: Run the test to verify failure**

Run: `node --test src/season.test.js`

Expected: FAIL because weather parsing and formatting functions are absent.

- [ ] **Step 7: Implement forecast parsing and icon mapping**

Implement nearest-time-series selection, MET Norway condition mapping, day and
night Weather Icon mapping, Oslo time formatting, precipitation formatting,
wind direction mapping, and 7-day forecast seasonal selection. Return
`wi-na` when a condition code is unavailable.

- [ ] **Step 8: Run the test suite to verify success**

Run: `npm test`

Expected: All weather and seasonal tests pass.

- [ ] **Step 9: Commit weather parsing**

```bash
git add src/season.js src/season.test.js
git commit --signoff --message "feat(weather): add forecast formatting"
```

### Task 3: Add the MET Norway Request Boundary

**Files:**

- Create: `src/weather.js`
- Modify: `src/season.test.js`

**Interfaces:**

- Consumes: `getOsloWeather`, `getOsloForecastPeriods`, `getSeasonFromForecast`, and formatter functions from `src/season.js`.
- Produces: `fetchOsloWeather(): Promise<WeatherViewModel>`.

- [ ] **Step 1: Write the failing request-boundary test**

Extract a `createWeatherViewModel(forecast, now)` export so it can be tested
without a network request:

```js
assert.equal(viewModel.seasonId, "summer");
assert.equal(viewModel.weatherSummary[0].value, "🇳🇴 Oslo");
assert.equal(viewModel.forecastPeriods.length, 3);
```

- [ ] **Step 2: Run the test to verify failure**

Run: `node --test src/season.test.js`

Expected: FAIL because `createWeatherViewModel` is not exported.

- [ ] **Step 3: Implement the view model and fetch function**

```js
const endpoint =
  "https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=59.9139&lon=10.7522";

export async function fetchOsloWeather() {
  const response = await fetch(endpoint);
  if (!response.ok)
    throw new Error(`MET Norway returned HTTP ${response.status}.`);
  return createWeatherViewModel(await response.json());
}
```

Build the returned object with `forecastPeriods`, `seasonId`, `time`,
`timeText`, `weatherDetails`, `weatherSummary`, and `weatherText`.

- [ ] **Step 4: Run the test suite to verify success**

Run: `npm test`

Expected: All tests pass.

- [ ] **Step 5: Commit the request boundary**

```bash
git add src/weather.js src/season.test.js
git commit --signoff --message "feat(weather): fetch oslo forecast"
```

### Task 4: Render the Weather Interface and Wind Barb

**Files:**

- Create: `src/main.jsx`
- Modify: `index.html`

**Interfaces:**

- Consumes: `fetchOsloWeather(): Promise<WeatherViewModel>`.
- Consumes: `mountSeasonalScene(container, variant): void`.
- Consumes: `getWindBarbSegments(speed): { calm: boolean, pennants: number, longBarbs: number, shortBarbs: number }`.
- Produces: the weather interface and error state in the DOM.

- [ ] **Step 1: Write the failing wind-barb data test**

Add the speed cases to `src/season.test.js`. Test metres per second values
that round to 0, 5, 10, and 50 knots:

```js
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
```

- [ ] **Step 2: Run the test to verify failure**

Run: `node --test src/season.test.js`

Expected: FAIL because `getWindBarbSegments` is not exported.

- [ ] **Step 3: Implement the National Weather Service wind-barb calculation**

Add `getWindBarbSegments(speed)` to `src/season.js`. Convert metres per
second to knots with `speed * 1.94384`, round to the nearest five knots, then
return the calm state and the count of 50-knot pennants, 10-knot long barbs,
and 5-knot short barbs.

- [ ] **Step 4: Run the wind-barb test to verify success**

Run: `node --test src/season.test.js`

Expected: PASS.

- [ ] **Step 5: Implement Weather Icon and wind-barb DOM helpers**

Create decorative `<i class="wi ...">` icon elements. Implement a wind barb
that consumes `getWindBarbSegments`, rotates the shaft to the wind-origin
direction, uses a calm circle, uses a short 5-knot barb, uses a long 10-knot
barb, and uses filled 50-knot pennants.

- [ ] **Step 6: Render the weather content**

Implement `refreshOsloWeather()` to:

- Render four centered summary card groups.
- Render centered detail icon-and-value groups without visible labels.
- Set each detail card `aria-label` to Wind, Pressure, or Cloud cover.
- Render three forecast cards with title, icon-and-condition row, and optional precipitation.
- Render forecast time and a MET Norway source link.
- Swap the background scene when the forecast season changes.

- [ ] **Step 7: Implement the request failure state**

On a rejected request, show `Current weather for Oslo is unavailable.`, clear
details, hide the forecast, and log the request error with `console.warn`.

- [ ] **Step 8: Run the test suite to verify success**

Run: `npm test`

Expected: All tests pass.

- [ ] **Step 9: Commit the weather renderer**

```bash
git add src/main.jsx index.html src/season.test.js
git commit --signoff --message "feat(weather): render current conditions"
```

### Task 5: Add Responsive Seasonal Styling and Documentation

**Files:**

- Modify: `index.html`
- Create: `README.md`

**Interfaces:**

- Consumes: DOM identifiers from Task 4.
- Produces: responsive, accessible visual styling and project instructions.

- [ ] **Step 1: Add the light and dark seasonal design tokens**

Define `--season-text: #1f2933`, `--season-muted: #3b4652`, and
`--season-link: #0550ae` for light scenes. Override the seasonal wash and
foreground colors in the dark color-scheme media query.

- [ ] **Step 2: Style the background and weather panel**

Set `#seasonal-scene` to a fixed full-screen layer behind a centered weather
panel. Add the translucent seasonal wash. Keep all text and links readable
without blurred text shadows.

- [ ] **Step 3: Style weather cards and responsive layouts**

Use these desktop and mobile rules:

```css
#oslo-weather.weather-summary {
  display: grid;
  grid-template-columns: repeat(4, auto);
  gap: 0.5rem;
}
#oslo-weather-details,
#oslo-forecast-periods {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
}
.weather-summary-item,
.weather-reading dd,
.weather-period > span:not(.weather-period-precipitation) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
}
@media (max-width: 720px) {
  #oslo-weather-details,
  #oslo-forecast-periods {
    grid-template-columns: 1fr;
  }
  #oslo-weather.weather-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

- [ ] **Step 4: Write the README**

Document setup, development, tests, production build, MET Norway attribution,
Weather Icons attribution, and the NWS wind-barb reference URL.

- [ ] **Step 5: Run the full verification set**

Run: `npm test && npm run build`

Expected: Tests pass and Vite creates `dist/`.

- [ ] **Step 6: Verify desktop and mobile layouts in a browser**

Run: `npm run dev -- --host 127.0.0.1 --port 4173`

Verify at 1200 pixels and 390 pixels wide:

- Current summary cards display the icon left of the value and center the pair.
- Detail cards show the icon, wind barb where applicable, and value without a visible label.
- Forecast cards show an icon left of condition text.
- Foreground text remains dark and readable on the light seasonal wash.
- The browser console has no errors.

- [ ] **Step 7: Commit styling and documentation**

```bash
git add index.html README.md
git commit --signoff --message "docs: add weather application guide"
```
