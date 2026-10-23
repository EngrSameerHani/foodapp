# Zawadi Food — Mobile Frontend

A complete React Native + Expo app for the Zawadi Food delivery platform.
Works **fully offline in demo mode** or connects to the real FastAPI backend.

---

## Quick Start

```bash
cd mobile-frontend
cp .env.example .env        # MOCK_MODE=true by default
npm install
npx expo start
```

Scan the QR code with **Expo Go** (Android/iOS). The app runs immediately with demo data — no backend needed.

---

## Demo Mode (Default)

Demo mode is ON by default (`EXPO_PUBLIC_MOCK_MODE=true`). The app uses pre-loaded sample data:

**Login:** Enter any demo phone number → OTP is always `123456`

| Role    | Phone        | Name            |
|---------|--------------|-----------------|
| Customer | +15550000001 | Alice Johnson   |
| Customer | +15550000002 | Bob Smith       |
| Restaurant | +15550000010 | Frank Miller  |
| Restaurant | +15550000011 | Grace Lee     |
| Rider   | +15550000020 | Ivan Martinez   |

Demo data includes:
- 3 restaurants with full menus (Zawadi Burgers, Nairobi Kitchen, Sakura Ramen)
- Sample orders (delivered + active)
- 2 vouchers (`WELCOME20`, `SAVE5`)
- Rider delivery history with earnings

**Toggle demo mode** in-app: Profile → "Demo mode: ON/OFF"

---

## Connecting the Real Backend

1. Deploy the backend (see main project README for Render/Railway/Docker instructions)
2. Edit `.env`:
   ```
   EXPO_PUBLIC_MOCK_MODE=false
   EXPO_PUBLIC_API_URL=https://YOUR_BACKEND_URL/api/v1
   EXPO_PUBLIC_WS_URL=wss://YOUR_BACKEND_URL/ws
   ```
3. Restart: `npx expo start`

The app automatically routes all API calls to the real backend. All endpoints are already wired in `src/services/index.ts`.

---

## Project Structure

```
mobile-frontend/
├── app/                        # Expo Router screens (file-based routing)
│   ├── _layout.tsx             # Root: QueryClient + Toast + auth hydrate
│   ├── index.tsx               # Auth guard → redirects by role
│   ├── (auth)/                 # Onboarding, login, OTP verify
│   ├── (customer)/             # Customer tab navigator + screens
│   │   ├── index.tsx           # Home: restaurant list, search, filter, sort
│   │   ├── search.tsx          # Full-text search
│   │   ├── restaurant/[id].tsx # Restaurant page + menu + item detail sheet
│   │   ├── cart.tsx            # Cart with promo codes + price breakdown
│   │   ├── checkout.tsx        # Address picker + payment + order placement
│   │   ├── order/[id].tsx      # Live order tracking (auto-advancing in mock)
│   │   ├── order/history.tsx   # Order history + reorder + reviews
│   │   ├── favorites.tsx       # Saved restaurants
│   │   └── profile.tsx         # Profile, demo toggle, logout
│   ├── (restaurant)/          # Restaurant owner screens
│   │   ├── index.tsx           # Orders dashboard (New/Active/History)
│   │   ├── menu.tsx            # Menu management with availability toggle
│   │   └── profile.tsx         # Store settings
│   └── (rider)/               # Rider screens
│       ├── index.tsx          # Online toggle + active delivery
│       ├── history.tsx        # Delivery history + earnings
│       └── profile.tsx        # Rider profile
├── src/
│   ├── components/ui/         # Button, Card, Badge, Skeleton, Empty, Toast
│   ├── data/                  # Mock data: users, restaurants, orders, vouchers
│   ├── hooks/useTheme.ts      # Light/dark theme hook
│   ├── services/              # API layer (mock + real, auto-switching)
│   ├── store/                 # Zustand: auth, cart, app (mock/favorites), orders
│   ├── theme/                 # Colors, spacing, typography, shadows
│   ├── types/                 # TypeScript types mirroring backend schemas
│   └── utils/                 # Currency/date/status formatters, ID generator
├── assets/                    # App icon, splash, adaptive icon, favicon
├── app.json                   # Expo config
├── eas.json                   # EAS Build profiles (preview=APK, production=AAB)
├── package.json
├── tsconfig.json
├── babel.config.js
├── metro.config.js
├── .env.example
└── .gitignore
```

---

## All Screens

