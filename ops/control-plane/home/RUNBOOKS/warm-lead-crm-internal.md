# Internal CRM Setup: Warm Leads (3DVR)

## Goal
Track warm leads using internal, portable files only. No external CRM SaaS dependency.

## Source Of Truth
- `warm-lead-crm-template.csv` for spreadsheet-style editing
- `warm-lead-crm.jsonl` for app ingestion, automation, and scripting

## Canonical Fields
- lead_name
- contact
- source
- date_first_talked
- interests
- vision_dream
- main_pain_point
- best_3dvr_value_fit
- offer_mentioned
- status
- next_step
- follow_up_date
- last_contact_date
- owner
- notes
- warmth_score
- fit_score
- urgency_score
- total_score

## Status Values
- New
- Contacted
- Interested
- Invited
- Joined
- Not Now

## Scoring
`total_score = warmth_score + fit_score + urgency_score`

## Daily Workflow
1. Add new warm leads to CSV as conversations happen.
2. Mirror meaningful updates to JSONL for automation.
3. Ensure every active lead has `next_step` and `follow_up_date`.
4. Review leads with `status=Interested` or `status=Invited` daily.

## Internal Automation Notes
- JSONL is line-oriented for reliable CLI processing.
- Keep one JSON object per lead record.
- Dates use ISO format: `YYYY-MM-DD`.
