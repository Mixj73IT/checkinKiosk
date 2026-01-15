
# Configuration Reference

## `.env`
- SMTP_* for email
- ALERTS_TO recipients (emails and/or phone numbers for SMS)
- TWILIO_* optional for SMS

## `config/app.config.json`
- All times adjustable (debounce, undo, cutoff, grace, quiet hours, summary/eod, retry, heartbeat)
- `storage.retentionDays` for retention; `storage.csvExportDir` for exports

## `config/calendar.csv`
- `date,event,cutoffOverride,alertsEnabled`
