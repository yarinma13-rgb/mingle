"""
Phase 3 — Hyper-personalization engine ("mingle" angle).

Produces TWO Hebrew assets per lead:
1) Personalized Message — email / LinkedIn DM (full copy)
2) LinkedIn Note — connection-request note, hard-capped at 300 chars

Default language: Hebrew (COPY_LANGUAGE=he).
"""

from __future__ import annotations

import re
from typing import Any

from config import (
    COPY_LANGUAGE,
    DEMO_MODE,
    LINKEDIN_NOTE_MAX_CHARS,
    OPENAI_API_KEY,
    OPENAI_MODEL,
    PRODUCT_NAME,
)

MAX_WORDS = 90

# Common Latin → Hebrew first names for Israeli outreach greetings
HEBREW_FIRST_NAMES = {
    "maya": "מאיה",
    "tom": "תום",
    "dana": "דנה",
    "ori": "אורי",
    "lior": "ליאור",
    "yael": "יעל",
    "noa": "נועה",
    "noah": "נוח",
    "gal": "גל",
    "tal": "טל",
    "ron": "רון",
    "roni": "רוני",
    "amit": "עמית",
    "amir": "אמיר",
    "omer": "עומר",
    "yonatan": "יונתן",
    "jonathan": "יונתן",
    "michael": "מיכאל",
    "michal": "מיכל",
    "sarah": "שרה",
    "sara": "שרה",
    "david": "דוד",
    "daniel": "דניאל",
    "dani": "דני",
    "shira": "שירה",
    "tamar": "תמר",
    "hila": "הילה",
    "inbal": "ענבל",
    "adir": "אדיר",
    "eden": "עדן",
    "itay": "איתי",
    "itai": "איתי",
    "eitan": "איתן",
    "asaf": "אסף",
    "assaf": "אסף",
    "barak": "ברק",
    "chen": "חן",
    "guy": "גיא",
    "ido": "עידו",
    "yuval": "יובל",
    "ziv": "זיו",
    "alex": "אלכס",
    "sam": "סם",
    "nina": "נינה",
}


def _has_hebrew(text: str) -> bool:
    return bool(re.search(r"[\u0590-\u05FF]", text or ""))


def _first_token(full_name: str) -> str:
    full_name = (full_name or "").strip()
    if not full_name:
        return ""
    return full_name.split()[0]


def hebrew_first_name(lead: dict[str, Any]) -> str:
    """Prefer Contact Name HE; else map Latin first name; else keep as-is."""
    explicit = (lead.get("Contact Name HE") or "").strip()
    if explicit:
        return _first_token(explicit)

    raw = _first_token(lead.get("Contact Name") or "")
    if not raw:
        return ""
    if _has_hebrew(raw):
        return raw
    return HEBREW_FIRST_NAMES.get(raw.lower(), raw)


def _word_count(text: str) -> int:
    return len(re.findall(r"\b\w+\b", text, flags=re.UNICODE))


def _copy_system(kind: str) -> str:
    if COPY_LANGUAGE == "en":
        limit = (
            f"Hard limit: {LINKEDIN_NOTE_MAX_CHARS} characters including spaces."
            if kind == "note"
            else f"Under {MAX_WORDS} words."
        )
        return f"""You write short B2B outreach for {PRODUCT_NAME}.
{limit}
Active voice, soft CTA, mention the open role.
Return ONLY the message body."""

    if kind == "note":
        return f"""אתה כותב הערת חיבור (LinkedIn connection note) בעברית עבור {PRODUCT_NAME}.
כללים קשיחים:
- לכל היותר {LINKEDIN_NOTE_MAX_CHARS} תווים כולל רווחים וסימני פיסוק
- פנייה בשם פרטי בעברית
- להזכיר את התפקיד והחברה
- CTA רך קצר
החזר רק את הטקסט, בלי מרכאות."""

    return f"""אתה כותב הודעת מייל/הודעת LinkedIn מלאה בעברית עבור {PRODUCT_NAME}.
סגנון רצוי:
- פנייה בשם פרטי בעברית
- משפט על כך שהם מגייסים לתפקיד הספציפי
- שאלה על כמה זמן לוקח להגיע מ־CVs ל־3–5 מועמדים ששווה לדבר איתם
- mingle עושה את זה ב־60 שניות עם דירוג Role / Human / Motivation ו־Match Report
- CTA: רוצה שאשלח Match Report של 60 שניות על המשרה?
החזר רק את גוף ההודעה."""


def _template_email(lead: dict[str, Any]) -> str:
    company = (lead.get("Company") or "").strip() or "החברה שלכם"
    role = (lead.get("Open Role Found") or "").strip() or "התפקיד הפתוח"
    name = hebrew_first_name(lead)

    if COPY_LANGUAGE == "en":
        greeting = f"Hi {name}," if name else "Hi,"
        return (
            f"{greeting}\n\n"
            f"Saw you're hiring a {role} at {company}.\n\n"
            "How long does it take you to go from CVs to 3–5 people actually worth talking to?\n\n"
            "mingle does that in 60 seconds — ranking by Role, Human, and Motivation fit, "
            "with a Match Report that shows why they match and where the risk is.\n\n"
            "Want me to send a 60-second Match Report for this role?"
        )

    greeting = f"היי {name}," if name else "היי,"
    return (
        f"{greeting}\n\n"
        f"ראיתי שאתם מגייסים {role} ב־{company}.\n\n"
        "כמה זמן לוקח לכם להגיע מ־CVs ל־3–5 מועמדים שבאמת שווה לדבר איתם?\n\n"
        "mingle עושה את זה תוך 60 שניות — ומדרגת את המועמדים לפי Role, Human ו־Motivation, "
        "עם Match Report שמראה גם למה יש התאמה וגם איפה הסיכון.\n\n"
        "רוצה שאשלח לך Match Report של 60 שניות על המשרה שלכם?"
    )


