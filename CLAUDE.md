# Garaj app: project guide for Claude

Read this before changing anything. It holds the product decisions, the design system and the architecture plan, so work stays consistent across sessions.

## What Garaj is

Garaj is a vehicle paperwork and service tracker for Sri Lanka, on Android and iPhone. It keeps revenue licenses, insurance, emission tests, services, fuel and costs for every vehicle someone owns, and reminds them before anything expires.

- Owner: Dinal (solo developer, builds mostly in the evenings). GitHub org: `gedara-workshop`.
- Audience: anyone with a vehicle (people, families, small businesses). **Designed for individual owners first**, with multi-vehicle owners as the most valuable users. One app for everyone: a person with one bike is just a garage with one vehicle.
- Vehicles in scope: car, SUV / jeep, van, pickup, three-wheeler, motorbike, lorry.
- Local by default: LKR, km, Sri Lankan number plates (new `WP CAB-4521` and old `31-8899` formats), revenue license and emission test, Sinhala and Tamil alongside English.

### Product decisions already made

- **Vehicle visuals:** the owner adds a photo of their own vehicle. No 3D models or AI renders. Without a photo, show a body-type icon on the teal band. A background-removed "cut-out" photo is a later idea, not MVP.
- **Service records as legal proof:** on hold. Records are for the owner's own use, not certified history.
- **Snap a bill:** the AI hook. Photo of a bill, AI fills in the entry, the user checks and saves. Fields the AI is unsure of are flagged amber, never silently saved.
- **Reminders:** 30 days before by default, again 7 days before, and on the day. WhatsApp reminders later.
- **Sign in:** phone number with an SMS code, plus Google. Apple sign-in comes with the iPhone App Store launch (Apple requires it on iOS when Google is offered). Each method creates its own account for now: phone and Google are not linked, so a "link sign-in methods" option in Me is needed before launch.
- **Launch:** build for Android and iPhone from day one. Share with iPhone testers through the web build or Expo Go. Buy the Apple Developer membership (US$99 a year) only when the demand test passes and the app is close to submission. Google Play is US$25 once; new personal accounts may need a 12-tester, 14-day closed test first.
- **Business model:** free for 1 to 2 vehicles, then a small monthly fee per extra vehicle. Families stay free, fleets pay.
- **Demand test first:** the landing page (`gedara-workshop/garaj-landing`, live at garaj-landing.vercel.app, signups in Formspree, Vercel Analytics) runs a 2-week test. Go signal: 50+ signups or 5%+ of visitors signing up.

## Design system

