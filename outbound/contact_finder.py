"""
Autonomous contact enrichment from PUBLIC pages only.

What this can do alone:
- Guess/clean company domains from job payloads
- Fetch /about /team /people /company pages
- Extract likely Founder/CEO/HR names from public HTML

What this cannot do alone (needs you / Phantombuster):
- LinkedIn profile URL scraping behind login walls
"""

from __future__ import annotations

import re
import time
from typing import Any
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

from config import FOUNDER_PERSONA_KEYWORDS, HR_PERSONA_KEYWORDS
from lead_store import read_leads, upsert_leads

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
)


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
    """Weak fallback — only used when no real website is known."""
    slug = re.sub(r"[^a-z0-9]+", "", (company or "").lower())
    if len(slug) < 3:
        return ""
    return f"{slug}.com"


def clean_lead_domain(lead: dict[str, Any]) -> str:
    domain = (lead.get("Domain") or "").strip().lower()
    if domain and not is_junk_domain(domain):
        return domain
    # try Reasoning / notes for a URL
    blob = " ".join(
        [
            str(lead.get("Reasoning") or ""),
            str(lead.get("Notes") or ""),
            str(lead.get("LinkedIn URL") or ""),
        ]
    )
    for match in re.findall(r"https?://[^\s\"']+", blob):
        d = domain_from_url(match)
        if d and not is_junk_domain(d):
            return d
    return ""


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

    # Common patterns: heading/name + nearby title text
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
        # Try to find a nearby personal name: previous sibling / parent heading
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
            # crude person-name heuristic: 2-4 words, letters
            if 1 <= len(maybe.split()) <= 4 and re.search(r"[A-Za-z\u0590-\u05FF]", maybe):
                name = maybe
                break

        if not name:
            # "Jane Doe, CEO" pattern
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
                "Contact Title": text if kind else text,
                "Has HR Function": "yes" if kind == "hr" else "no",
                "Source Detail": base_url,
            }
        )
    return people


def fetch_public_contacts(domain: str, timeout: int = 12) -> list[dict[str, str]]:
    if not domain or is_junk_domain(domain):
        return []
    found: list[dict[str, str]] = []
    for path in TEAM_PATHS:
        url = f"https://{domain}{path}"
        try:
            resp = SESSION.get(url, timeout=timeout, allow_redirects=True)
            if resp.status_code >= 400:
                continue
            ctype = (resp.headers.get("content-type") or "").lower()
            if "html" not in ctype and path != "/":
                continue
            people = _extract_people_from_html(resp.text, url)
            for person in people:
                # Prefer HR over founder when both exist
                found.append(person)
            if found:
                # Stop early once we have at least one ICP persona
                if any(p.get("Has HR Function") == "yes" for p in found) or any(
                    _title_kind(p.get("Contact Title", "")) == "founder" for p in found
                ):
                    break
        except Exception:
            continue
        time.sleep(0.4)
    return found


def pick_best_contact(people: list[dict[str, str]]) -> dict[str, str] | None:
    if not people:
        return None
    hr = [p for p in people if p.get("Has HR Function") == "yes"]
    if hr:
        return hr[0]
    founders = [p for p in people if _title_kind(p.get("Contact Title", "")) == "founder"]
    if founders:
        # founder path only if no HR found on public pages
        chosen = founders[0]
        chosen["Has HR Function"] = "no"
        return chosen
    return None


def enrich_leads_with_public_contacts(leads: list[dict[str, Any]] | None = None) -> list[dict[str, str]]:
    rows = leads if leads is not None else read_leads()
    updated: list[dict[str, str]] = []
    for lead in rows:
        out = dict(lead)
        if (out.get("Contact Title") or "").strip() and (out.get("Contact Name") or "").strip():
            updated.append(out)
            continue

        domain = clean_lead_domain(out)
        if not domain:
            domain = guess_domain_from_company(out.get("Company") or "")
        if domain and not is_junk_domain(domain):
            out["Domain"] = domain

        people = fetch_public_contacts(domain) if domain and not is_junk_domain(domain) else []
        best = pick_best_contact(people)
        if best:
            out["Contact Name"] = best["Contact Name"]
            out["Contact Title"] = best["Contact Title"]
            out["Has HR Function"] = best["Has HR Function"]
            prev = out.get("Reasoning") or ""
            out["Reasoning"] = f"{prev} | public_team:{best.get('Source Detail','')}".strip(" |")
            if out.get("Status") in {"dropped", "new", ""}:
                out["Status"] = "enriched"
        else:
            # Mark explicitly that a human/Phantom step is still required for LinkedIn URL
            if out.get("Status") in {"new", "dropped", ""}:
                out["Status"] = "needs_contact"
            prev = out.get("Reasoning") or ""
            if "needs_contact" not in prev:
                out["Reasoning"] = f"{prev} | needs_contact:no public founder/HR found".strip(" |")
        updated.append(out)
    upsert_leads(updated)
    return updated


def main() -> None:
    rows = enrich_leads_with_public_contacts()
    with_persona = sum(1 for r in rows if (r.get("Contact Title") or "").strip())
    needs = sum(1 for r in rows if r.get("Status") == "needs_contact")
    print(f"Contact enrichment done: {with_persona}/{len(rows)} have persona; needs_contact={needs}")


if __name__ == "__main__":
    main()
