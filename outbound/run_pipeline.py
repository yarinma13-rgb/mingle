"""
End-to-end orchestrator for mingle.careers outbound (100% free-tier friendly).

Recommended daily loop:
  1. Acquire hiring signals          → scraper.py
  2. Find/verify emails (free caps)  → email_finder.py
  3. ICP gate (drop score < 85)      → scorer.py
  4. Write personalized copy         → personalize.py
  5. Sync CRM / export YAMM CSV      → crm_sync.py

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

# Ensure local imports work when run from repo root or outbound/
ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import config  # noqa: E402
from crm_sync import export_yamm_csv, sync_to_google_sheets  # noqa: E402
from email_finder import enrich_many  # noqa: E402
from lead_store import ensure_log, read_leads, upsert_leads, write_leads  # noqa: E402
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

    return [empty_lead(**row) for row in rows]


def run(args: argparse.Namespace) -> None:
    if args.live_apis:
        os.environ["DEMO_MODE"] = "false"
        config.DEMO_MODE = False

    ensure_log()
    print("=== mingle.careers outbound pipeline ===")
    print(f"DEMO_MODE={config.DEMO_MODE} | ICP_MIN_SCORE={config.ICP_MIN_SCORE}")

    # --- Phase 1: acquire ---
    if args.sample:
        print("\n[1/5] Loading sample leads (offline)…")
        acquired = load_sample_leads()
        upsert_leads(acquired)
    elif not args.skip_scrape:
        print("\n[1/5] Acquiring hiring-signal leads (free APIs + seed)…")
        acquired = acquire_leads(limit_per_source=args.limit)
        upsert_leads(acquired)
        print(f"  + {len(acquired)} raw leads")
    else:
        print("\n[1/5] Skipping scrape — using existing leads_log.csv")

    all_rows = read_leads()

    # --- Phase 1b: email ---
    if not args.skip_email:
        print("\n[2/5] Email enrichment (Hunter free credits / demo placeholders)…")
        need = [r for r in all_rows if r.get("Status") in {"new", ""} or not r.get("Email")]
        # Don't re-enrich dropped forever; focus on new
        need = [r for r in all_rows if r.get("Status", "").lower() in {"new", "enriched"}]
        if not need:
            need = [r for r in all_rows if not (r.get("Email") or "").strip()]
        enriched = enrich_many(need) if need else []
        if enriched:
            upsert_leads(enriched)
            print(f"  enriched {len(enriched)}")
        all_rows = read_leads()
    else:
        print("\n[2/5] Skipping email enrichment")

    # --- Phase 2: score ---
    print("\n[3/5] ICP scoring & gating…")
    candidates = [
        r
        for r in all_rows
        if r.get("Status", "").lower() in {"new", "enriched", "scored"}
        or (not r.get("AI Match Score") and r.get("Status", "").lower() != "dropped")
    ]
    # Re-score only unscored / enriched / new
    candidates = [
        r
        for r in all_rows
        if r.get("Status", "").lower() in {"new", "enriched"}
    ]
    if not candidates:
        # First run after sample might already be new; if empty try all without score
        candidates = [r for r in all_rows if not (r.get("AI Match Score") or "").strip()]

    approved, dropped = score_and_gate(candidates, min_score=args.min_score)
    upsert_leads(approved + dropped)
    print(f"  approved={len(approved)} dropped={len(dropped)}")

    # --- Phase 3: personalize ---
    print("\n[4/5] Personalizing approved leads…")
    ready = personalize_many(approved)
    upsert_leads(ready)
    print(f"  ready messages={len(ready)}")

    # --- Phase 4: CRM ---
    print("\n[5/5] CRM export…")
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

    # Summary
    final = read_leads()
    counts: dict[str, int] = {}
    for r in final:
        st = r.get("Status") or "unknown"
        counts[st] = counts.get(st, 0) + 1
    print("\n=== DONE ===")
    print(f"leads_log.csv status counts: {counts}")
    print("Next: open data/yamm_ready.csv OR sync Sheets, then send ≤50/day via YAMM/Mail Meteor.")
    print("LinkedIn: use Open Profile / LinkedIn URL — manual paste only (safe mode).")


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="mingle.careers free outbound pipeline")
    p.add_argument("--limit", type=int, default=25, help="Max jobs per free API source")
    p.add_argument("--min-score", type=int, default=config.ICP_MIN_SCORE)
    p.add_argument("--skip-scrape", action="store_true")
    p.add_argument("--skip-email", action="store_true")
    p.add_argument("--sample", action="store_true", help="Use data/sample_leads.csv instead of live scrape")
    p.add_argument("--sheets", action="store_true", help="Also push ready leads to Google Sheets")
    p.add_argument("--live-apis", action="store_true", help="Use real OpenAI/Hunter keys from .env")
    return p


if __name__ == "__main__":
    run(build_parser().parse_args())
