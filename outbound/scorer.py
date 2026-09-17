"""
Phase 2 — Automated lead scoring & ICP gating.

Uses OpenAI gpt-4o-mini when OPENAI_API_KEY is set.
Falls back to a deterministic local heuristic in DEMO_MODE / without a key
so the pipeline is runnable at $0.

Strict persona rules:
  A) HR / People / Talent ONLY if company size ≤200
  B) Founder / CEO ONLY if there is no HR function and no recruiter
"""

from __future__ import annotations

import json
import re
from typing import Any

from config import (
    DEMO_MODE,
    FOUNDER_PERSONA_KEYWORDS,
    HAS_HR_OR_RECRUITER_SIGNALS,
    HR_PERSONA_KEYWORDS,
    ICP_COMPANY_KEYWORDS,
    ICP_MIN_SCORE,
    ICP_SIZE_BUCKETS,
    MAX_EMPLOYEES,
    OPENAI_API_KEY,
    OPENAI_MODEL,
    TARGET_PERSONAS,
    TARGET_VERTICALS,
    TRIGGER_ROLES,
)

SCORING_SYSTEM = f"""You are an ICP gate for mingle.careers, an AI hiring platform.
Be STRICT. Only true fits should score >= 85.

Personas (ONLY these):
1) HR / People / Talent at a company with ≤{MAX_EMPLOYEES} employees.
2) Founder / CEO only when the company has NO dedicated HR function and NO recruiter.

Reject: enterprise HR/TA teams, companies clearly >{MAX_EMPLOYEES}, founders/CEOs who already have HR or a recruiter, office managers, and non-hiring roles.

Return ONLY valid JSON with keys: is_match (bool), score (int 0-100), reasoning (one short sentence)."""


def parse_employee_count(size_raw: str) -> int | None:
    """Best-effort upper bound from strings like '11-50', '51-200', '~80', '150 employees'."""
    text = (size_raw or "").strip().lower()
    if not text:
        return None

    # Longest / most specific ranges first so '501-1000' does not match '1-10'
    range_patterns: list[tuple[str, int]] = [
        (r"\b10000\+\b", 10000),
        (r"\b1000\+\b", 1000),
        (r"\b500\+\b", 500),
        (r"\b201\+\b", 201),
        (r"\b501\s*[-–]\s*1000\b", 1000),
        (r"\b201\s*[-–]\s*500\b", 500),
        (r"\b51\s*[-–]\s*200\b", 200),
        (r"\b50\s*[-–]\s*200\b", 200),
        (r"\b11\s*[-–]\s*50\b", 50),
        (r"\b1\s*[-–]\s*50\b", 50),
        (r"\b1\s*[-–]\s*10\b", 10),
    ]
    for pattern, high in range_patterns:
        if re.search(pattern, text):
            return high

    if any(x in text for x in ("under 200", "≤200", "<=200", "<200")):
        return 200
    if any(x in text for x in ("over 200", ">200", "enterprise")):
        return 500

    nums = [int(n) for n in re.findall(r"\d+", text)]
    if not nums:
        return None
    return max(nums)


def _is_hr_title(title: str) -> bool:
    return any(k in title for k in HR_PERSONA_KEYWORDS)


def _is_founder_title(title: str) -> bool:
    return any(k in title for k in FOUNDER_PERSONA_KEYWORDS)


def _has_hr_or_recruiter(lead: dict[str, Any]) -> bool:
    """
    Explicit signals that hiring is already covered.
    Also treat Contact Title itself being a recruiter/HR hire-target as coverage
    when evaluating a separate founder row (via notes / flags).
    """
    flag = (lead.get("Has HR Function") or lead.get("has_hr_function") or "").strip().lower()
    if flag in {"1", "true", "yes", "y"}:
        return True
    if flag in {"0", "false", "no", "n"}:
        return False

    blob = " ".join(
        [
            str(lead.get("Reasoning") or ""),
            str(lead.get("Notes") or ""),
            str(lead.get("Source") or ""),
            str(lead.get("Company") or ""),
        ]
    ).lower()
    return any(sig in blob for sig in HAS_HR_OR_RECRUITER_SIGNALS)


