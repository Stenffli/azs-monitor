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
// ТВОИ ЗАПРАВКИ (СЛАВЯНСК-НА-КУБАНИ)
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
// ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ + ДОБАВЛЕНИЕ ЗАПРАВОК
// ============================================================
function initDB() {
    const exists = fs.existsSync(DB_PATH);
    db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
            console.error('❌ Ошибка подключения к БД:', err.message);
            return;
        }
        console.log('✅ База данных подключена');
        
        // Проверяем, есть ли таблица stations
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='stations'", (err, row) => {
            if (err) {
                console.error('❌ Ошибка проверки таблиц:', err.message);
                return;
            }
            
            if (!row) {
                // Таблиц нет — создаём
                console.log('⚠️ Таблицы не найдены, создаём...');
                createTablesAndAddStations();
            } else {
                // Таблицы есть — проверяем, пустые ли они
                db.get('SELECT COUNT(*) as count FROM stations', (err, countRow) => {
                    if (err) {
                        console.error('❌ Ошибка подсчёта станций:', err.message);
                        return;
                    }
                    if (countRow.count === 0) {
                        console.log('⚠️ Таблицы есть, но станций нет — добавляем...');
                        addMyStations();
                    } else {
                        console.log(`✅ Таблицы есть, станций: ${countRow.count}`);
                    }
                });
            }
        });
    });
}

function createTablesAndAddStations() {
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
            available INTEGER DEFAULT 1,
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
                console.log(`✅ Добавлена АЗС: ${s[0]} (${s[1]})`);
            }
        });
    });
    
    stmt.finalize(() => {
        console.log(`✅ ГОТОВО! Добавлено ${added} заправок.`);
    });
}

initDB();

// ============================================================
// API МАРШРУТЫ
// ============================================================

// ----- ПОЛУЧИТЬ ВСЕ АЗС -----
app.get('/api/gas-stations', (req, res) => {
    db.all(`
        SELECT s.*, 
               GROUP_CONCAT(json_object('fuel_type', f.fuel_type, 'price', f.price, 'available', f.available)) as fuel_stock_json
        FROM stations s
        LEFT JOIN fuel_stock f ON s.id = f.station_id
        GROUP BY s.id
    `, (err, rows) => {
        if (err) {
            console.error('❌ Ошибка получения станций:', err);
            return res.status(500).json({ error: err.message });
        }
        const stations = rows.map(row => {
            const fuelStock = row.fuel_stock_json ? JSON.parse(`[${row.fuel_stock_json}]`) : [];
            return {
                ...row,
                fuel_stock: [fuelStock],
                fuel_stock_json: undefined
            };
        });
        res.json(stations);
    });
});

// ----- ОТПРАВИТЬ ОТЧЁТ -----
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
            db.run(`UPDATE stations SET ${updates.join(', ')} WHERE id = ?`, params, (err) => {
                if (err) console.error('❌ Ошибка обновления stations:', err);
            });
        }

        if (fuel_type) {
            if (report_type === 'price' && price !== undefined && price !== null) {
                db.run(`
                    UPDATE fuel_stock SET price = ? 
                    WHERE station_id = ? AND fuel_type = ?
                `, [price, station_id, fuel_type], function(err) {
                    if (err) {
                        console.error('❌ Ошибка обновления цены:', err);
                    } else if (this.changes === 0) {
                        db.run(`
                            INSERT INTO fuel_stock (station_id, fuel_type, price, available)
                            VALUES (?, ?, ?, ?)
                        `, [station_id, fuel_type, price, 1]);
                    }
                });
            }
            
            if (report_type === 'availability' && availability !== undefined && availability !== null) {
                db.run(`
                    UPDATE fuel_stock SET available = ? 
                    WHERE station_id = ? AND fuel_type = ?
                `, [availability, station_id, fuel_type], function(err) {
                    if (err) {
                        console.error('❌ Ошибка обновления availability:', err);
                    } else if (this.changes === 0) {
                        db.run(`
                            INSERT INTO fuel_stock (station_id, fuel_type, price, available)
                            VALUES (?, ?, ?, ?)
                        `, [station_id, fuel_type, 0, availability]);
                    }
                });
            }
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
