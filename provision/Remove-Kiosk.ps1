
param([string]$KioskUser='SCSKiosk')
$task = Get-ScheduledTask -TaskName 'StudentKiosk_AutoLaunch' -ErrorAction SilentlyContinue
if ($task) { Unregister-ScheduledTask -TaskName 'StudentKiosk_AutoLaunch' -Confirm:$false }
try { Remove-LocalUser -Name $KioskUser -ErrorAction SilentlyContinue } catch {}
