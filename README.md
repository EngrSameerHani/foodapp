# Zawadi Food 🍽️

A full-stack native food delivery app — React Native (Expo) + FastAPI.  
Three roles in one binary: **Customer**, **Restaurant Owner**, **Rider**.

---

## Project Structure

```
zawadi-food/
├── app/       # React Native / Expo mobile app
└── backend/   # FastAPI REST API + WebSocket server
```

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 18+ |
| Python | 3.12+ |
| Docker + Compose | v2 |
| EAS CLI | `npm i -g eas-cli` |

---

## 1. Local Development (Expo Go on your phone / emulator)

### 1a. Start the backend

```bash
cd backend
cp .env.example .env          # already has sane defaults
docker compose up --build -d  # starts Postgres + FastAPI
docker compose exec backend python seed.py   # load demo data
```

API docs: http://localhost:8000/docs

### 1b. Start the mobile app

```bash
cd app
cp .env.example .env          # EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
npm install
npx expo start
```

- **Android emulator**: change `EXPO_PUBLIC_API_URL` to `http://10.0.2.2:8000/api/v1`
- **Physical device on same WiFi**: replace `localhost` with your machine's LAN IP (e.g. `http://192.168.1.10:8000/api/v1`)

Scan the QR with Expo Go. OTP codes print to the backend console: `📱 OTP for +15550000001: XXXXXX`

---

## 2. Demo Accounts (seeded)

| Role | Phone | Name |
|---|---|---|
| Customer | +15550000001 | Alice Johnson |
| Customer | +15550000002 | Bob Smith |
| Customer | +15550000003 | Carol White |
| Restaurant Owner | +15550000010 | Frank Miller (Zawadi Burgers) |
| Restaurant Owner | +15550000011 | Grace Lee (Nairobi Kitchen) |
| Restaurant Owner | +15550000012 | Henry Wilson (Sakura Ramen) |
| Rider | +15550000020 | Ivan Martinez |
| Rider | +15550000021 | Julia Thompson |
| Rider | +15550000022 | Kevin Anderson |

Vouchers: `WELCOME20` (20% off orders ≥ $15) · `SAVE5` ($5 off orders ≥ $20)

---

## 3. Publishing to GitHub

### What IS committed
- All source code (`app/`, `backend/`)
- `app.json`, `eas.json`, `package.json`, `requirements.txt`
- `alembic/versions/` migration files
- `*.example` files (`.env.example`, `google-services.json.example`)
- `assets/` images

### What is NOT committed (in `.gitignore`)
- `backend/.env` — contains `SECRET_KEY` and DB password
- `app/.env` — contains API URL
- `app/node_modules/`
- `app/google-services.json` — contains Firebase private key
- `app/GoogleService-Info.plist` — iOS Firebase config

```bash
# From the repo root — safe to push:
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOU/zawadi-food.git
git push -u origin main
```

---

## 4. Building a Real APK (EAS Build)

These are the exact steps to go from GitHub clone → downloadable APK.

### Step 1 — Deploy the backend to a real server

The APK needs a real URL, not `localhost`. Free options:

| Platform | Command |
|---|---|
| **Railway** | Push repo, add Postgres plugin, set env vars |
| **Render** | Create Web Service from GitHub, add Postgres |
| **Fly.io** | `fly launch` from `backend/` |
| **Any VPS** | `docker compose up -d` |

Set these environment variables on your server (same as `backend/.env.example`):

```
DATABASE_URL=postgresql+asyncpg://...
SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_hex(32))">
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30
OTP_EXPIRE_SECONDS=300
OTP_MAX_ATTEMPTS=3
OTP_RATE_LIMIT_WINDOW_SECONDS=600
OTP_RATE_LIMIT_MAX_REQUESTS=3
EXPO_PUSH_URL=https://exp.host/--/api/v2/push/send
PER_KM_RATE=0.50
SERVICE_FEE=1.99
TAX_RATE=0.08
CORS_ORIGINS=["*"]
```

After deploying, note the URL — e.g. `https://zawadi-api.railway.app`.

### Step 2 — Get a Google Maps API key

1. Go to https://console.cloud.google.com
2. Create a project → Enable **Maps SDK for Android** and **Maps SDK for iOS**
3. Create an API key (restrict to your Android package: `com.zawadidigital.food`)
4. In `app/app.json` replace `GOOGLE_MAPS_API_KEY_PLACEHOLDER` with your key

