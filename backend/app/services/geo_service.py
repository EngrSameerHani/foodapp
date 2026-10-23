"""Haversine distance and delivery fee calculation."""
import math


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Return great-circle distance in kilometres between two points."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def calculate_delivery_fee(
    distance_km: float,
    base_fee: float,
    per_km_rate: float,
    max_fee: float = 15.0,
) -> float:
    fee = base_fee + distance_km * per_km_rate
    return round(min(fee, max_fee), 2)
