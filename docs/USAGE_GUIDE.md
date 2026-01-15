
# Usage Guide (Front Office)
- Students scan card → success toast (beep + optional photo).
- Re-scan within undo window cancels previous event.
- **Exceptions**: Admin → Exceptions (today).
- **Manual checkout**: Admin → Corrections (audited).
- **Roster import**: CSV `id,name,grade,status,token,default_cutoff,alert_pref,photo_path`.
- Alerts fire at cutoff+grace; escalation after delay; daily summary + EOD reconciliation emails.
