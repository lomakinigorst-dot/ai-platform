from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://aiplatform:secret@localhost:5432/aiplatform"
    REDIS_URL: str = "redis://localhost:6379/0"

    DEEPSEEK_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    FIRECRAWL_API_KEY: str = ""

    # Модели через OpenRouter
    MODEL_DIALOG: str = "deepseek/deepseek-chat"        # диалоги — быстро и дёшево
    MODEL_ANALYSIS: str = "anthropic/claude-sonnet-4-5" # анализ ЦА, тексты — качество

    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080

    BASE_DOMAIN: str = "localhost"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    class Config:
        env_file = ("../.env", ".env")
        extra = "ignore"


settings = Settings()
