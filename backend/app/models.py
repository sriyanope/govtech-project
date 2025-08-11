from sqlalchemy import Column, Integer, String, Float, Text, Time, DECIMAL, ARRAY
from geoalchemy2 import Geometry
from .database import Base

# ----------------------------------
# 1. Covered linkways  (MULTI)POLYGON  
# -----------------------------------
class CoveredLinkway(Base):
    __tablename__ = "covered_linkways"
    objectid = Column(Integer, primary_key=True, index=True)
    geom = Column(
        Geometry(geometry_type="MULTIPOLYGON", srid=3414, spatial_index=True)
    )

# -----------------------------
# 2. Park facilities  POINT    
# -----------------------------
class ParkFacility(Base):
    __tablename__ = "park_facilities"

    objectid         = Column(Integer, primary_key=True, index=True)
    class_name       = Column("class", String)          
    additional_info  = Column(String, nullable=True)
    uniqueid         = Column(String, nullable=True)
    name_left        = Column(String, nullable=True)
    index_right      = Column(Integer, nullable=True)
    fid              = Column(Integer, nullable=True)
    n_reserve        = Column(Integer, nullable=True)
    l_code           = Column(String, nullable=True)
    name_right       = Column(String, nullable=True)
    shape_leng       = Column(Float, nullable=True)
    shape_area       = Column(Float, nullable=True)
    facility_type    = Column(String(50), default='standard')
    phone            = Column(String(50), nullable=True)
    hours_open       = Column(Time, nullable=True)
    hours_close      = Column(Time, nullable=True)
    price_range      = Column(String(10), nullable=True)
    price_info       = Column(Text, nullable=True)
    rating           = Column(DECIMAL(2, 1), nullable=True)
    review_count     = Column(Integer, nullable=True)
    cuisine          = Column(String(100), nullable=True)
    website          = Column(Text, nullable=True)
    activities       = Column(ARRAY(Text), nullable=True)
    service_options  = Column(ARRAY(Text), nullable=True)
    reservation_links = Column(ARRAY(Text), nullable=True)
    order_links      = Column(ARRAY(Text), nullable=True)
    address          = Column(Text, nullable=True)
    geom = Column(Geometry("POINT", srid=4326, spatial_index=True))

# -----------------------------------
# 3. Pasir Ris Park centroid  POINT     
# ----------------------------------
class Park(Base):
    __tablename__ = "parks"

    objectid = Column(Integer, primary_key=True, index=True)
    name      = Column(String)
    x_local   = Column("x", Float)        # original SVY21 easting
    y_local   = Column("y", Float)        # original SVY21 northing

    geom = Column(Geometry("POINT", srid=4326, spatial_index=True))
