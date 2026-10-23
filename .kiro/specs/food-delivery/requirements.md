# Zawadi Food — Requirements Document

**App name:** Zawadi Food  
**Version:** 1.0 MVP  
**Date:** October 2026

---

## 1. Overview

Zawadi Food is a native mobile food delivery platform (Android + iOS) with three user roles sharing a single app binary: **Customer**, **Restaurant Owner**, and **Rider**. It mirrors the core experience of Foodpanda — browse restaurants, place orders, track delivery in real time — while being fully operable from a locally run backend during development and easily deployable to production later.

---

## 2. Goals and Non-Goals

### Goals (MVP)
- Phone-number OTP login for all roles
- Customers can discover restaurants, build a cart, checkout, and track orders live
- Restaurant owners can manage their menu and accept/reject incoming orders
- Riders can receive, accept, and fulfill deliveries with real-time location sharing
- Backend exposes a documented REST API with WebSocket channels for live tracking
- App runs on Expo Go / Android emulator / iOS simulator against the local backend

### Non-Goals (post-MVP, tracked in feature checklist)
- Real online payment processing (card/wallet mocked)
- Admin dashboard
- In-app chat
- Analytics / BI
- Multi-language (Urdu/RTL deferred unless explicitly re-enabled)
- Surge pricing
- Scheduled orders

---

## 3. User Roles

| Role | Description |
|---|---|
| Customer | Browses restaurants, orders food, tracks delivery |
| Restaurant Owner | Manages their restaurant listing, menu, and incoming orders |
| Rider | Accepts delivery requests, navigates, updates order status |

Role is stored on the user profile. A user may only hold one role at a time in MVP.

---

## 4. Functional Requirements

### 4.1 Authentication (all roles)

| ID | Requirement |
|---|---|
| AUTH-01 | User enters a phone number; the backend sends a 6-digit OTP via SMS (mocked/logged in dev) |
| AUTH-02 | OTP has a 5-minute TTL; max 3 attempts before a 30-minute lockout |
| AUTH-03 | On successful verification the backend issues a JWT access token (15 min TTL) and a refresh token (30 days TTL) stored in expo-secure-store |
| AUTH-04 | Refresh token rotation: a new refresh token is issued on every silent refresh |
| AUTH-05 | Logout clears both tokens from secure storage and invalidates the refresh token server-side |
| AUTH-06 | Role is embedded in the JWT; the app renders the correct tab navigator on login |
| AUTH-07 | Onboarding flow (3 screens) shown once to new users before login |

### 4.2 Customer Features

#### 4.2.1 Home & Discovery

| ID | Requirement |
|---|---|
| CUST-01 | App requests device location on first launch; user can also type or pick an address manually |
| CUST-02 | Home screen shows: cuisine category chips, promotional banners, "Restaurants Near You" list |
| CUST-03 | Restaurant list is filtered to those whose delivery radius covers the selected address |
| CUST-04 | Sort options: Relevance (default), Rating, Delivery Time, Minimum Order, Distance |
| CUST-05 | Filter options: cuisine type, price range ($$/$$$), rating ≥ 4, offers/promo available, max delivery time |
| CUST-06 | Search bar performs full-text search on restaurant name, cuisine, and menu item name |

#### 4.2.2 Restaurant Page

| ID | Requirement |
|---|---|
| CUST-07 | Restaurant page shows cover photo, logo, rating, review count, estimated delivery time, delivery fee, minimum order amount |
| CUST-08 | Menu is grouped by category (sticky section header); each item shows name, description, price, photo, and an "Add" button |
| CUST-09 | Tapping an item opens a detail sheet: variations (size/flavour), add-ons (extras), quantity selector, special instructions text field |
| CUST-10 | If the cart already has items from a different restaurant, the app prompts to clear the cart before adding |

#### 4.2.3 Cart

