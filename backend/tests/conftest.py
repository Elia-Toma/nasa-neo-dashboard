import pytest
from app.core.cache import neo_cache

@pytest.fixture(autouse=True)
def clean_cache():
    """
    Clears the SQLite diskcache before and after every test to ensure test isolation.
    """
    neo_cache.clear()
    yield
    neo_cache.clear()
