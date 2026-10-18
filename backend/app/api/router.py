from fastapi import APIRouter
from app.api.v1 import (
    auth,
    workspaces,
    projects,
    architectures,
    datasets,
    training,
    experiments,
    optimization,
    registry,
    deployments,
    inference,
    visualization,
    monitoring,
    audit,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(workspaces.router)
api_router.include_router(projects.router)
api_router.include_router(architectures.router)
api_router.include_router(datasets.router)
api_router.include_router(training.router)
api_router.include_router(experiments.router)
api_router.include_router(optimization.router)
api_router.include_router(registry.router)
api_router.include_router(deployments.router)
api_router.include_router(inference.router)
api_router.include_router(visualization.router)
api_router.include_router(monitoring.router)
api_router.include_router(audit.router)
