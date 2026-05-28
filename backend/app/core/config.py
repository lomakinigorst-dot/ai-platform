from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://aiplatform:secret@localhost:5432/aiplatform"
    REDIS_URL: str = "redis://localhost:6379/0"

    DEEPSEEK_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""      # только для эмбеддингов (text-embedding-3-small)
    OPENROUTER_API_KEY: str = ""  # используется для vision (Gemini Flash)
    FIRECRAWL_API_KEY: str = ""

    # DeepSeek прямой API — основная модель для всех диалогов
    MODEL_DIALOG: str = "deepseek-v4-flash"
    # OpenRouter — vision extraction (изображения, аудио, видео)
    MODEL_VISION: str = "openai/gpt-4o-mini"
    # Anthropic прямой API — маркетинг-анализ, ДНК, тексты, качество
    MODEL_ANALYSIS: str = "claude-sonnet-4-6"

    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080

    # SMTP (email-уведомления о лидах)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""

    # Агентский кабинет
    AGENT_EMAIL: str = "admin@localhost"
    AGENT_PASSWORD: str = "changeme"

    BASE_DOMAIN: str = "localhost"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    class Config:
        env_file = ("../.env", ".env")
        extra = "ignore"


settings = Settings()
