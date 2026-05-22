from fastapi import APIRouter, HTTPException, Query
from app.services.nasa_client import nasa_client
from typing import Optional
from datetime import datetime
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


def validate_dates(start_date: str, end_date: str):
    """
    Validate ISO date formats, range order, and 90-day span constraint.
    """
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
        if start > end:
            raise ValueError("Start date must be before or equal to end date.")
        
        limit_days = 90
        if (end - start).days > limit_days:
            raise ValueError(f"Date range too long. Maximum allowed is {limit_days} days.")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format or range: {str(e)}")

def check_upstream_errors(data: dict):
    """
    Check for rate limiting or gateway failure flags in response payload.
    """
    if data.get("rate_limited"):
        raise HTTPException(status_code=429, detail="NASA API rate limit exceeded.")

    if "errors" in data and len(data["errors"]) > 0:
        logger.warning(f"Partial or total failure from NASA API: {data['errors']}")
        if not data["near_earth_objects"]:
            raise HTTPException(status_code=502, detail="Failed to fetch data from upstream NASA API.")


@router.get("/asteroids")
async def get_asteroids(
    start_date: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD format"),
    hazardous_only: bool = Query(False, description="Filter only potentially hazardous asteroids"),
    sort_by: Optional[str] = Query(None, description="Sort by: 'date', 'distance', 'size'")
):
    validate_dates(start_date, end_date)

    data = await nasa_client.get_asteroids_feed(start_date, end_date)

    check_upstream_errors(data)

    flattened_asteroids = []

    # Flatten daily feeds into a 1D array of asteroid records
    for date_key, asteroids in data.get("near_earth_objects", {}).items():
        for ast in asteroids:
            if hazardous_only and not ast.get("is_potentially_hazardous_asteroid"):
                continue

            # Extract distance and diameter metrics. Fallback to inf/0.0 on parse failure.
            try:
                distance = float(ast["close_approach_data"][0]["miss_distance"]["kilometers"])
            except (KeyError, IndexError, ValueError):
                distance = float('inf')

            try:
                size = float(ast["estimated_diameter"]["kilometers"]["estimated_diameter_max"])
            except (KeyError, ValueError):
                size = 0.0

            ast["_processed"] = {
                "close_approach_date": date_key,
                "miss_distance_km": distance,
                "max_diameter_km": size
            }
            flattened_asteroids.append(ast)

    # Sort results according to the requested sort parameter
    if sort_by == "distance":
        flattened_asteroids.sort(key=lambda x: x["_processed"]["miss_distance_km"])
    elif sort_by == "size":
        flattened_asteroids.sort(key=lambda x: x["_processed"]["max_diameter_km"], reverse=True)
    elif sort_by == "date":
        flattened_asteroids.sort(key=lambda x: x["_processed"]["close_approach_date"])

    return {
        "count": len(flattened_asteroids),
        "results": flattened_asteroids,
        "upstream_errors": data.get("errors", [])
    }


@router.get("/asteroids/charts")
async def get_asteroids_chart_data(
    start_date: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD format")
):
    """
    Format asteroid data for Recharts visualization.
    """
    validate_dates(start_date, end_date)
    data = await nasa_client.get_asteroids_feed(start_date, end_date)

    check_upstream_errors(data)

    chart_data = []
    for date_key, asteroids in data.get("near_earth_objects", {}).items():
        for ast in asteroids:
            try:
                distance = float(ast["close_approach_data"][0]["miss_distance"]["kilometers"])
                size = float(ast["estimated_diameter"]["kilometers"]["estimated_diameter_max"])
                chart_data.append({
                    "date": date_key,
                    "name": ast["name"],
                    "distance_km": distance,
                    "size_km": size,
                    "is_hazardous": ast.get("is_potentially_hazardous_asteroid", False)
                })
            except (KeyError, IndexError, ValueError):
                continue

    chart_data.sort(key=lambda x: x["date"])
    return {"chart_data": chart_data}


@router.get("/asteroids/{asteroid_id}")
async def get_asteroid(asteroid_id: str):
    """
    Fetch raw metadata for a specific asteroid from cache or upstream.
    """
    try:
        data = await nasa_client.get_asteroid_details(asteroid_id)
        return data
    except Exception as e:
        logger.error(f"Error fetching asteroid {asteroid_id}: {str(e)}")
        raise HTTPException(status_code=404, detail="Asteroid not found or upstream error")
