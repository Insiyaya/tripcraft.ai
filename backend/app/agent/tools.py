import logging

import httpx
from langchain_core.tools import tool

logger = logging.getLogger(__name__)

_TIMEOUT = httpx.Timeout(15.0, connect=10.0)


@tool
async def geocode_place(place_name: str) -> dict:
    """Get latitude and longitude for a place name using OpenStreetMap Nominatim."""
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": place_name, "format": "json", "limit": 1},
                headers={"User-Agent": "ai-travel-planner/1.0"},
            )
            resp.raise_for_status()
            results = resp.json()
            if results:
                return {
                    "lat": float(results[0]["lat"]),
                    "lng": float(results[0]["lon"]),
                    "display_name": results[0].get("display_name", ""),
                }
            return {"error": f"Could not geocode '{place_name}'"}
    except Exception as e:
        logger.warning("Geocoding failed for '%s': %s", place_name, e)
        return {"error": f"Geocoding service unavailable: {e}"}


@tool
async def get_weather_forecast(
    lat: float, lng: float, start_date: str, end_date: str
) -> dict:
    """Get weather forecast for coordinates and date range using Open-Meteo API."""
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": lat,
                    "longitude": lng,
                    "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode",
                    "start_date": start_date,
                    "end_date": end_date,
                    "timezone": "auto",
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("daily", {})
    except Exception as e:
        logger.warning("Weather forecast failed: %s", e)
        return {}


@tool
async def get_exchange_rate(currency_code: str) -> dict:
    """Units of `currency_code` per 1 USD, via the Frankfurter API.

    Returns {"rate": <float>} on success and {"error": "..."} on failure.

    Deliberately never returns a fabricated rate of 1.0 on failure: a caller
    cannot tell that apart from a genuine rate, so it ends up labelling USD
    figures with another currency's symbol — showing a $500 hotel as ₹500.
    Frankfurter is also ECB-backed and covers only ~30 currencies, so a
    successful response can still omit the requested code.
    """
    code = (currency_code or "").strip().upper()
    if not code or code == "USD":
        return {"rate": 1.0}

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.get(
                "https://api.frankfurter.dev/v1/latest",
                params={"from": "USD", "to": code},
            )
            resp.raise_for_status()
            rate = resp.json().get("rates", {}).get(code)
    except Exception as e:
        logger.warning("Exchange rate failed for %s: %s", code, e)
        return {"error": str(e)}

    if not isinstance(rate, (int, float)) or isinstance(rate, bool) or rate <= 0:
        logger.warning("Frankfurter returned no usable rate for %s: %r", code, rate)
        return {"error": f"no rate available for {code}"}

    return {"rate": float(rate)}


@tool
async def search_places_nearby(
    lat: float, lng: float, category: str, limit: int = 10
) -> list[dict]:
    """Search for places of a category near given coordinates using Nominatim."""
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={
                    "q": category,
                    "format": "json",
                    "limit": limit,
                    "viewbox": f"{lng - 0.1},{lat + 0.1},{lng + 0.1},{lat - 0.1}",
                    "bounded": 1,
                },
                headers={"User-Agent": "ai-travel-planner/1.0"},
            )
            resp.raise_for_status()
            results = resp.json()
            return [
                {
                    "name": r.get("display_name", "").split(",")[0],
                    "lat": float(r["lat"]),
                    "lng": float(r["lon"]),
                    "type": r.get("type", ""),
                }
                for r in results
            ]
    except Exception as e:
        logger.warning("Places search failed for '%s': %s", category, e)
        return []
