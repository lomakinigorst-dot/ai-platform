from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException
from jose import jwt
from passlib.context import CryptContext
from pydantic import BaseModel

from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str


def create_token(email: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": email, "exp": expire},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def verify_token(token: str) -> str:
    """Проверить JWT и вернуть email. Бросает HTTPException при ошибке."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            raise ValueError
        return email
    except Exception:
        raise HTTPException(401, "Неверный или просроченный токен")


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    if body.email != settings.AGENT_EMAIL:
        raise HTTPException(401, "Неверный email или пароль")

    # Поддерживаем и bcrypt-хеш, и plain text (для dev)
    password_ok = (
        body.password == settings.AGENT_PASSWORD
        or (settings.AGENT_PASSWORD.startswith("$2b$") and pwd_context.verify(body.password, settings.AGENT_PASSWORD))
    )
    if not password_ok:
        raise HTTPException(401, "Неверный email или пароль")

    return TokenResponse(
        access_token=create_token(body.email),
        email=body.email,
    )


@router.post("/verify")
async def verify(body: dict):
    token = body.get("token", "")
    email = verify_token(token)
    return {"email": email, "valid": True}
