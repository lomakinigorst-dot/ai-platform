from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, HttpUrl


class ClientCreate(BaseModel):
    website_url: str


class ClientResponse(BaseModel):
    id: UUID
    name: str
    domain: str
    website_url: str
    status: str
    index_progress: float
    pages_indexed: int
    pages_total: int
    scan_phase: str | None = None
    scan_quality: int = 0
    needs_deep_scan: bool = False
    niche: str | None
    company_description: str | None
    assistant_mode: str
    assistant_name: str
    assistant_gender: str | None = None
    assistant_avatar_url: str | None = None
    leads_used: int
    leads_limit: int
    dialogs_used: int
    dialogs_limit: int
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class ClientList(BaseModel):
    items: list[ClientResponse]
    total: int
