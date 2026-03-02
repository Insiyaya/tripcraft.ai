import math


def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance in km between two lat/lng points."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def estimate_travel_time_min(lat1: float, lng1: float, lat2: float, lng2: float) -> int:
    """Estimate travel time in minutes assuming ~30 km/h city travel speed."""
    dist = haversine(lat1, lng1, lat2, lng2)
    return max(5, int(dist / 30 * 60))
