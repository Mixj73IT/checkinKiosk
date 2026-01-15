
param(
  [Parameter(Mandatory=$true)][string]$AppPath,
  [string]$StationId = "KIOSK-01",
  [switch]$AutoLaunch,
  [switch]$ConfigureAutologon,
  [string]$KioskUser = 'SCSKiosk',
  [string]$KioskPassword = 'SCSkiosk!2026'
)
Write-Host "[Provision] Starting kiosk provisioning..." -ForegroundColor Cyan
if (-not (Get-LocalUser -Name $KioskUser -ErrorAction SilentlyContinue)) {
  $sec = ConvertTo-SecureString $KioskPassword -AsPlainText -Force
  New-LocalUser -Name $KioskUser -Password $sec -AccountNeverExpires:$true -UserMayNotChangePassword:$true -FullName "Student Kiosk User" | Out-Null
}
if ($ConfigureAutologon) {
  $reg = 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon'
  New-ItemProperty -Path $reg -Name 'AutoAdminLogon' -Value '1' -PropertyType String -Force | Out-Null
  New-ItemProperty -Path $reg -Name 'DefaultUserName' -Value $KioskUser -PropertyType String -Force | Out-Null
  New-ItemProperty -Path $reg -Name 'DefaultPassword' -Value $KioskPassword -PropertyType String -Force | Out-Null
}
if ($AutoLaunch) {
  $action    = New-ScheduledTaskAction -Execute $AppPath
  $trigger   = New-ScheduledTaskTrigger -AtLogOn
  $settings  = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew
  $principal = New-ScheduledTaskPrincipal -UserId $KioskUser -LogonType InteractiveToken
  Register-ScheduledTask -TaskName 'StudentKiosk_AutoLaunch' -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
}
Write-Host "[Provision] Completed. Reboot to enter kiosk session." -ForegroundColor Green
