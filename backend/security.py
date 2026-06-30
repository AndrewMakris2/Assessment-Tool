import html
import secrets
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data:; "
            "connect-src 'self' http://localhost:* https://*.railway.app https://*.netlify.app"
        )
        return response


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    MAX_BODY_SIZE = 5 * 1024 * 1024  # 5MB

    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.MAX_BODY_SIZE:
            return Response(
                content='{"detail":"Request body too large"}',
                status_code=413,
                media_type="application/json",
            )
        return await call_next(request)


# --- CSRF ---
_csrf_tokens = {}


def generate_csrf_token(session_id: str) -> str:
    token = secrets.token_hex(32)
    _csrf_tokens[session_id] = token
    return token


def validate_csrf_token(session_id: str, token: str) -> bool:
    expected = _csrf_tokens.get(session_id)
    if not expected:
        return False
    return secrets.compare_digest(expected, token)


# --- Input sanitization ---

def sanitize_text(text: str, max_length: int = 5000) -> str:
    if not text:
        return text
    text = text[:max_length]
    text = html.escape(text)
    return text


def sanitize_dict_values(data: dict, max_length: int = 5000) -> dict:
    result = {}
    for key, value in data.items():
        if isinstance(value, str):
            result[key] = sanitize_text(value, max_length)
        elif isinstance(value, dict):
            result[key] = sanitize_dict_values(value, max_length)
        else:
            result[key] = value
    return result
