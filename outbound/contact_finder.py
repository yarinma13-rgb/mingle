"""
Autonomous enrichment from PUBLIC pages only.

- Clean junk job-board domains
- Extract company headcount signals (≤200 ICP gate)
- Extract likely Founder/CEO/HR names from About/Team pages

Not included: LinkedIn login scraping.
"""

from __future__ import annotations

import re
import time
from typing import Any
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

from config import FOUNDER_PERSONA_KEYWORDS, HR_PERSONA_KEYWORDS, MAX_EMPLOYEES
from lead_store import read_leads, upsert_leads
from scorer import parse_employee_count

SESSION = requests.Session()
SESSION.headers.update(
    {
        "User-Agent": "mingle-outbound-research/1.0 (+https://mingle.careers)",
        "Accept": "text/html,application/xhtml+xml",
    }
)

JOB_BOARD_DOMAINS = {
    "remotive.com",
    "remotive.io",
    "arbeitnow.com",
    "linkedin.com",
    "indeed.com",
    "glassdoor.com",
    "lever.co",
    "greenhouse.io",
    "myworkdayjobs.com",
    "jobs.ashbyhq.com",
    "boards.greenhouse.io",
}

TEAM_PATHS = (
    "/",
    "/about",
    "/about-us",
    "/team",
    "/teams",
    "/people",
    "/company",
    "/leadership",
    "/our-team",
    "/founders",
    "/careers",
)

SIZE_PATTERNS = [
    re.compile(r"\b(\d{1,4})\s*[-–—]\s*(\d{1,4})\s*(?:employees|employee|people|person\b|team members|עובדים)", re.I),
    re.compile(r"\b(?:team of|over|more than|nearly|about|around|approx\.?|~)?\s*(\d{1,4})\+?\s*(?:employees|employee|people|person\b|team members|עובדים)", re.I),
    re.compile(r"\b(\d{1,4})\s*(?:person|people)\s+company\b", re.I),
    re.compile(r"\bheadcount\s*(?:of|:)?\s*(\d{1,4})\b", re.I),
    re.compile(r"\b(\d{1,4})\s*עובדים\b"),
]


def domain_from_url(url: str) -> str:
    if not url:
        return ""
    try:
        host = urlparse(url).netloc.lower()
        if host.startswith("www."):
            host = host[4:]
        return host
    except Exception:
        return ""


def is_junk_domain(domain: str) -> bool:
    d = (domain or "").lower().strip()
    if not d:
        return True
    if d in JOB_BOARD_DOMAINS:
        return True
    return any(d.endswith("." + b) or d == b for b in JOB_BOARD_DOMAINS)


def guess_domain_from_company(company: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "", (company or "").lower())
    if len(slug) < 3:
        return ""
    return f"{slug}.com"


def clean_lead_domain(lead: dict[str, Any]) -> str:
    domain = (lead.get("Domain") or "").strip().lower()
    if domain and not is_junk_domain(domain):
        return domain
    blob = " ".join([str(lead.get("Reasoning") or ""), str(lead.get("Notes") or "")])
    for match in re.findall(r"https?://[^\s\"']+", blob):
        d = domain_from_url(match)
        if d and not is_junk_domain(d):
            return d
    return ""


def extract_headcount_from_text(text: str) -> tuple[int | None, str]:
    """
    Returns (upper_bound_or_count, raw_match).
    Prefer explicit ranges' high end.
    """
    if not text:
        return None, ""
    # Normalize whitespace
    blob = re.sub(r"\s+", " ", text)[:80000]

    best: int | None = None
    raw = ""
    for pat in SIZE_PATTERNS:
        for m in pat.finditer(blob):
            nums = [int(x) for x in m.groups() if x and str(x).isdigit()]
            if not nums:
                continue
            val = max(nums)
            # Ignore tiny false positives like "2 people loved this" via context later;
            # keep plausible startup/company sizes.
            if val < 2 or val > 100000:
                continue
            # Prefer the first credible company-size-like mention; keep smallest credible
            # upper bound when multiple appear (often "10-50" vs marketing "millions").
            if best is None or val < best:
                best = val
                raw = m.group(0)
    return best, raw


