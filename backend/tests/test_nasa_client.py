import pytest
import httpx
from unittest.mock import AsyncMock, MagicMock
from app.services.nasa_client import NasaNeoClient

@pytest.fixture
def nasa_client():
    return NasaNeoClient()

def test_get_date_chunks_under_7_days(nasa_client):
    chunks = nasa_client._get_date_chunks("2026-05-01", "2026-05-05")
    assert chunks == [("2026-05-01", "2026-05-05")]

def test_get_date_chunks_exactly_7_days(nasa_client):
    # timedelta of 7 days: 2026-05-08 - 2026-05-01 = 7 days.
    chunks = nasa_client._get_date_chunks("2026-05-01", "2026-05-08")
    assert chunks == [("2026-05-01", "2026-05-08")]

def test_get_date_chunks_over_7_days(nasa_client):
    # 15 days range (2026-05-01 to 2026-05-15) -> 2 chunks
    chunks = nasa_client._get_date_chunks("2026-05-01", "2026-05-15")
    assert chunks == [
        ("2026-05-01", "2026-05-08"),
        ("2026-05-09", "2026-05-15")
    ]

@pytest.mark.asyncio
async def test_get_asteroids_feed_success(nasa_client, mocker):
    # Mock data to be returned by mock client
    mock_payload = {
        "element_count": 1,
        "near_earth_objects": {
            "2026-05-01": [
                {
                    "name": "Asteroid Test",
                    "is_potentially_hazardous_asteroid": False,
                    "close_approach_data": [{"miss_distance": {"kilometers": "1000000"}}],
                    "estimated_diameter": {"kilometers": {"estimated_diameter_max": 0.5}}
                }
            ]
        }
    }
    
    # Create mock response
    mock_response = MagicMock(spec=httpx.Response)
    mock_response.status_code = 200
    mock_response.json.return_value = mock_payload
    mock_response.raise_for_status = MagicMock()

    # Patch the httpx.AsyncClient.get method
    mock_get = mocker.patch("httpx.AsyncClient.get", new_callable=AsyncMock)
    mock_get.return_value = mock_response

    # Call method
    result = await nasa_client.get_asteroids_feed("2026-05-01", "2026-05-01")

    # Assert correct result structure and values
    assert result["element_count"] == 1
    assert "2026-05-01" in result["near_earth_objects"]
    assert result["near_earth_objects"]["2026-05-01"][0]["name"] == "Asteroid Test"
    assert result["rate_limited"] is False
    assert len(result["errors"]) == 0
    assert mock_get.call_count == 1

@pytest.mark.asyncio
async def test_get_asteroids_feed_cache_hit(nasa_client, mocker):
    mock_payload = {
        "element_count": 1,
        "near_earth_objects": {
            "2026-05-02": [
                {
                    "name": "Cached Asteroid",
                    "is_potentially_hazardous_asteroid": True,
                    "close_approach_data": [{"miss_distance": {"kilometers": "500000"}}],
                    "estimated_diameter": {"kilometers": {"estimated_diameter_max": 0.2}}
                }
            ]
        }
    }
    
    mock_response = MagicMock(spec=httpx.Response)
    mock_response.status_code = 200
    mock_response.json.return_value = mock_payload
    mock_response.raise_for_status = MagicMock()

    mock_get = mocker.patch("httpx.AsyncClient.get", new_callable=AsyncMock)
    mock_get.return_value = mock_response

    # First request: Cache miss, network call
    result1 = await nasa_client.get_asteroids_feed("2026-05-02", "2026-05-02")
    assert result1["element_count"] == 1
    assert mock_get.call_count == 1

    # Second request: Cache hit, no network call
    result2 = await nasa_client.get_asteroids_feed("2026-05-02", "2026-05-02")
    assert result2["element_count"] == 1
    assert result2["near_earth_objects"]["2026-05-02"][0]["name"] == "Cached Asteroid"
    # Call count remains 1 since cache hit bypassed client get
    assert mock_get.call_count == 1

@pytest.mark.asyncio
async def test_get_asteroids_feed_parallel_chunking(nasa_client, mocker):
    # Mock return values for different dates
    def mock_get_side_effect(url, params, **kwargs):
        start = params["start_date"]
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 200
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {
            "element_count": 1,
            "near_earth_objects": {
                start: [{"name": f"Asteroid {start}"}]
            }
        }
        return mock_response

    mock_get = mocker.patch("httpx.AsyncClient.get", new_callable=AsyncMock)
    mock_get.side_effect = mock_get_side_effect

    # 15 days date range splits into 2 chunks
    result = await nasa_client.get_asteroids_feed("2026-05-01", "2026-05-15")
    
    assert mock_get.call_count == 2
    assert "2026-05-01" in result["near_earth_objects"]
    assert "2026-05-09" in result["near_earth_objects"]
    assert result["element_count"] == 2

@pytest.mark.asyncio
async def test_get_asteroids_feed_rate_limited(nasa_client, mocker):
    # Simulate a HTTPStatusError with status 429
    request = httpx.Request("GET", "https://api.nasa.gov/neo/rest/v1/feed")
    response = httpx.Response(status_code=429, request=request)
    
    mock_get = mocker.patch("httpx.AsyncClient.get", new_callable=AsyncMock)
    mock_get.side_effect = httpx.HTTPStatusError("Too Many Requests", request=request, response=response)

    result = await nasa_client.get_asteroids_feed("2026-05-01", "2026-05-01")

    assert result["rate_limited"] is True
    assert len(result["errors"]) == 1
    assert "Too Many Requests" in result["errors"][0]
