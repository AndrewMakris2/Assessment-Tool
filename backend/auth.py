import pyotp
import qrcode
import io
import base64
import secrets
import time
import json
import bcrypt
from pathlib import Path

HARDCODED_USER = {
    "username": "andrew.makris",
    "password_hash": bcrypt.hashpw("Beartron12!".encode(), bcrypt.gensalt()).decode(),
}

_SECRETS_FILE = Path(__file__).parent / ".totp_secrets.json"
_SESSIONS_FILE = Path(__file__).parent / ".sessions.json"

TOTP_ISSUER = "CyberAssess"
SESSION_TTL = 86400

# --- Rate limiting state ---
_login_attempts = {}
MAX_ATTEMPTS = 5
LOCKOUT_SECONDS = 300


def check_rate_limit(key: str) -> tuple[bool, int]:
    now = time.time()
    record = _login_attempts.get(key)
    if not record:
        return True, 0
    if now - record["first_attempt"] > LOCKOUT_SECONDS:
        del _login_attempts[key]
        return True, 0
    if record["count"] >= MAX_ATTEMPTS:
        remaining = int(LOCKOUT_SECONDS - (now - record["first_attempt"]))
        return False, remaining
    return True, 0


def record_attempt(key: str, success: bool):
    now = time.time()
    if success:
        _login_attempts.pop(key, None)
        return
    record = _login_attempts.get(key)
    if not record or now - record["first_attempt"] > LOCKOUT_SECONDS:
        _login_attempts[key] = {"count": 1, "first_attempt": now}
    else:
        record["count"] += 1


# --- TOTP secrets (file-persisted) ---

def _load_secrets() -> dict:
    if _SECRETS_FILE.exists():
        return json.loads(_SECRETS_FILE.read_text())
    return {}


def _save_secrets(data: dict):
    _SECRETS_FILE.write_text(json.dumps(data))


# --- Sessions (file-persisted) ---

def _load_sessions() -> dict:
    if _SESSIONS_FILE.exists():
        try:
            return json.loads(_SESSIONS_FILE.read_text())
        except (json.JSONDecodeError, ValueError):
            return {}
    return {}


def _save_sessions(data: dict):
    _SESSIONS_FILE.write_text(json.dumps(data))


def _clean_expired_sessions(sessions: dict) -> dict:
    now = time.time()
    return {k: v for k, v in sessions.items() if now - v["created"] < SESSION_TTL}


# --- Credential verification ---

def verify_credentials(username: str, password: str) -> bool:
    if username != HARDCODED_USER["username"]:
        return False
    return bcrypt.checkpw(password.encode(), HARDCODED_USER["password_hash"].encode())


# --- TOTP ---

def is_totp_enrolled(username: str) -> bool:
    return username in _load_secrets()


def enroll_totp(username: str) -> tuple[str, str]:
    secret = pyotp.random_base32()
    data = _load_secrets()
    data[username] = secret
    _save_secrets(data)

    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(name=username, issuer_name=TOTP_ISSUER)
    img = qrcode.make(uri)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode()
    return secret, f"data:image/png;base64,{b64}"


def verify_totp(username: str, code: str) -> bool:
    data = _load_secrets()
    secret = data.get(username)
    if not secret:
        return False
    return pyotp.TOTP(secret).verify(code, valid_window=1)


# --- Session management ---

def create_session(username: str) -> str:
    token = secrets.token_hex(32)
    sessions = _clean_expired_sessions(_load_sessions())
    sessions[token] = {"username": username, "created": time.time()}
    _save_sessions(sessions)
    return token


def validate_session(token: str) -> str | None:
    sessions = _load_sessions()
    session = sessions.get(token)
    if not session:
        return None
    if time.time() - session["created"] > SESSION_TTL:
        sessions.pop(token, None)
        _save_sessions(sessions)
        return None
    return session["username"]


def invalidate_session(token: str):
    sessions = _load_sessions()
    sessions.pop(token, None)
    _save_sessions(sessions)
