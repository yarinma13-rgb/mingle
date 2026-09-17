"""
Phase 1 — Free trigger-signal acquisition.

Strategy (stable + free, no paid DBs):
1) Remotive public API — remote tech jobs (no key)
2) Arbeitnow public API — EU/tech jobs (no key)
3) Local seed_companies.csv — curated ICP list you maintain for free
4) Optional HTML scrape of public job pages (polite, rate-limited)

Hiring = the primary trigger for mingle.careers outbound.

LinkedIn people extraction is intentionally NOT automated here (ToS + ban risk).
See docs/PHANTOMBUSTER_PLAYBOOK.md for free-minute contact URL extraction.
"""

from __future__ import annotations

import csv
import time
from typing import Any
from urllib.parse import urlparse

import requests

from config import SEED_COMPANIES, TRIGGER_ROLES
from lead_store import empty_lead, upsert_leads

SESSION = requests.Session()
SESSION.headers.update(
    {
        "User-Agent": "mingle-outbound-research/1.0 (+https://mingle.careers; research)",
        "Accept": "application/json,text/html",
    }
)

JUNK_DOMAINS = {
    "remotive.com",
    "remotive.io",
    "arbeitnow.com",
    "linkedin.com",
    "indeed.com",
    "glassdoor.com",
}


def _domain_from_url(url: str) -> str:
    if not url:
        return ""
    try:
        host = urlparse(url).netloc.lower()
        host = host[4:] if host.startswith("www.") else host
        if host in JUNK_DOMAINS or any(host.endswith("." + j) for j in JUNK_DOMAINS):
            return ""
        return host
    except Exception:
        return ""


def _best_company_domain(job: dict) -> str:
    for key in ("company_website", "company_url", "website", "url"):
        domain = _domain_from_url(job.get(key) or "")
        if domain:
            return domain
    return ""


def _role_is_trigger(title: str) -> bool:
    t = title.lower()
    if any(role.lower() in t for role in TRIGGER_ROLES):
        return True
    return any(
        kw in t
        for kw in (
            "engineer",
            "designer",
            "product manager",
            "engineering manager",
            "fullstack",
            "full-stack",
            "frontend",
            "backend",
        )
    )


def fetch_remotive(limit: int = 40) -> list[dict[str, str]]:
    """https://remotive.com/api/remote-jobs — free, no auth."""
    url = "https://remotive.com/api/remote-jobs"
    try:
        resp = SESSION.get(url, timeout=30)
        resp.raise_for_status()
        jobs = resp.json().get("jobs", [])
    except Exception as exc:
        print(f"[remotive] skip: {exc}")
        return []

    leads: list[dict[str, str]] = []
    for job in jobs:
        title = job.get("title") or ""
        if not _role_is_trigger(title):
            continue
        company = (job.get("company_name") or "").strip()
        if not company:
            continue
        site = _best_company_domain(job)
        leads.append(
            empty_lead(
                {
                    "Company": company,
                    "Open Role Found": title,
                    "Domain": site,
                    "Company Size": "",
                    "Source": "remotive",
                    "Status": "new",
                    "LinkedIn URL": "",
                }
            )
        )
        if len(leads) >= limit:
            break
    return leads


def fetch_arbeitnow(limit: int = 40) -> list[dict[str, str]]:
    """https://www.arbeitnow.com/api/job-board-api — free, no auth."""
    url = "https://www.arbeitnow.com/api/job-board-api"
    try:
        resp = SESSION.get(url, timeout=30)
        resp.raise_for_status()
        jobs = resp.json().get("data", [])
    except Exception as exc:
        print(f"[arbeitnow] skip: {exc}")
        return []

    leads: list[dict[str, str]] = []
    for job in jobs:
        title = job.get("title") or ""
        if not _role_is_trigger(title):
            continue
        company = (job.get("company_name") or "").strip()
        if not company:
            continue
        site = _best_company_domain(job)
        tags = " ".join(job.get("tags") or [])
        leads.append(
            empty_lead(
                {
                    "Company": company,
                    "Open Role Found": title,
                    "Domain": site,
                    "Company Size": "",
                    "Source": "arbeitnow",
                    "Status": "new",
                    "Reasoning": tags[:120],
                }
            )
        )
        if len(leads) >= limit:
            break
    return leads