### Auth (3 screens)
- **Onboarding** — 3-slide intro with skip
- **Login** — Phone input + role selector (Customer/Restaurant/Rider)
- **Verify OTP** — 6-digit OTP boxes with auto-verify, resend timer

### Customer (9 screens)
- **Home** — Restaurant cards, cuisine filter chips, sort (rating/delivery time), search bar, pull-to-refresh, skeleton loaders
- **Search** — Full-text search across restaurant names and cuisines
- **Restaurant Detail** — Cover, rating, delivery info, menu by category, item detail sheet with variations/add-ons/quantity/special instructions
- **Cart** — Quantity steppers, remove, promo code validation, price breakdown (subtotal/delivery/service/tax/discount/total)
- **Checkout** — Address selection, delivery note, payment method (Cash active, Card "coming soon"), order summary, place order
- **Order Tracking** — Status timeline (7 steps), auto-advancing in demo mode, ETA, items summary, review CTA
- **Order History** — Status badges, reorder, rate, track buttons
- **Favorites** — Heart-toggle saved restaurants
- **Profile** — Avatar, name, demo mode toggle, order history link, logout

### Restaurant Owner (3 screens)
- **Orders Dashboard** — New/Active/History tabs, accept/reject/advance status, order details
- **Menu Management** — Category list, item availability toggle switch
- **Store Profile** — Settings, logout

### Rider (3 screens)
- **Delivery** — Online/offline toggle, active delivery card with navigate buttons, status updates (Pickup → On the Way → Delivered)
- **History** — Earnings summary card, delivery list
- **Profile** — Stats (deliveries, earnings, rating), logout

---

## Building an APK

### Step 1 — Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2 — Login & link project
```bash
cd mobile-frontend
eas login                    # expo.dev account
eas build:configure          # select Android
```

### Step 3A — Build APK in demo mode (no backend needed)
```bash
eas build --platform android --profile preview-mock
```
This builds an APK that runs entirely with demo data. Anyone can install and use it immediately.

### Step 3B — Build APK connected to your backend
1. Edit `eas.json` → replace `REPLACE_WITH_YOUR_BACKEND_URL` in the `preview` profile
2. Build:
```bash
eas build --platform android --profile preview
```

### Step 4 — Download & install
- EAS gives you a download link when the build finishes (~10-15 min)
- Open the link on your Android phone
- Enable "Install from unknown sources" if prompted
- Install the `.apk` file

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `EXPO_PUBLIC_MOCK_MODE` | `true` = offline demo data, `false` = real backend | `true` |
| `EXPO_PUBLIC_API_URL` | Backend REST API base URL | `http://localhost:8000/api/v1` |
| `EXPO_PUBLIC_WS_URL` | Backend WebSocket URL | `ws://localhost:8000/ws` |

For EAS builds, set these in `eas.json` under the profile's `env` block.

---

## Tech Stack

- React Native 0.74 + Expo SDK 51
- Expo Router v3 (file-based navigation)
- TypeScript (strict)
- Zustand (state management)
- TanStack Query v5 (server cache, when connected to backend)
- Axios (HTTP client with token interceptor)
- AsyncStorage (token + cart persistence)

---

## Uploading to GitHub

```bash
cd mobile-frontend
git add .
git commit -m "Add mobile-frontend"
git push
```

`.gitignore` excludes: `node_modules/`, `.expo/`, `.env`, `ios/`, `android/`, build artifacts.

---

## What Works vs What Needs Backend

| Feature | Demo Mode | Real Backend |
|---|---|---|
| Login (OTP) | ✅ (OTP = 123456) | ✅ |
| Browse restaurants | ✅ | ✅ |
| Restaurant menu + detail | ✅ | ✅ |
| Add to cart | ✅ | ✅ |
| Promo codes | ✅ (WELCOME20, SAVE5) | ✅ |
| Checkout + place order | ✅ (local store) | ✅ |
| Order tracking (live) | ✅ (auto-advancing) | ✅ (WebSocket) |
| Order history + reorder | ✅ | ✅ |
| Reviews | ✅ | ✅ |
| Favorites | ✅ | ✅ (local) |
| Restaurant order management | ✅ | ✅ |
| Rider delivery flow | ✅ | ✅ |
| Push notifications | ❌ | ✅ (needs Firebase) |
| Live map tracking | ❌ (placeholder) | ✅ (needs Maps API key) |
