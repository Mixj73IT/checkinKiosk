
-- STUDENTS
CREATE TABLE IF NOT EXISTS students (
  student_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  grade TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')),
  current_token TEXT UNIQUE NOT NULL,
  default_cutoff TEXT,
  alert_pref TEXT DEFAULT 'email' CHECK (alert_pref IN ('email','sms','both','none')),
  photo_path TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS token_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  token TEXT NOT NULL,
  valid_from TEXT NOT NULL,
  valid_until TEXT,
  reason TEXT,
  replaced_by TEXT,
  FOREIGN KEY(student_id) REFERENCES students(student_id)
);

CREATE TABLE IF NOT EXISTS events (
  event_id TEXT PRIMARY KEY,
  timestamp_iso TEXT NOT NULL,
  date TEXT NOT NULL,
  timezone TEXT NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('IN','OUT')),
  station_id TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('scanner','keyboard')),
  note TEXT,
  voided INTEGER DEFAULT 0,
  voided_at TEXT,
  voided_by TEXT,
  hash_prev TEXT,
  hash_curr TEXT,
  FOREIGN KEY(student_id) REFERENCES students(student_id)
);

CREATE TABLE IF NOT EXISTS daily_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  student_id TEXT NOT NULL,
  checkin_event_id TEXT,
  checkin_time TEXT,
  checkout_event_id TEXT,
  checkout_time TEXT,
  violation INTEGER DEFAULT 0,
  alert_sent_at TEXT,
  escalation_sent_at TEXT,
  exception_today INTEGER DEFAULT 0,
  exception_reason TEXT,
  exception_set_by TEXT,
  exception_set_at TEXT,
  last_updated TEXT DEFAULT (datetime('now')),
  UNIQUE(date, student_id)
);

CREATE TABLE IF NOT EXISTS admins (
  admin_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin','attendance','front_desk','readonly')),
  pin TEXT,
  active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS audit_log (
  change_id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  admin_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  before TEXT,
  after TEXT,
  reason TEXT
);

CREATE TABLE IF NOT EXISTS message_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_name TEXT UNIQUE NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email','sms')),
  subject TEXT,
  body TEXT NOT NULL,
  variables TEXT,
  active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS delivery_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  kind TEXT NOT NULL,
  payload TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  next_retry TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  error TEXT,
  completed_at TEXT
);
