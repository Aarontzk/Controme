from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_env: str = "development"
    database_url: str = "postgresql://postgres:postgres@localhost:5432/retas_siber_imut"
    secret_key: str = "change-me-in-production"
    allowed_origins: list[str] = ["http://localhost:5173"]
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    class Config:
        env_file = ".env"


settings = Settings()
