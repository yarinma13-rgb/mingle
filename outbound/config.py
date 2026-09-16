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
TARGET_VERTICALS = [
    "Tech Startups (Seed to Series B)",
    "Fast-growing Digital/Product Agencies",
    "High-volume Tech Companies",
    "Boutique Recruiting Agencies",
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
# ICP — personas (decision makers)
# ---------------------------------------------------------------------------
TARGET_PERSONAS = [
    {
        "title": "VP HR / Head of Talent Acquisition / HR Manager",
        "pain": "Too many noisy CVs, hours wasted screening.",
    },
    {
        "title": "Founder / CEO (early-stage)",
        "pain": "No time to source, hiring is slow, hiring mistakes cost too much.",
    },
]

PERSONA_TITLE_KEYWORDS = [
    "head of talent",
    "talent acquisition",
    "vp people",
    "vp hr",
    "head of people",
    "hr manager",
    "people ops",
    "chief people",
    "founder",
    "co-founder",
    "ceo",
    "managing partner",
]

# ---------------------------------------------------------------------------
# Scoring gate
# ---------------------------------------------------------------------------
ICP_MIN_SCORE = int(os.getenv("ICP_MIN_SCORE", "85"))
OPENAI_MODEL = "gpt-4o-mini"
DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() in {"1", "true", "yes"}

# ---------------------------------------------------------------------------
# Paths / CRM columns
# ---------------------------------------------------------------------------
LEADS_LOG = ROOT / "data" / "leads_log.csv"
SEED_COMPANIES = ROOT / "data" / "seed_companies.csv"
SAMPLE_LEADS = ROOT / "data" / "sample_leads.csv"

CRM_COLUMNS = [
    "Company",
    "Contact Name",
    "Contact Title",
    "Email",
    "LinkedIn URL",
    "Open Role Found",
    "AI Match Score",
    "Personalized Message",
    "Open Profile",  # HYPERLINK formula for safe click-to-send
    "Status",
    "Domain",
    "Company Size",
    "Source",
    "Reasoning",
    "Updated At",
]

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
HUNTER_API_KEY = os.getenv("HUNTER_API_KEY", "")
ANYMAIL_API_KEY = os.getenv("ANYMAIL_API_KEY", "")
GOOGLE_SERVICE_ACCOUNT_FILE = os.getenv(
    "GOOGLE_SERVICE_ACCOUNT_FILE",
    str(ROOT / "credentials" / "google_service_account.json"),
)
GOOGLE_SHEET_ID = os.getenv("GOOGLE_SHEET_ID", "")
