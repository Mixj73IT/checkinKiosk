
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
let db;
async function initDb() {
  const dbDir = path.join(process.resourcesPath || process.cwd(), 'db');
  const dbPath = path.join(dbDir, 'kiosk.db');
  const migDir = path.join(process.resourcesPath || process.cwd(), 'db', 'migrations');
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  db = new Database(dbPath);
  const files = fs.readdirSync(migDir).filter(f => f.endsWith('.sql')).sort();
  db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
  for (const f of files) {
    const sql = fs.readFileSync(path.join(migDir, f), 'utf8');
    db.exec(sql);
  }
}
module.exports = { initDb, db };
