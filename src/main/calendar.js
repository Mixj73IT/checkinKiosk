
const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc'); const tz = require('dayjs/plugin/timezone'); dayjs.extend(utc); dayjs.extend(tz);
function loadCalendar(){ try{ const base = process.resourcesPath || process.cwd(); const p = path.join(base, 'config', 'calendar.csv'); const csv = fs.readFileSync(p,'utf8').trim(); const rows = csv.split(/?
/).slice(1).map(l=>l.split(',').map(x=>x.trim())); const map = new Map(); rows.forEach(([date, event, cutoffOverride, alertsEnabled]) => { map.set(date, { event, cutoffOverride: cutoffOverride || null, alertsEnabled: alertsEnabled !== 'false' }); }); return map; }catch{return new Map();}}
const cal = loadCalendar();
function isSchoolDay(now, cfg){ const d = now.format('YYYY-MM-DD'); const ce = cal.get(d); if (!ce) return true; return ce.alertsEnabled !== false; }
function computeCutoffForStudent(cfg, studentCutoff, now){ const ce = cal.get(now.format('YYYY-MM-DD')); const hhmm = (ce && ce.cutoffOverride) || studentCutoff || cfg.cutoffs.globalCutoff; const [h, m] = hhmm.split(':').map(Number); return now.startOf('day').add(h, 'hour').add(m, 'minute'); }
module.exports = { isSchoolDay, computeCutoffForStudent };
