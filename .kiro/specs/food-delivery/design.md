# Zawadi Food — Architecture & Design Document

**Version:** 1.0 MVP  
**Date:** October 2026

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Mobile App (Expo)                        │
│   ┌──────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│   │   Customer   │  │ Restaurant Owner│  │      Rider       │  │
│   │  Navigator   │  │   Navigator     │  │   Navigator      │  │
│   └──────┬───────┘  └────────┬────────┘  └────────┬─────────┘  │
│          │                   │                    │             │
│   ┌──────▼───────────────────▼────────────────────▼─────────┐  │
│   │            Shared Services Layer                         │  │
│   │  TanStack Query │ Zustand │ Axios │ expo-secure-store    │  │
│   └──────────────────────────┬───────────────────────────────┘  │
│                               │ HTTP + WebSocket                 │
└───────────────────────────────┼─────────────────────────────────┘
                                │
                    ┌───────────▼────────────┐
                    │   FastAPI Backend       │
                    │  ┌──────────────────┐  │
                    │  │   REST Routers   │  │
                    │  │   WebSocket Hub  │  │
                    │  │   Auth / RBAC    │  │
                    │  │   Business Logic │  │
                    │  └────────┬─────────┘  │
                    │           │             │
                    │  ┌────────▼─────────┐  │
                    │  │  SQLAlchemy ORM  │  │
                    │  └────────┬─────────┘  │
                    └───────────┼────────────┘
                                │
                    ┌───────────▼────────────┐
                    │     PostgreSQL 16       │
                    └────────────────────────┘