### Step 3 — Set up Firebase (for push notifications)

1. Go to https://console.firebase.google.com
2. Create project → Add Android app (package: `com.zawadidigital.food`)
3. Download `google-services.json` → place at `app/google-services.json`
4. This file is gitignored — **do not commit it**
5. When building with EAS, upload it as a secret:
   ```bash
   eas secret:create --scope project --name GOOGLE_SERVICES_JSON \
     --type file --value ./google-services.json
   ```

### Step 4 — Configure EAS

```bash
cd app
eas login                          # create account at expo.dev if needed
eas build:configure                # links project to your Expo account
```

Set your backend URL as an EAS environment variable:

```bash
eas env:create --name EXPO_PUBLIC_API_URL \
  --value "https://zawadi-api.railway.app/api/v1" \
  --environment preview

eas env:create --name EXPO_PUBLIC_WS_URL \
  --value "wss://zawadi-api.railway.app/ws" \
  --environment preview
```

Or edit them directly in `eas.json` under `build.preview.env`.

### Step 5 — Build the APK

```bash
cd app
eas build --platform android --profile preview
```

- EAS builds in the cloud — no Android Studio needed
- Takes ~10–15 minutes
- When done, you get a download link for the `.apk` file
- Install directly on any Android device (enable "Install from unknown sources")

### Step 6 — Build for Google Play (AAB)

```bash
eas build --platform android --profile production
```

This produces a `.aab` bundle for Google Play submission.

---

## 5. Running Backend Tests

```bash
cd backend
pip install -r requirements-dev.txt
pytest tests/ -v
# Expected: 15 passed
```

---

## 6. Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Async PostgreSQL URL | `postgresql+asyncpg://user:pass@host/db` |
| `SECRET_KEY` | JWT signing secret (≥32 chars) | `python -c "import secrets; print(secrets.token_hex(32))"` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT TTL | `15` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token TTL | `30` |
| `OTP_EXPIRE_SECONDS` | OTP validity | `300` |
| `OTP_MAX_ATTEMPTS` | Max wrong OTP tries | `3` |
| `CORS_ORIGINS` | Allowed origins (JSON array) | `["https://yourapp.com"]` |
| `PER_KM_RATE` | Delivery fee per km | `0.50` |

### Mobile (`app/.env` / EAS env vars)

| Variable | Description | Example |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Backend REST base URL | `https://zawadi-api.railway.app/api/v1` |
| `EXPO_PUBLIC_WS_URL` | Backend WebSocket URL | `wss://zawadi-api.railway.app/ws` |

---

## 7. Feature Checklist

### ✅ Implemented (MVP)
- [x] Phone OTP auth for all 3 roles with JWT access + refresh tokens
- [x] OTP rate limiting (3 requests / 10 min per phone)
- [x] Customer: browse, filter, sort restaurants
- [x] Customer: restaurant page + full menu + item detail (variations, add-ons)
- [x] Customer: cart with quantity controls and promo codes
- [x] Customer: checkout with address selection and order placement
- [x] Customer: live order tracking screen (WebSocket + status timeline)
- [x] Customer: order history, reorder, reviews
- [x] Customer: favorites, profile, dark mode toggle
- [x] Restaurant: orders (New / Active / History tabs, accept/reject/prepare)
- [x] Restaurant: menu management with availability toggle
- [x] Rider: online/offline toggle with live GPS ping
- [x] Rider: active delivery screen with navigation and status updates
- [x] Rider: delivery history and earnings
- [x] Order state machine — 9 states, invalid transitions return HTTP 409
- [x] Nearest-rider auto-assignment (Haversine distance)
- [x] WebSocket real-time order + rider location updates
- [x] Push notifications via Expo Push API
- [x] Seed script — 3 restaurants, 11 demo users, 2 vouchers
- [x] Docker Compose one-command backend setup
- [x] 15 automated backend tests (auth + order state machine)

### 🔜 Post-MVP
- [ ] Real payment processing (Stripe / local gateway)
- [ ] Admin dashboard
- [ ] In-app chat
- [ ] Multi-language / RTL (Urdu)
- [ ] Analytics
- [ ] Surge pricing
- [ ] Scheduled orders
- [ ] Map address picker (tap-to-pin on map)
- [ ] Sound alert for new restaurant orders
- [ ] Offline cached data + "no internet" banner
