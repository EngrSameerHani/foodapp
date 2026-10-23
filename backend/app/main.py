"""Zawadi Food — FastAPI application factory."""
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.api import auth, users, addresses, restaurants, cart, orders, riders, notifications
from app.websockets.router import router as ws_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure media directory exists
    os.makedirs(settings.MEDIA_DIR, exist_ok=True)
    logger.info("🚀 Zawadi Food API starting up")
    yield
    logger.info("👋 Zawadi Food API shutting down")


app = FastAPI(
    title="Zawadi Food API",
    version="1.0.0",
    description="Backend API for the Zawadi Food delivery platform",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST routers
API_PREFIX = "/api/v1"
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(users.router, prefix=API_PREFIX)
app.include_router(addresses.router, prefix=API_PREFIX)
app.include_router(restaurants.router, prefix=API_PREFIX)
app.include_router(cart.router, prefix=API_PREFIX)
app.include_router(orders.router, prefix=API_PREFIX)
app.include_router(riders.router, prefix=API_PREFIX)
app.include_router(notifications.router, prefix=API_PREFIX)

# WebSocket
app.include_router(ws_router, prefix="/ws")

# Serve uploaded media files
os.makedirs("./media", exist_ok=True)
app.mount("/media", StaticFiles(directory="./media"), name="media")


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok", "service": "zawadi-food-api"}