```

---

## 2. Mobile App Architecture

### 2.1 Navigation Structure (Expo Router v3)

Expo Router uses the filesystem as the route definition. Role-based navigation is achieved with separate route groups; the root layout reads the auth store and redirects to the appropriate group.

```
app/
├── _layout.tsx               ← Root layout: checks auth, redirects
├── index.tsx                 ← Splash / redirect guard
│
├── (auth)/
│   ├── _layout.tsx           ← Stack navigator
│   ├── onboarding.tsx
│   ├── login.tsx             ← Phone number entry
│   └── verify-otp.tsx
│
├── (customer)/
│   ├── _layout.tsx           ← Bottom tab navigator (5 tabs)
│   ├── index.tsx             ← Home / discovery
│   ├── search.tsx
│   ├── restaurant/
│   │   └── [id].tsx          ← Restaurant + menu page
│   ├── cart.tsx
│   ├── checkout.tsx
│   ├── order/
│   │   ├── [id].tsx          ← Live tracking screen
│   │   └── history.tsx
│   ├── favorites.tsx
│   └── profile.tsx
│
├── (restaurant)/
│   ├── _layout.tsx           ← Bottom tab navigator (3 tabs)
│   ├── index.tsx             ← Dashboard (today's stats)
│   ├── orders.tsx            ← Incoming + active orders
│   ├── menu.tsx              ← Menu management
│   └── profile.tsx
│
└── (rider)/
    ├── _layout.tsx           ← Bottom tab navigator (3 tabs)
    ├── index.tsx             ← Available / active delivery
    ├── history.tsx
    └── profile.tsx
```

### 2.2 State Management Strategy

| Concern | Tool | Rationale |
|---|---|---|
| Auth tokens, current user, role | Zustand (`authStore`) | Needs to be read synchronously across the app |
| Cart contents | Zustand (`cartStore`) | Local-first, persisted to AsyncStorage |
| Server data (restaurants, orders, etc.) | TanStack Query | Handles caching, background refetch, pagination |
| WebSocket connection lifecycle | Zustand (`wsStore`) + custom hook | Centralised connect/disconnect logic |
| UI preferences (theme, etc.) | Zustand (`settingsStore`) | Persisted |

### 2.3 Zustand Store Shapes

```typescript
// authStore
interface AuthState {
  accessToken: string | null;
  user: User | null;
  role: 'customer' | 'restaurant_owner' | 'rider' | null;
  isHydrated: boolean;
  setTokens: (access: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

// cartStore
interface CartState {
  restaurantId: string | null;
  restaurantName: string;
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQuantity: (cartItemId: string, qty: number) => void;
  removeItem: (cartItemId: string) => void;
  clear: () => void;
  totalItems: number;       // derived
  subtotal: number;         // derived
}
```

### 2.4 API Service Layer

A single Axios instance is configured with:
- `baseURL` from `process.env.EXPO_PUBLIC_API_URL`
- Request interceptor: attaches `Authorization: Bearer <token>`
- Response interceptor: on 401, attempts silent token refresh via `POST /auth/refresh`; on second 401, calls `logout()`

All API calls are wrapped in TanStack Query hooks, e.g.:

```typescript
// hooks/useRestaurants.ts
export const useRestaurants = (filters: RestaurantFilters) =>
  useInfiniteQuery({
    queryKey: ['restaurants', filters],
    queryFn: ({ pageParam = 1 }) => api.restaurants.list({ ...filters, page: pageParam }),
    getNextPageParam: (last) => last.nextPage,
  });
```

### 2.5 WebSocket Design (Client Side)

A custom hook `useOrderTracking(orderId)` manages one WebSocket connection per active order:

```
connect  →  ws://API_HOST/ws/orders/{orderId}?token={accessToken}
messages →  { type: 'status_update', status: 'ON_THE_WAY' }
           { type: 'rider_location', lat: 1.23, lng: 4.56 }
disconnect on unmount or order terminal state
```

The hook updates TanStack Query's cache directly on incoming messages so the tracking screen re-renders reactively.

### 2.6 Theme System

```typescript
// theme/colors.ts
const palette = {
  primary:   '#E8003D',   // Zawadi red-pink
  primaryDark: '#B8002E',
  secondary: '#FF6B35',
  surface:   '#FFFFFF',
  background:'#F5F5F5',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  success:   '#27AE60',
  error:     '#EB5757',
};
// Dark mode variants follow the same keys with adjusted values.
```

`useTheme()` hook reads `settingsStore.theme` and returns the correct palette. Components never reference colours directly — always via the hook.

---

## 3. Backend Architecture

### 3.1 FastAPI Application Structure

```
backend/app/
├── main.py               ← App factory, CORS, routers, lifespan
├── core/
│   ├── config.py         ← Pydantic Settings (reads .env)
│   ├── security.py       ← JWT encode/decode, password hashing
│   ├── dependencies.py   ← get_db, get_current_user, role guards
│   └── rate_limit.py     ← Sliding-window OTP rate limiter
├── api/
│   ├── auth.py
│   ├── users.py
│   ├── addresses.py
│   ├── restaurants.py
│   ├── menu.py
│   ├── cart.py
│   ├── orders.py
│   ├── vouchers.py
│   ├── reviews.py
│   ├── riders.py
│   └── notifications.py
├── models/               ← SQLAlchemy ORM (one file per model group)
├── schemas/              ← Pydantic v2 request/response schemas
├── services/             ← Business logic (order_service, rider_service, …)
└── websockets/
    ├── manager.py        ← ConnectionManager (broadcast to room)
    └── router.py         ← WebSocket endpoint
```

### 3.2 Database Schema (ERD description)

```
users ──< addresses
users ──< orders (as customer)
users ──< restaurants (as owner)
users ──< rider_profiles

restaurants ──< menu_categories ──< menu_items ──< item_variations
restaurants ──< orders

orders ──< order_items
orders ──> payments
orders ──> reviews

carts ──< cart_items

riders ──< rider_locations (latest only, upserted)
```

Key design decisions:
- `item_variations` stores options as JSONB `[{name, price_delta}]` for flexibility without deep normalisation
- `order_items.options_snapshot` captures the selected options at order time so menu changes don't corrupt history
- `opening_hours` on restaurant is JSONB: `{"mon": {"open": "09:00", "close": "22:00"}, ...}`
- `rider_locations` is an upsert table (one row per rider), not a time-series — keeps it simple for MVP

### 3.3 Auth Flow (Sequence)

```
Client                           Backend
  │                                 │
  ├─ POST /auth/request-otp ───────►│ generate OTP, hash+store, send SMS (mock)
  │◄─ 200 { expires_in: 300 } ─────┤
  │                                 │
  ├─ POST /auth/verify-otp ────────►│ validate hash, check TTL+attempts
  │◄─ 200 { access_token,           │  create/update user
  │         refresh_token } ────────┤  store refresh token hash
  │                                 │
  │  [accessToken expires]          │
  ├─ POST /auth/refresh ───────────►│ validate refresh token hash
  │◄─ 200 { access_token,           │  rotate refresh token (new hash)
  │         refresh_token } ────────┤
  │                                 │
  ├─ POST /auth/logout ────────────►│ revoke refresh token in DB
  │◄─ 204 ──────────────────────────┤
```

### 3.4 Order Lifecycle (Service Layer)

```python
# services/order_service.py (pseudocode)

ALLOWED_TRANSITIONS = {
    'PLACED':           {'ACCEPTED', 'REJECTED', 'CANCELLED'},
    'ACCEPTED':         {'PREPARING', 'CANCELLED'},
    'PREPARING':        {'READY_FOR_PICKUP'},
    'READY_FOR_PICKUP': {'PICKED_UP'},
    'PICKED_UP':        {'ON_THE_WAY'},
    'ON_THE_WAY':       {'DELIVERED', 'FAILED'},
}

async def transition_order(order_id, new_status, actor):
    order = await get_order(order_id)
    if new_status not in ALLOWED_TRANSITIONS[order.status]:
        raise HTTPException(409, "Invalid status transition")
    validate_actor_permission(order, new_status, actor)
    order.status = new_status
    await db.commit()
    await ws_manager.broadcast(order_id, {'type': 'status_update', 'status': new_status})
    await push_notification_service.send(order, new_status)
```

### 3.5 Rider Assignment

When an order is placed:
1. Query `rider_profiles` where `is_online = true` and not currently assigned an active order
2. Join with `rider_locations` to get current lat/lng
3. Calculate Haversine distance to the restaurant
4. Assign the nearest available rider (within 10 km)
5. If no rider found, order stays `PLACED` and retries every 30 seconds (background task)

### 3.6 Delivery Fee Calculation

```
delivery_fee = restaurant.base_delivery_fee + (distance_km * per_km_rate)
capped at restaurant.max_delivery_fee
```

`per_km_rate` is a global config value (env var, default 0.50 currency units/km).

### 3.7 WebSocket Connection Manager

```python
class ConnectionManager:
    rooms: dict[str, set[WebSocket]]  # room_id → connected sockets

    async def connect(self, ws, room_id): ...
    async def disconnect(self, ws, room_id): ...
    async def broadcast(self, room_id, message: dict): ...
```

Each order has its own room (`order_{id}`). Customers, the restaurant, and the rider all join the same room and receive the same events. The server validates the JWT passed as a query param on WebSocket upgrade.

### 3.8 Push Notification Strategy

Using Expo's push notification service:
- Each user stores an `expo_push_token` (updated on login from the app)
- `push_notification_service.send(users, title, body, data)` calls the Expo Push API
- Notifications are fire-and-forget in MVP (stored in `notifications` table for in-app history)

---

## 4. Key Screen Designs

### 4.1 Customer Home Screen Layout

```
┌──────────────────────────────────────────┐
│  ▾ Deliver to: 123 Main St        🔔 👤  │  ← Header
├──────────────────────────────────────────┤
│  🔍 Search restaurants or dishes...      │  ← Search bar
├──────────────────────────────────────────┤
│  [🍕 Pizza] [🍔 Burger] [🍜 Asian] [+]  │  ← Cuisine chips (horizontal scroll)
├──────────────────────────────────────────┤
│  ┌────────────────────────────────────┐  │
│  │   PROMO BANNER (carousel)          │  │  ← Auto-scroll banners
│  └────────────────────────────────────┘  │
├──────────────────────────────────────────┤
│  Restaurants Near You          Sort ▾  ⚙ │
│  ┌──────────┐  ┌──────────┐             │
│  │ [Photo]  │  │ [Photo]  │             │  ← 2-col grid or vertical list
│  │ Name     │  │ Name     │             │
│  │ ⭐4.5 30m│  │ ⭐4.2 20m│             │
│  └──────────┘  └──────────┘             │
└──────────────────────────────────────────┘
│  🏠 Home  🔍 Search  🛒 Cart  ❤ Faves  👤│  ← Bottom tab bar
└──────────────────────────────────────────┘
```

### 4.2 Live Order Tracking Screen Layout

```
┌──────────────────────────────────────────┐
│  ← Order #ZF-1042                        │
├──────────────────────────────────────────┤
│                                          │
│         [MAP VIEW — rider dot +          │
│          destination pin]                │
│                                          │
├──────────────────────────────────────────┤
│  Estimated arrival: ~18 min              │
├──────────────────────────────────────────┤
│  ● Placed          10:32                 │
│  ● Accepted        10:33                 │
│  ● Preparing       10:35                 │
│  ○ Picked Up                             │
│  ○ On the Way                            │
│  ○ Delivered                             │
├──────────────────────────────────────────┤
│  🏍 Rider: Ahmed K.   ⭐4.8   📞 Call    │
└──────────────────────────────────────────┘
```

### 4.3 Restaurant Order Management Screen

```
┌──────────────────────────────────────────┐
│  Zawadi Burgers — Orders          🔔 ●   │
├──────────────────────────────────────────┤
│  [New (2)] [Active (3)] [History]        │  ← Tabs
├──────────────────────────────────────────┤
│  ┌────────────────────────────────────┐  │
│  │ 🔴 NEW  Order #ZF-1042  10:31      │  │
│  │ John D. — 3 items — $24.50        │  │
│  │ Cash on Delivery                   │  │
│  │          [✗ Reject]  [✓ Accept]   │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

---

## 5. API Design Conventions

- Base path: `/api/v1/`
- All responses wrapped: `{ data: T, meta?: PaginationMeta, error?: ErrorDetail }`
- Pagination: cursor-based for lists (`?page=1&limit=20`)
- Errors follow RFC 7807 Problem Details:
  ```json
  { "type": "validation_error", "detail": [...], "status": 422 }
  ```
- Timestamps: ISO 8601 UTC strings
- IDs: UUID v4
- File uploads: multipart/form-data; `photo_url` returned as a signed URL

---

## 6. Environment Configuration

### Backend `.env`
```
DATABASE_URL=postgresql+asyncpg://zawadi:secret@localhost:5432/zawadi_food
SECRET_KEY=<32-byte random hex>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30
OTP_EXPIRE_SECONDS=300
OTP_MAX_ATTEMPTS=3
EXPO_PUSH_URL=https://exp.host/--/api/v2/push/send
PER_KM_RATE=0.50
CORS_ORIGINS=["exp://localhost:8081","http://localhost:8081"]
```

### Mobile `.env`
```
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
EXPO_PUBLIC_WS_URL=ws://localhost:8000/ws
```

---

## 7. Testing Strategy

### Backend (Pytest)
| Suite | What it covers |
|---|---|
| `test_auth.py` | OTP request, verify, refresh, logout, rate limiting |
| `test_orders.py` | Place order, all valid status transitions, invalid transitions (409), cancellation |
| `test_restaurants.py` | Create, update, menu CRUD |
| `test_riders.py` | Online/offline toggle, assignment logic |
| `test_vouchers.py` | Validate, apply, expiry, max-uses |

All tests use an in-memory SQLite database (via SQLAlchemy's `create_engine`) and an async test client (`httpx.AsyncClient`).

### Mobile (Jest + React Native Testing Library)
- Unit tests for Zustand stores (cart calculations, auth state)
- Unit tests for utility functions (haversine, currency formatter)
- Component smoke tests for critical screens (Home, Cart, Checkout)

---

## 8. Docker Compose Architecture

```yaml
services:
  db:
    image: postgres:16-alpine
    volumes: [postgres_data:/var/lib/postgresql/data]
    environment: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD

  backend:
    build: ./backend
    depends_on: [db]
    env_file: ./backend/.env
    ports: ["8000:8000"]
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The `Dockerfile` uses a multi-stage build: `python:3.12-slim` base, installs dependencies from `requirements.txt`, copies source, runs migrations via `alembic upgrade head` in the entrypoint script.

---

## 9. Design Decisions & Trade-offs

| Decision | Chosen | Alternative Considered | Reason |
|---|---|---|---|
| Navigation | Expo Router (file-based) | React Navigation | Better DX with Expo, deep linking out of box |
| State | Zustand | Redux Toolkit | Less boilerplate for this scale |
| Real-time | FastAPI native WebSockets | Socket.io / Redis Pub-Sub | No extra infra for MVP; swap later |
| ORM | SQLAlchemy async | Tortoise ORM | More mature, better Alembic integration |
| Auth | JWT + secure-store | Sessions / Cookies | Standard for mobile; cookies are web-centric |
| Maps | react-native-maps | Mapbox | Free tier, works in Expo Go |
| Rider tracking | Polling via WebSocket push | MQTT | Simpler, no extra broker |

---

## 10. Scalability Notes (Post-MVP)

- Replace FastAPI WebSockets with a Redis Pub-Sub fan-out for multi-instance deployments
- Add an S3-compatible object store (MinIO in dev, S3 in prod) for media uploads
- Introduce a task queue (Celery + Redis) for OTP SMS, push notifications, and rider assignment retries
- Add a read replica for analytics queries
- CDN for restaurant photos
