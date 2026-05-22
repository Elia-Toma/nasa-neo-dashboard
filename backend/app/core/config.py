from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "NASA NEO Proxy Backend"
    NASA_API_KEY: str = "DEMO_KEY"
    NASA_BASE_URL: str = "https://api.nasa.gov/neo/rest/v1"
    CACHE_DIR: str = ".cache"
    CACHE_EXPIRE_SECONDS: int = 86400  # 24-hour cache TTL matching daily NEO feed updates
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()