"""
Hardcoded ICP + GTM parameters for mingle.careers outbound.
All scripts import from here — change strategy in ONE place.
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / ".env")

# ---------------------------------------------------------------------------
# Product
# ---------------------------------------------------------------------------
PRODUCT_NAME = "mingle.careers"
PRODUCT_ONE_LINER = (
    "AI-powered hiring that replaces CV filtering with DNA matching "
    "and clear Match Reports."
)
CORE_VALUE_PROP = (
    "Stop digging through CV piles. Paste a job description and see the few "
    "people worth talking to in 60 seconds with clear fit alignment and "
    "honest risk analysis."
)

# ---------------------------------------------------------------------------
# ICP — companies
# ---------------------------------------------------------------------------
# Soft ceiling: we sell into small/mid teams. HR persona is only valid ≤200.
MAX_EMPLOYEES = 200

TARGET_VERTICALS = [
    "Tech Startups (Seed to Series B, typically ≤200 employees)",
    "Fast-growing Digital/Product Agencies (≤200)",
    "Small/mid tech product companies currently hiring (≤200)",
    "Boutique recruiting agencies (≤200) buying tools for faster shortlists",
]

# Keywords used by scraper + scorer to flag ICP-ish companies
ICP_COMPANY_KEYWORDS = [
    "startup",
    "saas",
    "fintech",
    "healthtech",
    "ai",
    "machine learning",
    "product agency",
    "digital agency",
    "recruiting",
    "talent",
    "software",
    "platform",
    "marketplace",
]

# Hiring roles that are strong trigger signals for mingle
TRIGGER_ROLES = [
    "Product Designer",
    "UX Designer",
    "UI Designer",
    "Software Engineer",
    "Backend Engineer",
    "Frontend Engineer",
    "Full Stack Engineer",
    "Product Manager",
    "Engineering Manager",
    "Data Engineer",
    "DevOps Engineer",
    "Mobile Engineer",
]

# ---------------------------------------------------------------------------
# ICP — personas (decision makers) — STRICT
# ---------------------------------------------------------------------------
# A) HR / People / Talent at a SMALL company (≤200 employees)
# B) Founder / CEO only when there is NO dedicated HR function and NO recruiter
TARGET_PERSONAS = [
    {
        "id": "hr_small_company",
        "title": "HR / People / Talent (company ≤200 employees)",
        "examples": [
            "HR Manager",
            "People Ops",
            "Head of People",
            "Head of Talent",
            "Talent Acquisition (often the only hiring person)",
        ],
        "pain": "Too many noisy CVs, hours wasted screening — no big TA team behind them.",
        "rules": "Company size must be ≤200. Prefer sole/lean HR over enterprise TA orgs.",
    },
    {
        "id": "founder_no_hr",
        "title": "Founder / CEO with no HR function and no recruiter",
        "examples": ["Founder", "Co-Founder", "CEO"],
        "pain": "They own hiring themselves; slow screens and bad hires are expensive.",
        "rules": (
            "Only when the company has no dedicated HR / People / Talent role "
            "and no in-house or retained recruiter handling hiring."
        ),
    },
]

# Titles that count as the HR/People persona (path A)
HR_PERSONA_KEYWORDS = [
    "hr manager",
    "hr lead",
    "hrbp",
    "human resources",
    "people ops",
    "people operations",
    "head of people",
    "vp people",
    "vp hr",
    "head of hr",
    "head of talent",
    "talent acquisition",
    "talent partner",
    "people partner",
    "chief people",
]

# Titles that count as founder/CEO persona (path B) — only if no HR/recruiter
FOUNDER_PERSONA_KEYWORDS = [
    "founder",
    "co-founder",
    "cofounder",
    "ceo",
    "chief executive",
    "managing partner",  # tiny agency/shop where partner owns hiring
]

# Signals that a company ALREADY has hiring coverage → founder/CEO is NOT the ICP
HAS_HR_OR_RECRUITER_SIGNALS = [
    "has hr",
    "has recruiter",
    "in-house recruiter",
    "internal recruiter",
    "talent team",
    "ta team",
    "people team",
    "hr department",
    "hr function",
    "staffing partner",
    "retained recruiter",
    "recruitment agency hired",
]

# Backward-compatible union used by simple keyword scans
PERSONA_TITLE_KEYWORDS = HR_PERSONA_KEYWORDS + FOUNDER_PERSONA_KEYWORDS

# Size buckets we treat as ≤200
ICP_SIZE_BUCKETS = ("1-10", "11-50", "51-200", "1-50", "50-200", "under 200", "≤200", "<=200")


# ---------------------------------------------------------------------------
# Scoring gate
# ---------------------------------------------------------------------------
ICP_MIN_SCORE = int(os.getenv("ICP_MIN_SCORE", "85"))
OPENAI_MODEL = "gpt-4o-mini"
DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() in {"1", "true", "yes"}
# Outreach copy language: "he" (default) or "en"
COPY_LANGUAGE = os.getenv("COPY_LANGUAGE", "he").strip().lower()
if COPY_LANGUAGE not in {"he", "en"}:
    COPY_LANGUAGE = "he"

# ---------------------------------------------------------------------------
# Paths / CRM columns
# ---------------------------------------------------------------------------
LEADS_LOG = ROOT / "data" / "leads_log.csv"
SEED_COMPANIES = ROOT / "data" / "seed_companies.csv"
SAMPLE_LEADS = ROOT / "data" / "sample_leads.csv"

CRM_COLUMNS = [
    "Company",
    "Contact Name",
    "Contact Name HE",  # Hebrew first/full name for outreach greeting
    "Contact Title",
    "Email",
    "LinkedIn URL",
    "Open Role Found",
    "AI Match Score",
    "Personalized Message",  # email / LinkedIn message (longer)
    "LinkedIn Note",  # connection request note — max 300 chars
    "Open Profile",  # HYPERLINK formula for safe click-to-send
    "Status",
    "Domain",
    "Company Size",
    "Has HR Function",  # yes/no — founders only ICP when this is no/unknown-false
    "Source",
    "Reasoning",
    "Updated At",
]

LINKEDIN_NOTE_MAX_CHARS = 300


OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
HUNTER_API_KEY = os.getenv("HUNTER_API_KEY", "")
ANYMAIL_API_KEY = os.getenv("ANYMAIL_API_KEY", "")
GOOGLE_SERVICE_ACCOUNT_FILE = os.getenv(
    "GOOGLE_SERVICE_ACCOUNT_FILE",
    str(ROOT / "credentials" / "google_service_account.json"),
)
GOOGLE_SHEET_ID = os.getenv("GOOGLE_SHEET_ID", "")
