import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock
from app.main import app
from app.api.endpoints import nasa_client

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_validate_dates_range_too_long():
    # Assert range validation blocks spans exceeding 90 days
    response = client.get("/api/asteroids?start_date=2026-05-01&end_date=2026-08-01")
    assert response.status_code == 400
    assert "Date range too long" in response.json()["detail"]

def test_validate_dates_invalid_format():
    response = client.get("/api/asteroids?start_date=2026-05-01&end_date=invalid-date")
    assert response.status_code == 400
    assert "Invalid date format" in response.json()["detail"]

def test_validate_dates_start_after_end():
    response = client.get("/api/asteroids?start_date=2026-05-10&end_date=2026-05-01")
    assert response.status_code == 400
    assert "Start date must be before or equal to end date" in response.json()["detail"]

@pytest.mark.asyncio
async def test_endpoints_upstream_rate_limited(mocker):
    # Mock NASA client to return a rate-limited state
    mock_feed = mocker.patch.object(
        nasa_client, "get_asteroids_feed", new_callable=AsyncMock
    )
    mock_feed.return_value = {
        "element_count": 0,
        "near_earth_objects": {},
        "errors": ["Rate limit exceeded"],
        "rate_limited": True
    }

    # Assert endpoints return HTTP 429
    response = client.get("/api/asteroids?start_date=2026-05-01&end_date=2026-05-05")
    assert response.status_code == 429
    assert response.json()["detail"] == "NASA API rate limit exceeded."

    response_chart = client.get("/api/asteroids/charts?start_date=2026-05-01&end_date=2026-05-05")
    assert response_chart.status_code == 429
    assert response_chart.json()["detail"] == "NASA API rate limit exceeded."

@pytest.mark.asyncio
async def test_asteroids_endpoint_success(mocker):
    mock_feed_data = {
        "element_count": 2,
        "near_earth_objects": {
            "2026-05-01": [
                {
                    "name": "Asteroid Small",
                    "is_potentially_hazardous_asteroid": False,
                    "close_approach_data": [{"miss_distance": {"kilometers": "50000000"}}],
                    "estimated_diameter": {"kilometers": {"estimated_diameter_max": 0.1}}
                },
                {
                    "name": "Asteroid Big",
                    "is_potentially_hazardous_asteroid": True,
                    "close_approach_data": [{"miss_distance": {"kilometers": "15000000"}}],
                    "estimated_diameter": {"kilometers": {"estimated_diameter_max": 1.5}}
                }
            ]
        },
        "errors": [],
        "rate_limited": False
    }

    mock_feed = mocker.patch.object(
        nasa_client, "get_asteroids_feed", new_callable=AsyncMock
    )
    mock_feed.return_value = mock_feed_data

    # Assert results are sorted by close approach proximity
    response = client.get("/api/asteroids?start_date=2026-05-01&end_date=2026-05-01&sort_by=distance")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 2
    assert len(data["results"]) == 2
    assert data["results"][0]["name"] == "Asteroid Big"
    assert data["results"][1]["name"] == "Asteroid Small"

    # Assert filter returns only hazardous objects
    response_haz = client.get("/api/asteroids?start_date=2026-05-01&end_date=2026-05-01&hazardous_only=true")
    assert response_haz.status_code == 200
    data_haz = response_haz.json()
    assert data_haz["count"] == 1
    assert data_haz["results"][0]["name"] == "Asteroid Big"

@pytest.mark.asyncio
async def test_asteroids_charts_endpoint_success(mocker):
    mock_feed_data = {
        "element_count": 1,
        "near_earth_objects": {
            "2026-05-01": [
                {
                    "name": "Chart Asteroid",
                    "is_potentially_hazardous_asteroid": True,
                    "close_approach_data": [{"miss_distance": {"kilometers": "20000000"}}],
                    "estimated_diameter": {"kilometers": {"estimated_diameter_max": 0.8}}
                }
            ]
        },
        "errors": [],
        "rate_limited": False
    }

    mock_feed = mocker.patch.object(
        nasa_client, "get_asteroids_feed", new_callable=AsyncMock
    )
    mock_feed.return_value = mock_feed_data

    response = client.get("/api/asteroids/charts?start_date=2026-05-01&end_date=2026-05-01")
    assert response.status_code == 200
    data = response.json()
    assert "chart_data" in data
    assert len(data["chart_data"]) == 1
    assert data["chart_data"][0]["name"] == "Chart Asteroid"
    assert data["chart_data"][0]["distance_km"] == 20000000.0
    assert data["chart_data"][0]["size_km"] == 0.8
    assert data["chart_data"][0]["is_hazardous"] is True

@pytest.mark.asyncio
async def test_asteroid_detail_endpoint_success(mocker):
    mock_detail = mocker.patch.object(
        nasa_client, "get_asteroid_details", new_callable=AsyncMock
    )
    mock_detail.return_value = {"id": "12345", "name": "Specific Asteroid"}

    response = client.get("/api/asteroids/12345")
    assert response.status_code == 200
    assert response.json()["name"] == "Specific Asteroid"

@pytest.mark.asyncio
async def test_asteroid_detail_endpoint_not_found(mocker):
    mock_detail = mocker.patch.object(
        nasa_client, "get_asteroid_details", new_callable=AsyncMock
    )
    mock_detail.side_effect = Exception("Not Found")

    response = client.get("/api/asteroids/notfound")
    assert response.status_code == 404
    assert response.json()["detail"] == "Asteroid not found or upstream error"