| ID | Requirement |
|---|---|
| CUST-11 | Floating cart button shows item count and subtotal |
| CUST-12 | Cart screen lists items with quantity stepper and remove option |
| CUST-13 | Price breakdown: subtotal, delivery fee (dynamic from restaurant), service fee (flat), taxes (configurable %), promo discount, total |
| CUST-14 | Promo/voucher code field; backend validates and returns discount amount |

#### 4.2.4 Checkout

| ID | Requirement |
|---|---|
| CUST-15 | User selects or adds a delivery address (saved addresses list or pick on map) |
| CUST-16 | User can add a delivery instruction note |
| CUST-17 | Payment method selector: Cash on Delivery (active), Card / Wallet (shown but disabled with "Coming soon" badge) |
| CUST-18 | Order confirmation screen shown immediately after placement with order ID and estimated time |

#### 4.2.5 Order Tracking

| ID | Requirement |
|---|---|
| CUST-19 | Live order screen shows a 6-step status timeline: Placed → Accepted → Preparing → Ready → On the Way → Delivered |
| CUST-20 | When status is "On the Way", the rider's location updates on a map in near-real-time via WebSocket |
| CUST-21 | Customer receives a push notification at each status transition |

#### 4.2.6 Order History & Reviews

| ID | Requirement |
|---|---|
| CUST-22 | Order history list with status badges; tapping opens order detail |
| CUST-23 | "Reorder" button on completed orders adds all items back to cart |
| CUST-24 | After delivery, user is prompted to rate the restaurant (1–5 stars + comment) and the rider (1–5 stars) |

#### 4.2.7 Profile & Misc

| ID | Requirement |
|---|---|
| CUST-25 | Profile screen: name, phone, avatar, saved addresses, notification preferences, help & support link, logout |
| CUST-26 | Favorites: heart icon on restaurant cards; Favorites tab shows saved restaurants |
| CUST-27 | Offline mode: cached restaurant list and last order shown with a "No internet" banner |

### 4.3 Restaurant Owner Features

| ID | Requirement |
|---|---|
| REST-01 | Registration flow: restaurant name, description, cuisine type(s), address, cover + logo photo, opening hours per day, delivery radius (km), minimum order, delivery fee |
| REST-02 | Dashboard home: today's orders count, revenue, status (open/closed toggle) |
| REST-03 | Menu management: create/edit/delete categories and items; toggle item availability; set price, description, photo, variations, and add-ons |
| REST-04 | Incoming orders tab: new orders highlighted with sound alert and push notification; accept or reject with a reason |
| REST-05 | Accepted orders show a timer; owner marks order as "Preparing" then "Ready for Pickup" |
| REST-06 | Order history with filter by date; simple earnings summary (daily/weekly/monthly totals) |
| REST-07 | Profile: edit restaurant info, update opening hours, change password |

### 4.4 Rider Features

| ID | Requirement |
|---|---|
| RIDER-01 | Toggle online/offline; when online, device location is sent to the backend every 10 seconds |
| RIDER-02 | When a nearby order is assigned, rider receives a push notification and an in-app request card (60-second timeout to accept/decline) |
| RIDER-03 | Accepted delivery shows two-phase navigation: first to the restaurant, then to the customer; each phase has a "Navigate" button that opens Google Maps / Apple Maps with directions |
| RIDER-04 | Rider updates status: Picked Up → On the Way → Delivered |
| RIDER-05 | Delivery history list with earnings per delivery |
| RIDER-06 | Profile: name, photo, vehicle type, bank account details (display only in MVP) |

---

