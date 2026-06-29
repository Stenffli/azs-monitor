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
// ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ
// ============================================================
function initDB() {
    const exists = fs.existsSync(DB_PATH);
    db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) console.error('❌ Ошибка подключения к БД:', err.message);
        else console.log('✅ База данных подключена');
    });

    if (!exists) {
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
            if (err) console.error('❌ Ошибка создания таблиц:', err.message);
            else {
                console.log('✅ Таблицы созданы');
                const testStations = [
                    ['Роснефть (Красная ул., 141)', 'Красная ул., 141', 45.0448, 38.9760, 'Роснефть'],
                    ['Лукойл (ул. Северная, 12)', 'ул. Северная, 12', 45.0520, 38.9800, 'Лукойл'],
                    ['Газпромнефть (ул. Новороссийская, 25)', 'ул. Новороссийская, 25', 45.0350, 38.9600, 'Газпромнефть']
                ];
                const stmt = db.prepare('INSERT INTO stations (name, address, latitude, longitude, network) VALUES (?, ?, ?, ?, ?)');
                testStations.forEach(s => stmt.run(s, (err) => {
                    if (!err) console.log(`✅ Добавлена АЗС: ${s[0]}`);
                }));
                stmt.finalize();
            }
        });
    }
}

initDB();

// ============================================================
// ПОЛУЧЕНИЕ ВСЕХ АЗС (УПРОЩЁННАЯ ВЕРСИЯ)
// ============================================================
app.get('/api/gas-stations', (req, res) => {
    db.all('SELECT * FROM stations', (err, rows) => {
        if (err) {
            console.error('❌ Ошибка получения станций:', err);
            return res.status(500).json({ error: err.message });
        }
        // Добавляем пустой fuel_stock для совместимости с фронтендом
        const stations = rows.map(row => ({
            ...row,
            fuel_stock: [[]]
        }));
        res.json(stations);
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

        // Обновляем основные поля станции
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

        // Обновляем цену или наличие топлива
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
// ПОЛУЧЕНИЕ ОТЧЁТОВ ПО АЗС (ДЛЯ КОММЕНТАРИЕВ И ГРАФИКОВ)
// ============================================================
app.get('/api/reports/:stationId', (req, res) => {
    const { stationId } = req.params;
    db.all(`
        SELECT * FROM reports 
        WHERE station_id = ? 
        ORDER BY created_at DESC 
        LIMIT 50
    `, [stationId], (err, rows) => {
        if (err) {
            console.error('❌ Ошибка получения отчётов:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// ============================================================
// ЗАПУСК
// ============================================================
app.listen(PORT, () => {
    console.log(`✅ Сервер запущен на порту ${PORT}`);
});
