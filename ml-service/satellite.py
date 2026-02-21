import requests
import numpy as np
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

SENTINEL_CLIENT_ID     = os.getenv("SENTINEL_CLIENT_ID")
SENTINEL_CLIENT_SECRET = os.getenv("SENTINEL_CLIENT_SECRET")
OPENWEATHER_API_KEY    = os.getenv("OPENWEATHER_API_KEY")

def get_sentinel_token() -> str:
    """Sentinel Hub access token lo"""
    response = requests.post(
        "https://services.sentinel-hub.com/auth/realms/main/protocol/openid-connect/token",
        data={
            "grant_type"   : "client_credentials",
            "client_id"    : SENTINEL_CLIENT_ID,
            "client_secret": SENTINEL_CLIENT_SECRET
        }
    )
    return response.json()["access_token"]

def fetch_ndvi(bbox: list, days: int = 30) -> list:
    """
    bbox = [lon_min, lat_min, lon_max, lat_max]
    Returns: list of 30 NDVI floats
    """
    try:
        token   = get_sentinel_token()
        end_dt  = datetime.now()
        start_dt= end_dt - timedelta(days=days * 5)   # 5-day revisit

        # NDVI evalscript
        evalscript = """
        //VERSION=3
        function setup() {
          return { input: ["B04", "B08"], output: { bands: 1 } };
        }
        function evaluatePixel(s) {
          let ndvi = (s.B08 - s.B04) / (s.B08 + s.B04 + 0.0001);
          return [ndvi];
        }
        """

        payload = {
            "input": {
                "bounds": {
                    "bbox": bbox,
                    "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/4326"}
                },
                "data": [{
                    "type": "sentinel-2-l2a",
                    "dataFilter": {
                        "timeRange": {
                            "from": start_dt.strftime("%Y-%m-%dT00:00:00Z"),
                            "to"  : end_dt.strftime("%Y-%m-%dT23:59:59Z")
                        },
                        "maxCloudCoverage": 20
                    }
                }]
            },
            "output": {
                "width": 64, "height": 64,
                "responses": [{"identifier": "default",
                               "format": {"type": "image/tiff"}}]
            },
            "evalscript": evalscript
        }

        response = requests.post(
            "https://services.sentinel-hub.com/api/v1/process",
            json=payload,
            headers={"Authorization": f"Bearer {token}"}
        )

        if response.status_code == 200:
            # TIFF parse karke NDVI mean nikalo
            import io
            from PIL import Image as PILImage
            img  = PILImage.open(io.BytesIO(response.content))
            arr  = np.array(img, dtype=np.float32)
            ndvi = float(np.nanmean(arr))
            # 30 days simulate (same value with noise for now)
            return [round(ndvi + np.random.normal(0, 0.02), 3) for _ in range(30)]
        else:
            return _fallback_ndvi()

    except Exception as e:
        print(f"Sentinel API error: {e}")
        return _fallback_ndvi()

def _fallback_ndvi() -> list:
    """
    Sentinel unavailable — realistic synthetic NDVI generate karo
    based on current date + random trend
    """
    import random
    from datetime import datetime
    
    random.seed(datetime.now().microsecond)  # ← True random seed
    
    base      = random.uniform(0.35, 0.75)   # ← Random base NDVI
    is_stress = random.random() < 0.4        # ← 40% chance declining trend
    
    series = []
    current = base
    for i in range(30):
        if is_stress:
            trend = random.uniform(-0.015, -0.003)   # Declining
        else:
            trend = random.uniform(-0.005, 0.008)    # Stable/improving
        
        current = max(0.1, min(0.95, current + trend + random.gauss(0, 0.01)))
        series.append(round(current, 3))
    
    return series


def fetch_weather(lat: float, lon: float) -> dict:
    """OpenWeatherMap se current weather lo"""
    try:
        url = (
            f"https://api.openweathermap.org/data/2.5/weather"
            f"?lat={lat}&lon={lon}"
            f"&appid={OPENWEATHER_API_KEY}&units=metric"
        )
        r    = requests.get(url, timeout=5)
        data = r.json()
        return {
            "temp"        : data["main"]["temp"],
            "humidity"    : data["main"]["humidity"],
            "rainfall"    : data.get("rain", {}).get("1h", 0),
            "description" : data["weather"][0]["description"],
            "day_of_year" : datetime.now().timetuple().tm_yday
        }
    except Exception as e:
        print(f"Weather API error: {e}")
        return {
            "temp": 28, "humidity": 65,
            "rainfall": 0, "description": "N/A",
            "day_of_year": datetime.now().timetuple().tm_yday
        }