def _heuristic_score(lead: dict[str, Any]) -> dict[str, Any]:
    """Free local scorer used when no OpenAI key / DEMO_MODE."""
    role = (lead.get("Open Role Found") or "").lower()
    title = (lead.get("Contact Title") or lead.get("Persona Title") or "").lower()
    size_raw = lead.get("Company Size") or ""
    headcount = parse_employee_count(str(size_raw))
    source_blob = " ".join(
        [
            (lead.get("Company") or "").lower(),
            role,
            title,
            str(size_raw).lower(),
            (lead.get("Domain") or "").lower(),
            (lead.get("Notes") or "").lower(),
            (lead.get("Reasoning") or "").lower(),
        ]
    )

    score = 35
    reasons: list[str] = []

    # --- hard size gate when known ---
    if headcount is not None and headcount > MAX_EMPLOYEES:
        return {
            "is_match": False,
            "score": min(40, 30 + (10 if any(k in source_blob for k in ICP_COMPANY_KEYWORDS) else 0)),
            "reasoning": f"company size ~{headcount} exceeds ≤{MAX_EMPLOYEES} ICP ceiling",
        }

    if headcount is not None and headcount <= MAX_EMPLOYEES:
        score += 15
        reasons.append(f"size ≤{MAX_EMPLOYEES}")
    elif any(b in str(size_raw).lower() for b in ICP_SIZE_BUCKETS):
        score += 15
        reasons.append(f"size bucket ≤{MAX_EMPLOYEES}")
    elif not str(size_raw).strip():
        score += 5
        reasons.append("size unknown (soft pass)")

    if any(k in source_blob for k in ICP_COMPANY_KEYWORDS):
        score += 15
        reasons.append("ICP vertical keywords")

    hiring = any(tr.lower() in role for tr in TRIGGER_ROLES) or any(
        word in role for word in ("engineer", "designer", "product manager")
    )
    if hiring:
        score += 20
        reasons.append("active hiring trigger")

    # --- persona paths ---
    hr_title = _is_hr_title(title)
    founder_title = _is_founder_title(title)
    covered = _has_hr_or_recruiter(lead)

    if hr_title:
        if headcount is not None and headcount > MAX_EMPLOYEES:
            return {
                "is_match": False,
                "score": 25,
                "reasoning": "HR persona but company above 200 employees",
            }
        score += 25
        reasons.append("HR/People persona at small/mid company")
    elif founder_title:
        if covered:
            return {
                "is_match": False,
                "score": 35,
                "reasoning": "Founder/CEO but HR function or recruiter already present",
            }
        score += 25
        reasons.append("Founder/CEO with no HR/recruiter")
    elif not title:
        # Contact not resolved yet — keep alive only if size+hiring look right
        score += 5
        reasons.append("persona TBD — resolve HR (≤200) or Founder without HR")
    else:
        score -= 20
        reasons.append(f"non-ICP title: {title[:40]}")

    score = max(0, min(100, score))
    is_match = score >= ICP_MIN_SCORE and (hr_title or founder_title or not title)
    # Unknown title cannot clear the gate — force resolve persona first
    if not title:
        is_match = False
        score = min(score, ICP_MIN_SCORE - 1)
        reasons.append("blocked until persona resolved")

    reasoning = "; ".join(reasons) if reasons else "weak ICP signal"
    return {"is_match": is_match, "score": score, "reasoning": reasoning}


def _openai_score(lead: dict[str, Any]) -> dict[str, Any]:
    from openai import OpenAI

    client = OpenAI(api_key=OPENAI_API_KEY)
    payload = {
        "Company Name": lead.get("Company"),
        "Current Job Openings": lead.get("Open Role Found"),
        "Persona Title": lead.get("Contact Title") or lead.get("Persona Title"),
        "Company Size": lead.get("Company Size"),
        "Parsed headcount (upper)": parse_employee_count(str(lead.get("Company Size") or "")),
        "Has HR Function / recruiter": _has_hr_or_recruiter(lead),
        "Domain": lead.get("Domain"),
        "ICP verticals": TARGET_VERTICALS,
        "ICP personas": TARGET_PERSONAS,
        "Max employees": MAX_EMPLOYEES,
    }
    user_prompt = (
        "Analyze the lead against mingle.careers ICP.\n"
        f"Approve ONLY if persona title is present AND: "
        f"(HR/People/Talent AND size ≤{MAX_EMPLOYEES}) "
        "OR (Founder/CEO AND no HR function AND no recruiter), "
        "AND the company is currently hiring for a relevant role.\n"
        "If Persona Title is missing/empty → is_match=false and score below 85.\n"
        "Do NOT invent that the contact is a founder just because title is unknown.\n"
        f"Lead data:\n{json.dumps(payload, ensure_ascii=False)}\n\n"
        "Return a strict JSON object:\n"
        "{\n"
        '  "is_match": boolean,\n'
        '  "score": integer (0-100),\n'
        '  "reasoning": "one short sentence explaining the score"\n'
        "}"
    )
    resp = client.chat.completions.create(
        model=OPENAI_MODEL,
        temperature=0,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SCORING_SYSTEM},
            {"role": "user", "content": user_prompt},
        ],
    )
    raw = resp.choices[0].message.content or "{}"
    data = json.loads(raw)
    score = int(data.get("score", 0))
    return {
        "is_match": bool(data.get("is_match", score >= ICP_MIN_SCORE)),
        "score": score,
        "reasoning": str(data.get("reasoning", "")).strip() or "no reasoning",
    }


