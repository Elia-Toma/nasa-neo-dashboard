import diskcache as dc
from app.core.config import settings

# Persistent SQLite disk cache to survive application restarts
neo_cache = dc.Cache(settings.CACHE_DIR)


def get_cache():
    return neo_cache
