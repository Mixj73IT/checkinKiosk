
const { db } = require('./db');
const { sendEmail, sendSms } = require('./notifications');
const { getConfig } = require('./config');
function enqueueEmail(templateName, tokens, override) { db.prepare(`INSERT INTO delivery_queue(kind,payload) VALUES('email', ?)`).run(JSON.stringify({ templateName, tokens, override })); }
function enqueueSms(templateName, tokens) { db.prepare(`INSERT INTO delivery_queue(kind,payload) VALUES('sms', ?)`).run(JSON.stringify({ templateName, tokens })); }
async function processQueueLoop() { const cfg = getConfig(); const backoff = cfg.scheduling.queueRetryBackoffSeconds || [30,120,600]; async function tick(){ const nowIso = new Date().toISOString(); const items = db.prepare(`SELECT * FROM delivery_queue WHERE status='pending' AND (next_retry IS NULL OR next_retry<=?) ORDER BY id ASC LIMIT 10`).all(nowIso); for (const item of items){ db.prepare(`UPDATE delivery_queue SET status='processing' WHERE id=?`).run(item.id); try{ const payload = JSON.parse(item.payload); if (item.kind==='email') await sendEmail(payload.templateName, payload.tokens, payload.override); if (item.kind==='sms') await sendSms(payload.templateName, payload.tokens); db.prepare(`UPDATE delivery_queue SET status='completed', completed_at=datetime('now') WHERE id=?`).run(item.id);} catch(e){ const next = nextRetry(item.attempts, backoff); db.prepare(`UPDATE delivery_queue SET status='pending', attempts=attempts+1, error=?, next_retry=? WHERE id=?`).run(String(e), next, item.id);} } setTimeout(tick, 5000);} tick(); }
function nextRetry(attempts, backoff){ const secs = backoff[Math.min(attempts, backoff.length-1)]; return new Date(Date.now()+secs*1000).toISOString(); }
module.exports = { enqueueEmail, enqueueSms, processQueueLoop };
