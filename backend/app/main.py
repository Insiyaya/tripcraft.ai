from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import connect_db, close_db
from .routers import health, trips, itinerary, chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
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
# Add production frontend URL if set
frontend_url = os.getenv("FRONTEND_URL", "")
if frontend_url:
    cors_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.(vercel|netlify)\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(trips.router, prefix="/api", tags=["trips"])
app.include_router(itinerary.router, prefix="/api", tags=["itinerary"])
app.include_router(chat.router, tags=["chat"])