def load_seed_companies() -> list[dict[str, str]]:
    """
    Free directory alternative: maintain seed_companies.csv yourself
    (from public startup lists, YC directories, agency directories, etc.).
    Columns: company,domain,employee_count,notes,open_role
    """
    if not SEED_COMPANIES.exists():
        return []

    leads: list[dict[str, str]] = []
    with SEED_COMPANIES.open(newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            company = (row.get("company") or "").strip()
            if not company:
                continue
            leads.append(
                empty_lead(
                    {
                        "Company": company,
                        "Domain": (row.get("domain") or "").strip(),
                        "Company Size": (row.get("employee_count") or "").strip(),
                        "Open Role Found": (row.get("open_role") or "Engineering / Product hire").strip(),
                        "Source": "seed_directory",
                        "Status": "new",
                        "Reasoning": (row.get("notes") or "").strip(),
                    }
                )
            )
    return leads


def scrape_public_jobs_html(url: str, company_hint: str = "") -> list[dict[str, str]]:
    """
    Optional polite HTML scrape for a PUBLIC careers page you already know.
    Not for LinkedIn/Indeed login walls — those break ToS and scrapers.
    """
    try:
        from bs4 import BeautifulSoup
    except ImportError:
        print("BeautifulSoup missing — pip install -r requirements.txt")
        return []

    try:
        resp = SESSION.get(url, timeout=30)
        resp.raise_for_status()
    except Exception as exc:
        print(f"[html] {url} skip: {exc}")
        return []

    soup = BeautifulSoup(resp.text, "lxml")
    text_nodes = [a.get_text(" ", strip=True) for a in soup.find_all("a")]
    leads: list[dict[str, str]] = []
    seen: set[str] = set()
    for text in text_nodes:
        if not text or len(text) > 120:
            continue
        if not _role_is_trigger(text):
            continue
        key = text.lower()
        if key in seen:
            continue
        seen.add(key)
        leads.append(
            empty_lead(
                {
                    "Company": company_hint or _domain_from_url(url),
                    "Open Role Found": text,
                    "Domain": _domain_from_url(url),
                    "Source": "careers_html",
                    "Status": "new",
                }
            )
        )
    time.sleep(1.0)  # be polite
    return leads


def acquire_leads(limit_per_source: int = 30, include_seed: bool = True) -> list[dict[str, str]]:
    collected: list[dict[str, str]] = []
    collected.extend(fetch_remotive(limit_per_source))
    collected.extend(fetch_arbeitnow(limit_per_source))
    if include_seed:
        collected.extend(load_seed_companies())

    # Dedupe by company+role
    deduped: list[dict[str, str]] = []
    seen: set[tuple[str, str]] = set()
    for lead in collected:
        key = (lead["Company"].lower(), lead["Open Role Found"].lower())
        if key in seen:
            continue
        seen.add(key)
        deduped.append(lead)
    return deduped


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Acquire hiring-signal leads (free sources)")
    parser.add_argument("--limit", type=int, default=30)
    parser.add_argument("--no-seed", action="store_true")
    parser.add_argument("--careers-url", default="", help="Optional public careers page to parse")
    parser.add_argument("--company", default="", help="Company name for --careers-url")
    args = parser.parse_args()

    leads = acquire_leads(limit_per_source=args.limit, include_seed=not args.no_seed)
    if args.careers_url:
        leads.extend(scrape_public_jobs_html(args.careers_url, args.company))

    upsert_leads(leads)
    print(f"Acquired {len(leads)} leads → data/leads_log.csv")
    for row in leads[:8]:
        print(f"  • {row['Company']} | {row['Open Role Found']} | {row['Source']}")


if __name__ == "__main__":
    main()
