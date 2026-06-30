import json
import os
import secrets
import time
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Header, Query, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field, field_validator
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from models import AssessRequest, ReportRequest, PDFRequest, FallbackPDFRequest
from scoring import score_assessment
from report_generator import generate_report
from pdf_export import generate_pdf, generate_fallback_pdf
from auth import (
    verify_credentials, is_totp_enrolled, enroll_totp,
    verify_totp, create_session, validate_session, invalidate_session,
    check_rate_limit, record_attempt,
)
from security import (
    SecurityHeadersMiddleware, RequestSizeLimitMiddleware,
    sanitize_text, sanitize_dict_values,
)
from audit import log_event
import database as db

load_dotenv()

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Cybersecurity Risk Assessment API")
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return Response(
        content='{"detail":"Too many requests. Please try again later."}',
        status_code=429,
        media_type="application/json",
    )


app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestSizeLimitMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

QUESTIONS = json.loads((Path(__file__).parent / "questions.json").read_text())


# --- Auth helpers ---

def require_admin(authorization: str | None = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    username = validate_session(token)
    if not username:
        raise HTTPException(status_code=401, detail="Session expired")
    return username


def require_client(authorization: str | None = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    session = _client_sessions.get(token)
    if not session:
        raise HTTPException(status_code=401, detail="Session expired")
    if time.time() - session.get("created", 0) > 86400:
        _client_sessions.pop(token, None)
        raise HTTPException(status_code=401, detail="Session expired")
    return session


_client_sessions = {}


# --- Validation models with length limits ---

class LoginRequest(BaseModel):
    username: str = Field(max_length=100)
    password: str = Field(max_length=200)

class TOTPVerifyRequest(BaseModel):
    username: str = Field(max_length=100)
    code: str = Field(min_length=6, max_length=6)

class ClientLoginRequest(BaseModel):
    email: str = Field(max_length=200)
    password: str = Field(max_length=200)

class ClientActivateRequest(BaseModel):
    token: str = Field(max_length=100)
    password: str = Field(min_length=8, max_length=200)


# --- Auth routes (rate limited) ---

@app.post("/auth/login")
@limiter.limit("10/minute")
async def login(req: LoginRequest, request: Request):
    ip = get_remote_address(request)
    allowed, lockout_remaining = check_rate_limit(req.username)
    if not allowed:
        log_event("login_locked_out", actor=req.username, ip=ip, details={"remaining": lockout_remaining})
        raise HTTPException(status_code=429, detail=f"Account locked. Try again in {lockout_remaining} seconds.")

    if not verify_credentials(req.username, req.password):
        record_attempt(req.username, success=False)
        log_event("login_failed", actor=req.username, ip=ip)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    record_attempt(req.username, success=True)
    log_event("login_success", actor=req.username, ip=ip)

    if is_totp_enrolled(req.username):
        return {"status": "mfa_required", "enrolled": True}
    secret, qr = enroll_totp(req.username)
    return {"status": "mfa_setup", "enrolled": False, "qr_code": qr, "totp_secret": secret}


@app.post("/auth/verify-mfa")
@limiter.limit("10/minute")
async def verify_mfa(req: TOTPVerifyRequest, request: Request):
    ip = get_remote_address(request)
    if not verify_totp(req.username, req.code):
        log_event("mfa_failed", actor=req.username, ip=ip)
        raise HTTPException(status_code=401, detail="Invalid MFA code")
    token = create_session(req.username)
    log_event("mfa_success", actor=req.username, ip=ip)
    return {"status": "authenticated", "token": token, "username": req.username}


@app.get("/auth/me")
async def get_me(username: str = Depends(require_admin)):
    return {"username": username}


@app.post("/auth/logout")
async def logout(request: Request, authorization: str | None = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
        invalidate_session(token)
        log_event("logout", ip=get_remote_address(request))
    return {"status": "logged_out"}


# --- Assessment flow ---

@app.get("/questions")
async def get_questions():
    return QUESTIONS


@app.post("/assess")
async def assess(req: AssessRequest):
    return score_assessment(req.answers, industry=req.intake.industry)


@app.post("/generate-report")
async def create_report(req: ReportRequest, username: str = Depends(require_admin)):
    try:
        report = generate_report(
            intake=req.intake.model_dump(), scoring=req.scoring.model_dump(),
            answers=req.answers, notes=req.notes,
        )
        log_event("report_generated", actor=username, details={"org": req.intake.org_name})
        return report
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.post("/export-pdf")
async def export_pdf(req: PDFRequest):
    try:
        pdf_bytes = generate_pdf(
            intake=req.intake.model_dump(), scoring=req.scoring.model_dump(),
            report=req.report.model_dump(), notes=req.notes,
        )
        return Response(content=pdf_bytes, media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="Risk_Assessment_{sanitize_text(req.intake.org_name, 50).replace(" ", "_")}.pdf"'})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/export-pdf-fallback")
async def export_fallback_pdf(req: FallbackPDFRequest):
    try:
        pdf_bytes = generate_fallback_pdf(
            intake=req.intake.model_dump(), scoring=req.scoring.model_dump(), notes=req.notes,
        )
        return Response(content=pdf_bytes, media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="Risk_Assessment_{sanitize_text(req.intake.org_name, 50).replace(" ", "_")}.pdf"'})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Admin: Clients (auth required) ---

class ClientCreate(BaseModel):
    org_name: str = Field(max_length=200)
    industry: str = Field(max_length=100)
    employee_count: str = Field(max_length=20)
    contact_name: str = Field(max_length=200)
    contact_email: str = Field(max_length=200)
    phone: str = Field(default="", max_length=50)
    address: str = Field(default="", max_length=500)
    notes: str = Field(default="", max_length=2000)

class ClientUpdate(BaseModel):
    org_name: Optional[str] = Field(default=None, max_length=200)
    industry: Optional[str] = Field(default=None, max_length=100)
    employee_count: Optional[str] = Field(default=None, max_length=20)
    contact_name: Optional[str] = Field(default=None, max_length=200)
    contact_email: Optional[str] = Field(default=None, max_length=200)
    phone: Optional[str] = Field(default=None, max_length=50)
    address: Optional[str] = Field(default=None, max_length=500)
    notes: Optional[str] = Field(default=None, max_length=2000)


@app.get("/admin/clients")
async def admin_list_clients(username: str = Depends(require_admin)):
    return db.list_clients()


@app.post("/admin/clients")
async def admin_create_client(req: ClientCreate, request: Request, username: str = Depends(require_admin)):
    result = db.create_client(sanitize_dict_values(req.model_dump()))
    log_event("client_created", actor=username, ip=get_remote_address(request), details={"org": req.org_name})
    return result


@app.get("/admin/clients/{client_id}")
async def admin_get_client(client_id: str, username: str = Depends(require_admin)):
    c = db.get_client(client_id)
    if not c:
        raise HTTPException(status_code=404, detail="Client not found")
    return c


@app.put("/admin/clients/{client_id}")
async def admin_update_client(client_id: str, req: ClientUpdate, username: str = Depends(require_admin)):
    c = db.update_client(client_id, sanitize_dict_values(req.model_dump(exclude_none=True)))
    if not c:
        raise HTTPException(status_code=404, detail="Client not found")
    return c


@app.delete("/admin/clients/{client_id}")
async def admin_delete_client(client_id: str, request: Request, username: str = Depends(require_admin)):
    log_event("client_deleted", actor=username, ip=get_remote_address(request), details={"client_id": client_id})
    db.delete_client(client_id)
    return {"status": "deleted"}


# --- Admin: Assessments (auth required) ---

class AssessmentSave(BaseModel):
    client_id: str = Field(max_length=20)
    assessor_name: str = Field(default="", max_length=200)
    assessment_date: str = Field(max_length=20)
    answers: dict
    notes: dict = {}
    domain_scores: dict
    overall_score: float
    risk_rating: str = Field(max_length=20)
    flagged_findings: list
    report: Optional[dict] = None


@app.get("/admin/assessments")
async def admin_list_assessments(client_id: Optional[str] = Query(None), username: str = Depends(require_admin)):
    return db.list_assessments(client_id)


@app.post("/admin/assessments")
async def admin_save_assessment(req: AssessmentSave, request: Request, username: str = Depends(require_admin)):
    data = req.model_dump()
    data["notes"] = sanitize_dict_values(data.get("notes", {}))
    result = db.save_assessment(data)
    log_event("assessment_saved", actor=username, ip=get_remote_address(request), details={"client_id": req.client_id})
    return result


@app.get("/admin/assessments/{assessment_id}")
async def admin_get_assessment(assessment_id: str, username: str = Depends(require_admin)):
    a = db.get_assessment(assessment_id)
    if not a:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return a


# --- Admin: Engagements (auth required) ---

class EngagementCreate(BaseModel):
    client_id: str = Field(max_length=20)
    title: str = Field(max_length=300)
    status: str = Field(default="scheduled", max_length=20)
    due_date: Optional[str] = Field(default=None, max_length=20)
    billing_notes: str = Field(default="", max_length=2000)
    notes: str = Field(default="", max_length=2000)

class EngagementUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=300)
    status: Optional[str] = Field(default=None, max_length=20)
    due_date: Optional[str] = Field(default=None, max_length=20)
    billing_notes: Optional[str] = Field(default=None, max_length=2000)
    notes: Optional[str] = Field(default=None, max_length=2000)


@app.get("/admin/engagements")
async def admin_list_engagements(client_id: Optional[str] = Query(None), username: str = Depends(require_admin)):
    return db.list_engagements(client_id)


@app.post("/admin/engagements")
async def admin_create_engagement(req: EngagementCreate, username: str = Depends(require_admin)):
    return db.create_engagement(sanitize_dict_values(req.model_dump()))


@app.put("/admin/engagements/{eng_id}")
async def admin_update_engagement(eng_id: str, req: EngagementUpdate, username: str = Depends(require_admin)):
    e = db.update_engagement(eng_id, sanitize_dict_values(req.model_dump(exclude_none=True)))
    if not e:
        raise HTTPException(status_code=404, detail="Engagement not found")
    return e


@app.delete("/admin/engagements/{eng_id}")
async def admin_delete_engagement(eng_id: str, username: str = Depends(require_admin)):
    db.delete_engagement(eng_id)
    return {"status": "deleted"}


# --- Admin: Analytics (auth required) ---

@app.get("/admin/analytics")
async def admin_analytics(username: str = Depends(require_admin)):
    return db.get_analytics()


# --- Admin: Invites (auth required) ---

class InviteCreate(BaseModel):
    client_id: str = Field(max_length=20)
    email: str = Field(max_length=200)
    name: str = Field(default="", max_length=200)


@app.post("/admin/invites")
async def admin_create_invite(req: InviteCreate, request: Request, username: str = Depends(require_admin)):
    result = db.create_invite(req.client_id, sanitize_text(req.email, 200), sanitize_text(req.name, 200))
    log_event("invite_created", actor=username, ip=get_remote_address(request), details={"email": req.email, "client_id": req.client_id})
    return result


@app.get("/admin/client-users")
async def admin_list_client_users(client_id: Optional[str] = Query(None), username: str = Depends(require_admin)):
    return db.list_client_users(client_id)


# --- Client Portal Auth (rate limited) ---

@app.get("/client/invite/{token}")
async def get_invite(token: str):
    if len(token) > 100:
        raise HTTPException(status_code=400, detail="Invalid token")
    invite = db.get_invite_by_token(token)
    if not invite:
        raise HTTPException(status_code=404, detail="Invalid or expired invite link")
    client = db.get_client(invite["client_id"])
    return {"email": invite["email"], "name": invite.get("name", ""), "org_name": client["org_name"] if client else ""}


@app.post("/client/activate")
@limiter.limit("5/minute")
async def client_activate(req: ClientActivateRequest, request: Request):
    ip = get_remote_address(request)
    user = db.activate_client_user(req.token, req.password)
    if not user:
        log_event("client_activate_failed", ip=ip)
        raise HTTPException(status_code=400, detail="Invalid or expired invite")
    token = secrets.token_hex(32)
    _client_sessions[token] = {
        "user_id": user["id"], "client_id": user["client_id"],
        "email": user["email"], "org_name": user.get("org_name", ""),
        "created": time.time(),
    }
    log_event("client_activated", actor=user["email"], ip=ip)
    return {"status": "activated", "token": token, "user": {
        "email": user["email"], "name": user.get("name", ""),
        "org_name": user.get("org_name", ""), "client_id": user["client_id"],
    }}


@app.post("/client/login")
@limiter.limit("10/minute")
async def client_login(req: ClientLoginRequest, request: Request):
    ip = get_remote_address(request)
    allowed, lockout_remaining = check_rate_limit(f"client:{req.email}")
    if not allowed:
        log_event("client_login_locked", actor=req.email, ip=ip)
        raise HTTPException(status_code=429, detail=f"Account locked. Try again in {lockout_remaining} seconds.")

    user = db.verify_client_credentials(req.email, req.password)
    if not user:
        record_attempt(f"client:{req.email}", success=False)
        log_event("client_login_failed", actor=req.email, ip=ip)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    record_attempt(f"client:{req.email}", success=True)
    token = secrets.token_hex(32)
    _client_sessions[token] = {
        "user_id": user["id"], "client_id": user["client_id"],
        "email": user["email"], "org_name": user.get("org_name", ""),
        "created": time.time(),
    }
    log_event("client_login_success", actor=req.email, ip=ip)
    return {"status": "authenticated", "token": token, "user": {
        "email": user["email"], "name": user.get("name", ""),
        "org_name": user.get("org_name", ""), "client_id": user["client_id"],
    }}


# --- Client Portal Data (auth required) ---

@app.get("/client/me")
async def client_me(session: dict = Depends(require_client)):
    return {"email": session["email"], "org_name": session["org_name"], "client_id": session["client_id"]}


@app.get("/client/assessments")
async def client_assessments(session: dict = Depends(require_client)):
    assessments = db.list_assessments(session["client_id"])
    for a in assessments:
        db.init_remediation(a["id"], a["flagged_findings"])
    return assessments


@app.get("/client/assessments/{assessment_id}")
async def client_assessment_detail(assessment_id: str, session: dict = Depends(require_client)):
    a = db.get_assessment(assessment_id)
    if not a or a["client_id"] != session["client_id"]:
        raise HTTPException(status_code=404, detail="Not found")
    db.init_remediation(a["id"], a["flagged_findings"])
    return a


@app.get("/client/remediation/{assessment_id}")
async def client_remediation(assessment_id: str, session: dict = Depends(require_client)):
    a = db.get_assessment(assessment_id)
    if not a or a["client_id"] != session["client_id"]:
        raise HTTPException(status_code=404, detail="Not found")
    return db.get_remediation(assessment_id)


class RemediationUpdate(BaseModel):
    status: str = Field(max_length=20)
    client_note: str = Field(default="", max_length=2000)


@app.put("/client/remediation/{item_id}")
async def client_update_remediation(item_id: str, req: RemediationUpdate, session: dict = Depends(require_client)):
    result = db.update_remediation_item(item_id, req.status, sanitize_text(req.client_note, 2000))
    if not result:
        raise HTTPException(status_code=404, detail="Not found")
    log_event("remediation_updated", actor=session["email"], details={"item_id": item_id, "status": req.status})
    return result


@app.get("/client/engagements")
async def client_engagements(session: dict = Depends(require_client)):
    return db.list_engagements(session["client_id"])
