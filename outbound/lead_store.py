"""
Local lead store — single source of truth before Google Sheets sync.
Tracks everything in data/leads_log.csv.
"""

from __future__ import annotations

import csv
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from config import CRM_COLUMNS, LEADS_LOG


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")


def ensure_log(path: Path | None = None) -> Path:
    target = path or LEADS_LOG
    target.parent.mkdir(parents=True, exist_ok=True)
    if not target.exists():
        with target.open("w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=CRM_COLUMNS)
            writer.writeheader()
    return target


def empty_lead(overrides: dict[str, Any] | None = None, **kwargs: Any) -> dict[str, str]:
    """Build a CRM row. Prefer dict keys for columns with spaces, e.g. {'Open Role Found': '...'}."""
    row = {col: "" for col in CRM_COLUMNS}
    row["Status"] = "new"
    row["Updated At"] = _now()
    merged: dict[str, Any] = {}
    if overrides:
        merged.update(overrides)
    merged.update(kwargs)
    for key, value in merged.items():
        if key in row:
            row[key] = "" if value is None else str(value)
    return row


def read_leads(path: Path | None = None) -> list[dict[str, str]]:
    target = ensure_log(path)
    with target.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write_leads(rows: list[dict[str, str]], path: Path | None = None) -> Path:
    target = ensure_log(path)
    normalized: list[dict[str, str]] = []
    for row in rows:
        base = empty_lead()
        base.update({k: str(v) if v is not None else "" for k, v in row.items() if k in base})
        if not base.get("Updated At"):
            base["Updated At"] = _now()
        normalized.append(base)

    with target.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CRM_COLUMNS)
        writer.writeheader()
        writer.writerows(normalized)
    return target


def upsert_leads(new_rows: list[dict[str, str]], path: Path | None = None) -> list[dict[str, str]]:
    """Merge by Company + Open Role Found (email may appear later during enrichment)."""
    existing = read_leads(path)
    index: dict[tuple[str, str], int] = {}
    for i, row in enumerate(existing):
        key = (
            row.get("Company", "").strip().lower(),
            row.get("Open Role Found", "").strip().lower(),
        )
        index[key] = i

    for raw in new_rows:
        row = empty_lead(raw)
        row["Updated At"] = _now()
        key = (
            row["Company"].strip().lower(),
            row["Open Role Found"].strip().lower(),
        )
        if key in index:
            # Preserve richer fields if incoming row leaves them blank
            prev = existing[index[key]]
            merged = dict(prev)
            for k, v in row.items():
                if v != "" and v is not None:
                    merged[k] = v
            merged["Updated At"] = _now()
            existing[index[key]] = merged
        else:
            index[key] = len(existing)
            existing.append(row)

    write_leads(existing, path)
    return existing


def filter_by_status(rows: list[dict[str, str]], statuses: set[str]) -> list[dict[str, str]]:
    return [r for r in rows if r.get("Status", "").lower() in {s.lower() for s in statuses}]
