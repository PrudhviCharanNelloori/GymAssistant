# Gym Workout Tracker

A mobile-first Angular PWA for personal gym workout execution and tracking.

## Repository

https://github.com/PrudhviCharanNelloori/GymAssistant.git

## Development

```bash
npm install
npm start        # dev server at http://localhost:4200 (service worker off)
npm run build    # production build with service worker
npm test         # unit tests
```

### Offline / install testing

1. `npm run build` then serve `dist/gym-assistant/browser` over HTTPS or `localhost`
2. Open Chrome DevTools → Application → Service Workers / Manifest
3. Use Network → Offline to confirm home, workouts, and history still load from IndexedDB + cached shell
4. Install prompt appears when the browser fires `beforeinstallprompt` (Chrome/Edge); Settings also has **Install app**

## Documentation

See [`docs/`](docs/) for product requirements, architecture, domain model, and roadmap.

- [Product Vision](docs/PRODUCT.md)
- [Domain Model](docs/DOMAIN-MODEL.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Roadmap](docs/ROADMAP.md)
- [AI Context](docs/AI-CONTEXT.md)

## Tech Stack

- Angular 22 (standalone, strict TypeScript)
- SCSS design tokens
- Dexie.js (IndexedDB)
- Angular PWA (service worker + install/update UX)

## Current Status

Phases 1–9 complete (foundation through PWA/offline hardening). See [ROADMAP.md](docs/ROADMAP.md) for remaining phases.
