"""
Pull recent interest click/visit/signup events and mark CRM rows.

Sets:
  Clicked At
  Status=interested (company side) or audience_talent (candidate path)
  Audience=candidate|company_side|unknown
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin

import requests

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from config import APP_URL, OUTBOUND_LINK_SECRET  # noqa: E402
from lead_store import read_leads, upsert_leads  # noqa: E402
from mint_interest_links import follow_up_message  # noqa: E402


def audience_from_event(ev: dict) -> str:
    meta = ev.get("meta") or {}
    if isinstance(meta, str):
        meta = {}
    audience = (meta.get("audience") or "").strip()
    if audience in {"candidate", "company_side", "unknown"}:
        return audience
    user_type = (meta.get("user_type") or "").strip()
    if user_type == "talent":
        return "candidate"
    if user_type == "company":
        return "company_side"
    if ev.get("event_type") in {"click", "visit", "followup_sent"}:
        return "unknown"
    return "unknown"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--api", default=APP_URL or "http://localhost:3000")
    args = parser.parse_args()

    secret = OUTBOUND_LINK_SECRET or os.getenv("CRON_SECRET") or ""
    if not secret:
        raise SystemExit("Missing OUTBOUND_LINK_SECRET / CRON_SECRET")

    url = urljoin(args.api.rstrip("/") + "/", "api/outbound/interest")
    resp = requests.get(url, headers={"Authorization": f"Bearer {secret}"}, timeout=30)
    if resp.status_code != 200:
        raise SystemExit(f"API error {resp.status_code}: {resp.text[:300]}")

    payload = resp.json()
    if payload.get("skipped"):
        print("No Supabase service role on server — events not stored yet.")
        return

    events = payload.get("events") or []
    print(f"Fetched {len(events)} events")

    latest: dict[str, dict] = {}
    for ev in events:
        if ev.get("event_type") not in {"click", "visit", "signup", "followup_sent"}:
            continue
        key = (ev.get("contact_email") or "").strip().lower()
        if not key:
            key = f"{(ev.get('company') or '').strip().lower()}|{(ev.get('contact_name') or '').strip().lower()}"
        if not key or key == "|":
            continue
        prev = latest.get(key)
        # Prefer signup events when present (they carry audience)
        if not prev:
            latest[key] = ev
            continue
        if ev.get("event_type") == "signup" and prev.get("event_type") != "signup":
            latest[key] = ev
            continue
        if str(ev.get("created_at")) > str(prev.get("created_at")) and not (
            prev.get("event_type") == "signup" and ev.get("event_type") != "signup"
        ):
            latest[key] = ev

    rows = read_leads()
    updated = []
    marked = 0
    for row in rows:
        out = dict(row)
        email = (out.get("Email") or "").strip().lower()
        company_key = f"{(out.get('Company') or '').strip().lower()}|{(out.get('Contact Name') or '').strip().lower()}"
        hit = latest.get(email) or latest.get(company_key)
        if hit:
            out["Clicked At"] = str(hit.get("created_at") or datetime.now(timezone.utc).isoformat())
            audience = audience_from_event(hit)
            out["Audience"] = audience
            if audience == "candidate":
                out["Status"] = "audience_talent"
                # Candidates are not the B2B ICP — keep founder copy only as archived note
                if not (out.get("Follow-up Message") or "").strip():
                    out["Follow-up Message"] = follow_up_message(out)
            else:
                if out.get("Status") in {"ready", "sent_1", "new", "enriched", ""}:
                    out["Status"] = "interested"
                if not (out.get("Follow-up Message") or "").strip():
                    out["Follow-up Message"] = follow_up_message(out)
            marked += 1
        updated.append(out)

    upsert_leads(updated)
    print(f"Marked rows from interest events: {marked}")


if __name__ == "__main__":
    main()
