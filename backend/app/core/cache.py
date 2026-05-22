import diskcache as dc
from app.core.config import settings

# Initialize the persistent cache using SQLite under the hood.
# This prevents exhausting NASA API limits across server restarts.
neo_cache = dc.Cache(settings.CACHE_DIR)


def get_cache():
    return neo_cache
