import httpx
from langchain_core.tools import tool


@tool
async def geocode_place(place_name: str) -> dict:
    """Get latitude and longitude for a place name using OpenStreetMap Nominatim."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": place_name, "format": "json", "limit": 1},
            headers={"User-Agent": "ai-travel-planner/1.0"},
        )
        results = resp.json()
        if results:
            return {
                "lat": float(results[0]["lat"]),
                "lng": float(results[0]["lon"]),
                "display_name": results[0].get("display_name", ""),
            }
        return {"error": f"Could not geocode '{place_name}'"}


@tool
async def get_weather_forecast(
    lat: float, lng: float, start_date: str, end_date: str
) -> dict:
    """Get weather forecast for coordinates and date range using Open-Meteo API."""
    async with httpx.AsyncClient() as client:
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
        data = resp.json()
        return data.get("daily", {})


@tool
async def get_exchange_rate(currency_code: str) -> dict:
    """Get exchange rate from USD to target currency using Frankfurter API."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://api.frankfurter.dev/v1/latest",
            params={"from": "USD", "to": currency_code},
        )
        return resp.json()


@tool
async def search_places_nearby(
    lat: float, lng: float, category: str, limit: int = 10
) -> list[dict]:
    """Search for places of a category near given coordinates using Nominatim."""
    async with httpx.AsyncClient() as client:
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
