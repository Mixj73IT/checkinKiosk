
const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');
const isDev = require('electron-is-dev');
require('dotenv').config();
const { autoUpdater } = require('electron-updater');
const { initDb, db } = require('./db');
const { getConfig, setConfig } = require('./config');
const { enqueueEmail, enqueueSms, processQueueLoop } = require('./queue');
const { scheduleAll, runHeartbeat } = require('./scheduler');
const { exportDailyCsv, enforceRetention } = require('./exports');
const { ensureRoles } = require('./rbac');

let mainWindow;

async function createWindow() {
  await initDb();
  await ensureRoles();
  const cfg = getConfig();

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    fullscreen: !isDev,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  const url = isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, '../../dist/index.html')}`;
  await mainWindow.loadURL(url);
  if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });

  scheduleAll();
  processQueueLoop();
  runHeartbeat();
  enforceRetention();

  setTimeout(() => { try { autoUpdater.checkForUpdatesAndNotify(); } catch {} }, 5000);
}

app.on('ready', createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', async () => { if (BrowserWindow.getAllWindows().length === 0) await createWindow(); });

function sha256(input) { return require('crypto').createHash('sha256').update(input).digest('hex'); }
function cryptoRandomId() { return require('crypto').randomUUID(); }

ipcMain.handle('config:get', () => getConfig());
ipcMain.handle('config:set', (_e, updates) => setConfig(updates));

ipcMain.handle('events:add', (_e, payload) => {
  const { studentId, studentName, source, note, stationId, dateISO, timestampISO, timezone } = payload;
  const cfg = getConfig();
  const undoWindow = (cfg.scan?.undoWindowSeconds || 45) * 1000;
  const last = db.prepare(`SELECT * FROM events WHERE student_id=? AND date=? AND voided=0 ORDER BY timestamp_iso DESC LIMIT 1`).get(studentId, dateISO);
  if (last) {
    const diff = new Date(timestampISO) - new Date(last.timestamp_iso);
    if (diff >= 0 && diff <= undoWindow) {
      db.prepare(`UPDATE events SET voided=1, voided_at=datetime('now'), voided_by='undo_window' WHERE event_id=?`).run(last.event_id);
      const eventsToday = db.prepare(`SELECT * FROM events WHERE student_id=? AND date=? AND voided=0 ORDER BY timestamp_iso ASC`).all(studentId, dateISO);
      const inEvent = eventsToday.find(e => e.action === 'IN');
      const outEvent = [...eventsToday].reverse().find(e => e.action === 'OUT');
      db.prepare(`UPDATE daily_status SET checkin_event_id=?, checkin_time=?, checkout_event_id=?, checkout_time=?, last_updated=datetime('now') WHERE date=? AND student_id=?`)
        .run(inEvent?.event_id || null, inEvent?.timestamp_iso || null, outEvent?.event_id || null, outEvent?.timestamp_iso || null, dateISO, studentId);
      return { undo: true, action: 'UNDO' };
    }
  }
  const action = (!last || last.action === 'OUT') ? 'IN' : 'OUT';
  const eventId = cryptoRandomId();
  const lastHash = db.prepare(`SELECT hash_curr FROM events ORDER BY rowid DESC LIMIT 1`).get();
  const hashPrev = lastHash ? lastHash.hash_curr : null;
  const hashCurr = sha256([eventId, timestampISO, studentId, action, hashPrev || ''].join('|'));
  db.prepare(`INSERT INTO events(event_id,timestamp_iso,date,timezone,student_id,student_name,action,station_id,source,note,hash_prev,hash_curr,voided) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,0)`).run(eventId, timestampISO, dateISO, timezone, studentId, studentName, action, stationId, source, note || null, hashPrev, hashCurr);
  const ds = db.prepare(`SELECT * FROM daily_status WHERE date=? AND student_id=?`).get(dateISO, studentId);
  if (!ds) { db.prepare(`INSERT INTO daily_status(date,student_id,last_updated) VALUES(?,?,datetime('now'))`).run(dateISO, studentId); }
  if (action === 'IN') {
    db.prepare(`UPDATE daily_status SET checkin_event_id=?, checkin_time=?, last_updated=datetime('now') WHERE date=? AND student_id=?`).run(eventId, timestampISO, dateISO, studentId);
  } else {
    db.prepare(`UPDATE daily_status SET checkout_event_id=?, checkout_time=?, last_updated=datetime('now') WHERE date=? AND student_id=?`).run(eventId, timestampISO, dateISO, studentId);
  }
  return { eventId, action };
});

ipcMain.handle('events:undoLast', (_e, { studentId, dateISO }) => {
  const last = db.prepare(`SELECT * FROM events WHERE student_id=? AND date=? AND voided=0 ORDER BY timestamp_iso DESC LIMIT 1`).get(studentId, dateISO);
  if (!last) return { ok: false, message: 'No event to undo' };
  db.prepare(`UPDATE events SET voided=1, voided_at=datetime('now'), voided_by='undo_manual' WHERE event_id=?`).run(last.event_id);
  const eventsToday = db.prepare(`SELECT * FROM events WHERE student_id=? AND date=? AND voided=0 ORDER BY timestamp_iso ASC`).all(studentId, dateISO);
  const inEvent = eventsToday.find(e => e.action === 'IN');
  const outEvent = [...eventsToday].reverse().find(e => e.action === 'OUT');
  db.prepare(`UPDATE daily_status SET checkin_event_id=?, checkin_time=?, checkout_event_id=?, checkout_time=?, last_updated=datetime('now') WHERE date=? AND student_id=?`).run(inEvent?.event_id || null, inEvent?.timestamp_iso || null, outEvent?.event_id || null, outEvent?.timestamp_iso || null, dateISO, studentId);
  return { ok: true };
});

ipcMain.handle('students:lookupByToken', (_e, token) => {
  return db.prepare(`SELECT * FROM students WHERE current_token=? AND status='active'`).get(token);
});

ipcMain.handle('students:importCsv', async (_e, csvString) => {
  const rows = csvString.trim().split(/?
/);
  const headers = rows.shift().split(',').map(h => h.trim().toLowerCase());
  const insert = db.prepare(`
    INSERT INTO students(student_id,name,grade,status,current_token,default_cutoff,alert_pref,photo_path)
    VALUES(@student_id,@name,@grade,@status,@current_token,@default_cutoff,@alert_pref,@photo_path)
    ON CONFLICT(student_id) DO UPDATE SET
      name=excluded.name, grade=excluded.grade, status=excluded.status,
      current_token=excluded.current_token, default_cutoff=excluded.default_cutoff,
      alert_pref=excluded.alert_pref, photo_path=excluded.photo_path, updated_at=datetime('now')
  `);
  const trx = db.transaction((items) => { items.forEach(row => insert.run(row)); });
  const parsed = rows.map(line => {
    const cells = line.split(',').map(c => c.trim());
    const obj = {}; headers.forEach((h, i) => obj[h] = cells[i] || null);
    return {
      student_id: obj.id || obj.student_id,
      name: obj.name,
      grade: obj.grade || null,
      status: obj.status || 'active',
      current_token: obj.token,
      default_cutoff: obj.default_cutoff || null,
      alert_pref: obj.alert_pref || 'email',
      photo_path: obj.photo_path || null
    };
  });
  trx(parsed);
  return { imported: parsed.length };
});

ipcMain.handle('admin:exceptionToday', (_e, { dateISO, studentId, reason, adminId }) => {
  db.prepare(`UPDATE daily_status SET exception_today=1, exception_reason=?, exception_set_by=?, exception_set_at=datetime('now') WHERE date=? AND student_id=?`).run(reason || '', adminId || 'frontdesk', dateISO, studentId);
  return { ok: true };
});

ipcMain.handle('admin:manualCheckout', (_e, { dateISO, studentId, adminId, reason }) => {
  const ds = db.prepare(`SELECT * FROM daily_status WHERE date=? AND student_id=?`).get(dateISO, studentId);
  if (ds?.checkout_time) return { ok: false, message: 'Already checked out' };
  const nowIso = new Date().toISOString();
  const evtId = cryptoRandomId();
  const student = db.prepare(`SELECT * FROM students WHERE student_id=?`).get(studentId);
  if (!student) return { ok: false, message: 'Student not found' };
  db.prepare(`INSERT INTO events(event_id,timestamp_iso,date,timezone,student_id,student_name,action,station_id,source,note,voided) VALUES(?,?,?,?,?,?,?,?,?,?,0)`).run(evtId, nowIso, dateISO, getConfig().timezone, studentId, student.name, 'OUT', getConfig().stationId, 'keyboard', 'manual checkout');
  db.prepare(`UPDATE daily_status SET checkout_event_id=?, checkout_time=?, last_updated=datetime('now') WHERE date=? AND student_id=?`).run(evtId, nowIso, dateISO, studentId);
  db.prepare(`INSERT INTO audit_log(admin_id, action_type, entity_type, entity_id, before, after, reason) VALUES(?,?,?,?,?,?,?)`).run(adminId || 'attendance', 'correction', 'daily_status', `${dateISO}:${studentId}`, null, JSON.stringify({ checkout_time: nowIso }), reason || '');
  return { ok: true };
});
