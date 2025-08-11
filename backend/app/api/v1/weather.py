import datetime
import pytz
import httpx
import math
from fastapi import APIRouter, Query, HTTPException

router = APIRouter(tags=["weather"])
BASE_URL = "https://api-open.data.gov.sg/v2/real-time/api"

def _get_date_str_with_fallback():
    """
    Returns the appropriate date string for API calls.
    During midnight to 5am, uses previous day's date due to API downtime.
    Returns tuple: (date_str, is_fallback)
    """
    sgt = pytz.timezone("Asia/Singapore")
    now = datetime.datetime.now(tz=sgt)
    
    # Check if current time is between midnight and 5am
    if 0 <= now.hour < 5:
        # Use previous day's date
        yesterday = now - datetime.timedelta(days=1)
        return yesterday.strftime("%Y-%m-%d"), True
    else:
        return now.strftime("%Y-%m-%d"), False

def _latest_map_from(payload):
    try:
        latest = payload["data"]["readings"][0]
        return latest["timestamp"], {d["stationId"]: float(d["value"]) for d in latest["data"]}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Upstream schema error: {e}")

def _round1(x):
    return None if x is None else round(float(x), 1)

def _stations_from(payload):
    return payload.get("data", {}).get("stations") or []

def _hav(lat1, lon1, lat2, lon2):
    R = 6371e3
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))

def _nearest_station_id(stations, lat, lon):
    best = None
    best_d = float("inf")
    for s in stations:
        slat = s.get("location", {}).get("latitude")
        slon = s.get("location", {}).get("longitude")
        sid = s.get("stationId") or s.get("id") or s.get("deviceId")
        if sid is None or slat is None or slon is None:
            continue
        d = _hav(lat, lon, float(slat), float(slon))
        if d < best_d:
            best_d = d
            best = sid
    return best

def _apparent_temperature_c(t_c, rh, v_ms):
    if t_c is None or rh is None or v_ms is None:
        return t_c
    rh = max(0.0, min(100.0, float(rh)))
    e = (rh / 100.0) * 6.105 * math.exp(17.27 * float(t_c) / (237.7 + float(t_c)))
    return float(t_c) + 0.33 * e - 0.70 * float(v_ms) - 4.00

def _single_station_record(stations, sid):
    for s in stations:
        if s.get("stationId") == sid:
            return [s]
    return []

@router.get("/weather/now")
def weather_now():
    date_str, is_fallback = _get_date_str_with_fallback()
    url = f"{BASE_URL}/two-hr-forecast?date={date_str}"
    response = httpx.get(url, timeout=5).json()
    
    # Add fallback indicator to response
    if is_fallback:
        response["is_fallback_data"] = True
        response["fallback_reason"] = "Using previous day's data due to API downtime (12am-5am)"
    
    return response

@router.get("/weather/wind-speed-now")
def wind_speed_now():
    date_str, is_fallback = _get_date_str_with_fallback()
    url = f"{BASE_URL}/wind-speed?date={date_str}"
    response = httpx.get(url, timeout=5).json()
    
    if is_fallback:
        response["is_fallback_data"] = True
        response["fallback_reason"] = "Using previous day's data due to API downtime (12am-5am)"
    
    return response

@router.get("/weather/psi-now")
def psi_now():
    date_str, is_fallback = _get_date_str_with_fallback()
    url = f"{BASE_URL}/psi?date={date_str}"
    response = httpx.get(url, timeout=5).json()
    
    if is_fallback:
        response["is_fallback_data"] = True
        response["fallback_reason"] = "Using previous day's data due to API downtime (12am-5am)"
    
    return response

