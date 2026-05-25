import asyncio
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib

from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_email(to: str, subject: str, html: str) -> bool:
    """Отправить HTML письмо. Возвращает True если успешно."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP не настроен, письмо не отправлено")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
    msg["To"] = to
    msg.attach(MIMEText(html, "html", "utf-8"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
        )
        logger.info("Email отправлен на %s", to)
        return True
    except Exception as e:
        logger.error("Ошибка отправки email на %s: %s", to, e)
        return False


def lead_notification_html(
    company_name: str,
    assistant_name: str,
    phone: str | None,
    email: str | None,
    request_text: str | None,
    conversation_id: str,
    cabinet_url: str = "http://localhost:3000",
) -> tuple[str, str]:
    """Возвращает (subject, html) для уведомления о новом лиде."""
    contact_lines = []
    if phone:
        contact_lines.append(f"📞 <b>Телефон:</b> {phone}")
    if email:
        contact_lines.append(f"✉️ <b>Email:</b> {email}")
    contacts_html = "<br>".join(contact_lines) if contact_lines else "Контакт не указан"

    subject = f"🔔 Новый лид — {company_name}"
    html = f"""
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family:system-ui,sans-serif;background:#F8FAFC;margin:0;padding:24px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;
              box-shadow:0 4px 20px rgba(0,0,0,.08);overflow:hidden;">

    <!-- Header -->
    <div style="background:#2563EB;padding:24px 28px;">
      <div style="color:#fff;font-size:20px;font-weight:700;">🔔 Новый лид</div>
      <div style="color:rgba(255,255,255,.85);font-size:14px;margin-top:4px;">
        {assistant_name} собрал контакт на сайте <b>{company_name}</b>
      </div>
    </div>

    <!-- Body -->
    <div style="padding:24px 28px;">

      <!-- Contact -->
      <div style="background:#EFF6FF;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
        <div style="font-size:13px;font-weight:600;color:#1D4ED8;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;">
          Контактные данные
        </div>
        <div style="font-size:15px;color:#1E3A8A;line-height:1.6;">
          {contacts_html}
        </div>
      </div>

      <!-- Request -->
      {"" if not request_text else f'''
      <div style="margin-bottom:20px;">
        <div style="font-size:13px;font-weight:600;color:#6B7280;margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px;">
          Суть запроса
        </div>
        <div style="font-size:14px;color:#374151;line-height:1.6;background:#F9FAFB;
                    border-radius:10px;padding:14px 16px;border-left:3px solid #2563EB;">
          {request_text[:400]}{"..." if len(request_text or "") > 400 else ""}
        </div>
      </div>
      '''}

      <!-- CTA -->
      <a href="{cabinet_url}"
         style="display:block;background:#2563EB;color:#fff;text-align:center;
                padding:14px;border-radius:10px;font-weight:600;font-size:15px;
                text-decoration:none;">
        Открыть кабинет
      </a>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #E5E7EB;padding:16px 28px;
                font-size:12px;color:#9CA3AF;text-align:center;">
      AI Platform · Автоматическое уведомление
    </div>
  </div>
</body>
</html>
"""
    return subject, html
