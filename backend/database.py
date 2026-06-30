import sqlite3
import json
import uuid
from datetime import datetime
from pathlib import Path

DB_PATH = Path(__file__).parent / "cyberassess.db"


def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS clients (
            id TEXT PRIMARY KEY,
            org_name TEXT NOT NULL,
            industry TEXT NOT NULL,
            employee_count TEXT NOT NULL,
            contact_name TEXT NOT NULL,
            contact_email TEXT NOT NULL,
            phone TEXT DEFAULT '',
            address TEXT DEFAULT '',
            notes TEXT DEFAULT '',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS assessments (
            id TEXT PRIMARY KEY,
            client_id TEXT NOT NULL,
            assessor_name TEXT DEFAULT '',
            assessment_date TEXT NOT NULL,
            answers TEXT NOT NULL,
            notes TEXT DEFAULT '{}',
            domain_scores TEXT NOT NULL,
            overall_score REAL NOT NULL,
            risk_rating TEXT NOT NULL,
            flagged_findings TEXT NOT NULL,
            report TEXT DEFAULT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS engagements (
            id TEXT PRIMARY KEY,
            client_id TEXT NOT NULL,
            title TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'scheduled',
            due_date TEXT DEFAULT NULL,
            billing_notes TEXT DEFAULT '',
            notes TEXT DEFAULT '',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS client_users (
            id TEXT PRIMARY KEY,
            client_id TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT DEFAULT NULL,
            name TEXT DEFAULT '',
            invite_token TEXT DEFAULT NULL,
            invite_expires TEXT DEFAULT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS remediation_items (
            id TEXT PRIMARY KEY,
            assessment_id TEXT NOT NULL,
            question_id TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'open',
            client_note TEXT DEFAULT '',
            updated_at TEXT NOT NULL,
            FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
        );
    """)
    conn.commit()
    conn.close()


# --- Clients ---

def create_client(data: dict) -> dict:
    client_id = str(uuid.uuid4())[:8]
    now = datetime.utcnow().isoformat()
    conn = get_db()
    conn.execute(
        "INSERT INTO clients (id, org_name, industry, employee_count, contact_name, contact_email, phone, address, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (client_id, data["org_name"], data["industry"], data["employee_count"],
         data["contact_name"], data["contact_email"], data.get("phone", ""),
         data.get("address", ""), data.get("notes", ""), now, now),
    )
    conn.commit()
    conn.close()
    return get_client(client_id)


def get_client(client_id: str) -> dict | None:
    conn = get_db()
    row = conn.execute("SELECT * FROM clients WHERE id = ?", (client_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def list_clients() -> list[dict]:
    conn = get_db()
    rows = conn.execute("SELECT * FROM clients ORDER BY updated_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def update_client(client_id: str, data: dict) -> dict | None:
    now = datetime.utcnow().isoformat()
    fields = []
    values = []
    for key in ["org_name", "industry", "employee_count", "contact_name", "contact_email", "phone", "address", "notes"]:
        if key in data:
            fields.append(f"{key} = ?")
            values.append(data[key])
    if not fields:
        return get_client(client_id)
    fields.append("updated_at = ?")
    values.append(now)
    values.append(client_id)
    conn = get_db()
    conn.execute(f"UPDATE clients SET {', '.join(fields)} WHERE id = ?", values)
    conn.commit()
    conn.close()
    return get_client(client_id)


def delete_client(client_id: str):
    conn = get_db()
    conn.execute("DELETE FROM clients WHERE id = ?", (client_id,))
    conn.commit()
    conn.close()


# --- Assessments ---

def save_assessment(data: dict) -> dict:
    assessment_id = str(uuid.uuid4())[:8]
    now = datetime.utcnow().isoformat()
    conn = get_db()
    conn.execute(
        "INSERT INTO assessments (id, client_id, assessor_name, assessment_date, answers, notes, domain_scores, overall_score, risk_rating, flagged_findings, report, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (assessment_id, data["client_id"], data.get("assessor_name", ""),
         data["assessment_date"], json.dumps(data["answers"]),
         json.dumps(data.get("notes", {})), json.dumps(data["domain_scores"]),
         data["overall_score"], data["risk_rating"],
         json.dumps(data["flagged_findings"]),
         json.dumps(data["report"]) if data.get("report") else None, now),
    )
    conn.commit()
    conn.close()
    return get_assessment(assessment_id)


def get_assessment(assessment_id: str) -> dict | None:
    conn = get_db()
    row = conn.execute("SELECT * FROM assessments WHERE id = ?", (assessment_id,)).fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d["answers"] = json.loads(d["answers"])
    d["notes"] = json.loads(d["notes"])
    d["domain_scores"] = json.loads(d["domain_scores"])
    d["flagged_findings"] = json.loads(d["flagged_findings"])
    d["report"] = json.loads(d["report"]) if d["report"] else None
    return d


def list_assessments(client_id: str = None) -> list[dict]:
    conn = get_db()
    if client_id:
        rows = conn.execute(
            "SELECT a.*, c.org_name FROM assessments a JOIN clients c ON a.client_id = c.id WHERE a.client_id = ? ORDER BY a.created_at DESC",
            (client_id,),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT a.*, c.org_name FROM assessments a JOIN clients c ON a.client_id = c.id ORDER BY a.created_at DESC"
        ).fetchall()
    conn.close()
    results = []
    for row in rows:
        d = dict(row)
        d["domain_scores"] = json.loads(d["domain_scores"])
        d["flagged_findings"] = json.loads(d["flagged_findings"])
        d["answers"] = json.loads(d["answers"])
        d["notes"] = json.loads(d["notes"])
        d["report"] = json.loads(d["report"]) if d["report"] else None
        results.append(d)
    return results


# --- Engagements ---

def create_engagement(data: dict) -> dict:
    eng_id = str(uuid.uuid4())[:8]
    now = datetime.utcnow().isoformat()
    conn = get_db()
    conn.execute(
        "INSERT INTO engagements (id, client_id, title, status, due_date, billing_notes, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (eng_id, data["client_id"], data["title"], data.get("status", "scheduled"),
         data.get("due_date"), data.get("billing_notes", ""),
         data.get("notes", ""), now, now),
    )
    conn.commit()
    conn.close()
    return get_engagement(eng_id)


def get_engagement(eng_id: str) -> dict | None:
    conn = get_db()
    row = conn.execute("SELECT e.*, c.org_name FROM engagements e JOIN clients c ON e.client_id = c.id WHERE e.id = ?", (eng_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def list_engagements(client_id: str = None) -> list[dict]:
    conn = get_db()
    if client_id:
        rows = conn.execute(
            "SELECT e.*, c.org_name FROM engagements e JOIN clients c ON e.client_id = c.id WHERE e.client_id = ? ORDER BY e.due_date ASC NULLS LAST",
            (client_id,),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT e.*, c.org_name FROM engagements e JOIN clients c ON e.client_id = c.id ORDER BY e.due_date ASC NULLS LAST"
        ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def update_engagement(eng_id: str, data: dict) -> dict | None:
    now = datetime.utcnow().isoformat()
    fields = []
    values = []
    for key in ["title", "status", "due_date", "billing_notes", "notes"]:
        if key in data:
            fields.append(f"{key} = ?")
            values.append(data[key])
    if not fields:
        return get_engagement(eng_id)
    fields.append("updated_at = ?")
    values.append(now)
    values.append(eng_id)
    conn = get_db()
    conn.execute(f"UPDATE engagements SET {', '.join(fields)} WHERE id = ?", values)
    conn.commit()
    conn.close()
    return get_engagement(eng_id)


def delete_engagement(eng_id: str):
    conn = get_db()
    conn.execute("DELETE FROM engagements WHERE id = ?", (eng_id,))
    conn.commit()
    conn.close()


# --- Analytics ---

def get_analytics() -> dict:
    conn = get_db()
    total_clients = conn.execute("SELECT COUNT(*) FROM clients").fetchone()[0]
    total_assessments = conn.execute("SELECT COUNT(*) FROM assessments").fetchone()[0]
    active_engagements = conn.execute("SELECT COUNT(*) FROM engagements WHERE status IN ('scheduled', 'in-progress')").fetchone()[0]

    rating_dist = {}
    for row in conn.execute("SELECT risk_rating, COUNT(*) as cnt FROM assessments GROUP BY risk_rating"):
        rating_dist[row["risk_rating"]] = row["cnt"]

    industry_scores = {}
    for row in conn.execute("""
        SELECT c.industry, AVG(a.overall_score) as avg_score, COUNT(*) as cnt
        FROM assessments a JOIN clients c ON a.client_id = c.id
        GROUP BY c.industry
    """):
        industry_scores[row["industry"]] = {"avg_score": round(row["avg_score"], 4), "count": row["cnt"]}

    top_failures = {}
    for row in conn.execute("SELECT flagged_findings FROM assessments"):
        findings = json.loads(row["flagged_findings"])
        for f in findings:
            qid = f["id"]
            top_failures[qid] = top_failures.get(qid, 0) + 1
    top_failures_sorted = sorted(top_failures.items(), key=lambda x: -x[1])[:10]

    recent = []
    for row in conn.execute("""
        SELECT a.id, a.assessment_date, a.overall_score, a.risk_rating, c.org_name
        FROM assessments a JOIN clients c ON a.client_id = c.id
        ORDER BY a.created_at DESC LIMIT 5
    """):
        recent.append(dict(row))

    conn.close()

    return {
        "total_clients": total_clients,
        "total_assessments": total_assessments,
        "active_engagements": active_engagements,
        "rating_distribution": rating_dist,
        "industry_scores": industry_scores,
        "top_failures": [{"id": qid, "count": cnt} for qid, cnt in top_failures_sorted],
        "recent_assessments": recent,
    }


# --- Client Users ---

import bcrypt

def create_invite(client_id: str, email: str, name: str = "") -> dict:
    user_id = str(uuid.uuid4())[:8]
    token = uuid.uuid4().hex
    now = datetime.utcnow().isoformat()
    from datetime import timedelta
    expires = (datetime.utcnow() + timedelta(days=7)).isoformat()
    conn = get_db()
    existing = conn.execute("SELECT id FROM client_users WHERE email = ?", (email,)).fetchone()
    if existing:
        conn.execute("UPDATE client_users SET invite_token = ?, invite_expires = ?, client_id = ?, name = ? WHERE email = ?",
                     (token, expires, client_id, name, email))
    else:
        conn.execute(
            "INSERT INTO client_users (id, client_id, email, name, invite_token, invite_expires, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (user_id, client_id, email, name, token, expires, now))
    conn.commit()
    conn.close()
    return {"client_id": client_id, "email": email, "token": token, "expires": expires}


def get_invite_by_token(token: str) -> dict | None:
    conn = get_db()
    row = conn.execute("SELECT * FROM client_users WHERE invite_token = ?", (token,)).fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    if d.get("invite_expires") and datetime.fromisoformat(d["invite_expires"]) < datetime.utcnow():
        return None
    return d


def activate_client_user(token: str, password: str) -> dict | None:
    invite = get_invite_by_token(token)
    if not invite:
        return None
    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    conn = get_db()
    conn.execute("UPDATE client_users SET password_hash = ?, invite_token = NULL WHERE id = ?", (pw_hash, invite["id"]))
    conn.commit()
    conn.close()
    return get_client_user_by_email(invite["email"])


def get_client_user_by_email(email: str) -> dict | None:
    conn = get_db()
    row = conn.execute("SELECT cu.*, c.org_name FROM client_users cu JOIN clients c ON cu.client_id = c.id WHERE cu.email = ?", (email,)).fetchone()
    conn.close()
    return dict(row) if row else None


def verify_client_credentials(email: str, password: str) -> dict | None:
    user = get_client_user_by_email(email)
    if not user or not user.get("password_hash"):
        return None
    if not bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
        return None
    return user


def list_client_users(client_id: str = None) -> list[dict]:
    conn = get_db()
    if client_id:
        rows = conn.execute("SELECT cu.id, cu.client_id, cu.email, cu.name, cu.created_at, c.org_name, CASE WHEN cu.password_hash IS NOT NULL THEN 'active' WHEN cu.invite_token IS NOT NULL THEN 'invited' ELSE 'inactive' END as status FROM client_users cu JOIN clients c ON cu.client_id = c.id WHERE cu.client_id = ?", (client_id,)).fetchall()
    else:
        rows = conn.execute("SELECT cu.id, cu.client_id, cu.email, cu.name, cu.created_at, c.org_name, CASE WHEN cu.password_hash IS NOT NULL THEN 'active' WHEN cu.invite_token IS NOT NULL THEN 'invited' ELSE 'inactive' END as status FROM client_users cu JOIN clients c ON cu.client_id = c.id ORDER BY cu.created_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


# --- Remediation ---

def init_remediation(assessment_id: str, flagged_findings: list):
    now = datetime.utcnow().isoformat()
    conn = get_db()
    existing = conn.execute("SELECT COUNT(*) FROM remediation_items WHERE assessment_id = ?", (assessment_id,)).fetchone()[0]
    if existing > 0:
        conn.close()
        return
    for f in flagged_findings:
        item_id = str(uuid.uuid4())[:8]
        conn.execute("INSERT INTO remediation_items (id, assessment_id, question_id, status, client_note, updated_at) VALUES (?, ?, ?, 'open', '', ?)",
                     (item_id, assessment_id, f["id"], now))
    conn.commit()
    conn.close()


def get_remediation(assessment_id: str) -> list[dict]:
    conn = get_db()
    rows = conn.execute("SELECT * FROM remediation_items WHERE assessment_id = ? ORDER BY question_id", (assessment_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def update_remediation_item(item_id: str, status: str, client_note: str = "") -> dict | None:
    now = datetime.utcnow().isoformat()
    conn = get_db()
    conn.execute("UPDATE remediation_items SET status = ?, client_note = ?, updated_at = ? WHERE id = ?", (status, client_note, now, item_id))
    conn.commit()
    row = conn.execute("SELECT * FROM remediation_items WHERE id = ?", (item_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


init_db()