def score_lead(lead: dict[str, Any]) -> dict[str, Any]:
    use_openai = bool(OPENAI_API_KEY) and not DEMO_MODE
    if use_openai:
        try:
            result = _openai_score(lead)
        except Exception as exc:
            # Quota / network / auth failures should not kill the whole pipeline.
            print(f"[scorer] OpenAI unavailable ({exc.__class__.__name__}); using local heuristic")
            result = _heuristic_score(lead)
            result["reasoning"] = f"{result['reasoning']} | openai_fallback"
    else:
        result = _heuristic_score(lead)

    # Hard gate: never approve without a resolved ICP persona title.
    title = (lead.get("Contact Title") or lead.get("Persona Title") or "").strip().lower()
    if not title:
        result = {
            "is_match": False,
            "score": min(int(result.get("score", 0)), ICP_MIN_SCORE - 1),
            "reasoning": (
                f"{result.get('reasoning', '')}; blocked — resolve HR (≤200) or "
                "Founder/CEO without HR before approve"
            ).strip("; "),
        }
    elif not (_is_hr_title(title) or _is_founder_title(title)):
        result = {
            "is_match": False,
            "score": min(int(result.get("score", 0)), ICP_MIN_SCORE - 1),
            "reasoning": f"non-ICP title '{title[:48]}' — need HR≤200 or Founder without HR",
        }
    elif _is_founder_title(title) and _has_hr_or_recruiter(lead):
        result = {
            "is_match": False,
            "score": min(int(result.get("score", 0)), 40),
            "reasoning": "Founder/CEO blocked — HR function or recruiter already present",
        }
    else:
        headcount = parse_employee_count(str(lead.get("Company Size") or ""))
        if _is_hr_title(title) and headcount is not None and headcount > MAX_EMPLOYEES:
            result = {
                "is_match": False,
                "score": min(int(result.get("score", 0)), 40),
                "reasoning": f"HR persona but company size ~{headcount} exceeds ≤{MAX_EMPLOYEES}",
            }

    result["score"] = int(result["score"])
    result["is_match"] = bool(result.get("is_match")) and result["score"] >= ICP_MIN_SCORE
    return result


def score_and_gate(leads: list[dict[str, Any]], min_score: int | None = None) -> tuple[list[dict], list[dict]]:
    """
    Returns (approved, dropped).
    Approved leads get Status=scored and AI Match Score filled.
    Dropped leads get Status=dropped.
    """
    threshold = min_score if min_score is not None else ICP_MIN_SCORE
    approved: list[dict] = []
    dropped: list[dict] = []

    for lead in leads:
        result = score_lead(lead)
        enriched = dict(lead)
        enriched["AI Match Score"] = str(result["score"])
        enriched["Reasoning"] = result["reasoning"]
        if result["score"] >= threshold and result["is_match"]:
            enriched["Status"] = "scored"
            approved.append(enriched)
        else:
            enriched["Status"] = "dropped"
            dropped.append(enriched)

    return approved, dropped


def main() -> None:
    import argparse

    from lead_store import read_leads, upsert_leads

    parser = argparse.ArgumentParser(description="Score leads and drop below ICP threshold")
    parser.add_argument("--min-score", type=int, default=ICP_MIN_SCORE)
    args = parser.parse_args()

    leads = [r for r in read_leads() if r.get("Status", "").lower() in {"new", "enriched", ""}]
    if not leads:
        print("No new/enriched leads to score. Run scraper.py first or load sample data.")
        return

    approved, dropped = score_and_gate(leads, min_score=args.min_score)
    upsert_leads(approved + dropped)
    print(f"Approved: {len(approved)} | Dropped: {len(dropped)} (threshold={args.min_score})")
    for row in approved[:5]:
        print(f"  ✓ {row['Company']} — {row['Open Role Found']} — score={row['AI Match Score']}")


if __name__ == "__main__":
    main()