def _template_linkedin_note(lead: dict[str, Any]) -> str:
    """Must stay ≤ LINKEDIN_NOTE_MAX_CHARS for LinkedIn connection requests."""
    company = (lead.get("Company") or "").strip() or "החברה"
    role = (lead.get("Open Role Found") or "").strip() or "התפקיד"
    name = hebrew_first_name(lead)

    if COPY_LANGUAGE == "en":
        greeting = f"Hi {name}," if name else "Hi,"
        candidates = [
            f"{greeting} Saw you're hiring a {role} at {company}. mingle shortlists worth-talking-to candidates in 60s with a Match Report. Worth connecting?",
            f"{greeting} Hiring {role} at {company}? mingle ranks a shortlist in 60s (Role/Human/Motivation). Open to connect?",
            f"{greeting} Re: {role} at {company} — mingle builds a 60s Match Report shortlist. Connect?",
        ]
    else:
        greeting = f"היי {name}," if name else "היי,"
        candidates = [
            f"{greeting} ראיתי שאתם מגייסים {role} ב־{company}. mingle מדרגת 3–5 מועמדים רלוונטיים תוך 60 שניות עם Match Report. שווה להתחבר?",
            f"{greeting} מגייסים {role} ב־{company}? mingle בונה שורטליסט ב־60 שניות עם Match Report. פתוח/ה להתחבר?",
            f"{greeting} לגבי {role} ב־{company} — mingle מדרגת מועמדים ב־60 שניות. נתחבר?",
        ]

    for text in candidates:
        if len(text) <= LINKEDIN_NOTE_MAX_CHARS:
            return text

    # Last-resort hard trim (should rarely hit)
    base = candidates[-1]
    return base[: LINKEDIN_NOTE_MAX_CHARS - 1] + "…"


def _openai_copy(lead: dict[str, Any], kind: str) -> str:
    from openai import OpenAI

    client = OpenAI(api_key=OPENAI_API_KEY)
    name_he = hebrew_first_name(lead)
    if COPY_LANGUAGE == "en":
        user = (
            f"Kind: {kind}\n"
            f"Company: {lead.get('Company')}\n"
            f"Contact first name: {name_he}\n"
            f"Open role: {lead.get('Open Role Found')}\n"
            "Write the message."
        )
    else:
        user = (
            f"סוג: {'הערת חיבור LinkedIn עד 300 תווים' if kind == 'note' else 'הודעת מייל מלאה'}\n"
            f"חברה: {lead.get('Company')}\n"
            f"שם פרטי בעברית לפתיחה: {name_he}\n"
            f"משרה פתוחה: {lead.get('Open Role Found')}\n"
            "כתוב את ההודעה בסגנון שסופק בכללי המערכת."
        )
    resp = client.chat.completions.create(
        model=OPENAI_MODEL,
        temperature=0.6,
        messages=[
            {"role": "system", "content": _copy_system(kind)},
            {"role": "user", "content": user},
        ],
    )
    text = (resp.choices[0].message.content or "").strip().strip('"').strip("'")
    if kind == "note":
        if not text or len(text) > LINKEDIN_NOTE_MAX_CHARS:
            return _template_linkedin_note(lead)
        return text
    if not text or _word_count(text) > MAX_WORDS:
        return _template_email(lead)
    return text


def personalize_lead(lead: dict[str, Any]) -> dict[str, Any]:
    use_openai = bool(OPENAI_API_KEY) and not DEMO_MODE
    out = dict(lead)
    out["Contact Name HE"] = hebrew_first_name(out)

    if use_openai:
        try:
            email_msg = _openai_copy(out, "email")
        except Exception as exc:
            print(f"[personalize] OpenAI email fallback ({exc.__class__.__name__})")
            email_msg = _template_email(out)
        try:
            note_msg = _openai_copy(out, "note")
        except Exception as exc:
            print(f"[personalize] OpenAI note fallback ({exc.__class__.__name__})")
            note_msg = _template_linkedin_note(out)
    else:
        email_msg = _template_email(out)
        note_msg = _template_linkedin_note(out)

    # Hard safety for LinkedIn connection note limit
    if len(note_msg) > LINKEDIN_NOTE_MAX_CHARS:
        note_msg = _template_linkedin_note(out)

    out["Personalized Message"] = email_msg
    out["LinkedIn Note"] = note_msg
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
    print(f"Personalized {len(ready)} leads (lang={COPY_LANGUAGE}).")
    for row in ready[:3]:
        print("-" * 60)
        print(f"{row['Company']} | {row['Open Role Found']} | name_he={row.get('Contact Name HE')}")
        print("EMAIL:")
        print(row["Personalized Message"])
        print(f"NOTE ({len(row['LinkedIn Note'])} chars):")
        print(row["LinkedIn Note"])


if __name__ == "__main__":
    main()