## 5. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-01 | API response time < 500 ms for list endpoints under normal load (single server, local dev) |
| NFR-02 | JWT secrets and database credentials never hardcoded; loaded from environment variables |
| NFR-03 | All API inputs validated with Pydantic; malformed requests return structured 422 responses |
| NFR-04 | OTP endpoint rate-limited: max 3 requests per phone number per 10 minutes |
| NFR-05 | Role-based access control: each endpoint checks the caller's role claim |
| NFR-06 | Strict TypeScript (no `any`); ESLint + Prettier enforced |
| NFR-07 | Shared type definitions for API request/response shapes (generated or hand-maintained in a `shared/` package) |
| NFR-08 | Light and dark mode using a theme provider |
| NFR-09 | Safe-area handling on all screens (notch, home indicator) |
| NFR-10 | Skeleton loaders on all data-fetching screens |
| NFR-11 | Pull-to-refresh on list screens |
| NFR-12 | Empty state and error state components on all list/data screens |
| NFR-13 | Docker Compose spins up backend + PostgreSQL in one command |
| NFR-14 | Seed script populates: 3 demo restaurants with full menus, 5 customers, 3 riders, 2 vouchers |

---

## 6. Order State Machine

```
PLACED
  └─► ACCEPTED   (by restaurant)
  └─► REJECTED   (by restaurant — terminal)
        └─► PREPARING  (by restaurant)
              └─► READY_FOR_PICKUP  (by restaurant)
                    └─► PICKED_UP   (by rider)
                          └─► ON_THE_WAY  (by rider)
                                └─► DELIVERED  (by rider — terminal)
                                └─► FAILED     (by rider — terminal)
CANCELLED  (by customer, only while PLACED or ACCEPTED)
```

Invalid transitions return HTTP 409.

---

## 7. Data Models (summary)

| Model | Key Fields |
|---|---|
| User | id, phone, name, role, avatar_url, is_active |
| OTPAttempt | id, phone, code_hash, expires_at, attempts |
| RefreshToken | id, user_id, token_hash, expires_at, revoked |
| Address | id, user_id, label, lat, lng, full_address, is_default |
| Restaurant | id, owner_id, name, description, cuisine_types[], cover_url, logo_url, rating, delivery_fee, min_order, delivery_radius_km, is_active, opening_hours (JSONB) |
| MenuCategory | id, restaurant_id, name, sort_order |
| MenuItem | id, category_id, name, description, price, photo_url, is_available |
| ItemVariation | id, item_id, label, options (JSONB: name+price_delta) |
| Cart | id, customer_id, restaurant_id |
| CartItem | id, cart_id, item_id, quantity, selected_options (JSONB), special_note |
| Order | id, customer_id, restaurant_id, rider_id, status, subtotal, delivery_fee, service_fee, tax, discount, total, address_id, payment_method, payment_status |
| OrderItem | id, order_id, item_id, quantity, unit_price, options_snapshot (JSONB) |
| Payment | id, order_id, method, status, amount, provider_ref |
| Voucher | id, code, discount_type (% / flat), value, min_order, max_uses, expires_at |
| Review | id, order_id, reviewer_id, restaurant_id, rider_id, restaurant_rating, rider_rating, comment |
| RiderLocation | id, rider_id, lat, lng, updated_at |
| Notification | id, user_id, title, body, type, is_read, created_at |

---

## 8. API Surface (summary)

| Group | Endpoints |
|---|---|
| Auth | POST /auth/request-otp, POST /auth/verify-otp, POST /auth/refresh, POST /auth/logout |
| Users | GET/PATCH /users/me |
| Addresses | GET/POST/PATCH/DELETE /addresses |
| Restaurants | GET /restaurants (list+filter), GET /restaurants/{id}, POST /restaurants (owner), PATCH /restaurants/{id} |
| Menu | GET /restaurants/{id}/menu, POST/PATCH/DELETE /menu/categories, POST/PATCH/DELETE /menu/items |
| Cart | GET/PUT /cart, DELETE /cart |
| Orders | POST /orders, GET /orders, GET /orders/{id}, PATCH /orders/{id}/status |
| Vouchers | POST /vouchers/validate |
| Reviews | POST /reviews |
| Riders | PATCH /rider/status (online/offline), GET /rider/deliveries |
| Notifications | GET /notifications, PATCH /notifications/{id}/read |
| Admin (stub) | — |

WebSocket: `ws://host/ws/orders/{order_id}` — broadcasts order status changes and rider location updates to subscribed clients.

---

