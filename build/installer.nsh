
!macro customHeader
  !include "FileFunc.nsh"
  !include "x64.nsh"
  !include "nsExec.nsh"
!macroend

!macro customInstall
  SetOutPath "$INSTDIR\provision"
  File "provision\Provision-Kiosk.ps1"
  File "provision\Remove-Kiosk.ps1"
  nsExec::ExecToLog 'powershell -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\provision\Provision-Kiosk.ps1" -AppPath "$INSTDIR\${PRODUCT_FILENAME}.exe" -StationId "KIOSK-01" -AutoLaunch -ConfigureAutologon'
!macroend

!macro customUnInstall
!macroend
