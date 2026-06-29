const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../public')));

const DB_PATH = path.join(__dirname, '../gas_stations.db');
let db;

// ============================================================
// ТВОИ ЗАПРАВКИ
// ============================================================
const MY_STATIONS = [
    ['Роснефть', 'Красная ул., 141', 45.248870, 38.098440, 'Роснефть'],
    ['Роснефть', 'Маевское ш., 25', 45.238155, 38.150282, 'Роснефть'],
    ['Панда', 'Рыночная ул., 295', 45.273980, 38.094515, 'Панда'],
    ['Газпромнефть', 'Пролетарская ул., 1Д', 45.233658, 38.109846, 'Газпромнефть'],
    ['Rusoil', 'ул. Дружбы Народов, 65/1', 45.221889, 38.109681, 'Rusoil'],
    ['Роснефть', 'Артиллерийский пр., 1', 45.228900, 38.113922, 'Роснефть'],
    ['Лукойл', 'Славянск-на-Кубани (город)', 45.212501, 38.119253, 'Лукойл'],
    ['Rusoil', 'Маевское сельское поселение', 45.217346, 38.167217, 'Rusoil'],
    ['Ника', 'ул. Дружбы Народов, 5', 45.236255, 38.141647, 'Ника']
];

// ============================================================
// ИНИЦИАЛИЗАЦИЯ БАЗЫ
// ============================================================
function initDB() {
    const exists = fs.existsSync(DB_PATH);
    db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
            console.error('❌ Ошибка подключения к БД:', err.message);
            return;
        }
        console.log('✅ База данных подключена');
        
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='stations'", (err, row) => {
            if (err) {
                console.error('❌ Ошибка проверки таблиц:', err.message);
                return;
            }
            
            if (!row) {
                console.log('⚠️ Таблицы не найдены, создаём...');
                db.exec(`
                    CREATE TABLE stations (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT,
                        address TEXT,
                        latitude REAL,
                        longitude REAL,
                        network TEXT,
                        queue_length INTEGER DEFAULT 0,
                        tanker_active INTEGER DEFAULT 0,
                        last_update TEXT
                    );
                    CREATE TABLE fuel_stock (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        station_id INTEGER,
                        fuel_type TEXT,
                        price REAL,
                        FOREIGN KEY(station_id) REFERENCES stations(id)
                    );
                    CREATE TABLE reports (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        station_id INTEGER,
                        user_name TEXT,
                        report_type TEXT,
                        fuel_type TEXT,
                        price REAL,
                        queue_length INTEGER,
                        availability INTEGER,
                        tanker_active INTEGER,
                        description TEXT,
                        created_at TEXT,
                        FOREIGN KEY(station_id) REFERENCES stations(id)
                    );
                `, (err) => {
                    if (err) {
                        console.error('❌ Ошибка создания таблиц:', err.message);
                    } else {
                        console.log('✅ Таблицы созданы');
                        addMyStations();
                    }
                });
            } else {
                // Проверяем, есть ли станции
                db.get('SELECT COUNT(*) as count FROM stations', (err, countRow) => {
                    if (err) {
                        console.error('❌ Ошибка подсчёта станций:', err.message);
                        return;
                    }
                    if (countRow.count === 0) {
                        console.log('⚠️ Станций нет — добавляем...');
                        addMyStations();
                    } else {
                        console.log(`✅ Станций: ${countRow.count}`);
                    }
                });
            }
        });
    });
}

function addMyStations() {
    const stmt = db.prepare('INSERT OR IGNORE INTO stations (name, address, latitude, longitude, network) VALUES (?, ?, ?, ?, ?)');
    let added = 0;
    
    MY_STATIONS.forEach(s => {
        stmt.run(s, (err) => {
            if (err) {
                console.error('❌ Ошибка вставки:', err.message);
            } else {
                added++;
                console.log(`✅ Добавлена АЗС: ${s[0]}`);
            }
        });
    });
    
    stmt.finalize(() => {
        console.log(`✅ ГОТОВО! Добавлено ${added} заправок.`);
    });
}

initDB();

// ============================================================
// ГЛАВНЫЙ МАРШРУТ — ПРОСТО ОТДАЁТ ВСЕ АЗС
// ============================================================
app.get('/api/gas-stations', (req, res) => {
    db.all('SELECT * FROM stations', (err, rows) => {
        if (err) {
            console.error('❌ Ошибка получения станций:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// ============================================================
// ОТПРАВКА ОТЧЁТА
// ============================================================
app.post('/api/report', (req, res) => {
    const { station_id, user_name, report_type, fuel_type, price, queue_length, availability, tanker_active, description } = req.body;
    const now = new Date().toISOString();
    
    db.run(`
        INSERT INTO reports (station_id, user_name, report_type, fuel_type, price, queue_length, availability, tanker_active, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [station_id, user_name || 'Аноним', report_type, fuel_type, price, queue_length, availability, tanker_active || 0, description || '', now], function(err) {
        if (err) {
            console.error('❌ Ошибка вставки отчёта:', err);
            return res.status(500).json({ error: err.message });
        }

        let updates = ['last_update = ?'];
        let params = [now];
        if (queue_length !== undefined && queue_length !== null) {
            updates.push('queue_length = ?');
            params.push(queue_length);
        }
        if (tanker_active !== undefined && tanker_active !== null) {
            updates.push('tanker_active = ?');
            params.push(tanker_active);
        }
        if (updates.length > 1) {
            params.push(station_id);
            db.run(`UPDATE stations SET ${updates.join(', ')} WHERE id = ?`, params);
        }

        res.json({ success: true, message: 'Отчёт отправлен!' });
    });
});

// ============================================================
// ЗАПУСК
// ============================================================
app.listen(PORT, () => {
    console.log(`✅ Сервер запущен на порту ${PORT}`);
});
