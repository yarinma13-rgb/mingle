"""
Phase 3 — Hyper-personalization engine ("mingle" angle).

Rules: under 75 words, active voice, no corporate buzzwords, soft CTA.
Generates LinkedIn/email-ready copy mentioning the specific open role.
"""

from __future__ import annotations

import re
from typing import Any

from config import DEMO_MODE, OPENAI_API_KEY, OPENAI_MODEL, PRODUCT_NAME

MAX_WORDS = 75

COPY_SYSTEM = f"""You write short B2B outreach for {PRODUCT_NAME}.
Rules:
- Under {MAX_WORDS} words
- Active voice
- No generic corporate buzzwords (no synergies, leverage, disrupt, revolutionary)
- Soft interest-based CTA
- Mention the specific open role
Return ONLY the message body text, no subject line, no quotes."""


def _word_count(text: str) -> int:
    return len(re.findall(r"\b\w+\b", text))


def _template_message(lead: dict[str, Any]) -> str:
    company = (lead.get("Company") or "your team").strip()
    role = (lead.get("Open Role Found") or "your open role").strip()
    name = (lead.get("Contact Name") or "").strip()
    greeting = f"Hi {name.split()[0]}," if name else "Hi,"

    msg = (
        f"{greeting} Saw you're looking for a {role} at {company}. "
        "Most tools just throw another CV pile at you. mingle ranks a shortlist "
        "in 60 seconds based on Role, Human, and Motivation fit, showing you "
        "exactly why they match and the honest risks. "
        "Open to seeing a 60-second Match Report for this role?"
    )
    # Hard trim if somehow over budget
    words = msg.split()
    if len(words) > MAX_WORDS:
        msg = " ".join(words[: MAX_WORDS - 1]) + "?"
    return msg


def _openai_message(lead: dict[str, Any]) -> str:
    from openai import OpenAI

    client = OpenAI(api_key=OPENAI_API_KEY)
    user = (
        f"Company: {lead.get('Company')}\n"
        f"Contact: {lead.get('Contact Name')}\n"
        f"Title: {lead.get('Contact Title') or lead.get('Persona Title')}\n"
        f"Open role: {lead.get('Open Role Found')}\n"
        f"Hook pattern: Saw you're looking for a [role] at [Company].\n"
        "Value: Most tools just throw another CV pile at you. mingle ranks a "
        "shortlist in 60 seconds based on Role, Human, and Motivation fit, "
        "showing exactly why they match and the honest risks.\n"
        "CTA: Worth a quick look? / Open to seeing a 60-second Match Report for this role?\n"
        "Write one message."
    )
    resp = client.chat.completions.create(
        model=OPENAI_MODEL,
        temperature=0.7,
        messages=[
            {"role": "system", "content": COPY_SYSTEM},
            {"role": "user", "content": user},
        ],
    )
    text = (resp.choices[0].message.content or "").strip()
    if _word_count(text) > MAX_WORDS or not text:
        return _template_message(lead)
    return text


def personalize_lead(lead: dict[str, Any]) -> dict[str, Any]:
    use_openai = bool(OPENAI_API_KEY) and not DEMO_MODE
    if use_openai:
        try:
            message = _openai_message(lead)
        except Exception as exc:
            print(f"[personalize] OpenAI unavailable ({exc.__class__.__name__}); using template")
            message = _template_message(lead)
    else:
        message = _template_message(lead)
    out = dict(lead)
    out["Personalized Message"] = message
    # Safe-mode LinkedIn helper (also mirrored as Sheets HYPERLINK in crm_sync)
    li = (out.get("LinkedIn URL") or "").strip()
    out["Open Profile"] = li if li else ""
    if out.get("Status") in {"scored", "enriched", "new", ""}:
        out["Status"] = "ready"
    return out


def personalize_many(leads: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [personalize_lead(lead) for lead in leads]


def main() -> None:
    from lead_store import filter_by_status, read_leads, upsert_leads

    leads = filter_by_status(read_leads(), {"scored"})
    if not leads:
        print("No scored leads. Run scorer.py first.")
        return

    ready = personalize_many(leads)
    upsert_leads(ready)
    print(f"Personalized {len(ready)} leads.")
    for row in ready[:3]:
        print("-" * 60)
        print(f"{row['Company']} | {row['Open Role Found']}")
        print(row["Personalized Message"])
        print(f"words={_word_count(row['Personalized Message'])}")


if __name__ == "__main__":
    main()
