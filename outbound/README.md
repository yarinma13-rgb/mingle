# mingle.careers — Free Outbound Pipeline

End-to-end B2B acquisition loop for **mingle.careers** using only free tiers, local Python, and manual-safe LinkedIn send.

## Decision: how this ships

| Order | Why |
| --- | --- |
| 1. Local CRM (`leads_log.csv`) | Single source of truth before any paid minute is burned |
| 2. Scorer (drop &lt; 85) | Protects OpenAI / Hunter / Sheets / YAMM free caps |
| 3. Personalizer | Only write copy for approved ICP |
| 4. Free job APIs + seed directory | Stable hiring triggers without brittle LinkedIn/Indeed bots |
| 5. Sheets + YAMM export | Delivery loop at $0 |

**Not automated on purpose:** LinkedIn connection/message bots (ban risk). Use the **Open Profile** click-to-send column and paste manually.

## Quick start (demo, $0)

```bash
cd outbound
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env

# Offline dry-run with sample ICP leads
python run_pipeline.py --sample --skip-email
```

Outputs:
- `data/leads_log.csv` — full pipeline log / local CRM
- `data/yamm_ready.csv` — rows ready for YAMM / Mail Meteor

## Live daily loop

```bash
# 1) Optional: add companies to data/seed_companies.csv
# 2) Put API keys in .env (OPENAI_API_KEY, HUNTER_API_KEY, GOOGLE_*)
# 3) DEMO_MODE=false

python run_pipeline.py --live-apis --sheets
```

Or step-by-step:

```bash
python scraper.py
python email_finder.py
python scorer.py
python personalize.py
python crm_sync.py --yamm
python crm_sync.py --sheets --ready-only
```

## ICP (hardcoded in `config.py`)

- **Product:** paste JD → DNA match shortlist + Match Reports (Role / Human / Motivation) in ~60s
- **Companies:** Seed–Series B tech, digital/product agencies, high-volume tech, boutique recruiting
- **Personas:** Head of Talent / VP HR / HR Manager; Founder/CEO early-stage
- **Gate:** `score < 85` → `Status=dropped` (never pushed to send queues)

## Scripts

| File | Phase | Role |
| --- | --- | --- |
| `scraper.py` | 1 | Remotive + Arbeitnow APIs + seed CSV (+ optional public careers HTML) |
| `email_finder.py` | 1b | Hunter.io / Anymail free credits (demo placeholders if no key) |
| `scorer.py` | 2 | `gpt-4o-mini` or free heuristic gate |
| `personalize.py` | 3 | &lt;75 word mingle-angle copy |
| `crm_sync.py` | 4 | Google Sheets sync + YAMM CSV + HYPERLINK Open Profile |
| `run_pipeline.py` | all | Orchestrator |

## Docs

- [`docs/PHANTOMBUSTER_PLAYBOOK.md`](docs/PHANTOMBUSTER_PLAYBOOK.md) — free daily minutes → Head of Talent / Founder LinkedIn URLs
- [`docs/YAMM_MAIL_METEOR.md`](docs/YAMM_MAIL_METEOR.md) — ≤50 tailored emails/day via Gmail free add-ons

## Compliance notes

- Prefer public job APIs and your own seed lists over login-walled scraping.
- Verify emails before send; demo addresses are **unverified**.
- Keep LinkedIn sends manual (safe mode).
- Respect CAN-SPAM / local cold-email rules; use a real business Gmail and honest opt-out.