## 9. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Mobile framework | React Native + Expo SDK 51 + TypeScript | Cross-platform, fast iteration, Expo Go for dev |
| Navigation | Expo Router v3 (file-based) | Aligns with Expo ecosystem, deep linking built-in |
| State management | Zustand | Lightweight, no boilerplate, easy to test |
| Server state | TanStack Query v5 | Caching, background refresh, pagination |
| Backend | Python 3.12 + FastAPI | Fast dev, auto OpenAPI docs, async support |
| ORM | SQLAlchemy 2.x (async) | Mature, migrations via Alembic |
| Database | PostgreSQL 16 | Relational integrity, JSONB for flexible fields |
| Auth tokens | PyJWT | Standard JWT library |
| Real-time | FastAPI WebSockets (native) | No extra infrastructure for MVP |
| Maps | react-native-maps + Expo Location | Standard in RN ecosystem |
| Push | Expo Notifications + FCM/APNs | Managed by Expo, works in Expo Go |
| Secure storage | expo-secure-store | Keychain (iOS) / Keystore (Android) |
| Containerization | Docker + docker-compose | Reproducible backend setup |

---

## 10. Folder Structure

```
zawadi-food/
├── app/                        # React Native / Expo project
│   ├── app/                    # Expo Router screens (file-based routes)
│   │   ├── (auth)/             # Login, OTP, onboarding
│   │   ├── (customer)/         # Customer tab navigator
│   │   ├── (restaurant)/       # Restaurant owner tab navigator
│   │   └── (rider)/            # Rider tab navigator
│   ├── components/             # Shared UI components
│   ├── hooks/                  # Custom React hooks
│   ├── services/               # API service layer (TanStack Query + axios)
│   ├── store/                  # Zustand stores
│   ├── utils/                  # Helpers, formatters, constants
│   ├── theme/                  # Colors, typography, spacing
│   └── types/                  # Shared TypeScript types (mirrored from backend)
│
├── backend/                    # FastAPI project
│   ├── app/
│   │   ├── api/                # Routers (auth, users, restaurants, orders, …)
│   │   ├── core/               # Config, security, dependencies
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── services/           # Business logic
│   │   ├── websockets/         # WebSocket connection manager
│   │   └── main.py
│   ├── alembic/                # Migrations
│   ├── tests/                  # Pytest suites
│   ├── seed.py
│   ├── Dockerfile
│   └── docker-compose.yml
│
└── README.md
```

---

## 11. Security Checklist

- [ ] All secrets via environment variables; `.env.example` committed, `.env` gitignored
- [ ] Passwords / OTP codes stored as bcrypt hashes only
- [ ] JWT signed with HS256 using a secret ≥ 32 bytes
- [ ] Refresh tokens stored as SHA-256 hashes in the DB
- [ ] CORS locked to app origins in production
- [ ] SQL injection prevented by SQLAlchemy parameterised queries
- [ ] File uploads (photos) validated by MIME type and size; stored in object storage (S3-compatible; local disk in dev)
- [ ] No sensitive data logged

---

## 12. Feature Completion Checklist

### MVP (this spec)
- [ ] Phone OTP auth for all roles
- [ ] Customer browse, cart, checkout, live tracking
- [ ] Restaurant menu management and order flow
- [ ] Rider accept/deliver flow
- [ ] Real-time WebSocket order updates
- [ ] Push notifications at status transitions
- [ ] Maps: delivery address picker, rider live location
- [ ] Voucher/promo codes
- [ ] Reviews and ratings
- [ ] Seed data and demo accounts
- [ ] Docker Compose backend setup
- [ ] README with full setup guide

### Post-MVP
- [ ] Real payment processing (Stripe / local gateway)
- [ ] Admin dashboard (web)
- [ ] In-app chat (customer ↔ rider)
- [ ] Analytics and reports
- [ ] Surge / dynamic pricing
- [ ] Scheduled / pre-orders
- [ ] Multi-language / RTL (Urdu)
- [ ] iOS App Store / Google Play submission via EAS