def _title_kind(text: str) -> str:
    t = text.lower()
    if any(k in t for k in HR_PERSONA_KEYWORDS):
        return "hr"
    if any(k in t for k in FOUNDER_PERSONA_KEYWORDS):
        return "founder"
    return ""


def _extract_people_from_html(html: str, base_url: str) -> list[dict[str, str]]:
    soup = BeautifulSoup(html, "lxml")
    people: list[dict[str, str]] = []
    seen: set[str] = set()

    candidates = []
    for tag in soup.find_all(["h1", "h2", "h3", "h4", "p", "span", "li", "div"]):
        text = " ".join(tag.get_text(" ", strip=True).split())
        if not text or len(text) > 120:
            continue
        kind = _title_kind(text)
        if not kind:
            continue
        candidates.append((tag, text, kind))

    for tag, text, kind in candidates[:40]:
        name = ""
        for near in [
            tag.find_previous(["h1", "h2", "h3", "h4", "strong", "b"]),
            tag.parent.find(["h1", "h2", "h3", "h4", "strong", "b"]) if tag.parent else None,
        ]:
            if not near:
                continue
            maybe = " ".join(near.get_text(" ", strip=True).split())
            if not maybe or len(maybe) > 60:
                continue
            if _title_kind(maybe):
                continue
            if 1 <= len(maybe.split()) <= 4 and re.search(r"[A-Za-z\u0590-\u05FF]", maybe):
                name = maybe
                break

        if not name:
            m = re.match(
                r"^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\s*[,|\-|–|—|:]\s*(.+)$",
                text,
            )
            if m and _title_kind(m.group(2)):
                name = m.group(1)
                text = m.group(2)
                kind = _title_kind(text)

        if not name:
            continue
        key = name.lower()
        if key in seen:
            continue
        seen.add(key)
        people.append(
            {
                "Contact Name": name,
                "Contact Title": text,
                "Has HR Function": "yes" if kind == "hr" else "no",
                "Source Detail": base_url,
            }
        )
    return people


def fetch_public_company_signals(domain: str, timeout: int = 12) -> dict[str, Any]:
    """Fetch public pages once → people + headcount."""
    if not domain or is_junk_domain(domain):
        return {"people": [], "headcount": None, "size_raw": "", "size_source": ""}

    people: list[dict[str, str]] = []
    headcount: int | None = None
    size_raw = ""
    size_source = ""

    for path in TEAM_PATHS:
        url = f"https://{domain}{path}"
        try:
            resp = SESSION.get(url, timeout=timeout, allow_redirects=True)
            if resp.status_code >= 400:
                continue
            ctype = (resp.headers.get("content-type") or "").lower()
            if "html" not in ctype and path != "/":
                continue
            html = resp.text
            if headcount is None:
                hc, raw = extract_headcount_from_text(html)
                if hc is not None:
                    headcount, size_raw, size_source = hc, raw, url
            for person in _extract_people_from_html(html, url):
                people.append(person)
            if people and headcount is not None:
                break
            if people and any(p.get("Has HR Function") == "yes" for p in people):
                # keep scanning a bit for size if missing
                if headcount is not None:
                    break
        except Exception:
            continue
        time.sleep(0.35)

    return {
        "people": people,
        "headcount": headcount,
        "size_raw": size_raw,
        "size_source": size_source,
    }


def pick_best_contact(people: list[dict[str, str]]) -> dict[str, str] | None:
    if not people:
        return None
    hr = [p for p in people if p.get("Has HR Function") == "yes"]
    if hr:
        return hr[0]
    founders = [p for p in people if _title_kind(p.get("Contact Title", "")) == "founder"]
    if founders:
        chosen = founders[0]
        chosen["Has HR Function"] = "no"
        return chosen
    return None


