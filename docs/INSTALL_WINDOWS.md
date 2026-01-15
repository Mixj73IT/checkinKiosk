
# Install (Windows)

## Prerequisites
- Windows 10/11 (x64)
- Node.js 18+ (LTS)
- (First build only) Build tools may be required by SQLite

## 1) Configure
1. Copy `.env.example` to `.env` and fill SMTP (and Twilio if using SMS).
2. Edit `config/app.config.json` (timezone, cutoff, grace, quiet hours, etc.).
3. (Optional) Edit `config/calendar.csv` for holidays/early release.

## 2) Install & Run
```powershell
npm install
npm run dev:renderer
npm run dev
```

## 3) Build the Installer
```powershell
npm run dist
```
Outputs to `release/`.

## 4) First Launch
- DB auto-creates, roles/templates seeded.
- Use **Admin → Roster Import** to load students.

For **silent deployment** of the installer, see `ZeroTouch-Guide.md`.
