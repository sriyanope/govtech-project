from fastapi import FastAPI, Depends, Query
from .database import AsyncSessionLocal, engine, Base
from .models import CoveredLinkway, ParkFacility, Park
from app.api import api_router
from sqlalchemy import select
from geoalchemy2.functions import ST_Transform 
from geoalchemy2.shape import to_shape
from shapely.geometry import mapping
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="Parks4People API")
app.include_router(api_router, prefix="/v1")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://parks4people.vercel.app", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

@app.get("/v1/facilities/all_facilities")
async def facilities(db=Depends(get_db)):
    res = await db.execute(
        select(
            ParkFacility.objectid, 
            ParkFacility.class_name, 
            ParkFacility.additional_info, 
            ParkFacility.name_left,
            ParkFacility.facility_type,
            ParkFacility.phone,
            ParkFacility.hours_open,
            ParkFacility.hours_close,
            ParkFacility.price_range,
            ParkFacility.price_info,
            ParkFacility.rating,
            ParkFacility.review_count,
            ParkFacility.cuisine,
            ParkFacility.website,
            ParkFacility.activities,
            ParkFacility.service_options,
            ParkFacility.reservation_links,
            ParkFacility.order_links,
            ParkFacility.address,
            ST_Transform(ParkFacility.geom, 4326).label('geom')
        )
    )
    rows = res.all() 
    features = [{
        "type": "Feature",
        "geometry": mapping(to_shape(r.geom)),
        "properties": {
            "objectid": r.objectid,
            "class": r.class_name,
            "additional_info": r.additional_info,
            "name_left": r.name_left,
            "facility_type": r.facility_type,
            "phone": r.phone,
            "hours": {
                "open": r.hours_open.strftime("%H:%M") if r.hours_open else None,
                "close": r.hours_close.strftime("%H:%M") if r.hours_close else None
            } if r.hours_open or r.hours_close else None,
            "price_range": r.price_range,
            "price_info": r.price_info,
            "rating": float(r.rating) if r.rating else None,
            "review_count": r.review_count,
            "cuisine": r.cuisine,
            "website": r.website,
            "activities": r.activities,
            "service_options": r.service_options,
            "reservation_links": r.reservation_links,
            "order_links": r.order_links,
            "address": r.address
        }
    } for r in rows]
    return {"type": "FeatureCollection", "features": features}


@app.get("/v1/facilities/filter")
async def filter_facilities(
    categories: str = Query(..., description="Comma-separated list of facility categories (class_name) to filter by"),
    db=Depends(get_db)
):
    category_list = [c.strip() for c in categories.split(',') if c.strip()]
    query = select(ParkFacility.objectid, ParkFacility.class_name, ParkFacility.additional_info, ParkFacility.name_left, ST_Transform(ParkFacility.geom, 4326).label('geom'))
    if category_list:
        query = query.where(ParkFacility.class_name.in_(category_list))
    res = await db.execute(query)
    rows = res.all() 
    features = [{
        "type": "Feature",
        "geometry": mapping(to_shape(r.geom)),
        "properties": {
            "objectid": r.objectid,
            "class": r.class_name,
            "additional_info": r.additional_info,
            "name_left": r.name_left,
        }
    } for r in rows]

    return {"type": "FeatureCollection", "features": features}