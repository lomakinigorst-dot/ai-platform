import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import String, Text, DateTime, Boolean, Integer, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class ClientStatus(str, Enum):
    pending = "pending"       # добавлен, ещё не проиндексирован
    indexing = "indexing"     # сканирование в процессе
    active = "active"         # готов к работе
    paused = "paused"         # на паузе
    trial = "trial"           # триальный период


class AssistantMode(str, Enum):
    sales = "sales"           # менеджер по продажам — собирает лиды
    support = "support"       # техподдержка — консультирует


class ClientNiche(str, Enum):
    ecommerce = "ecommerce"
    services = "services"
    real_estate = "real_estate"
    medical = "medical"
    b2b = "b2b"
    other = "other"


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Основная информация
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    domain: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    website_url: Mapped[str] = mapped_column(String(500), nullable=False)

    # Статус и индексация
    status: Mapped[ClientStatus] = mapped_column(String(50), default=ClientStatus.pending)
    index_progress: Mapped[float] = mapped_column(Float, default=0.0)  # 0-100%
    pages_indexed: Mapped[int] = mapped_column(Integer, default=0)
    pages_total: Mapped[int] = mapped_column(Integer, default=0)
    scan_phase: Mapped[str | None] = mapped_column(String(200), nullable=True)   # текущая фаза сканирования
    scan_quality: Mapped[int] = mapped_column(Integer, default=0)                 # 0-100
    needs_deep_scan: Mapped[bool] = mapped_column(Boolean, default=False)         # рекомендовать глубокое сканирование

    # Автоопределённые данные компании
    niche: Mapped[str | None] = mapped_column(String(50), nullable=True)
    company_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    company_contacts: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # {phones, emails, addresses}

    # Настройки AI-ассистента
    assistant_mode: Mapped[AssistantMode] = mapped_column(String(50), default=AssistantMode.sales)
    assistant_name: Mapped[str] = mapped_column(String(100), default="Алексей")
    assistant_gender: Mapped[str] = mapped_column(String(10), default="male")
    assistant_avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    system_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Настройки виджета
    widget_settings: Mapped[dict] = mapped_column(JSON, default=dict)  # триггеры, цвета, задержки

    # Тарифы и лимиты
    leads_limit: Mapped[int] = mapped_column(Integer, default=0)
    leads_used: Mapped[int] = mapped_column(Integer, default=0)
    dialogs_limit: Mapped[int] = mapped_column(Integer, default=0)
    dialogs_used: Mapped[int] = mapped_column(Integer, default=0)
    trial_ends_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    subscription_ends_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # ДНК-анализ маркетолога (автозапуск после сканирования)
    marketing_status: Mapped[str] = mapped_column(String(50), default="none")  # none|running|done|failed
    marketing_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)   # результаты 7 шагов

    # Интеграции
    email_notifications: Mapped[str | None] = mapped_column(String(255), nullable=True)
    telegram_chat_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    bitrix_webhook: Mapped[str | None] = mapped_column(String(500), nullable=True)
    amocrm_token: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Связи
    knowledge_items: Mapped[list["KnowledgeItem"]] = relationship(back_populates="client", cascade="all, delete-orphan")
    conversations: Mapped[list["Conversation"]] = relationship(back_populates="client", cascade="all, delete-orphan")
    leads: Mapped[list["Lead"]] = relationship(back_populates="client", cascade="all, delete-orphan")
    prompt_versions: Mapped[list["PromptVersion"]] = relationship(back_populates="client", cascade="all, delete-orphan")
    audit_logs: Mapped[list["AuditLog"]] = relationship(back_populates="client", cascade="all, delete-orphan")
