# Garaj app

Vehicle paperwork and service tracker for Sri Lanka: revenue license, insurance and emission test reminders, service bars, fuel and cost tracking for every vehicle you own. Android and iPhone.

Part of [Gedara Workshop](https://github.com/gedara-workshop). Landing page: [garaj-landing](https://github.com/gedara-workshop/garaj-landing).

## Stack

- Expo SDK 57, React Native 0.86, Expo Router (file-based routes in `src/app`)
- NativeWind 4 (Tailwind classes) with the Garaj design tokens as CSS variables, light and dark
- Inter, JetBrains Mono and Noto Sans Sinhala via `@expo-google-fonts`
- Lucide icons, `expo-image`, `expo-image-picker`
- Supabase for auth, Postgres and storage (schema in `supabase/migrations`, not wired up yet)

## Run it

Needs Node 20.19.4 or newer (`.nvmrc` pins 24, so `nvm use` picks it).

```bash
npm install
cp .env.example .env.local   # then fill in the Supabase URL and publishable key
npx expo start
```

Then press `i` for the iOS simulator, `a` for Android, or scan the QR code with Expo Go.

Checks: `npm run typecheck`.

## What works now (week 1)

- Home: vehicle cards (most urgent first), upcoming renewals, "Snap a bill" button (placeholder)
- Vehicle detail: photo header, stats, renewal tickets with "Mark renewed", service bars, history
- Add vehicle: photo, type, make and model, number plate, odometer, renewal dates
- Vehicles, Costs and Me (reminder settings) tabs
- Sample data: the founder's own garage, held in memory (`src/data/GarageProvider.tsx`)

## Next

1. Supabase project: run `supabase/migrations/0001_garaj_init.sql`, add phone OTP sign in
2. Swap `GarageProvider` for Supabase queries (TanStack Query), upload photos to storage
3. Renewal reminders with `expo-notifications`
4. Snap a bill: photo to a Supabase Edge Function that calls a vision model, then a review screen

## Structure

```
src/
  app/                 routes: (tabs)/index, vehicles, costs, me; vehicle/[id]; vehicle/new
  components/          Txt, Plate, StatusChip, VehicleCard, RenewalTicket, ServiceProgress, TimelineRow, Button
  data/                types, status rules (30 days / 1,000 km), sample garage, GarageProvider
  theme/               tokens (light and dark) and ThemeProvider
supabase/migrations/   database schema with row level security
```

## Design rules worth knowing

- Every text goes through `<Txt variant=...>`; React Native text doesn't inherit fonts.
- Colors are tokens (`bg-surface-200`, `text-ink-muted`, `bg-brand`); never hard-code a hex in a component.
- Status colors (`ok`, `soon`, `due`) only ever mean status, and always come with an icon and words.
- Join classes with `cn()` so overrides win; NativeWind doesn't resolve conflicting classes by order.
