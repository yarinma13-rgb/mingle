# Phantombuster playbook (free daily minutes)

LinkedIn profile extraction is **not** coded into this repo (ToS + account risk).  
Use Phantombuster’s free daily minutes, then paste results back into the pipeline.

## Goal

For each company in `data/leads_log.csv` that is hiring and looks ≤200 employees, get the **right** persona:

1. **Prefer:** HR / People / Talent / People Ops (lean team — often the only hiring person)
2. **Else:** Founder / CEO **only if** LinkedIn/company shows **no** HR, People, Talent, or Recruiter role

Skip enterprise TA orgs and companies clearly over 200 employees.

## Steps (≈10 minutes)

1. Create a free Phantombuster account.
2. Export companies from the sheet/CSV (Company + Domain + Company Size columns).
3. Use a Phantom such as:
   - **LinkedIn Search Export** — try in order:
     1. `"[Company]" ("HR Manager" OR "People Ops" OR "Head of People" OR "Head of Talent" OR "Talent Acquisition")`
     2. If none: `"[Company]" (Founder OR "Co-Founder" OR CEO)` — then verify there is still no HR/recruiter on the company page
   - **LinkedIn Company Employees Export** — filter titles locally with the same rules
4. Run only within free daily minutes; keep batches small (20–40 companies/day).
5. Download the CSV result.
6. Map columns into `leads_log.csv`:
   - `Contact Name`
   - `Contact Title`
   - `LinkedIn URL`
   - `Has HR Function` → `yes` / `no` (critical for Founder/CEO rows)
7. Re-run scoring after the merge so wrong personas get dropped.

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
