import json
from pathlib import Path

QUESTIONS = json.loads((Path(__file__).parent / "questions.json").read_text())
_QUESTIONS_BY_ID = {q["id"]: q for q in QUESTIONS}

SEVERITY_ORDER = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}

INDUSTRY_DOMAIN_MULTIPLIERS = {
    "Healthcare": {
        "Compliance & Regulatory": 1.5,
        "Data Protection & Backup": 1.3,
        "Access Control & IAM": 1.2,
    },
    "Finance": {
        "Compliance & Regulatory": 1.5,
        "Vendor & Third-Party Risk": 1.4,
        "Access Control & IAM": 1.3,
        "Data Protection & Backup": 1.2,
    },
    "Legal": {
        "Data Protection & Backup": 1.4,
        "Compliance & Regulatory": 1.3,
        "Access Control & IAM": 1.2,
    },
    "Manufacturing": {
        "Physical Security": 1.3,
        "Asset Management": 1.2,
        "Vulnerability Management": 1.2,
    },
    "Retail": {
        "Compliance & Regulatory": 1.2,
        "Data Protection & Backup": 1.2,
        "Vendor & Third-Party Risk": 1.2,
    },
}


def score_assessment(answers: dict[str, str], industry: str = "") -> dict:
    questions_by_domain: dict[str, list] = {}
    for q in QUESTIONS:
        questions_by_domain.setdefault(q["domain"], []).append(q)

    multipliers = INDUSTRY_DOMAIN_MULTIPLIERS.get(industry, {})
    domain_scores = {}
    flagged_findings = []

    for domain, questions in questions_by_domain.items():
        weighted_sum = 0.0
        weight_total = 0.0
        domain_mult = multipliers.get(domain, 1.0)

        for q in questions:
            answer_label = answers.get(q["id"])
            if not answer_label:
                continue

            answer_obj = next((a for a in q["answers"] if a["label"] == answer_label), None)
            if not answer_obj:
                continue

            if answer_obj["score"] is None:
                continue

            effective_weight = q["weight"] * domain_mult
            weighted_sum += answer_obj["score"] * effective_weight
            weight_total += effective_weight

            if q.get("flag_if") and answer_label == q["flag_if"]:
                flagged_findings.append({
                    "id": q["id"],
                    "domain": domain,
                    "question": q["question"],
                    "answer": answer_label,
                    "severity": q.get("severity", "Medium"),
                    "effort": q.get("effort", "Medium"),
                    "fix_hint": q.get("fix_hint", ""),
                })

        if weight_total == 0:
            domain_scores[domain] = {
                "score": None,
                "rating": "N/A",
                "excluded": True,
            }
        else:
            score = weighted_sum / weight_total
            domain_scores[domain] = {
                "score": round(score, 4),
                "rating": _rating(score),
                "excluded": False,
            }

    flagged_findings.sort(key=lambda f: SEVERITY_ORDER.get(f["severity"], 99))

    scored = [d["score"] for d in domain_scores.values() if not d["excluded"]]
    overall_score = round(sum(scored) / len(scored), 4) if scored else 0.0

    return {
        "domain_scores": domain_scores,
        "overall_score": overall_score,
        "risk_rating": _rating(overall_score),
        "flagged_findings": flagged_findings,
    }


def _rating(score: float) -> str:
    if score < 0.40:
        return "Critical"
    if score < 0.60:
        return "High"
    if score < 0.80:
        return "Moderate"
    return "Low"
