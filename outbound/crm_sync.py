"""
Phase 4 — Google Sheets local sync (free CRM) + safe click-to-send column.

Columns:
  Company | Contact Name | Email | LinkedIn URL | Open Role Found |
  AI Match Score | Personalized Message | Open Profile | Status | ...

Open Profile uses HYPERLINK so you manually open → copy → paste
(zero-cost, LinkedIn-safe; no paid automation).
"""

from __future__ import annotations

import csv
from pathlib import Path
from typing import Any

from config import (
    CRM_COLUMNS,
    GOOGLE_SERVICE_ACCOUNT_FILE,
    GOOGLE_SHEET_ID,
    LEADS_LOG,
)
from lead_store import ensure_log, read_leads


def _hyperlink_formula(linkedin_url: str, row_number: int) -> str:
    """
    Sheets formula for click-to-send. row_number is 1-indexed sheet row.
    Prefer LinkedIn URL in column D (LinkedIn URL). Fallback to explicit URL.
    """
    url = (linkedin_url or "").strip()
    if not url:
        return ""
    # Escape quotes for Sheets formulas
    safe = url.replace('"', '""')
    return f'=HYPERLINK("{safe}","Open Profile")'


def rows_for_sheets(leads: list[dict[str, str]]) -> list[list[str]]:
    body: list[list[str]] = []
    for i, lead in enumerate(leads, start=2):  # row 1 = header
        row = dict(lead)
        li = row.get("LinkedIn URL") or ""
        row["Open Profile"] = _hyperlink_formula(li, i) if li else row.get("Open Profile", "")
        body.append([row.get(col, "") for col in CRM_COLUMNS])
    return body


def sync_to_google_sheets(
    leads: list[dict[str, str]] | None = None,
    worksheet_title: str = "Outbound",
) -> str:
    """
    Pushes leads_log.csv → Google Sheet.
    Requires:
      1) Google Cloud service account JSON at GOOGLE_SERVICE_ACCOUNT_FILE
      2) Sheet shared with the service account email (Editor)
      3) GOOGLE_SHEET_ID env var
    """
    if not GOOGLE_SHEET_ID:
        raise RuntimeError("GOOGLE_SHEET_ID missing — set it in outbound/.env")

    sa_path = Path(GOOGLE_SERVICE_ACCOUNT_FILE)
    if not sa_path.exists():
        raise RuntimeError(
            f"Service account file not found: {sa_path}\n"
            "Create one in Google Cloud → share the Sheet with the client_email."
        )

    import gspread
    from google.oauth2.service_account import Credentials

    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
    ]
    creds = Credentials.from_service_account_file(str(sa_path), scopes=scopes)
    gc = gspread.authorize(creds)
    sh = gc.open_by_key(GOOGLE_SHEET_ID)

    try:
        ws = sh.worksheet(worksheet_title)
    except gspread.WorksheetNotFound:
        ws = sh.add_worksheet(title=worksheet_title, rows=2000, cols=len(CRM_COLUMNS))

    data = leads if leads is not None else read_leads()
    # Prefer ready / sent for CRM surface; still allow full dump via --all
    values = [CRM_COLUMNS] + rows_for_sheets(data)
    ws.clear()
    ws.update("A1", values, value_input_option="USER_ENTERED")
    return f"Synced {len(data)} rows → sheet '{worksheet_title}' ({GOOGLE_SHEET_ID})"


def export_yamm_csv(path: Path | None = None) -> Path:
    """
    Flat CSV for Yet Another Mail Merge / Mail Meteor.
    Only rows with Email + Personalized Message + Status=ready.
    """
    ensure_log()
    out = path or (LEADS_LOG.parent / "yamm_ready.csv")
    yamm_cols = [
        "Email",
        "Contact Name",
        "Contact Name HE",
        "Company",
        "Open Role Found",
        "Personalized Message",
        "Follow-up Message",
        "Interest Link",
        "LinkedIn Note",
        "LinkedIn URL",
        "Clicked At",
        "Status",
    ]
    ready = [
        r
        for r in read_leads()
        if r.get("Status", "").lower() == "ready"
        and (r.get("Email") or "").strip()
        and (r.get("Personalized Message") or "").strip()
    ]
    with out.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=yamm_cols)
        writer.writeheader()
        for row in ready:
            writer.writerow({c: row.get(c, "") for c in yamm_cols})
    return out


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Sync CRM to Google Sheets / export YAMM CSV")
    parser.add_argument("--sheets", action="store_true", help="Push to Google Sheets")
    parser.add_argument("--yamm", action="store_true", help="Export yamm_ready.csv")
    parser.add_argument("--worksheet", default="Outbound")
    parser.add_argument(
        "--ready-only",
        action="store_true",
        help="Only sync Status=ready rows to Sheets",
    )
    args = parser.parse_args()

    if not args.sheets and not args.yamm:
        args.yamm = True  # default safe local export

    leads = read_leads()
    if args.ready_only:
        leads = [r for r in leads if r.get("Status", "").lower() == "ready"]

    if args.yamm:
        path = export_yamm_csv()
        print(f"YAMM/Mail Meteor CSV → {path} ({sum(1 for _ in path.open()) - 1} rows)")

    if args.sheets:
        try:
            print(sync_to_google_sheets(leads, worksheet_title=args.worksheet))
        except Exception as exc:
            print(f"Sheets sync skipped/failed: {exc}")
            print("Local CSV is still the source of truth: data/leads_log.csv")


if __name__ == "__main__":
    main()
