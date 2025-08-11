from typing import Tuple, List
from fastapi import HTTPException
from sqlalchemy import text
from shapely.geometry import LineString, mapping, Point, Polygon, MultiPoint, MultiLineString, MultiPolygon
from geoalchemy2.shape import to_shape
from geoalchemy2.types import Geometry 
from ..database import AsyncSessionLocal
import httpx 
import json 
import os 
from dotenv import load_dotenv
from geoalchemy2.elements import WKBElement

load_dotenv()

def _to_xy(geom):
    """Return (x, y) for any shapely geometry; None if unusable."""
    if geom is None:
        return None
    if isinstance(geom, Point):
        return geom.x, geom.y
    if isinstance(geom, MultiPoint):
        # first point
        for g in geom.geoms:
            return g.x, g.y
        return None
    if isinstance(geom, LineString):
        x, y = list(geom.coords)[0]
        return x, y
    if isinstance(geom, MultiLineString):
        if not geom.geoms:
            return None
        x, y = list(geom.geoms[0].coords)[0]
        return x, y
    if isinstance(geom, (Polygon, MultiPolygon)):
        # robust and on-surface
        rp = geom.representative_point()
        return rp.x, rp.y
    # fallback
    c = geom.centroid
    return getattr(c, "x", None), getattr(c, "y", None)

# async def _nearest_node_id(db, pt: Point) -> int:
#     sql = text("""
#         SELECT id
#         FROM walkway_edges_vertices_pgr
#         ORDER BY the_geom <-> ST_Transform(ST_SetSRID(ST_GeomFromText(:wkt), 4326), 3414)
#         LIMIT 1;
#     """)
#     result = await db.execute(sql, {"wkt": pt.wkt})
#     row = result.first()
#     if not row:
#         raise HTTPException(404, "No graph node found near that coordinate for snapping.")
#     return row[0]



