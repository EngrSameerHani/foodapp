# Zawadi Food — Implementation Task List

**Version:** 1.0 MVP  
**Date:** October 2026  
**Build order:** Backend foundation → Customer flow → Restaurant flow → Rider + tracking → Polish

Each task is self-contained and ends with a verifiable outcome. Tasks within a phase can often be parallelised across backend and mobile tracks.

---

## Phase 1 — Backend Foundation & Auth

### Task 1.1 — Project scaffolding (backend)
- Initialise `backend/` with `pyproject.toml` / `requirements.txt`
- Packages: `fastapi`, `uvicorn[standard]`, `sqlalchemy[asyncio]`, `asyncpg`, `alembic`, `pydantic-settings`, `pyjwt`, `bcrypt`, `httpx`, `pytest`, `pytest-asyncio`
- Create folder tree: `app/api`, `app/core`, `app/models`, `app/schemas`, `app/services`, `app/websockets`
- Add `app/main.py` with app factory, CORS middleware, and health-check endpoint `GET /health`
- Add `backend/.env.example` and `.gitignore`

**Done when:** `uvicorn app.main:app` starts and `GET /health` returns `{"status": "ok"}`

---

### Task 1.2 — Database setup & migrations
- Configure async SQLAlchemy engine in `core/config.py` reading `DATABASE_URL` from env
- Create `alembic.ini` and `alembic/env.py` wired to the async engine
- Write ORM models for: `users`, `otp_attempts`, `refresh_tokens`
- Generate and run first migration
- Add `docker-compose.yml` and `Dockerfile` (multi-stage, `python:3.12-slim`)

**Done when:** `docker compose up` starts Postgres; `alembic upgrade head` applies migration; tables visible in `psql`

---

### Task 1.3 — OTP auth endpoints
- `POST /api/v1/auth/request-otp`: validate phone, generate 6-digit code, bcrypt-hash and store, log code to console (mock SMS)
- `POST /api/v1/auth/verify-otp`: look up hash, check TTL and max attempts, create user on first login, issue JWT access + refresh tokens
- `POST /api/v1/auth/refresh`: validate refresh token hash, rotate tokens
- `POST /api/v1/auth/logout`: revoke refresh token
- Sliding-window rate limiter on `request-otp` (3 requests / phone / 10 min)
- Role embedded in JWT (`role` claim)

**Done when:** Full OTP flow works via `curl`/Postman; rate limit returns 429 on 4th attempt

---

### Task 1.4 — Auth test suite
- `tests/test_auth.py`: happy-path OTP flow, wrong code (increment attempts), expired OTP, rate limiting, token refresh, logout (revoked token rejected)
- Set up `conftest.py` with async test client and in-memory test DB fixture

**Done when:** `pytest tests/test_auth.py` passes (all green)

---

### Task 1.5 — All remaining DB models & migrations
- ORM models for: `addresses`, `restaurants`, `menu_categories`, `menu_items`, `item_variations`, `carts`, `cart_items`, `orders`, `order_items`, `payments`, `vouchers`, `reviews`, `rider_profiles`, `rider_locations`, `notifications`
- Generate single migration covering all new tables
- Alembic `upgrade head` runs cleanly

**Done when:** All tables exist in DB; no SQLAlchemy mapping errors on startup

---

### Task 1.6 — Seed script
- `backend/seed.py` (runnable with `python seed.py`):
  - 3 restaurants with full menus (categories + items + variations)
  - 5 customer accounts (phone numbers listed in README)
  - 3 rider accounts
  - 2 voucher codes
  - All passwords/OTPs printed to console for demo use

**Done when:** `python seed.py` runs without errors; demo data queryable in DB

---

## Phase 2 — Core REST API (backend)

### Task 2.1 — Users & addresses API
- `GET /api/v1/users/me` — return current user profile
- `PATCH /api/v1/users/me` — update name, avatar_url, expo_push_token
- `GET/POST/PATCH/DELETE /api/v1/addresses` — full CRUD, enforce `is_default`

**Done when:** Endpoints return correct data; RBAC rejects wrong roles

---

