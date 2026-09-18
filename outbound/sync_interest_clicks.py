"""
Pull recent interest click/visit events from the mingle API and mark CRM rows.

Usage:
  python sync_interest_clicks.py
  python sync_interest_clicks.py --api https://mingle-omega.vercel.app

Auth: Authorization Bearer $OUTBOUND_LINK_SECRET (or CRON_SECRET)
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
        print("Deploy migration 0033 + SUPABASE_SERVICE_ROLE_KEY to enable click logs.")
        return

    events = payload.get("events") or []
    print(f"Fetched {len(events)} events")

    # Map latest click by email or company+name
    latest: dict[str, dict] = {}
    for ev in events:
        if ev.get("event_type") not in {"click", "visit", "signup"}:
            continue
        key = (ev.get("contact_email") or "").strip().lower()
        if not key:
            key = f"{(ev.get('company') or '').strip().lower()}|{(ev.get('contact_name') or '').strip().lower()}"
        if not key or key == "|":
            continue
        prev = latest.get(key)
        if not prev or str(ev.get("created_at")) > str(prev.get("created_at")):
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
            if out.get("Status") in {"ready", "sent_1", "new", "enriched", ""}:
                out["Status"] = "interested"
            if not (out.get("Follow-up Message") or "").strip():
                out["Follow-up Message"] = follow_up_message(out)
            marked += 1
        updated.append(out)

    upsert_leads(updated)
    print(f"Marked interested: {marked}")


if __name__ == "__main__":
    main()
