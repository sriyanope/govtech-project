from fastapi import APIRouter
from .v1.navigation import router as nav_router
from .v1.weather import router as weather_router
from .v1.parking import router as parking_router

api_router = APIRouter()
api_router.include_router(nav_router)
api_router.include_router(weather_router)
api_router.include_router(parking_router)
