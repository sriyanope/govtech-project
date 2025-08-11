from fastapi import APIRouter, Query
from app.services.routing_service import shortest_path

router = APIRouter(prefix="/navigation", tags=["navigation"])

@router.get("/route")
async def get_route(
    start_lat: float = Query(..., ge=-90, le=90),
    start_lon: float = Query(..., ge=-180, le=180),
    end_lat:   float = Query(..., ge=-90, le=90),
    end_lon:   float = Query(..., ge=-180, le=180),
    prefer_shelter: bool = True
):
    """
    Example:
    /v1/navigation/route?start_lat=1.3806&start_lon=103.9560&end_lat=1.3739&end_lon=103.9539
    """
    return await shortest_path(
        start=(start_lat, start_lon),
        end=(end_lat, end_lon),
        prefer_shelter=prefer_shelter
    )
