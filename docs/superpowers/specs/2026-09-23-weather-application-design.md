# Standalone Weather Application Design

## Purpose

Create a standalone browser application that presents the current Oslo
weather and short forecast against the existing seasonal Three.js background.
The application uses the MET Norway location forecast API and shows the data
with accessible Weather Icons and an National Weather Service style wind barb.

## Application Structure

The project is a Vite application with React used only for the background
scene. Plain browser DOM code renders the weather interface. This keeps the
existing scene integration intact and avoids adding a second UI framework.

The project has these main modules:

- `src/scene.jsx` mounts the copied seasonal scene.
- `src/weather.js` fetches and normalizes the MET Norway forecast response.
- `src/season.js` selects the seasonal scene and formats weather data.
- `src/main.jsx` renders weather cards, source attribution, and the wind barb.
- `src/shaders/` contains the copied seasonal background assets.

## Weather Data Flow

The browser requests the MET Norway compact location forecast for Oslo.
`season.js` selects the nearest valid time series entry, then returns:

- Four summary values: Oslo, temperature, condition, and humidity.
- Three icon-first detail values: wind, pressure, and cloud cover.
- Forecast periods for the next hour, six hours, and twelve hours.
- Source time and a season identifier based on the forecast temperatures.

The UI uses Weather Icons for temperature, condition, humidity, wind,
pressure, cloud cover, and forecast conditions. Weather icons are decorative.
The text values remain present for screen readers and visual users.

## Wind Barb

The wind detail uses an inline SVG wind barb. The shaft rotates toward the
reported wind-origin direction. Wind speed converts from metres per second to
knots and rounds to the nearest five knots. The SVG follows the National
Weather Service convention:

- A circle indicates calm wind.
- A short barb indicates five knots.
- A long barb indicates ten knots.
- A filled pennant indicates fifty knots.

The displayed wind value remains in metres per second with a compass
direction.

## Visual Design and Accessibility

The seasonal scene is a fixed, full-screen background. A light wash keeps the
weather surface readable. The weather interface is centered and responsive.
Summary values appear in four cards. Icon and value form a centered horizontal
group in each card. Detail cards omit visible labels, but retain accessible
names. Forecast cards show the period, centered icon-and-condition group, and
precipitation when present.

Seasonal foreground colors use explicit dark text and link values so light
background scenes cannot make the data unreadable. The existing dark-mode
override remains supported.

## Error Handling

If MET Norway cannot provide weather data, the application replaces the
weather area with a concise unavailable message and hides the forecast cards.
The seasonal background remains available. The browser logs the request error
for diagnosis.

## Validation

Unit tests cover forecast selection, season selection, weather formatting,
icon selection, and forecast-period formatting. The validation workflow runs
the test suite, creates a production build, and checks the desktop and mobile
weather-card layouts in a browser.
