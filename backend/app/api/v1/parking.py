# app/api/v1/parking.py
from fastapi import APIRouter, Query, HTTPException
import httpx
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import pytz
import os
from math import radians, sin, cos, sqrt, atan2
import asyncio
from functools import lru_cache
import time

router = APIRouter(prefix="/parking", tags=["parking"])

# Cache for carpark data (30 minutes TTL)
carpark_cache = {
    "data": None,
    "timestamp": None,
    "ttl": timedelta(minutes=30)
}

# MRT Exit Information for Pasir Ris - to store in DB
MRT_EXITS = [
    {
        "exit": "A",
        "name": "Pasir Ris MRT Exit A",
        "lat": 1.372842,
        "lon": 103.949333,
        "description": "To Pasir Ris Park"
    },
    {
        "exit": "B",
        "name": "Pasir Ris MRT Exit B",
        "lat": 1.372886,
        "lon": 103.949137,
        "description": "To White Sands"
    }
]

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points in meters using Haversine formula"""
    R = 6371000  # Earth's radius in meters
    
    lat1_rad = radians(lat1)
    lat2_rad = radians(lat2)
    delta_lat = radians(lat2 - lat1)
    delta_lon = radians(lon2 - lon1)
    
    a = sin(delta_lat/2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(delta_lon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    
    return R * c

async def fetch_carpark_availability():
    """Fetch carpark availability from LTA DataMall API"""
    global carpark_cache
    
    # Check cache
    if carpark_cache["data"] and carpark_cache["timestamp"]:
        if datetime.now() - carpark_cache["timestamp"] < carpark_cache["ttl"]:
            return carpark_cache["data"]
    
    try:
        api_key = os.getenv("LTA_API_KEY")
        if not api_key:
            print("ERROR: LTA_API_KEY not found in environment variables")
            raise HTTPException(status_code=500, detail="LTA API key not configured")
        
        url = "https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2"
        headers = {
            "AccountKey": api_key,
            "Accept": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, timeout=10)
            
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch carpark data from LTA")
        
        data = response.json()
        records = data.get("value", [])
        
        # Filter for Pasir Ris carparks using string search
        pasir_ris_carparks = []
        for record in records:
            if "PASIR RIS" in record.get("Development", "").upper():
                # Parse location string "lat lon" format
                location_parts = record.get("Location", "").split()
                if len(location_parts) >= 2:
                    try:
                        lat = float(location_parts[0])
                        lon = float(location_parts[1])
                        
                        pasir_ris_carparks.append({
                            "carpark_id": record.get("CarParkID"),
                            "available_lots": int(record.get("AvailableLots", 0)),
                            "lot_type": record.get("LotType"),
                            "agency": record.get("Agency"),
                            "development": record.get("Development"),
                            "lat": lat,
                            "lon": lon
                        })
                    except (ValueError, IndexError):
                        continue
        
        # Update cache
        carpark_cache["data"] = pasir_ris_carparks
        carpark_cache["timestamp"] = datetime.now()
        
        return pasir_ris_carparks
        
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Timeout fetching carpark data")
    except Exception as e:
        print(f"Error fetching carpark data: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching carpark data: {str(e)}")

@router.get("/carparks/availability")
async def get_carpark_availability(
    user_lat: float = Query(..., description="User's current latitude"),
    user_lon: float = Query(..., description="User's current longitude"),
    limit: int = Query(5, description="Number of carparks to return")
):
    """
    Get nearby Pasir Ris carpark availability with real-time lot information
    """
    try:
        # Fetch carpark data
        carparks = await fetch_carpark_availability()
        
        # Group by carpark_id and aggregate lots by type
        carpark_dict = {}
        for cp in carparks:
            cp_id = cp["carpark_id"]
            if cp_id not in carpark_dict:
                carpark_dict[cp_id] = {
                    "carpark_id": cp_id,
                    "development": cp["development"],
                    "agency": cp["agency"],
                    "lat": cp["lat"],
                    "lon": cp["lon"],
                    "lots_by_type": {},
                    "total_available": 0
                }
            
            # Add lots by type
            lot_type = cp["lot_type"]
            carpark_dict[cp_id]["lots_by_type"][lot_type] = cp["available_lots"]
            carpark_dict[cp_id]["total_available"] += cp["available_lots"]
        
        # Calculate distances and prepare response
        result_carparks = []
        for cp_id, cp_data in carpark_dict.items():
            distance = calculate_distance(
                user_lat, user_lon,
                cp_data["lat"], cp_data["lon"]
            )
            
            result_carparks.append({
                "carpark_id": cp_data["carpark_id"],
                "development": cp_data["development"],
                "agency": cp_data["agency"],
                "lat": cp_data["lat"],
                "lon": cp_data["lon"],
                "distance_meters": round(distance),
                "lots_by_type": cp_data["lots_by_type"],
                "total_available": cp_data["total_available"],
                "recommendation_score": cp_data["total_available"] / (distance / 100) if distance > 0 else 0
            })
        
        # Sort by recommendation score (balances availability and distance)
        result_carparks.sort(key=lambda x: x["recommendation_score"], reverse=True)
        
        return {
            "carparks": result_carparks[:limit],
            "timestamp": datetime.now(pytz.timezone("Asia/Singapore")).isoformat(),
            "cache_age_minutes": (datetime.now() - carpark_cache["timestamp"]).total_seconds() / 60 if carpark_cache["timestamp"] else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_carpark_availability: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/mrt-exits")
async def get_mrt_exits(
    user_lat: Optional[float] = None,
    user_lon: Optional[float] = None
):
    """
    Get Pasir Ris MRT exit information
    """
    exits = []
    for exit_info in MRT_EXITS:
        exit_data = exit_info.copy()
        
        # Calculate distance if user location provided
        if user_lat is not None and user_lon is not None:
            distance = calculate_distance(
                user_lat, user_lon,
                exit_info["lat"], exit_info["lon"]
            )
            exit_data["distance_meters"] = round(distance)
        
        exits.append(exit_data)
    
    # Sort by distance if user location provided
    if user_lat is not None and user_lon is not None:
        exits.sort(key=lambda x: x.get("distance_meters", 0))
    
    return {"mrt_exits": exits}

@router.get("/navigation/to-park")
async def get_navigation_to_park(
    start_lat: float = Query(...),
    start_lon: float = Query(...),
    destination_type: str = Query(..., regex="^(mrt|carpark)$"),
    destination_id: Optional[str] = None
):
    """
    Get navigation to MRT exit or carpark from user's location
    Returns route data for in-app navigation
    """
    destination = None
    
    if destination_type == "mrt":
        # Find the closest MRT exit if not specified
        exits_response = await get_mrt_exits(start_lat, start_lon)
        mrt_exits = exits_response["mrt_exits"]
        
        if destination_id:
            destination = next((e for e in mrt_exits if e["exit"] == destination_id), None)
        else:
            # Get closest exit
            destination = mrt_exits[0] if mrt_exits else None
            
    else:  # carpark
        # Get recommended carpark
        carparks_response = await get_carpark_availability(start_lat, start_lon, limit=1)
        carparks = carparks_response["carparks"]
        destination = carparks[0] if carparks else None
    
    if not destination:
        raise HTTPException(status_code=404, detail=f"No {destination_type} found")
    
    # Prepare response with destination info
    # The actual route will be calculated by Mapbox in the frontend
    return {
        "destination_type": destination_type,
        "destination": destination,
        "start": {"lat": start_lat, "lon": start_lon},
        "end": {"lat": destination["lat"], "lon": destination["lon"]},
        "distance_meters": calculate_distance(start_lat, start_lon, destination["lat"], destination["lon"])
    }