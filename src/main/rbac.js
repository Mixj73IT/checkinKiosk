
const { db } = require('./db');
async function ensureRoles() {
  const count = db.prepare(`SELECT COUNT(*) AS n FROM admins`).get().n;
  if (!count) {
    db.prepare(`INSERT INTO admins(admin_id,name,email,role,pin) VALUES
      ('admin','System Admin','', 'admin','1234'),
      ('frontdesk','Front Desk','', 'front_desk','1111'),
      ('attendance','Attendance','', 'attendance','2222')`).run();
  }
}
module.exports = { ensureRoles };
