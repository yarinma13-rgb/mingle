"""
Phase 1b — Free email find + light verification via Hunter.io / Anymail Finder.

Uses free monthly credits only. In DEMO_MODE or without keys, generates a
plausible but UNVERIFIED pattern placeholder and marks Status accordingly —
never invents that an email is verified.
"""

from __future__ import annotations

import re
from typing import Any

import requests

from config import ANYMAIL_API_KEY, DEMO_MODE, HUNTER_API_KEY
from lead_store import read_leads, upsert_leads

SESSION = requests.Session()


def _guess_domain(lead: dict[str, Any]) -> str:
    domain = (lead.get("Domain") or "").strip().lower()
    if domain:
        return domain
    company = re.sub(r"[^a-z0-9]", "", (lead.get("Company") or "").lower())
    return f"{company}.com" if company else ""


def hunter_find_email(domain: str, full_name: str = "") -> dict[str, Any]:
    """https://hunter.io/api-documentation/v2#email-finder"""
    if not HUNTER_API_KEY:
        return {}
    params: dict[str, Any] = {"domain": domain, "api_key": HUNTER_API_KEY}
    if full_name:
        parts = full_name.strip().split()
        if len(parts) >= 2:
            params["first_name"] = parts[0]
            params["last_name"] = parts[-1]
    resp = SESSION.get("https://api.hunter.io/v2/email-finder", params=params, timeout=30)
    if resp.status_code != 200:
        return {"error": resp.text[:200]}
    data = resp.json().get("data") or {}
    return {
        "email": data.get("email") or "",
        "score": data.get("score"),
        "verified": (data.get("verification") or {}).get("status") == "valid",
        "provider": "hunter",
    }


def hunter_verify(email: str) -> dict[str, Any]:
    if not HUNTER_API_KEY or not email:
        return {}
    resp = SESSION.get(
        "https://api.hunter.io/v2/email-verifier",
        params={"email": email, "api_key": HUNTER_API_KEY},
        timeout=30,
    )
    if resp.status_code != 200:
        return {"error": resp.text[:200]}
    data = resp.json().get("data") or {}
    return {
        "email": data.get("email") or email,
        "verified": data.get("status") == "valid",
        "score": data.get("score"),
        "provider": "hunter_verify",
    }


def anymail_find(domain: str, full_name: str = "") -> dict[str, Any]:
    """Anymail Finder free-tier style lookup (if key present)."""
    if not ANYMAIL_API_KEY or not domain:
        return {}
    # Endpoint shapes vary by plan; keep soft-fail.
    try:
        resp = SESSION.post(
            "https://api.anymailfinder.com/v5.0/search/person.json",
            headers={"Authorization": f"Bearer {ANYMAIL_API_KEY}"},
            json={"domain": domain, "full_name": full_name or "Talent Lead"},
            timeout=30,
        )
        if resp.status_code != 200:
            return {"error": resp.text[:200]}
        data = resp.json()
        email = data.get("email") or data.get("emails", [None])[0]
        return {"email": email or "", "verified": bool(email), "provider": "anymail"}
    except Exception as exc:
        return {"error": str(exc)}


def demo_placeholder(domain: str, full_name: str = "") -> dict[str, Any]:
    """
    Does NOT claim verification. Useful to exercise the pipeline locally.
    Prefer real Hunter credits before any send.
    """
    if not domain:
        return {"email": "", "verified": False, "provider": "demo"}
    local = "talent"
    if full_name:
        parts = re.findall(r"[a-zA-Z]+", full_name)
        if len(parts) >= 2:
            local = f"{parts[0].lower()}.{parts[-1].lower()}"
        elif parts:
            local = parts[0].lower()
    return {
        "email": f"{local}@{domain}",
        "verified": False,
        "provider": "demo_unverified",
    }


def enrich_lead(lead: dict[str, Any]) -> dict[str, Any]:
    out = dict(lead)
    domain = _guess_domain(out)
    out["Domain"] = domain
    name = (out.get("Contact Name") or "").strip()

    result: dict[str, Any] = {}
    if HUNTER_API_KEY and not DEMO_MODE:
        result = hunter_find_email(domain, name) if domain else {}
        if result.get("email") and not result.get("verified"):
            verified = hunter_verify(result["email"])
            result["verified"] = bool(verified.get("verified"))
    elif ANYMAIL_API_KEY and not DEMO_MODE:
        result = anymail_find(domain, name)
    else:
        result = demo_placeholder(domain, name)

    if result.get("email"):
        out["Email"] = result["email"]
        flag = "verified" if result.get("verified") else "unverified"
        out["Status"] = "enriched"
        note = f"email_{flag}:{result.get('provider', 'unknown')}"
        prev = out.get("Reasoning") or ""
        out["Reasoning"] = f"{prev} | {note}".strip(" |")
    return out


def enrich_many(leads: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [enrich_lead(lead) for lead in leads]


def main() -> None:
    leads = [
        r
        for r in read_leads()
        if r.get("Status", "").lower() in {"new", "scored", "ready", "enriched"}
        and not (r.get("Email") or "").strip()
    ]
    # Prefer enriching pre-score "new" leads; if none, enrich all missing emails
    if not leads:
        leads = [r for r in read_leads() if not (r.get("Email") or "").strip()]

    if not leads:
        print("No leads need email enrichment.")
        return

    enriched = enrich_many(leads)
    upsert_leads(enriched)
    found = sum(1 for r in enriched if r.get("Email"))
    print(f"Email enrichment complete: {found}/{len(enriched)} have an address.")
    if DEMO_MODE or not HUNTER_API_KEY:
        print("NOTE: DEMO/unverified placeholders — set HUNTER_API_KEY + DEMO_MODE=false before sending.")


if __name__ == "__main__":
    main()
