"""
End-to-end orchestrator for mingle.careers outbound (100% free-tier friendly).

Recommended daily loop:
  1. Acquire hiring signals                 → scraper.py
  2. Find public Founder/HR contacts       → contact_finder.py
  3. Find/verify emails (free caps)        → email_finder.py
  4. ICP gate (drop score < 85)            → scorer.py
  5. Write personalized copy               → personalize.py
  6. Sync CRM / export YAMM CSV            → crm_sync.py

Usage:
  python run_pipeline.py              # full demo-friendly run
  python run_pipeline.py --live-apis  # respect .env keys (disables DEMO_MODE for this process)
  python run_pipeline.py --skip-scrape --sample
"""

from __future__ import annotations

import argparse
import csv
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import config  # noqa: E402
from contact_finder import enrich_leads_with_public_contacts  # noqa: E402
from crm_sync import export_yamm_csv, sync_to_google_sheets  # noqa: E402
from email_finder import enrich_many  # noqa: E402
from lead_store import ensure_log, read_leads, upsert_leads  # noqa: E402
from personalize import personalize_many  # noqa: E402
from scraper import acquire_leads  # noqa: E402
from scorer import score_and_gate  # noqa: E402


def load_sample_leads() -> list[dict]:
    path = config.SAMPLE_LEADS
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    from lead_store import empty_lead

    return [empty_lead(row) for row in rows]


def merge_known_sample_contacts(rows: list[dict]) -> list[dict]:
    """If a scraped company matches a sample row, copy the known persona onto it."""
    samples = {r.get("Company", "").strip().lower(): r for r in load_sample_leads()}
    out = []
    for row in rows:
        key = (row.get("Company") or "").strip().lower()
        hit = samples.get(key)
        if hit and not (row.get("Contact Title") or "").strip():
            merged = dict(row)
            for field in (
                "Contact Name",
                "Contact Title",
                "LinkedIn URL",
                "Has HR Function",
                "Company Size",
                "Domain",
                "Email",
            ):
                if hit.get(field):
                    merged[field] = hit[field]
            if merged.get("Status") in {"new", "dropped", "needs_contact", ""}:
                merged["Status"] = "enriched"
            out.append(merged)
        else:
            out.append(row)
    return out


def run(args: argparse.Namespace) -> None:
    if args.live_apis:
        os.environ["DEMO_MODE"] = "false"
        config.DEMO_MODE = False

    ensure_log()
    print("=== mingle.careers outbound pipeline ===")
    print(f"DEMO_MODE={config.DEMO_MODE} | ICP_MIN_SCORE={config.ICP_MIN_SCORE}")

    # --- Phase 1: acquire ---
    if args.sample:
        print("\n[1/6] Loading sample leads (offline)…")
        acquired = load_sample_leads()
        upsert_leads(acquired)
    elif not args.skip_scrape:
        print("\n[1/6] Acquiring hiring-signal leads (free APIs + seed)…")
        acquired = acquire_leads(limit_per_source=args.limit)
        # Always keep high-quality sample personas in the CRM for immediate send practice
        acquired = acquired + load_sample_leads()
        upsert_leads(acquired)
        print(f"  + {len(acquired)} raw leads (includes sample personas)")
    else:
        print("\n[1/6] Skipping scrape — using existing leads_log.csv")

    all_rows = merge_known_sample_contacts(read_leads())
    upsert_leads(all_rows)

    # --- Phase 1b: public contacts ---
    if not args.skip_contacts:
        print("\n[2/6] Public contact enrichment (About/Team pages)…")
        enriched_contacts = enrich_leads_with_public_contacts(read_leads())
        with_persona = sum(1 for r in enriched_contacts if (r.get("Contact Title") or "").strip())
        print(f"  personas found: {with_persona}/{len(enriched_contacts)}")
    else:
        print("\n[2/6] Skipping public contact enrichment")

    all_rows = read_leads()

    # --- Phase 1c: email ---
    if not args.skip_email:
        print("\n[3/6] Email enrichment (Hunter free credits / demo placeholders)…")
        need = [
            r
            for r in all_rows
            if r.get("Status", "").lower() in {"new", "enriched", "needs_contact"}
            or not (r.get("Email") or "").strip()
        ]
        # Prefer rows that already have a persona
        need = [r for r in need if (r.get("Contact Title") or "").strip()]
        enriched = enrich_many(need) if need else []
        if enriched:
            upsert_leads(enriched)
            print(f"  enriched {len(enriched)}")
        all_rows = read_leads()
    else:
        print("\n[3/6] Skipping email enrichment")

    # --- Phase 2: score ---
    print("\n[4/6] ICP scoring & gating…")
    candidates = [
        r
        for r in all_rows
        if r.get("Status", "").lower() in {"new", "enriched", "needs_contact", "scored", "ready"}
    ]
    approved, dropped = score_and_gate(candidates, min_score=args.min_score)
    # Keep unresolved contacts visible instead of burying them only as dropped
    needs = []
    still_dropped = []
    for row in dropped:
        if not (row.get("Contact Title") or "").strip():
            row = dict(row)
            row["Status"] = "needs_contact"
            needs.append(row)
        else:
            still_dropped.append(row)
    upsert_leads(approved + still_dropped + needs)
    print(f"  approved={len(approved)} dropped={len(still_dropped)} needs_contact={len(needs)}")

    # --- Phase 3: personalize ---
    print("\n[5/6] Personalizing approved leads…")
    ready = personalize_many(approved)
    upsert_leads(ready)
    print(f"  ready messages={len(ready)}")

    # --- Phase 4: CRM ---
    print("\n[6/6] CRM export…")
    yamm = export_yamm_csv()
    print(f"  YAMM CSV → {yamm}")

    if args.sheets:
        try:
            msg = sync_to_google_sheets(
                [r for r in read_leads() if r.get("Status") == "ready"],
                worksheet_title="Outbound",
            )
            print(f"  {msg}")
        except Exception as exc:
            print(f"  Sheets sync not configured yet: {exc}")

    final = read_leads()
    counts: dict[str, int] = {}
    for r in final:
        st = r.get("Status") or "unknown"
        counts[st] = counts.get(st, 0) + 1
    print("\n=== DONE ===")
    print(f"leads_log.csv status counts: {counts}")
    print("Ready rows → send via YAMM / LinkedIn Note.")
    print("needs_contact → public pages didn't find HR/Founder; use Phantombuster or manual LinkedIn.")


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="mingle.careers free outbound pipeline")
    p.add_argument("--limit", type=int, default=25, help="Max jobs per free API source")
    p.add_argument("--min-score", type=int, default=config.ICP_MIN_SCORE)
    p.add_argument("--skip-scrape", action="store_true")
    p.add_argument("--skip-email", action="store_true")
    p.add_argument("--skip-contacts", action="store_true")
    p.add_argument("--sample", action="store_true", help="Use data/sample_leads.csv instead of live scrape")
    p.add_argument("--sheets", action="store_true", help="Also push ready leads to Google Sheets")
    p.add_argument("--live-apis", action="store_true", help="Use real OpenAI/Hunter keys from .env")
    return p


if __name__ == "__main__":
    run(build_parser().parse_args())
