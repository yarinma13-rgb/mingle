"""
Phase 3 — Hyper-personalization engine ("mingle" angle).

Produces TWO Hebrew assets per lead:
1) Personalized Message — email / LinkedIn DM (full copy, founder-approved tone)
2) LinkedIn Note — connection-request note, hard-capped at 300 chars

By default Hebrew copy uses the locked templates (not free-form AI),
because connection notes + ICP messaging must stay on-brief.
Set USE_AI_COPY=true only if you explicitly want OpenAI variations.
"""

from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env", override=True)

from config import (
    COPY_LANGUAGE,
    DEMO_MODE,
    LINKEDIN_NOTE_MAX_CHARS,
    OPENAI_API_KEY,
    OPENAI_MODEL,
)

USE_AI_COPY = os.getenv("USE_AI_COPY", "false").lower() in {"1", "true", "yes"}

# Common Latin → Hebrew first names for Israeli outreach greetings
HEBREW_FIRST_NAMES = {
    "maya": "מאיה",
    "tom": "תום",
    "dana": "דנה",
    "ori": "אורי",
    "lior": "ליאור",
    "yael": "יעל",
    "noa": "נועה",
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


def _template_email(lead: dict[str, Any], link: str = "") -> str:
    """Full message — founder-approved copy (updated 2026-09-20), with the
    per-lead tracked interest link embedded inline where the founder placed it.
    English branch intentionally left on the older copy — no English text was
    approved for this revision."""
    role = (lead.get("Open Role Found") or "").strip() or "התפקיד הפתוח"
    name = hebrew_first_name(lead)

    if COPY_LANGUAGE == "en":
        greeting = f"Hi {name}," if name else "Hi,"
        return (
            f"{greeting} Saw you're hiring a {role}. "
            "At mingle we have a slightly different way to spot role fit — beyond CV and experience. "
            "Thought this open role could be a great example to see it in action. Want a look?"
        )

    link_line = f"{link}\n" if link else ""
    return (
        "היי, נעים מאוד!\n"
        "שמנו לב שיש לכם מגוון משרות פתוחות, ורצינו להציע לכם לפרסם אותן ב-mingle.\n"
        "mingle עוזרת לחברות לחסוך זמן ועלויות בתהליכי גיוס, באמצעות התאמה שמתבססת גם על ניסיון מקצועי וגם על "
        "interpersonal skills, סביבת עבודה, כיוון קריירה ועוד.\n"
        "נשמח להראות לך בדמו קצר איך זה עובד, ואיך המשרות שלכם יכולות להגיע לטאלנטים שמתאימים להן באמת:\n"
        f"{link_line}"
        "נשמח להתחבר ולבחון יחד את האפשרות לצרף אתכם להשקה הראשונית של mingle במסגרת קיט ההטבות שלנו."
    )


def _template_linkedin_note(lead: dict[str, Any]) -> str:
    """Connection request note — must stay ≤ 300 chars. Same copy as email when it fits."""
    role = (lead.get("Open Role Found") or "").strip() or "התפקיד"
    name = hebrew_first_name(lead)

    if COPY_LANGUAGE == "en":
        greeting = f"Hi {name}," if name else "Hi,"
        candidates = [
            f"{greeting} Saw you're hiring a {role}. mingle spots fit beyond CV/experience — worth a quick look?",
            f"{greeting} Hiring {role}? We identify fit beyond the CV. Want to see an example?",
            f"{greeting} Re {role}: mingle finds fit beyond CV. Open to a peek?",
        ]
    else:
        greeting = f"היי {name}," if name else "היי,"
        candidates = [
            (
                f"{greeting} ראיתי שאתם מגייסים {role}. "
                "יש לנו ב־mingle דרך קצת אחרת לזהות התאמה לתפקיד, מעבר ל־CV ולניסיון המקצועי. "
                "חשבתי שהמשרה הזו יכולה להיות אחלה דוגמה לראות את זה בפועל. "
                "רוצה לראות?"
            ),
            (
                f"{greeting} מגייסים {role}? "
                "ב־mingle יש דרך אחרת לזהות התאמה מעבר ל־CV ולניסיון. "
                "המשרה הזו יכולה להיות דוגמה טובה. רוצה לראות?"
            ),
            (
                f"{greeting} לגבי {role} — "
                                "mingle מזהה התאמה מעבר ל־CV. רוצה לראות דוגמה קצרה?"
        ]

    for text in candidates:
        if len(text) <= LINKEDIN_NOTE_MAX_CHARS:
            return text
    return candidates[-1][: LINKEDIN_NOTE_MAX_CHARS - 1] + "…"


def _openai_variation(lead: dict[str, Any], kind: str, seed: str) -> str:
    """Optional slight variation — kept tightly constrained to the approved seed."""
    from openai import OpenAI

    client = OpenAI(api_key=OPENAI_API_KEY)
    limit = (
                f"לכל היותר {LINKEDIN_NOTE_MAX_CHARS} תווים."
        if kind == "note"
        else "שמור על אותו מבנה ורעיון."
    )
    resp = client.chat.completions.create(
        model=OPENAI_MODEL,
        temperature=0.4,
        messages=[
            {
                "role": "system",
                "content": (
                                        "ערוך קלות את טקסט הבסיס בעברית ל־mingle.careers. "
                    "אל תשנה את המסר, אל תוסיף באזזוורדים, אל תוסיף חתימה/[שמך], "
                    f"ואל תהפוך את זה להודעת מחפש עבודה. {limit} "
                    "החזר רק את הטקסט הסופי."
                ),
            },
            {"role": "user", "content": seed},
        ],
    )
    text = (resp.choices[0].message.content or "").strip().strip('"').strip("'")
    if kind == "note" and (not text or len(text) > LINKEDIN_NOTE_MAX_CHARS):
        return seed
    return text or seed


def personalize_lead(lead: dict[str, Any]) -> dict[str, Any]:
    out = dict(lead)
    out["Contact Name HE"] = hebrew_first_name(out)

    existing_link = (out.get("Interest Link") or "").strip()
    email_msg = _template_email(out, link=existing_link)
    note_msg = _template_linkedin_note(out)

    if USE_AI_COPY and OPENAI_API_KEY and not DEMO_MODE:
        try:
            email_msg = _openai_variation(out, "email", email_msg)
            note_msg = _openai_variation(out, "note", note_msg)
        except Exception as exc:
            print(f"[personalize] AI variation skipped ({exc.__class__.__name__}); using locked templates")

    if len(note_msg) > LINKEDIN_NOTE_MAX_CHARS:
        note_msg = _template_linkedin_note(out)

    out["Personalized Message"] = email_msg
    out["LinkedIn Note"] = note_msg
    out["Open Profile"] = (out.get("LinkedIn URL") or "").strip()
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
    print(f"Personalized {len(ready)} leads (lang={COPY_LANGUAGE}, ai_copy={USE_AI_COPY}).")
    for row in ready[:2]:
        print("-" * 60)
        print(f"{row['Company']} | name_he={row.get('Contact Name HE')}")
        print("EMAIL:")
        print(row["Personalized Message"])
        print(f"NOTE ({len(row['LinkedIn Note'])}/{LINKEDIN_NOTE_MAX_CHARS}):")
        print(row["LinkedIn Note"])


if __name__ == "__main__":
    main()
