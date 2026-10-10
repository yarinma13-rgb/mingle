# Free cold email delivery — YAMM / Mail Meteor

Cap: **≤50 tailored emails per day** on a normal business Gmail (stays inside free add-on norms and reduces spam risk).

## A) Yet Another Mail Merge (YAMM)

1. Create a Google Sheet (or sync with `python crm_sync.py --sheets --ready-only`).
2. Ensure columns include at least:
   - `Email`
   - `Contact Name`
   - `Company`
   - `Open Role Found`
   - `Personalized Message`
3. Install **Yet Another Mail Merge** from Google Workspace Marketplace.
4. In Gmail, create a draft:
   - To: `{{Email}}`
   - Subject: `Quick idea for {{Company}} hiring`
   - Body: `{{Personalized Message}}`
5. Back in the Sheet → Extensions → YAMM → Start mail merge.
6. Send to **ready** rows only; set daily limit to **50**.

### Using the local export (no Sheets API yet)

```bash
python crm_sync.py --yamm
# Upload data/yamm_ready.csv into a Google Sheet, then run YAMM
```

## B) Mail Meteor

1. Install Mail Meteor (Sheets / Gmail add-on).
2. Import `data/yamm_ready.csv` or use the synced worksheet.
3. Map:
   - Recipient = `Email`
   - Body = `Personalized Message`
4. Schedule ≤50/day; track opens if the free plan allows.

## Suggested 3-touch sequence (manual statuses)

| Day | Status after send | Angle |
| --- | --- | --- |
| 0 | `sent_1` | Role-specific Match Report offer |
| 3 | `sent_2` | Short bump + same CTA |
| 7 | `sent_3` / `closed` | Breakup / “should I close the loop?” |

Update `Status` in `leads_log.csv` or Sheets after each wave so you never double-send.

## LinkedIn safe mode (parallel)

In Sheets, column **Open Profile** is:

```text
=HYPERLINK("https://www.linkedin.com/in/...","Open Profile")
```

Workflow: click → copy `Personalized Message` → paste on LinkedIn. No bot. No bill.
