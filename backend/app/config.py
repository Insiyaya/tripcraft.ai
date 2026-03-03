from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    gemini_api_key: str = ""
    groq_api_key: str = ""
    mongo_uri: str = "mongodb://localhost:27017"
    database_name: str = "travel_planner"
    clerk_issuer: str = ""
    clerk_audience: str = ""
    clerk_jwks_url: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
