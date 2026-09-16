# Phantombuster playbook (free daily minutes)

LinkedIn profile extraction is **not** coded into this repo (ToS + account risk).  
Use Phantombuster’s free daily minutes, then paste results back into the pipeline.

## Goal

For each company in `data/leads_log.csv` with `Status=scored` or `ready`, get:

- LinkedIn profile URL of **Head of Talent / VP People / HR Manager**, or
- **Founder / CEO** for Seed–Series A startups

## Steps (≈10 minutes)

1. Create a free Phantombuster account.
2. Export companies from the sheet/CSV (Company + Domain columns).
3. Use a Phantom such as:
   - **LinkedIn Search Export** — query: `"[Company]" ("Head of Talent" OR "Talent Acquisition" OR Founder OR CEO)`
   - **LinkedIn Company Employees Export** — then filter titles locally
4. Run only within free daily minutes; keep batches small (20–40 companies/day).
5. Download the CSV result.
6. Map columns into `leads_log.csv`:
   - `Contact Name`
   - `LinkedIn URL`
   - optional persona title → helps `scorer.py`

### Minimal merge tip

```bash
# After you save phantombuster_out.csv with columns: company,name,linkedin_url,title
python - <<'PY'
import csv
from pathlib import Path
from lead_store import read_leads, upsert_leads

pb = {r["company"].strip().lower(): r for r in csv.DictReader(open("phantombuster_out.csv"))}
rows = read_leads()
for row in rows:
    hit = pb.get(row["Company"].strip().lower())
    if not hit:
        continue
    row["Contact Name"] = hit.get("name", row.get("Contact Name", ""))
    row["LinkedIn URL"] = hit.get("linkedin_url", "")
    if hit.get("title"):
        row["Reasoning"] = (row.get("Reasoning") or "") + f" | persona:{hit['title']}"
upsert_leads(rows)
print("Merged Phantombuster contacts")
PY
```

7. Re-run:

```bash
python email_finder.py
python scorer.py
python personalize.py
python crm_sync.py --yamm
```

## Safety rules

- Do **not** auto-send LinkedIn messages from Phantombuster on a warm account you care about.
- Use the Sheets **Open Profile** column → open → paste the `Personalized Message` yourself.
- Space runs; stop if LinkedIn shows puzzles/blocks.
