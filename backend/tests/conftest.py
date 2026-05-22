import pytest
from app.core.cache import neo_cache

@pytest.fixture(autouse=True)
def clean_cache():
    """
    Reset disk cache database before and after each test run to ensure isolation.
    """
    neo_cache.clear()
    yield
    neo_cache.clear()
