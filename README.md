# Salah Tracker

An elegant, responsive prayer dashboard built with React, TypeScript, Vite and Tailwind CSS. Manchester is the default location.

## Develop

Requires Node.js 22.12+ (Node 24 recommended) and npm.

```sh
npm ci
npm run dev
```

In cloud environments where the default npm cache is not writable, use `npm ci --cache /workspace/.npm-cache`.

```sh
npm test             # prayer calculations, next-prayer rollover, history and streak logic
npm run build        # strict TypeScript check and production build
npm run test:e2e     # desktop and mobile Chromium integration tests
npm run preview     # serve the production build
```

Browser tests use `/usr/bin/chromium` by default in this cloud environment. On other machines, install Chromium and set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its executable.

## Features

- Five daily prayers, with reversible completion tracking and past-day navigation.
- Next prayer and live countdown, including tomorrow's Fajr after Isha.
- Daily completion, consecutive fully completed days, and a rolling seven-day summary.
- Offline prayer calculations using the Adhan library; no API key or external prayer service.
- Manchester coordinates by default; manual location, optional geolocation, five calculation methods and Hanafi Asr support.
- In-app reminders and optional browser notifications while the app remains open.
- Local saved history and settings, plus JSON export from Settings.
- Responsive layout, keyboard-accessible controls and settings dialog, and reduced-motion support.

## Prayer times and reminders

All displayed times and tracking dates use the device's timezone, shown beside the daily prayers. For Manchester, set the device to **Europe/London** to include UK daylight saving time. Location changes set calculation coordinates, not the device's timezone. The default method is Muslim World League; select a method appropriate to your mosque. Calculated times and the civil Hijri date can differ from local mosque schedules and moon sightings. Extreme latitudes may not have all calculable times.

Geolocation and browser notifications require a secure context (HTTPS or localhost) and browser permission. Notifications are best effort while this page is open; closed-app push notifications and background scheduling are not implemented. Browser throttling or a sleeping device may delay reminders.

History is saved in localStorage on this browser only. There is no account, server, cross-device sync, or analytics. Export a JSON backup before clearing browser data; import is not currently supported. Storage failures are surfaced in the dashboard.

## Repository

No credentials are required. `dist`, dependencies and test artifacts are ignored. The project is prepared for an initial commit; no commit or push is performed automatically.
