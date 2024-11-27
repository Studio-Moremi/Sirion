/* License is GPL 3.0.
- made by studio moremi
 - op@kkutu.store
*/
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS catches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        fish TEXT,
        grade INTEGER,
        value INTEGER,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
});

function addCatch(userId, fish, grade, value) {
    const stmt = db.prepare("INSERT INTO catches (user_id, fish, grade, value) VALUES (?, ?, ?, ?)");
    stmt.run(userId, fish, grade, value);
    stmt.finalize();
}

module.exports = { db, addCatch };
