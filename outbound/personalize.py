"""
Phase 3 — Hyper-personalization engine ("mingle" angle).

Rules: under 75 words, active voice, no corporate buzzwords, soft CTA.
Default language: Hebrew (COPY_LANGUAGE=he). Set COPY_LANGUAGE=en for English.
"""

from __future__ import annotations

import re
from typing import Any

from config import COPY_LANGUAGE, DEMO_MODE, OPENAI_API_KEY, OPENAI_MODEL, PRODUCT_NAME

MAX_WORDS = 75


def _copy_system() -> str:
    if COPY_LANGUAGE == "en":
        return f"""You write short B2B outreach for {PRODUCT_NAME}.
Rules:
- Under {MAX_WORDS} words
- Active voice
- No generic corporate buzzwords
- Soft interest-based CTA
- Mention the specific open role
Return ONLY the message body text, no subject line, no quotes."""

    return f"""אתה כותב הודעות B2B קצרות בעברית עבור {PRODUCT_NAME}.
כללים:
- עד {MAX_WORDS} מילים
- לשון פעילה, טבעית, לא מתחסדת
- בלי באזזוורדים ארגוניים
- CTA רך מבוסס עניין
- להזכיר את התפקיד הספציפי שהם מגייסים אליו
החזר רק את גוף ההודעה, בלי נושא מייל ובלי מרכאות."""


def _word_count(text: str) -> int:
    return len(re.findall(r"\b\w+\b", text, flags=re.UNICODE))


def _first_name(full_name: str) -> str:
    full_name = (full_name or "").strip()
    if not full_name:
        return ""
    return full_name.split()[0]


def _template_message(lead: dict[str, Any]) -> str:
    company = (lead.get("Company") or "").strip() or ("הצוות שלכם" if COPY_LANGUAGE != "en" else "your team")
    role = (lead.get("Open Role Found") or "").strip() or (
        "התפקיד הפתוח" if COPY_LANGUAGE != "en" else "your open role"
    )
    name = _first_name(lead.get("Contact Name") or "")

    if COPY_LANGUAGE == "en":
        greeting = f"Hi {name}," if name else "Hi,"
        msg = (
            f"{greeting} Saw you're looking for a {role} at {company}. "
            "Most tools just throw another CV pile at you. mingle ranks a shortlist "
            "in 60 seconds based on Role, Human, and Motivation fit, showing you "
            "exactly why they match and the honest risks. "
            "Open to seeing a 60-second Match Report for this role?"
        )
    else:
        greeting = f"היי {name}," if name else "היי,"
        msg = (
            f"{greeting} ראיתי שאתם מחפשים {role} ב־{company}. "
            "רוב הכלים רק זורקים עליכם עוד ערמת קורות חיים. "
            "mingle מדרגת שורטליסט תוך 60 שניות לפי התאמת Role, Human ו־Motivation, "
            "ומראה בדיוק למה זה מתאים — וגם את הסיכונים בכנות. "
            "פתוחים לראות Match Report של 60 שניות לתפקיד הזה?"
        )

    words = msg.split()
    if len(words) > MAX_WORDS:
        msg = " ".join(words[: MAX_WORDS - 1]) + "?"
    return msg


def _openai_message(lead: dict[str, Any]) -> str:
    from openai import OpenAI

    client = OpenAI(api_key=OPENAI_API_KEY)
    if COPY_LANGUAGE == "en":
        user = (
            f"Company: {lead.get('Company')}\n"
            f"Contact: {lead.get('Contact Name')}\n"
            f"Title: {lead.get('Contact Title') or lead.get('Persona Title')}\n"
            f"Open role: {lead.get('Open Role Found')}\n"
            "Hook: Saw you're looking for a [role] at [Company].\n"
            "Value: Most tools just throw another CV pile at you. mingle ranks a "
            "shortlist in 60 seconds based on Role, Human, and Motivation fit, "
            "with clear why-match and honest risks.\n"
            "CTA: Open to seeing a 60-second Match Report for this role?\n"
            "Write one message in English."
        )
    else:
        user = (
            f"חברה: {lead.get('Company')}\n"
            f"איש קשר: {lead.get('Contact Name')}\n"
            f"תפקיד: {lead.get('Contact Title') or lead.get('Persona Title')}\n"
            f"משרה פתוחה: {lead.get('Open Role Found')}\n"
            "מבנה:\n"
            "- פתיחה: ראיתי שאתם מחפשים [תפקיד] ב־[חברה]\n"
            "- ערך: רוב הכלים זורקים ערמת קורות חיים; mingle מדרגת שורטליסט "
            "ב־60 שניות לפי Role / Human / Motivation, עם הסבר התאמה וסיכונים בכנות\n"
            "- CTA רך: פתוחים לראות Match Report של 60 שניות לתפקיד?\n"
            "כתוב הודעה אחת בעברית טבעית."
        )
    resp = client.chat.completions.create(
        model=OPENAI_MODEL,
        temperature=0.7,
        messages=[
            {"role": "system", "content": _copy_system()},
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
    li = (out.get("LinkedIn URL") or "").strip()
    out["Open Profile"] = li if li else ""
    if out.get("Status") in {"scored", "enriched", "new", "ready", ""}:
        out["Status"] = "ready"
    return out


def personalize_many(leads: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [personalize_lead(lead) for lead in leads]


def main() -> None:
    from lead_store import filter_by_status, read_leads, upsert_leads

    leads = filter_by_status(read_leads(), {"scored", "ready"})
    if not leads:
        print("No scored/ready leads. Run scorer.py first.")
        return

    ready = personalize_many(leads)
    upsert_leads(ready)
    print(f"Personalized {len(ready)} leads in language={COPY_LANGUAGE}.")
    for row in ready[:3]:
        print("-" * 60)
        print(f"{row['Company']} | {row['Open Role Found']}")
        print(row["Personalized Message"])
        print(f"words={_word_count(row['Personalized Message'])}")


if __name__ == "__main__":
    main()
