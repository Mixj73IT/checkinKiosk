
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const { db } = require('./db');
function makeTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;
  return nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT || 587), secure: String(SMTP_SECURE) === 'true', auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined });
}
function renderTemplate(templateName, tokens, override) {
  if (override?.body) return override;
  const tpl = db.prepare(`SELECT * FROM message_templates WHERE template_name=? AND active=1`).get(templateName || 'alert_initial');
  if (!tpl) return { subject: 'Attendance Alert', body: 'No template configured.' };
  let subject = tpl.subject || ''; let body = tpl.body || '';
  for (const [k,v] of Object.entries(tokens || {})) { subject = subject.replaceAll(`{${k}}`, String(v ?? '')); body = body.replaceAll(`{${k}}`, String(v ?? '')); }
  return { subject, body };
}
async function sendEmail(templateName, tokens, override) {
  const { subject, body } = renderTemplate(templateName, tokens, override);
  const to = process.env.ALERTS_TO; if (!to) throw new Error('ALERTS_TO missing');
  const transporter = makeTransport(); await transporter.sendMail({ from: process.env.ALERTS_FROM || 'kiosk@localhost', to, subject, text: body });
}
async function sendSms(templateName, tokens) {
  const sid = process.env.TWILIO_ACCOUNT_SID; const tok = process.env.TWILIO_AUTH_TOKEN; const from = process.env.TWILIO_FROM_NUMBER; if (!sid || !tok || !from) throw new Error('Twilio env missing');
  const client = twilio(sid, tok); const { body } = renderTemplate(templateName, tokens);
  const targets = (process.env.ALERTS_TO || '').split(',').filter(x => /^\+?\d{7,}$/.test(x));
  for (const to of targets) { await client.messages.create({ from, to, body }); }
}
module.exports = { sendEmail, sendSms };
