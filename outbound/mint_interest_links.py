"""
Mint unique interest links for ready outbound leads.

Each lead gets:
  Interest Link     → https://app/r/<signed-token>
  Follow-up Message → Hebrew copy for after they click
  Personalized Message includes the link (email/DM)

Requires OUTBOUND_LINK_SECRET (or CRON_SECRET) + NEXT_PUBLIC_APP_URL in outbound/.env
Matching verifier: lib/outbound-interest/token.ts
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from config import APP_URL, CRM_COLUMNS, LEADS_LOG, OUTBOUND_LINK_SECRET  # noqa: E402
from lead_store import read_leads, upsert_leads  # noqa: E402


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def sign_interest_payload(
    *,
    company: str,
    contact_name: str = "",
    email: str = "",
    open_role: str = "",
    destination: str = "/welcome",
    iat: int | None = None,
    secret: str,
) -> str:
    body = {
        "c": company,
        "n": contact_name or "",
        "e": email or "",
        "r": open_role or "",
        "d": destination or "/welcome",
        "iat": iat if iat is not None else int(time.time()),
    }
    body_b64 = _b64url(json.dumps(body, ensure_ascii=False, separators=(",", ":")).encode("utf-8"))
    sig = _b64url(hmac.new(secret.encode("utf-8"), body_b64.encode("ascii"), hashlib.sha256).digest())
    return f"{body_b64}.{sig}"


def follow_up_message(lead: dict) -> str:
    """Founder-approved template — never 'saw you clicked'. Uses the lead's
    existing Interest Link if already minted, otherwise renders without one."""
    from personalize import _template_email

    return _template_email(lead, link=(lead.get("Interest Link") or "").strip())


def mint_ready_leads() -> list[dict]:
    secret = OUTBOUND_LINK_SECRET or os.getenv("OUTBOUND_LINK_SECRET") or os.getenv("CRON_SECRET") or ""
    if not secret:
        raise SystemExit(
            "Missing OUTBOUND_LINK_SECRET (or CRON_SECRET). Add it to outbound/.env"
        )

    app_url = (APP_URL or os.getenv("NEXT_PUBLIC_APP_URL") or "http://localhost:3000").rstrip("/")
    rows = read_leads()
    updated: list[dict] = []
    minted = 0

    from personalize import _template_email
    from urllib.parse import quote

    for row in rows:
        out = dict(row)
        if out.get("Status", "").lower() not in {"ready", "interested", "sent_1", "clicked"}:
            updated.append(out)
            continue

        token = sign_interest_payload(
            company=out.get("Company") or "",
            contact_name=out.get("Contact Name") or "",
            email=out.get("Email") or "",
            open_role=out.get("Open Role Found") or "",
            secret=secret,
        )
        link = f"{app_url}/r/{quote(token, safe='')}"
        out["Interest Link"] = link
        # Fresh founder copy every mint, with the per-lead link embedded inline
        msg = _template_email(out, link=link)
        out["Follow-up Message"] = msg
        out["Personalized Message"] = msg
        minted += 1
        updated.append(out)

    upsert_leads(updated)
    print(f"Minted interest links for {minted} leads → {LEADS_LOG}")
    print(f"App URL base: {app_url}")
    return updated


def main() -> None:
    mint_ready_leads()


if __name__ == "__main__":
    main()