def size_bucket_label(headcount: int) -> str:
    if headcount <= 10:
        return "1-10"
    if headcount <= 50:
        return "11-50"
    if headcount <= 200:
        return "51-200"
    if headcount <= 500:
        return "201-500"
    if headcount <= 1000:
        return "501-1000"
    return f"{headcount}+"


def enrich_leads_with_public_contacts(leads: list[dict[str, Any]] | None = None) -> list[dict[str, str]]:
    rows = leads if leads is not None else read_leads()
    updated: list[dict[str, str]] = []

    for lead in rows:
        out = dict(lead)
        domain = clean_lead_domain(out)
        if not domain:
            domain = guess_domain_from_company(out.get("Company") or "")
        if domain and not is_junk_domain(domain):
            out["Domain"] = domain

        already_has_persona = bool((out.get("Contact Title") or "").strip() and (out.get("Contact Name") or "").strip())
        already_has_size = parse_employee_count(str(out.get("Company Size") or "")) is not None

        # Skip network fetch only when both persona + size already known
        if already_has_persona and already_has_size:
            updated.append(out)
            continue

        signals = (
            fetch_public_company_signals(domain)
            if domain and not is_junk_domain(domain)
            else {"people": [], "headcount": None, "size_raw": "", "size_source": ""}
        )

        # --- size ---
        if not already_has_size and signals.get("headcount") is not None:
            hc = int(signals["headcount"])
            out["Company Size"] = size_bucket_label(hc)
            prev = out.get("Reasoning") or ""
            out["Reasoning"] = (
                f"{prev} | size_public:{hc} from '{signals.get('size_raw','')}' @ {signals.get('size_source','')}"
            ).strip(" |")
            if hc > MAX_EMPLOYEES:
                out["Status"] = "dropped"
                out["Reasoning"] = (
                    f"{out['Reasoning']} | dropped: headcount {hc} > {MAX_EMPLOYEES}"
                ).strip(" |")
                updated.append(out)
                continue

        # --- persona ---
        if not already_has_persona:
            best = pick_best_contact(signals.get("people") or [])
            if best:
                out["Contact Name"] = best["Contact Name"]
                out["Contact Title"] = best["Contact Title"]
                out["Has HR Function"] = best["Has HR Function"]
                prev = out.get("Reasoning") or ""
                out["Reasoning"] = f"{prev} | public_team:{best.get('Source Detail','')}".strip(" |")
                if out.get("Status") in {"dropped", "new", "needs_contact", ""}:
                    out["Status"] = "enriched"
            else:
                if out.get("Status") in {"new", "dropped", ""}:
                    out["Status"] = "needs_contact"
                prev = out.get("Reasoning") or ""
                if "needs_contact" not in prev:
                    out["Reasoning"] = f"{prev} | needs_contact:no public founder/HR found".strip(" |")

        # size still unknown → mark for follow-up (don't pretend ≤200)
        if parse_employee_count(str(out.get("Company Size") or "")) is None:
            prev = out.get("Reasoning") or ""
            if "needs_size" not in prev:
                out["Reasoning"] = f"{prev} | needs_size:confirm ≤{MAX_EMPLOYEES}".strip(" |")
            if out.get("Status") in {"new", ""}:
                out["Status"] = "needs_contact"

        updated.append(out)

    upsert_leads(updated)
    return updated


def main() -> None:
    rows = enrich_leads_with_public_contacts()
    with_persona = sum(1 for r in rows if (r.get("Contact Title") or "").strip())
    with_size = sum(1 for r in rows if parse_employee_count(str(r.get("Company Size") or "")) is not None)
    over = sum(
        1
        for r in rows
        if (parse_employee_count(str(r.get("Company Size") or "")) or 0) > MAX_EMPLOYEES
    )
    needs = sum(1 for r in rows if r.get("Status") == "needs_contact")
    print(
        f"Enrichment done: persona={with_persona}/{len(rows)} size={with_size}/{len(rows)} "
        f"over_{MAX_EMPLOYEES}={over} needs_contact={needs}"
    )


if __name__ == "__main__":
    main()
