from pydantic import BaseModel


class IntakeData(BaseModel):
    org_name: str
    industry: str
    employee_count: str
    contact_name: str
    contact_email: str
    assessor_name: str = ""
    assessment_date: str


class AssessRequest(BaseModel):
    intake: IntakeData
    answers: dict[str, str]
    notes: dict[str, str] = {}


class ScoringResult(BaseModel):
    domain_scores: dict[str, dict]
    overall_score: float
    risk_rating: str
    flagged_findings: list[dict]


class ReportRequest(BaseModel):
    intake: IntakeData
    answers: dict[str, str]
    notes: dict[str, str] = {}
    scoring: ScoringResult


class ReportSections(BaseModel):
    executive_summary: str
    key_findings: list[str]
    domain_analysis: dict[str, str]
    remediation_roadmap: dict[str, list[str]]
    closing_statement: str


class PDFRequest(BaseModel):
    intake: IntakeData
    scoring: ScoringResult
    report: ReportSections
    notes: dict[str, str] = {}


class FallbackPDFRequest(BaseModel):
    intake: IntakeData
    scoring: ScoringResult
    notes: dict[str, str] = {}
