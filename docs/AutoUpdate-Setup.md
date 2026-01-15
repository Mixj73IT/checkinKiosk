
# AutoUpdate Setup (electron‑updater)

1) Add a publish target in `package.json > build.publish` (GitHub shown):
```json
{
  "build": { "publish": [{ "provider": "github", "owner": "YOUR_ORG", "repo": "student-kiosk", "private": false }] }
}
```
2) Ensure `electron-updater` is installed (already included) and code calls:
```js
const { autoUpdater } = require('electron-updater');
app.whenReady().then(()=> setTimeout(()=>autoUpdater.checkForUpdatesAndNotify(), 5000));
```
3) Build installers (`npm run dist`) and **publish artifacts + latest.yml** to your provider.
