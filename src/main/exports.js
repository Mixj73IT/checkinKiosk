
const fs = require('fs');
const path = require('path');
const { db } = require('./db');
const { getConfig } = require('./config');
function exportDailyCsv(dateISO) {
  const cfg = getConfig();
  const dir = path.join(process.resourcesPath || process.cwd(), cfg.storage.csvExportDir);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const rows = db.prepare(`SELECT timestamp_iso,date,student_id,student_name,action,station_id,source,note FROM events WHERE date=? ORDER BY timestamp_iso ASC`).all(dateISO);
  const header = 'timestamp,date,student_id,student_name,action,station_id,source,note
';
  const body = rows.map(r => [r.timestamp_iso, r.date, r.student_id, csv(r.student_name), r.action, r.station_id, r.source, csv(r.note)].join(',')).join('
');
  fs.writeFileSync(path.join(dir, `events_${dateISO}.csv`), header + body, 'utf8');
}
function csv(s){ if(!s) return ''; return '"' + String(s).replaceAll('"','""') + '"'; }
function enforceRetention() {
  const cfg = getConfig();
  const keep = cfg.storage.retentionDays || 365;
  const cutoff = new Date(Date.now() - keep*24*60*60*1000).toISOString();
  db.prepare(`DELETE FROM events WHERE timestamp_iso < ? AND voided=0`).run(cutoff);
  db.prepare(`DELETE FROM audit_log WHERE timestamp < ?`).run(cutoff);
}
module.exports = { exportDailyCsv, enforceRetention };
