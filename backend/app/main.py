import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.db.init_db import init_db
from app.api.router import api_router

setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing NNAS database and default seed records...")
    init_db()
    logger.info("NNAS Core Platform startup complete.")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Production-Grade AI Platform for Visual Model Engineering, Training, Explainability, and Architecture Optimization.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_process_time_and_request_id(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    start_time = time.time()
    try:
        response = await call_next(request)
    except Exception as ex:
        logger.error(f"Unhandled server error on {request.method} {request.url.path}: {ex}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error. Our engineering team has been notified."},
            headers={"X-Request-ID": request_id},
        )
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    response.headers["X-Request-ID"] = request_id
    return response


app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
        "status": "operational",
        "documentation": "/docs",
        "api_v1": settings.API_V1_STR,
    }
