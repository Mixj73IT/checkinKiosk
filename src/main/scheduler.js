
const cron = require('node-cron');
const { db } = require('./db');
const { getConfig } = require('./config');
const { enqueueEmail, enqueueSms } = require('./queue');
const { isQuietHours, nowLocal, todayLocal } = require('./time');
const { computeCutoffForStudent, isSchoolDay } = require('./calendar');
function scheduleAll() {
  const cfg = getConfig();
  cron.schedule(`* * * * *`, checkAlerts);
  const [h1, m1] = (cfg.scheduling.dailySummaryTime || '12:15').split(':').map(Number);
  cron.schedule(`${m1} ${h1} * * *`, sendDailySummary);
  const [h2, m2] = (cfg.scheduling.eodReconciliationTime || '15:30').split(':').map(Number);
  cron.schedule(`${m2} ${h2} * * *`, endOfDayReconciliation);
  const hb = Math.max(1, cfg.scheduling.heartbeatMinutes || 5);
  cron.schedule(`*/${hb} * * * *`, heartbeat);
}
function runHeartbeat() { heartbeat(); }
function heartbeat() {
  const cfg = getConfig();
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO audit_log(admin_id,action_type,entity_type,entity_id,after,reason) VALUES('system','heartbeat','station',?,?,'')`).run(cfg.stationId, JSON.stringify({ at: now }));
}
function checkAlerts() {
  const cfg = getConfig();
  const tzNow = nowLocal(cfg.timezone);
  if (!isSchoolDay(tzNow, cfg) || isQuietHours(tzNow, cfg)) return;
  const dateISO = todayLocal(cfg.timezone);
  const rows = db.prepare(`
    SELECT ds.student_id, ds.checkin_time, ds.checkout_time, ds.alert_sent_at,
           s.name, s.default_cutoff, s.alert_pref
    FROM daily_status ds
    JOIN students s ON s.student_id = ds.student_id
    WHERE ds.date = ? AND ds.checkin_time IS NOT NULL AND ds.checkout_time IS NULL
      AND ds.exception_today = 0 AND s.status='active'
  `).all(dateISO);
  for (const r of rows) {
    const cutoff = computeCutoffForStudent(cfg, r.default_cutoff, tzNow);
    const cutoffPlusGrace = cutoff.add(cfg.cutoffs.graceMinutes, 'minute');
    if (tzNow.isBefore(cutoffPlusGrace)) continue;
    if (!r.alert_sent_at) {
      queueAlert('initial', r, tzNow, cfg);
      db.prepare(`UPDATE daily_status SET alert_sent_at=? WHERE date=? AND student_id=?`).run(tzNow.toISOString(), dateISO, r.student_id);
    } else {
      const escalAfter = new Date(r.alert_sent_at);
      const diffMs = tzNow.toDate() - escalAfter;
      if (diffMs >= (cfg.cutoffs.escalationDelayMinutes * 60 * 1000)) {
        queueAlert('escalation', r, tzNow, cfg);
        db.prepare(`UPDATE daily_status SET escalation_sent_at=? WHERE date=? AND student_id=?`).run(tzNow.toISOString(), dateISO, r.student_id);
      }
    }
  }
}
function queueAlert(kind, row, now, cfg) {
  const tokens = { StudentName: row.name, StudentID: row.student_id, CheckInTime: row.checkin_time, CurrentTime: now.toISO(), StationID: cfg.stationId, Cutoff: computeCutoffForStudent(cfg, row.default_cutoff, now).format('HH:mm') };
  if (row.alert_pref === 'email' || row.alert_pref === 'both') enqueueEmail('alert_' + (kind === 'initial' ? 'initial' : 'escalation'), tokens);
  if (row.alert_pref === 'sms' || row.alert_pref === 'both') enqueueSms('alert_sms', tokens);
}
function sendDailySummary() {
  const cfg = getConfig();
  const dateISO = todayLocal(cfg.timezone);
  const rows = db.prepare(`SELECT ds.student_id, s.name, ds.checkin_time FROM daily_status ds JOIN students s ON s.student_id=ds.student_id WHERE ds.date=? AND ds.checkin_time IS NOT NULL AND ds.checkout_time IS NULL AND ds.exception_today=0`).all(dateISO);
  const body = rows.length ? rows.map(r => `${r.name} (${r.student_id}) — IN at ${r.checkin_time}`).join('
') : 'No students are currently IN without OUT.';
  enqueueEmail(null, {}, { subject: `Daily Summary (${dateISO})`, body });
}
function endOfDayReconciliation() {
  const cfg = getConfig();
  const dateISO = todayLocal(cfg.timezone);
  const open = db.prepare(`SELECT ds.student_id, s.name, ds.checkin_time FROM daily_status ds JOIN students s ON s.student_id=ds.student_id WHERE ds.date=? AND ds.checkin_time IS NOT NULL AND ds.checkout_time IS NULL`).all(dateISO);
  if (!open.length) return;
  const body = open.map(r => `${r.name} (${r.student_id}) — IN at ${r.checkin_time} (no checkout)`).join('
');
  enqueueEmail(null, {}, { subject: `EOD Reconciliation Needed (${dateISO})`, body });
}
module.exports = { scheduleAll, runHeartbeat };