### Task 2.2 — Restaurants & menu API
- `GET /api/v1/restaurants` — list with filters (cuisine, rating, max_delivery_time, has_promo), sorting, pagination, distance filter using lat/lng query params
- `GET /api/v1/restaurants/{id}` — detail with nested menu
- `POST /api/v1/restaurants` — create (restaurant_owner role only)
- `PATCH /api/v1/restaurants/{id}` — update (owner only)
- `GET /api/v1/restaurants/{id}/menu` — grouped by category
- `POST/PATCH/DELETE /api/v1/menu/categories`
- `POST/PATCH/DELETE /api/v1/menu/items`

**Done when:** Customer can list restaurants filtered by location; owner can create and edit menu

---

### Task 2.3 — Cart API
- `GET /api/v1/cart` — return current customer cart with computed totals
- `PUT /api/v1/cart` — replace cart contents (idempotent upsert)
- `DELETE /api/v1/cart` — clear cart

**Done when:** Cart CRUD works; totals (subtotal, fees, tax) computed server-side correctly

---

### Task 2.4 — Orders API & state machine
- `POST /api/v1/orders` — place order from cart, validate stock/availability, compute final pricing, create order + order_items, clear cart, trigger rider assignment
- `GET /api/v1/orders` — paginated list (filtered by role: customer sees own, owner sees restaurant's, rider sees assigned)
- `GET /api/v1/orders/{id}` — order detail
- `PATCH /api/v1/orders/{id}/status` — transition with state machine validation (409 on invalid)
- `POST /api/v1/orders/{id}/cancel` — customer cancellation guard

**Done when:** `tests/test_orders.py` covers all valid transitions and at least 5 invalid ones (all pass)

---

### Task 2.5 — Vouchers, reviews, rider endpoints
- `POST /api/v1/vouchers/validate` — return discount amount or 400 with reason
- `POST /api/v1/reviews` — submit after DELIVERED order (one review per order)
- `PATCH /api/v1/rider/status` — toggle online/offline
- `PUT /api/v1/rider/location` — upsert rider lat/lng (called every 10 s from app)
- `GET /api/v1/rider/deliveries` — delivery history with earnings

**Done when:** Each endpoint returns correct responses; duplicate review returns 409

---

### Task 2.6 — WebSocket order tracking endpoint
- `ws://host/ws/orders/{order_id}?token=<jwt>` 
- Auth on upgrade (validate JWT from query param)
- Join/leave room on connect/disconnect
- `ConnectionManager.broadcast(room_id, message)` called from order status transitions and rider location updates
- Message types: `status_update`, `rider_location`, `ping/pong`

**Done when:** Two browser tabs connected to same order room both receive a broadcast when order status is changed via REST

---

### Task 2.7 — Notifications API
- `GET /api/v1/notifications` — paginated unread-first list
- `PATCH /api/v1/notifications/{id}/read`
- `PATCH /api/v1/notifications/read-all`
- `push_notification_service.py` — send to Expo Push API; store record in `notifications` table

**Done when:** Notification is created in DB on each order status transition

---

## Phase 3 — Mobile App Foundation

### Task 3.1 — Expo project scaffolding
- `npx create-expo-app@latest app --template expo-template-blank-typescript` inside `app/`
- Install dependencies: `expo-router`, `zustand`, `@tanstack/react-query`, `axios`, `expo-secure-store`, `expo-location`, `react-native-maps`, `expo-notifications`, `@expo/vector-icons`, `nativewind` (TailwindCSS for RN)
- Configure `app.json`: name "Zawadi Food", scheme "zawadi", bundleId
- Set up `app/_layout.tsx` as root layout with `<QueryClientProvider>` and `<ThemeProvider>`
- Add `.env` and `.env.example` with `EXPO_PUBLIC_API_URL`

**Done when:** `npx expo start` launches without errors; blank screen visible in Expo Go

---

### Task 3.2 — Theme, design system & shared components
- `theme/colors.ts` — primary `#E8003D`, full palette, dark-mode variants
- `theme/typography.ts` — font scale
- `theme/spacing.ts` — spacing constants
- Shared components: `Button`, `TextInput`, `Card`, `Badge`, `SkeletonLoader`, `EmptyState`, `ErrorState`, `Avatar`, `Divider`, `BottomSheet`
- `useTheme()` hook
- Safe-area wrapper applied globally

**Done when:** Storybook-style dev screen shows all components in light + dark mode

---

### Task 3.3 — Auth store & token management
- `store/authStore.ts` — Zustand store with `accessToken`, `user`, `role`, `isHydrated`
- Rehydrate tokens from `expo-secure-store` on app launch (before render)
- Axios instance in `services/apiClient.ts` with auth interceptor and silent refresh
- `store/settingsStore.ts` — theme preference persisted

**Done when:** App reads a stored token on cold launch and does not redirect to login if valid

---

### Task 3.4 — Auth screens (Onboarding → OTP flow)
- `app/(auth)/onboarding.tsx` — 3-page swipeable intro, "Get Started" button, skip option; shown once (flag in AsyncStorage)
- `app/(auth)/login.tsx` — phone number input with country code picker, "Send OTP" button
- `app/(auth)/verify-otp.tsx` — 6-box OTP input, countdown timer (5 min), "Resend" button
- On success: set tokens, decode role from JWT, redirect to correct navigator
- Loading states, error toasts for wrong code / too many attempts

**Done when:** Full OTP login works end-to-end against the running backend; role-based redirect works for all 3 roles

---

## Phase 4 — Customer App

### Task 4.1 — Customer tab navigator & home screen
- `app/(customer)/_layout.tsx` — 5-tab navigator: Home, Search, Cart, Favorites, Profile
- `app/(customer)/index.tsx` — Home screen:
  - Address selector header (shows selected address, tap to change)
  - Search bar (navigates to search screen)
  - Horizontal cuisine category chips (fetched from API)
  - Promotional banners carousel (auto-scroll, 3 s interval)
  - "Restaurants Near You" list — calls `useRestaurants()` hook with current location
  - Sort and filter bottom sheet
  - Skeleton loaders while loading; empty/error states
  - Pull-to-refresh

**Done when:** Home screen loads and displays seeded restaurants; filter by cuisine works

---

### Task 4.2 — Restaurant page & menu
- `app/(customer)/restaurant/[id].tsx`:
  - Cover image, logo, info bar (rating, delivery time, min order, fee)
  - Sticky category tab bar (jumps to section)
  - Menu items list grouped by category
  - "Add" button on each item → opens item detail bottom sheet
- Item detail bottom sheet:
  - Variation selector (radio group)
  - Add-ons selector (multi-check)
  - Quantity stepper
  - Special instructions text field
  - "Add to Cart" button with price
- Cart conflict modal (different restaurant warning)

**Done when:** Can browse menu and add items; cart state updates correctly; conflict modal appears when switching restaurants

---

### Task 4.3 — Cart screen
- `app/(customer)/cart.tsx`:
  - List of cart items with quantity steppers and remove buttons
  - Restaurant name header
  - Price breakdown card (subtotal, delivery fee, service fee, tax, discount, total)
  - Promo code input field (calls `POST /vouchers/validate`)
  - "Proceed to Checkout" button (disabled if cart empty)
  - Empty state with "Browse Restaurants" CTA

**Done when:** Cart reflects all add/update/remove operations; promo code applies discount; totals are accurate

---

### Task 4.4 — Checkout screen
- `app/(customer)/checkout.tsx`:
  - Delivery address section (list of saved addresses + "Add new" → map picker)
  - Map address picker screen using `expo-location` + `react-native-maps`
  - Delivery instructions text input
  - Payment method selector (Cash on Delivery active; Card/Wallet shows "Coming Soon")
  - Order summary recap
  - "Place Order" button → `POST /orders` → navigate to tracking screen

**Done when:** Order is placed successfully and appears in DB with status PLACED; rider assignment triggers

---

### Task 4.5 — Live order tracking screen
- `app/(customer)/order/[id].tsx`:
  - Map with customer marker, restaurant marker, rider marker (live-updating)
  - Status timeline component (6 steps, completed steps filled)
  - Estimated arrival time
  - Rider info card (name, rating, phone call button)
  - WebSocket hook `useOrderTracking(orderId)` updates map and timeline in real-time
  - Auto-navigate to review screen on DELIVERED

**Done when:** Changing order status via `PATCH /orders/{id}/status` causes timeline to update live on screen without refresh

---

### Task 4.6 — Order history, reorder & review
- `app/(customer)/order/history.tsx` — paginated list with status badges
- Order detail view (same as tracking but read-only for completed orders)
- "Reorder" button re-populates cart
- Review bottom sheet after delivery: star rating for restaurant + rider, comment field, submit calls `POST /reviews`

**Done when:** Past orders visible; reorder correctly populates cart; review submits and updates restaurant rating

---

### Task 4.7 — Favorites, profile & saved addresses
- `app/(customer)/favorites.tsx` — list of favourited restaurants (heart stored in Zustand + synced via API)
- `app/(customer)/profile.tsx` — name, phone, avatar, settings, logout
- Saved addresses list with default selector and delete option
- Notification preferences toggle (in-app / push)

**Done when:** Favorites persist across app restarts; profile edit saves to backend

---

## Phase 5 — Restaurant Owner App

### Task 5.1 — Restaurant owner navigator & dashboard
- `app/(restaurant)/_layout.tsx` — 3-tab navigator: Orders, Menu, Profile
- `app/(restaurant)/index.tsx` — Dashboard:
  - Open/Closed toggle (calls `PATCH /restaurants/{id}`)
  - Today's stats cards: orders, revenue, avg rating
  - Quick link to new orders

**Done when:** Owner can toggle restaurant open/closed; stats visible

---

### Task 5.2 — Restaurant registration flow
- First-time owner flow (shown if no restaurant linked):
  - Step 1: Basic info (name, description, cuisine types)
  - Step 2: Location (address + map pin)
  - Step 3: Hours, delivery radius, fees
  - Step 4: Photos (cover + logo, picked from camera roll)
  - Submit calls `POST /restaurants`

**Done when:** New restaurant created end-to-end; visible in customer restaurant list

---

### Task 5.3 — Menu management screen
- `app/(restaurant)/menu.tsx`:
  - Category accordion list with add/edit/delete
  - Item list per category with toggle availability switch
  - Item edit sheet: name, description, price, photo, variations, add-ons
  - Image upload (camera roll → `PATCH /menu/items/{id}` with multipart)

**Done when:** Owner can add a new item with a photo; item appears on customer menu immediately

---

### Task 5.4 — Incoming orders screen
- `app/(restaurant)/orders.tsx`:
  - Three tabs: New, Active, History
  - New orders card with sound alert (`expo-av`) and push notification
  - Accept / Reject (with reason) buttons → `PATCH /orders/{id}/status`
  - Active order card shows elapsed timer; "Mark Preparing" → "Ready for Pickup" buttons
  - Order history with date filter and earnings totals

**Done when:** Placing an order as customer causes it to appear on restaurant New tab with sound; accept/reject works

---

## Phase 6 — Rider App

### Task 6.1 — Rider navigator & online toggle
- `app/(rider)/_layout.tsx` — 3-tab navigator: Delivery, History, Profile
- `app/(rider)/index.tsx`:
  - Big online/offline toggle with status indicator
  - When online: starts location ping (`PUT /rider/location` every 10 s via `setInterval`)
  - Current delivery card if assigned, else "Waiting for orders…"

**Done when:** Going online starts location pings visible in `rider_locations` table

---

### Task 6.2 — Delivery request & active delivery screen
- Push notification received on assignment → opens delivery request card (60 s countdown)
- Accept / Decline buttons → `PATCH /orders/{id}/status`
- Active delivery screen:
  - Phase 1 (heading to restaurant): restaurant address, "Navigate" button (opens Google/Apple Maps with directions URL), "Mark Picked Up" button
  - Phase 2 (heading to customer): customer address, "Navigate" button, "Mark Delivered" button
  - Map with route overview

**Done when:** Rider receives push notification; accept triggers status change to ACCEPTED; navigation opens correct app

---

### Task 6.3 — Rider history & profile
- `app/(rider)/history.tsx` — delivery list with earnings per delivery, running total
- `app/(rider)/profile.tsx` — name, photo, vehicle type, account status
- Earnings summary card (today / this week / this month)

**Done when:** Completed deliveries appear in history with correct earnings

---

## Phase 7 — Real-time, Notifications & Polish

### Task 7.1 — Push notifications (end-to-end)
- On login, call `Expo.Notifications.getExpoPushTokenAsync()` and `PATCH /users/me` with token
- Request notification permissions (iOS prompt)
- Background notification handler: navigate to correct screen on tap
- Test: order status change triggers push to customer, restaurant, and rider

**Done when:** Physical device / simulator receives push on order status change

---

### Task 7.2 — Offline state & caching
- `NetInfo` listener sets global `isOffline` flag in Zustand
- Offline banner component shown at top of screen when offline
- TanStack Query `staleTime` / `gcTime` set so cached restaurant list is shown offline
- Cart persisted to `AsyncStorage` so it survives app restarts and offline periods

**Done when:** Turning off network in simulator shows offline banner and still shows cached restaurant list

---

### Task 7.3 — Light / dark mode
- System theme detection via `useColorScheme()`
- Manual override in settings stored in `settingsStore`
- All components use `useTheme()` — verify no hardcoded colours remain

**Done when:** Switching system theme or in-app toggle switches all screens correctly

---

### Task 7.4 — Animations & UX polish
- Skeleton loaders on all fetch screens (using `Animated` or `react-native-reanimated`)
- Cart icon badge bounce on item add
- Bottom sheet smooth snap animation
- Restaurant card press scale feedback
- Status timeline step fill animation (when status advances)
- Error toast component (slide-in from top)

**Done when:** All animations run at 60 fps on a mid-range Android emulator; no jank on restaurant list scroll

---

### Task 7.5 — Final backend tests
- `tests/test_orders.py` — full lifecycle: place → accept → prepare → ready → pickup → deliver
- `tests/test_orders.py` — invalid transitions (6 cases), cancellation edge cases
- `tests/test_restaurants.py` — CRUD, menu management, filter/sort
- `tests/test_riders.py` — online/offline, assignment, location update
- `tests/test_vouchers.py` — validate, apply, expired, max-uses exceeded

**Done when:** `pytest` passes with ≥ 40 tests, 0 failures

---

## Phase 8 — Documentation & Delivery

### Task 8.1 — README
- Project overview and screenshots placeholder
- Prerequisites (Node, Python, Docker, Expo CLI)
- Backend setup: Docker Compose (one-command) and manual setup
- Mobile setup: `npm install`, configure `.env`, `npx expo start`
- Demo accounts table (phone, role, OTP in dev = last 6 digits of phone)
- How to run tests (backend + mobile)
- Build release APK / IPA with EAS Build (`eas build --platform android`)
- Feature checklist (MVP vs. post-MVP)

**Done when:** A developer who clones the repo can follow the README to run both backend and app with no outside knowledge

---

### Task 8.2 — Code quality pass
- Run ESLint + Prettier on all mobile TypeScript; fix all errors
- Run `mypy` + `ruff` on all Python; fix all errors
- Ensure no `any` types in TypeScript (strict mode)
- Ensure all `.env` values referenced by name only in code (no secrets in source)
- Verify `.gitignore` covers `.env`, `node_modules`, `__pycache__`, `*.pyc`, `.expo`

**Done when:** `npm run lint` and `ruff check .` both exit 0 with no warnings

---

## Summary Table

| Phase | Tasks | Scope |
|---|---|---|
| 1 | 1.1 – 1.6 | Backend scaffolding, auth, DB, seed |
| 2 | 2.1 – 2.7 | Full REST API + WebSocket |
| 3 | 3.1 – 3.4 | Mobile foundation, theme, auth screens |
| 4 | 4.1 – 4.7 | Customer flow (browse → order → review) |
| 5 | 5.1 – 5.4 | Restaurant owner flow |
| 6 | 6.1 – 6.3 | Rider flow |
| 7 | 7.1 – 7.5 | Push, offline, polish, final tests |
| 8 | 8.1 – 8.2 | README and code quality |

**Total tasks: 30**

---

## Dependency Order

```
1.1 → 1.2 → 1.3 → 1.4
            1.2 → 1.5 → 1.6
1.3 → 2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6 → 2.7
3.1 → 3.2 → 3.3 → 3.4
3.4 → 4.1 → 4.2 → 4.3 → 4.4 → 4.5 → 4.6 → 4.7
3.4 → 5.1 → 5.2 → 5.3 → 5.4
3.4 → 6.1 → 6.2 → 6.3
(2.x and 3.x/4.x/5.x/6.x run in parallel after 1.x is done)
7.1 → 7.2 → 7.3 → 7.4 → 7.5
8.1 → 8.2
```
