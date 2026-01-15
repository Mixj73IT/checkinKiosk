
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc'); const tz = require('dayjs/plugin/timezone'); dayjs.extend(utc); dayjs.extend(tz);
function nowLocal(zone){ return dayjs().tz(zone); }
function todayLocal(zone){ return dayjs().tz(zone).format('YYYY-MM-DD'); }
function isQuietHours(now, cfg){ const qs = cfg.schoolDay.quietHours.start; const qe = cfg.schoolDay.quietHours.end; const s = parseHHMM(now, qs); const e = parseHHMM(now, qe); if (e.isAfter(s)) return now.isAfter(s) && now.isBefore(e); return now.isAfter(s) || now.isBefore(e); }
function parseHHMM(now, hhmm){ const [h,m] = hhmm.split(':').map(Number); return now.startOf('day').add(h,'hour').add(m,'minute'); }
module.exports = { nowLocal, todayLocal, isQuietHours, parseHHMM };
