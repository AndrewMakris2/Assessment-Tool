import json
import anthropic


def generate_report(intake: dict, scoring: dict, answers: dict, notes: dict = None) -> dict:
    client = anthropic.Anthropic()

    domain_summary = ""
    for domain, data in scoring["domain_scores"].items():
        if data["excluded"]:
            domain_summary += f"- {domain}: N/A (excluded)\n"
        else:
            domain_summary += f"- {domain}: {data['score']:.0%} ({data['rating']})\n"

    flagged = ""
    for f in scoring["flagged_findings"]:
        flagged += f"- [{f['id']}] {f['question']} — {f['answer']}\n"

    user_prompt = f"""Generate a cybersecurity risk assessment report based on the following data. Return ONLY valid JSON with no markdown formatting, no code fences, no preamble.

Organization: {intake['org_name']}
Industry: {intake['industry']}
Employee Count: {intake['employee_count']}
Assessment Date: {intake['assessment_date']}
Assessor: {intake['assessor_name']}

Overall Risk Rating: {scoring['risk_rating']} ({scoring['overall_score']:.0%})

Domain Scores:
{domain_summary}

Flagged Findings (Not Implemented):
{flagged if flagged else "None"}

Assessor Notes:
{_format_notes(notes) if notes else "None provided"}

Return this exact JSON structure:
{{
  "executive_summary": "2-3 paragraph executive summary",
  "key_findings": ["finding 1", "finding 2", "...up to 5 findings"],
  "domain_analysis": {{"Domain Name": "1-2 paragraph analysis for each scored domain"}},
  "remediation_roadmap": {{
    "short_term": ["action items for 0-30 days"],
    "mid_term": ["action items for 30-90 days"],
    "long_term": ["action items for 90+ days"]
  }},
  "closing_statement": "1 paragraph closing"
}}"""

    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2000,
            system="You are a senior cybersecurity consultant writing a professional risk assessment report. Be direct, specific, and actionable. Use formal but clear language appropriate for executive and technical audiences.",
            messages=[{"role": "user", "content": user_prompt}],
        )

        text = message.content[0].text
        return json.loads(text)

    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse AI response as JSON: {e}")
    except anthropic.APIError as e:
        raise ValueError(f"Claude API error: {e}")


def _format_notes(notes: dict) -> str:
    if not notes:
        return "None provided"
    lines = []
    for qid, note in notes.items():
        if note.strip():
            lines.append(f"- [{qid}]: {note}")
    return "\n".join(lines) if lines else "None provided"
