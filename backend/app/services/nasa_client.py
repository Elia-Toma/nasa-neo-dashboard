import httpx
import asyncio
import logging
from datetime import datetime, timedelta
from app.core.config import settings
from app.core.cache import get_cache

# Configure basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class NasaNeoClient:
    def __init__(self):
        self.base_url = settings.NASA_BASE_URL
        self.api_key = settings.NASA_API_KEY
        self.cache = get_cache()
        self.max_days_per_call = 7
        # Prevent completely flooding the NASA API when querying large date ranges
        self.semaphore = asyncio.Semaphore(5)

    def _get_date_chunks(self, start_date: str, end_date: str) -> list[tuple[str, str]]:
        """
        Splits a large date range into smaller chunks compliant with NASA's 7-day limit.
        """
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")

        chunks = []
        current = start
        while current <= end:
            chunk_end = current + timedelta(days=self.max_days_per_call)
            if chunk_end > end:
                chunk_end = end
            chunks.append((current.strftime("%Y-%m-%d"), chunk_end.strftime("%Y-%m-%d")))
            current = chunk_end + timedelta(days=1)

        return chunks

    async def _fetch_chunk(self, client: httpx.AsyncClient, start_date: str, end_date: str) -> dict:
        """
        Fetches a single date range chunk, checking the persistent cache first.
        Implements failure-first thinking: captures errors to avoid whole-request collapse.
        """
        cache_key = f"neo_feed_{start_date}_{end_date}"
        cached_data = self.cache.get(cache_key)

        if cached_data:
            logger.info(f"Cache hit for range {start_date} to {end_date}")
            return cached_data

        url = f"{self.base_url}/feed"
        params = {
            "start_date": start_date,
            "end_date": end_date,
            "api_key": self.api_key
        }

        async with self.semaphore:
            try:
                logger.info(f"Fetching from NASA API for range {start_date} to {end_date}")
                # 10 second timeout to prevent hanging requests
                response = await client.get(url, params=params, timeout=10.0)
                response.raise_for_status()
                data = response.json()

                self.cache.set(cache_key, data, expire=settings.CACHE_EXPIRE_SECONDS)
                return data

            except httpx.HTTPStatusError as e:
                status_code = e.response.status_code
                logger.error(f"HTTP Status error {status_code} for range {start_date}-{end_date}: {e}")
                return {"near_earth_objects": {}, "element_count": 0, "error": str(e), "status_code": status_code}
            except httpx.HTTPError as e:
                logger.error(f"HTTP/Network error for range {start_date}-{end_date}: {e}")
                # Return empty valid structure with error metadata instead of crashing
                return {"near_earth_objects": {}, "element_count": 0, "error": str(e), "status_code": None}

    async def get_asteroids_feed(self, start_date: str, end_date: str) -> dict:
        """
        Public method to fetch asteroid data over any date range.
        Handles chunking, parallel execution, and aggregation.
        """
        chunks = self._get_date_chunks(start_date, end_date)

        async with httpx.AsyncClient() as client:
            tasks = [self._fetch_chunk(client, start, end) for start, end in chunks]
            results = await asyncio.gather(*tasks)

        # Aggregate the distributed results into a single response
        aggregated_data = {
            "element_count": 0,
            "near_earth_objects": {},
            "errors": [],
            "rate_limited": False
        }

        for result in results:
            if "error" in result:
                aggregated_data["errors"].append(result["error"])
                if result.get("status_code") == 429:
                    aggregated_data["rate_limited"] = True
            else:
                aggregated_data["element_count"] += result.get("element_count", 0)

                # Merge the date dictionaries
                for date, objects in result.get("near_earth_objects", {}).items():
                    if date in aggregated_data["near_earth_objects"]:
                        aggregated_data["near_earth_objects"][date].extend(objects)
                    else:
                        aggregated_data["near_earth_objects"][date] = objects

        return aggregated_data

    async def get_asteroid_details(self, asteroid_id: str) -> dict:
        """
        Fetches detailed lookup data for a specific asteroid.
        """
        cache_key = f"neo_detail_{asteroid_id}"
        cached_data = self.cache.get(cache_key)

        if cached_data:
            logger.info(f"Cache hit for asteroid {asteroid_id}")
            return cached_data

        url = f"{self.base_url}/neo/{asteroid_id}"
        params = {"api_key": self.api_key}

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, params=params, timeout=10.0)
                response.raise_for_status()
                data = response.json()
                self.cache.set(cache_key, data, expire=settings.CACHE_EXPIRE_SECONDS)
                return data
            except httpx.HTTPError as e:
                logger.error(f"Failed to fetch asteroid {asteroid_id}: {e}")
                # For a specific resource lookup, we want to expose the error
                raise e


nasa_client = NasaNeoClient()
