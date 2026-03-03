import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import connect_db, close_db
from .routers import health, trips, itinerary, chat, auth

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    logger.info("CORS origins: %s", cors_origins)
    yield
    await close_db()


app = FastAPI(
    title="AI Travel Itinerary Planner",
    version="1.0.0",
    lifespan=lifespan,
)

import os

cors_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]
# Add production frontend URLs if set (supports single FRONTEND_URL or comma-separated FRONTEND_URLS)
frontend_url = os.getenv("FRONTEND_URL", "").strip().rstrip("/")
if frontend_url:
    cors_origins.append(frontend_url)

frontend_urls = os.getenv("FRONTEND_URLS", "")
for url in frontend_urls.split(","):
    clean_url = url.strip().rstrip("/")
    if clean_url:
        cors_origins.append(clean_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.(vercel|netlify)\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "ok", "app": "TripCraft AI"}

app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(trips.router, prefix="/api", tags=["trips"])
app.include_router(itinerary.router, prefix="/api", tags=["itinerary"])
app.include_router(chat.router, tags=["chat"])
