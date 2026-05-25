import uuid
from datetime import datetime

from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class Lead(Base):
    """Лид — контакт собранный AI-ассистентом."""
    __tablename__ = "leads"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    conversation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Контакт
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Контекст
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)   # резюме диалога для менеджера
    priority: Mapped[str] = mapped_column(String(20), default="normal")  # urgent / normal
    request_text: Mapped[str | None] = mapped_column(Text, nullable=True)  # суть запроса

    # UTM
    utm_source: Mapped[str | None] = mapped_column(String(200), nullable=True)
    utm_medium: Mapped[str | None] = mapped_column(String(200), nullable=True)
    utm_campaign: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # Статус
    status: Mapped[str] = mapped_column(String(50), default="new")   # new / contacted / closed

    client: Mapped["Client"] = relationship(back_populates="leads")
    conversation: Mapped["Conversation"] = relationship(back_populates="lead")
