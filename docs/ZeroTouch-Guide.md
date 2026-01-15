
# Zero‑Touch Guide (Silent Install, Auto‑Logon, Auto‑Launch)

This build includes **NSIS** hooks to silently install and run a **post‑install PowerShell** provisioning script that:
- Creates a local kiosk user (default `SCSKiosk`)
- (Optional) configures **AutoAdminLogon** for that user
- Adds a **Scheduled Task** to **auto‑launch** the app at user logon

## Silent install
```powershell
# Silent + auto-run after install
"Student Kiosk Setup 1.1.0.exe" /S --force-run
# Optional install path
"Student Kiosk Setup 1.1.0.exe" /S /D=C:\Kiosk
```

## Auto‑logon note
AutoAdminLogon stores a password under `HKLM\...Winlogon` and should be used **only on physically secured devices**.

## Kiosk hardening
If you need true OS‑level kiosk lock‑down: use **Assigned Access** (UWP/Edge) or **Shell Launcher** for Win32 shells (Enterprise/Education). Otherwise, this package’s auto‑logon + scheduled task is sufficient.
