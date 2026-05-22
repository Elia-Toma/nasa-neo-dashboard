from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router
from app.core.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend Proxy API for NASA NEO Dashboard",
    version="1.0.0"
)

# Configure CORS to allow the Vite frontend to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register the routes
app.include_router(api_router, prefix="/api")


@app.get("/health")
def health_check():
    """
    Simple health check endpoint useful for deployment platforms.
    """
    return {"status": "ok", "service": settings.PROJECT_NAME}
