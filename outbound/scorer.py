"""
Phase 2 — Automated lead scoring & ICP gating.

Uses OpenAI gpt-4o-mini when OPENAI_API_KEY is set.
Falls back to a deterministic local heuristic in DEMO_MODE / without a key
so the pipeline is runnable at $0.
"""

from __future__ import annotations

import json
from typing import Any

from config import (
    DEMO_MODE,
    ICP_COMPANY_KEYWORDS,
    ICP_MIN_SCORE,
    OPENAI_API_KEY,
    OPENAI_MODEL,
    PERSONA_TITLE_KEYWORDS,
    TARGET_VERTICALS,
    TRIGGER_ROLES,
)

SCORING_SYSTEM = """You are an ICP gate for mingle.careers, an AI hiring platform.
Score leads for outbound. Be strict: only true fits should score >= 85.
Return ONLY valid JSON with keys: is_match (bool), score (int 0-100), reasoning (one short sentence)."""


def _heuristic_score(lead: dict[str, Any]) -> dict[str, Any]:
    """Free local scorer used when no OpenAI key / DEMO_MODE."""
    company = (lead.get("Company") or "").lower()
    role = (lead.get("Open Role Found") or "").lower()
    title = (lead.get("Contact Title") or lead.get("Persona Title") or "").lower()
    size = (lead.get("Company Size") or "").lower()
    source_blob = " ".join(
        [
            company,
            role,
            title,
            size,
            (lead.get("Domain") or "").lower(),
            (lead.get("Notes") or "").lower(),
        ]
    )

    score = 40
    reasons: list[str] = []

    if any(k in source_blob for k in ICP_COMPANY_KEYWORDS):
        score += 20
        reasons.append("ICP vertical keywords present")

    if any(tr.lower() in role for tr in TRIGGER_ROLES) or any(
        word in role for word in ("engineer", "designer", "product manager")
    ):
        score += 25
        reasons.append("active hiring trigger role")

    if any(p in title for p in PERSONA_TITLE_KEYWORDS) or not title:
        # Unknown contact still ok if company+role strong; assume TA/founder later
        score += 15 if title else 10
        reasons.append("decision-maker persona" if title else "persona TBD (company+role strong)")

    if any(x in size for x in ("1-10", "11-50", "51-200", "seed", "series", "startup", "agency")):
        score += 10
        reasons.append("ICP company size")

    score = max(0, min(100, score))
    is_match = score >= ICP_MIN_SCORE
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
        "Domain": lead.get("Domain"),
        "ICP verticals": TARGET_VERTICALS,
    }
    user_prompt = (
        "Analyze the extracted lead data. Determine if they fit the mingle.careers ICP "
        "(Tech companies/agencies currently hiring, targeting HR/Founders).\n"
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
    result = _openai_score(lead) if use_openai else _heuristic_score(lead)
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