async def shortest_path(
    start: Tuple[float, float], # (lat, lon)
    end: Tuple[float, float],   # (lat, lon)
    prefer_shelter: bool = False 
) -> dict:
    """
    Calculates a route using the Mapbox Directions API.
    If prefer_shelter is True, it attempts to optimize the route to pass by
    more shelters and toilets by adding them as waypoints.
    """
    mapbox_access_token = os.getenv("MAPBOX_ACCESS_TOKEN") 
    if not mapbox_access_token:
        raise HTTPException(500, "Mapbox Access Token not set. Please set MAPBOX_ACCESS_TOKEN environment variable or replace placeholder.")

    # Mapbox - {long},{lat}
    origin_coords_str      = f"{start[1]},{start[0]}" # lon,lat
    destination_coords_str = f"{end[1]},{end[0]}"     # lon,lat

    # --- Move httpx.AsyncClient initialization to encompass both API calls ---
    async with httpx.AsyncClient() as client:
        # --- Step 1: Get the initial shortest route from Mapbox ---
        initial_mapbox_url = (
            f"https://api.mapbox.com/directions/v5/mapbox/walking/{origin_coords_str};{destination_coords_str}"
            f"?alternatives=false&geometries=geojson&steps=false&access_token={mapbox_access_token}"
        )

        try:
            response = await client.get(initial_mapbox_url, timeout=10)
            response.raise_for_status() 
            initial_directions_data = response.json()
        except httpx.RequestError as exc:
            raise HTTPException(500, f"An error occurred while requesting Mapbox Directions: {exc}")
        except httpx.HTTPStatusError as exc:
            error_detail = exc.response.json().get("message", "Unknown error from Mapbox")
            raise HTTPException(exc.response.status_code, f"Mapbox Directions API error: {error_detail}")
        except json.JSONDecodeError:
            raise HTTPException(500, "Mapbox Directions API returned invalid JSON.")
        except Exception as e:
            raise HTTPException(500, f"An unexpected error occurred during Mapbox API call: {e}")

        if not initial_directions_data or not initial_directions_data.get('routes'):
            raise HTTPException(404, "No route found by Mapbox for the given points.")

        initial_route_geometry_geojson = initial_directions_data['routes'][0]['geometry']
        initial_route_coords = initial_route_geometry_geojson['coordinates']
        
        try:
            initial_primary_route_line = LineString(initial_route_coords)
        except Exception as e:
            raise HTTPException(500, f"Error creating initial route geometry from Mapbox response: {e}")

        # Extract initial distance and duration
        final_route_line = initial_primary_route_line
        final_distance_meters = initial_directions_data['routes'][0].get('distance', 0)
        final_duration_seconds = initial_directions_data['routes'][0].get('duration', 0)
        final_route_coords_to_return = initial_route_coords # Coordinates to be returned

        found_amenities_along_initial_route = []
        
        # --- Step 2: If prefer_shelter, identify amenities and potentially re-route ---
        if prefer_shelter:
            async with AsyncSessionLocal() as db:
                buffer_m = 300 # Meters buffer around the initial route line
                
                amenity_sql = text(f"""
                    SELECT objectid, class, name_right AS name, ST_AsEWKB(geom) AS geom_wkb
                    FROM park_facilities
                    WHERE class IN ('SHELTER', 'TOILET')
                    AND ST_DWithin(
                        ST_Transform(geom, 3414),
                        ST_Transform(ST_SetSRID(ST_GeomFromText(:route_wkt_4326), 4326), 3414),
                        {buffer_m}
                    );
                """)
                
                amenity_results = await db.execute(amenity_sql, {"route_wkt_4326": initial_primary_route_line.wkt})
                

                for row in amenity_results.mappings().all():
                    facility_geom = to_shape(WKBElement(row["geom_wkb"]))
                    print(f"this is facility {facility_geom}")
                    xy = _to_xy(facility_geom)
                    print(f"this is xy{xy}")
                    if not xy or xy[0] is None or xy[1] is None:
                        pass
                    print(xy)
                    lon, lat = xy
                    # lat, lon = xy
                    print(f"this is long and lat{lon}, {lat}")
                    found_amenities_along_initial_route.append({
                        "objectid": row["objectid"],
                        "class": row["class"],
                        "name": row["name"],
                        "lat": lat,
                        "lon": lon
                    })
            
            # --- Step 3: If amenities found, attempt to re-route via waypoints ---
            if found_amenities_along_initial_route:
                # Select a limited number of amenities as waypoints to avoid Mapbox limits
                # and excessive route deviation. Let's take up to 3 amenities.
                # A more sophisticated approach would sort by distance along path, etc. - lets try this one
                waypoints_to_use = []
                max_waypoints = 20 # Mapbox free tier typically allows 25 waypoints, but keeping it low for sensible routes
                
                # Simple strategy: Add amenities that are roughly "in the middle" or spread out.
                # For this iteration, we are only going to pick a few from the found list 
                # future steps:: might sort them by distance along the path.
                for i, amenity in enumerate(found_amenities_along_initial_route):
                    if i < max_waypoints: # Add up to max_waypoints
                        waypoints_to_use.append(f"{amenity['lon']},{amenity['lat']}") # Mapbox expects lon,lat
                    else:
                        break

                # Construct waypoints string for Mapbox URL
                # Format: {lon},{lat};{lon},{lat};
                if waypoints_to_use:
                    # The waypoints go between origin and destination in the URL
                    waypoint_string = ";".join(waypoints_to_use)
                    waypointed_mapbox_url = (
                        f"https://api.mapbox.com/directions/v5/mapbox/walking/"
                        f"{origin_coords_str};{waypoint_string};{destination_coords_str}"
                        f"?alternatives=false&geometries=geojson&steps=false&access_token={mapbox_access_token}"
                    )

                    try:
                        response_waypointed = await client.get(waypointed_mapbox_url, timeout=10) # <--- This call is now within the 'client' scope
                        response_waypointed.raise_for_status()
                        waypointed_directions_data = response_waypointed.json()

                        if waypointed_directions_data and waypointed_directions_data.get('routes'):
                            waypointed_route_geometry_geojson = waypointed_directions_data['routes'][0]['geometry']
                            waypointed_route_coords = waypointed_route_geometry_geojson['coordinates']
                            
                            # Update the final route details to the waypointed route
                            final_route_line = LineString(waypointed_route_coords)
                            final_distance_meters = waypointed_directions_data['routes'][0].get('distance', 0)
                            final_duration_seconds = waypointed_directions_data['routes'][0].get('duration', 0)
                            final_route_coords_to_return = waypointed_route_coords
                            # The amenities returned will be those along the *initial* path,
                            # but the route itself now passes through some of them.
                            
                    except httpx.RequestError as exc:
                        print(f"Warning: Mapbox Waypoint Directions API request failed: {exc}. Falling back to shortest route.")
                    except httpx.HTTPStatusError as exc:
                        error_detail = exc.response.json().get("message", "Unknown error from Mapbox")
                        print(f"Warning: Mapbox Waypoint Directions API error: {error_detail}. Falling back to shortest route.")
                    except Exception as e:
                        print(f"Warning: Unexpected error with Mapbox Waypoint Directions: {e}. Falling back to shortest route.")

    # --- Step 4: Return the chosen route GeoJSON and the identified amenities ---
    return {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "geometry": mapping(final_route_line), 
            "properties": {
                "total_distance_meters": final_distance_meters,
                "total_duration_seconds": final_duration_seconds,
                "segments":  len(final_route_coords_to_return) - 1,
            }
        }],
        "amenities_along_route": found_amenities_along_initial_route # Amenities identified locally (from initial path)
    }

