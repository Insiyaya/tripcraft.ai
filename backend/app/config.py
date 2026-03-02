from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    gemini_api_key: str = ""
    groq_api_key: str = ""
    mongo_uri: str = "mongodb://localhost:27017"
    database_name: str = "travel_planner"
    google_client_id: str = ""
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 72

    class Config:
        env_file = ".env"


settings = Settings()
