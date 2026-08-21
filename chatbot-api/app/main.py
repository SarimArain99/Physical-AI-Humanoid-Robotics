from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import get_settings
from app.routers.chat import router as chat_router
from app.services.db import init_db

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup."""
    # Initialize database
    await init_db()
    yield


app = FastAPI(
    title="Physical AI Textbook — RAG Chatbot API",
    description="Retrieval-Augmented Generation chatbot for the Physical AI & Humanoid Robotics textbook.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow the Docusaurus frontend
origins = [o.strip() for o in settings.cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(chat_router)


@app.get("/")
async def root():
    return {
        "name": "Physical AI Textbook RAG API",
        "version": "1.0.0",
        "docs": "/docs",
    }