Source of truth: the Garaj design system artifact (https://claude.ai/artifact/J9MaqsSs9L5omNs2KaAVHv) and the screen designs (https://claude.ai/artifact/RxBKKZiDaiFPvauDnGEHLH). Both are private to Dinal. In code, the tokens live in `src/theme/tokens.ts` and must stay in sync with the design system.

### Principles

1. **Glanceable first.** Someone opens Garaj for two seconds at a traffic light or a fuel pump. Home answers "is anything due?" before anything else.
2. **Status is the only loud color.** Calm neutrals plus one teal. Green, amber and red only ever mean ok, soon and due.
3. **Numbers are the content.** Km, days, rupees and plates use the mono face with tabular figures.
4. **Local by default.** See above.
5. **One-handed.** 48px minimum touch targets (44px for small chips), primary action at the bottom.

### Color tokens (light / dark)

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| surface-100 | #f5f5f1 | #101312 | Page background |
| surface-200 | #ffffff | #191d1c | Cards, sheets, tab bar |
| surface-300 | #ebebe5 | #232827 | Tracks, inputs, icon wells |
| ink | #141917 | #eef1ef | Primary text |
| ink-muted | #5a625f | #a2aaa6 | Secondary text (dates, captions) |
| line | #dcdcd4 | #2f3533 | Hairlines, card borders |
| brand | #0e5c55 | #4cc3b4 | Garaj teal: primary button, active tab, links |
| brand-ink | #ffffff | #06211e | Text on brand |
| brand-tint | #dcefeb | #15302c | Hero band, service icon wells, selected chips |
| signal | #f2a93b | #f2a93b | The logo's reminder dot ONLY, never UI |
| ok / ok-tint | #1d7238 / #e0f1e5 | #5fcf88 / #163322 | Status: more than 30 days or 1,000 km away |
| soon / soon-tint | #8a4f00 / #fcefd5 | #f3b543 / #3a2c10 | Status: within 30 days, 1,000 km, or 70% of a service interval |
| due / due-tint | #b02318 / #fbe2df | #ff8b7b / #3e1a16 | Status: overdue or expired |
| plate-bg / plate-ink | #ffffff / #111111 | #f2f2ec / #111111 | Number plates, light in both themes like a real plate |

Over vehicle photos: white text on a bottom scrim fading to `rgba(0,0,0,0.62)` (`PhotoScrim`).

### Type

- Inter for UI (400, 500, 600, 700, 800), JetBrains Mono for numbers and plates (600, 700), Noto Sans Sinhala for Sinhala (taller line height, 24px for 15px text, so vowel signs don't clip). Noto Sans Tamil is planned and not loaded yet.
- Scale (`Txt` variants): display 32/38 bold, title 22/28 semibold, heading 17/24 semibold, body 15/22, label 13/18 medium, caption 12/16 medium muted, stat 20/26 mono, number 14/18 mono.

### Spacing, radius, shape

- 4px base: 4, 8, 12, 16, 24, 32. Screen gutter and card padding 16.
- Radius: sm 8 (chips, inputs, wells), md 14 (buttons, tickets, list cards), lg 22 (hero card, sheets), full for status chips and bars.
- One shadow at most, light theme only. Dark mode uses surface steps instead.

### Components (in `src/components`)

- **Txt**: all text goes through it. React Native text doesn't inherit fonts.
- **VehicleCard**: hero card per vehicle. Photo band (or body-type icon on brand-tint), ONE next-up item with a StatusChip, three stats (km on clock, km to service, LKR this year). Most urgent vehicle first.
- **RenewalTicket**: ticket shape for anything that expires. The ticket shape means "document", so use it only for renewals. Days count in mono, colored by status. "Mark renewed" rolls the date forward a year.
- **ServiceProgress**: km bars toward the next service. Max 4 per card.
- **TimelineRow**: one history entry. Meta order is always place, km, date. Amounts are plain numbers; the screen says "LKR" once.
- **StatusChip**: always icon plus words ("12 days", "3 days over"), never color alone.
- **Plate**: optional province cell plus mono characters.
- **Button**: primary (one per screen), secondary, ghost.

### Voice

Short, plain, friendly. Say the number, not the feeling: "Revenue license due in 12 days", not "Warning! Expiring soon!!". Buttons are verbs: "Snap a bill", "Mark renewed", "Add vehicle". Sinhala and Tamil copy is written natively, not translated word for word.

### Logo

Lowercase wordmark "garaj" in round strokes, with the dot on the "j" in signal amber (the reminder dot). The app icon is the "g" plus the dot, white on a teal rounded square. Never recolor the dot.

## Architecture

### Stack

- Expo SDK 57, React Native 0.86, TypeScript strict, Expo Router (file routes in `src/app`)
- NativeWind 4 + Tailwind 3. Colors are CSS variables set by `ThemeProvider` (`vars()`), so light and dark switch by swapping variables. Do not write `dark:` classes.
- `tailwind-merge` via `cn()` for class overrides (NativeWind does not resolve conflicting classes by order).
- Lucide icons, `expo-image`, `expo-image-picker`, `@expo-google-fonts/*`
- Planned: Supabase (auth, Postgres, storage, Edge Functions), TanStack Query, Zod, `expo-notifications`, EAS Build

### Folders

```
src/
  app/                 routes
    _layout.tsx        fonts, ThemeProvider, GarageProvider, root Stack
    (tabs)/            Home (index), Vehicles, Costs, Me
    vehicle/[id].tsx   vehicle detail
    vehicle/new.tsx    add vehicle (modal)
    renewal/edit.tsx   add (?vehicleId=) or edit (?id=) a renewal (modal)
    record/edit.tsx    add (?vehicleId=) or edit (?id=) a fuel, service, repair or other entry (modal)
    service/edit.tsx   add service items with suggestions (?vehicleId=) or edit one (?id=) (modal)
  components/          design system components
  data/
    types.ts           Vehicle, Renewal, ServiceItem, LogRecord
    rules.ts           status thresholds and sorting (single place for business rules)
    format.ts          numbers, LKR, dates
    sample.ts          sample garage (Dinal's real vehicles), dates relative to today; no longer loaded by the app
    GarageProvider.tsx Supabase through TanStack Query, the only thing screens talk to
  theme/               token-names.js (shared with tailwind.config.js), tokens.ts, ThemeProvider.tsx
supabase/migrations/   database schema
assets/                icons, splash, sample vehicle photos
```

### Data flow

Screens only call `useGarage()`. It loads the signed-in person's garage from Supabase with one TanStack Query (key `["garage", userId]`) and writes straight to Supabase, refetching after each save; "Mark renewed" updates optimistically. Keep this hook shape so screens don't change. Keep business rules (thresholds, sorting, renewal roll-forward) in `src/data/rules.ts`, not in screens.

### Data model (Supabase, `supabase/migrations/0001_garaj_init.sql`)

- `garages` is the workspace. `garage_members` has roles: **owner** (everything), **editor** (vehicles, renewals, records), **logger** (a driver or family member: can add records, can't delete).
- `vehicles`, `renewals`, `service_items`, `records`, all carrying `garage_id` for row level security through `is_garage_member()`.
- A trigger creates a garage for every new user.
- Storage buckets (planned): `vehicle-photos`, `bills`. Store object paths, not URLs.
- `records.extracted` keeps the raw fields the AI read from a bill.

### Planned flows

- **Auth:** phone OTP via Supabase (SMS fits Sri Lanka better than email). Codes are sent through Text.lk (about Rs 0.64 per SMS) using Supabase's Send SMS hook, a small Edge Function, since local gateways aren't built into Supabase. Google uses the browser OAuth flow (`expo-web-browser`), which works in Expo Go; switch to a native Google SDK later only if it's worth it.
- **Reminders:** schedule local notifications with `expo-notifications` from renewal dates, and keep due dates in the database so they can be rescheduled after a reinstall. Ask for permission on a custom "Turn on reminders" screen first, then the system prompt.
- **Snap a bill:** camera photo, then compress, then upload to the `bills` bucket, then a Supabase Edge Function calls a vision model with a fixed schema, then Zod-validate the response, then a review screen with low-confidence fields flagged. The API key lives only in the Edge Function. Also offer "Enter it manually" and handle blurry photos.
- **Sign-in setup (live):** the `send-sms` Edge Function (`supabase/functions/send-sms`) is the Supabase Send SMS hook; secrets `SEND_SMS_HOOK_SECRET`, `TEXTLK_API_TOKEN`, `TEXTLK_SENDER_ID` (`TextLKDemo` until a "Garaj" sender ID is approved). Redeploy with `npx supabase functions deploy send-sms --no-verify-jwt --project-ref dtxhezxengwkjyktaxxm`. Google uses PKCE (`src/data/googleSignIn.ts`); Redirect URLs allow `garaj://**`, `exp://**` and `http://localhost:8081/**`. Supabase rejects redirect URLs with an IP host, so test Google in Expo Go with `npx expo start --tunnel`.
- **Offline:** queue failed saves locally and retry; full sync later if needed.
- **Photos (live):** `src/data/photos.ts` shrinks to 1200px wide JPEG (`expo-image-manipulator`), uploads to the private `vehicle-photos` bucket at `<garage_id>/<vehicle_id>-<timestamp>.jpg`, and the garage query turns `photo_path` into a signed link (cacheKey = path). Migrations are pushed with `npx supabase db push --linked` (project is linked).

## Status and roadmap

- **Week 1 (done):** project setup, theme, components, Home, Vehicle detail, Add vehicle, Vehicles, Costs, Me (local settings), sample data, schema.
- **Week 2:** Supabase project (done), Supabase client (done), phone and Google sign in, replace GarageProvider with real persistence (done), photo upload (done), renewals CRUD (done).
- **Week 3:** Snap a bill (Edge Function + review screen), fuel and service logging, cost per km.
- **Week 4:** reminders and notification prompt, empty and error states, Sinhala strings, EAS builds, Play Store listing. App Store listing and Apple sign-in once the Apple membership is bought.

Designed but not built yet: Welcome, Sign in (OTP), Home empty state (basic version exists), Turn on reminders, Vehicle options sheet (edit, change photo, update odometer, sold, delete), Snap a bill review, Bill could not be read / offline, Sinhala Home, dark mode variants (dark already works through tokens).

Known gaps: phone and Google accounts aren't linked, no three-wheeler icon in Lucide (uses the car icon for now), "Snap a bill" is a placeholder alert, Me settings aren't persisted, Tamil font not loaded, ESLint not configured yet.

## Working rules

- **One small commit per task or feature.** Conventional Commits (`feat`, `fix`, `chore`, `docs`, `refactor`), imperative mood, short subject. Don't bundle unrelated changes.
- Run `npm run typecheck` before every commit; don't commit if it fails.
- **Never use the em dash character** anywhere: code, comments, commit messages, docs, UI copy. Use commas, periods or parentheses.
- Ask before adding a dependency. Use `npx expo install` for Expo and React Native packages so versions match the SDK. This Expo version is newer than most training data: check `node_modules` docs or https://docs.expo.dev before using an API from memory.
- UI rules: text through `Txt`; colors only through tokens (no hex in components except the photo scrim and placeholder text); join classes with `cn()`; status colors only mean status and always come with an icon and words; touch targets 44 to 48px with accessibility labels on icon-only buttons.
- Keep sample data realistic and Sri Lankan (places like Marawila, Chilaw; LKR amounts; real plate formats).
- Don't start big features (auth, AI) without checking the roadmap above and asking Dinal first.