@router.get("/weather/full")
def full_weather_now():
    sgt = pytz.timezone("Asia/Singapore")
    now = datetime.datetime.now(tz=sgt)
    date_str, is_fallback = _get_date_str_with_fallback()

    try:
        forecast_url_2hr = f"{BASE_URL}/two-hr-forecast?date={date_str}"
        forecast_url_24hr = f"{BASE_URL}/twenty-four-hr-forecast?date={date_str}"
        wind_url = f"{BASE_URL}/wind-speed?date={date_str}"
        psi_url = f"{BASE_URL}/psi?date={date_str}"

        forecast_res_2hr = httpx.get(forecast_url_2hr, timeout=5)
        forecast_res_24hr = httpx.get(forecast_url_24hr, timeout=5)
        wind_res = httpx.get(wind_url, timeout=5)
        psi_res = httpx.get(psi_url, timeout=5)

        forecast_data_2hr = forecast_res_2hr.json()
        forecast_data_24hr = forecast_res_24hr.json()
        wind_data = wind_res.json()
        psi_data = psi_res.json()

        general_24 = (forecast_data_24hr.get("data", {})
                                     .get("records", [{}])[0]
                                     .get("general", {}))
        temperature = general_24.get("temperature", {})
        humidity = general_24.get("relativeHumidity", {})

        item_2hr = (forecast_data_2hr.get("data", {}).get("items") or [{}])[0]
        area_forecasts = item_2hr.get("forecasts") or []
        pr = next((f for f in area_forecasts if f.get("area", "").lower() == "pasir ris"), None)
        cond_text = (pr or (area_forecasts[0] if area_forecasts else {})).get("forecast")
        forecast = {"text": cond_text, "code": None}

        wind_speed_knots = None
        try:
            for reading in wind_data["data"]["readings"]:
                for r in reading["data"]:
                    if r.get("stationId") == "S106":
                        wind_speed_knots = float(r["value"])
                        break
                if wind_speed_knots is not None:
                    break
        except Exception:
            wind_speed_knots = None
        wind_speed_kmh = round(wind_speed_knots * 1.852, 1) if wind_speed_knots is not None else None

        psi_reading = psi_data["data"]["items"][0]["readings"]
        psi_east = {
            "psi_twenty_four_hourly": psi_reading["psi_twenty_four_hourly"]["east"],
            "pm25_sub_index": psi_reading["pm25_sub_index"]["east"],
            "pm25_twenty_four_hourly": psi_reading["pm25_twenty_four_hourly"]["east"],
        }

        response = {
            "timestamp": now.isoformat(),
            "temperature": temperature.get("high"),
            "tempLow": temperature.get("low"),
            "condition": forecast.get("text"),
            "conditionCode": forecast.get("code"),
            "humidity": humidity.get("high"),
            "windSpeed": wind_speed_kmh,
            "windSpeedKnots": wind_speed_knots,
            "psi": psi_east,
        }
        
        # Add fallback indicator if using previous day's data
        if is_fallback:
            response["is_fallback_data"] = True
            response["fallback_reason"] = "Data from previous day due to API downtime (12am-5am)"
            response["data_date"] = date_str
        
        return response

    except Exception as e:
        return {"error": f"Failed to fetch combined weather data: {str(e)}"}

@router.get("/feels-like")
def feels_like(
    date: str | None = Query(default=None),
    lat: float = Query(default=1.3815),
    lon: float = Query(default=103.9510),
):
    # If no date provided, use the fallback logic
    if date is None:
        date, is_fallback = _get_date_str_with_fallback()
    else:
        is_fallback = False
    
    params = {"date": date}

    air = httpx.get(f"{BASE_URL}/air-temperature", params=params, timeout=5).json()
    rh = httpx.get(f"{BASE_URL}/relative-humidity", params=params, timeout=5).json()
    wind = httpx.get(f"{BASE_URL}/wind-speed", params=params, timeout=5).json()

    ts_air, t_map = _latest_map_from(air)
    ts_rh, rh_map = _latest_map_from(rh)
    ts_w, w_map = _latest_map_from(wind)

    stations = _stations_from(air)
    sid = _nearest_station_id(stations, lat, lon)

    t_c = t_map.get(sid)
    r = rh_map.get(sid)
    v_ms = w_map.get(sid)

    at = _round1(_apparent_temperature_c(t_c, r, v_ms))
    ts = max(ts_air, ts_rh, ts_w)

    response = {
        "code": 0,
        "errorMsg": "",
        "data": {
            "stations": _single_station_record(stations, sid),
            "readings": [{
                "timestamp": ts,
                "data": [{
                    "stationId": sid,
                    "value": at,
                    "airTemperature": _round1(t_c),
                    "relativeHumidity": _round1(r),
                    "windSpeed": _round1(v_ms),
                    "method": "Steadman Apparent Temperature",
                }]
            }],
            "readingType": "Apparent Temperature (Steadman) from Air Temp, RH & Wind",
            "readingUnit": "deg c",
        },
    }
    
    if is_fallback:
        response["is_fallback_data"] = True
        response["fallback_reason"] = "Using previous day's data due to API downtime (12am-5am)"
        response["data_date"] = date
    
    return response

@router.get("/apparent-temperature")
def apparent_temperature(
    date: str | None = Query(default=None),
    lat: float = Query(default=1.3815),
    lon: float = Query(default=103.9510),
):
    return feels_like(date=date, lat=lat, lon=lon)
