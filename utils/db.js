/* License is GPL 3.0.
- made by studio moremi
 - op@kkutu.store
*/
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const winston = require('winston');
const { format, transports } = winston;
const EventEmitter = require('events');

class DatabaseEventEmitter extends EventEmitter {}
const dbEvents = new DatabaseEventEmitter();

const dbPath = path.join(__dirname, '../database.db');
const db = new sqlite3.Database('./database.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('❌ Failed to connect to the database:', err.message);
    } else {
        console.log('✅ Connected to the SQLite database.');
    }
});

function getUserInfo(userId) {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM users WHERE user_id = ?`;
        db.get(query, [userId], (err, row) => {
            if (err) {
                logger.error(`❗ 사용자 정보 조회 실패 (userId: ${userId}): ${err.message}`);
                reject(err);
            } else {
                logger.info(`✅ 사용자 정보 조회 성공 (userId: ${userId})`);
                resolve(row || null);
            }
        });
    });
}


const logger = winston.createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: path.join(__dirname, '../log/database.log') }),
    ],
});

function createTables() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS catches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                fish TEXT NOT NULL,
                grade INTEGER NOT NULL,
                value INTEGER NOT NULL,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`, err => {
                if (err) {
                    logger.error('❗ catches 테이블 생성 실패:', err.message);
                    reject(err);
                } else {
                    logger.info('✅ catches 테이블 생성 성공');
                }
            });

            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT UNIQUE NOT NULL,
                experience INTEGER DEFAULT 0,
                coins INTEGER DEFAULT 0,
                date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`, err => {
                if (err) {
                    logger.error('❗ users 테이블 생성 실패:', err.message);
                    reject(err);
                } else {
                    logger.info('✅ users 테이블 생성 성공');
                    resolve();
                }
            });
        });
    });
}

function addCatch(userId, fish, grade, value) {
    return new Promise((resolve, reject) => {
        const query = `INSERT INTO catches (user_id, fish, grade, value) VALUES (?, ?, ?, ?)`;
        db.run(query, [userId, fish, grade, value], err => {
            if (err) {
                logger.error(`❗ 낚시 기록 추가 실패 (userId: ${userId}, fish: ${fish}): ${err.message}`);
                dbEvents.emit('error', err);
                reject(err);
            } else {
                logger.info(`✅ 낚시 기록 추가 성공 (userId: ${userId}, fish: ${fish}, grade: ${grade}, value: ${value})`);
                dbEvents.emit('catchAdded', { userId, fish, grade, value });
                resolve();
            }
        });
    });
}

function initializeUser(userId) {
    return new Promise((resolve, reject) => {
        const query = `INSERT OR IGNORE INTO users (user_id) VALUES (?)`;
        db.run(query, [userId], err => {
            if (err) {
                logger.error(`❗ 사용자 초기화 실패 (userId: ${userId}): ${err.message}`);
                dbEvents.emit('error', err);
                reject(err);
            } else {
                logger.info(`✅ 사용자 초기화 성공 (userId: ${userId})`);
                dbEvents.emit('userInitialized', userId);
                resolve();
            }
        });
    });
}

function updateUser(userId, experience = 0, coins = 0) {
    return new Promise((resolve, reject) => {
        const query = `UPDATE users SET experience = experience + ?, coins = coins + ? WHERE user_id = ?`;
        db.run(query, [experience, coins, userId], err => {
            if (err) {
                logger.error(`❗ 사용자 정보 업데이트 실패 (userId: ${userId}): ${err.message}`);
                dbEvents.emit('error', err);
                reject(err);
            } else {
                logger.info(`✅ 사용자 정보 업데이트 성공 (userId: ${userId}, experience: +${experience}, coins: +${coins})`);
                dbEvents.emit('userUpdated', { userId, experience, coins });
                resolve();
            }
        });
    });
}

function closeDatabase() {
    db.close(err => {
        if (err) {
            logger.error('❗ 데이터베이스 종료 실패:', err.message);
            dbEvents.emit('error', err);
        } else {
            logger.info('✅ 데이터베이스 종료 성공');
            dbEvents.emit('disconnected');
        }
    });
}

dbEvents.on('connected', () => logger.info('📡 데이터베이스 연결 이벤트 발생'));
dbEvents.on('disconnected', () => logger.info('🔌 데이터베이스 연결 종료 이벤트 발생'));
dbEvents.on('catchAdded', data => logger.info(`🎣 낚시 기록 추가 이벤트: ${JSON.stringify(data)}`));
dbEvents.on('userInitialized', userId => logger.info(`👤 사용자 초기화 이벤트: ${userId}`));
dbEvents.on('userUpdated', data => logger.info(`📈 사용자 정보 업데이트 이벤트: ${JSON.stringify(data)}`));

module.exports = {
    db,
    dbEvents,
    createTables,
    addCatch,
    initializeUser,
    getUserInfo,
    updateUser,
    closeDatabase,
};
