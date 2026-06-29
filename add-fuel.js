const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'gas_stations.db');

if (!fs.existsSync(DB_PATH)) {
    console.log('❌ База данных не найдена!');
    process.exit(1);
}

const db = new sqlite3.Database(DB_PATH);

// Добавляем топливо для всех АЗС, у которых его нет
const fuelTypes = ['АИ-92', 'АИ-95', 'АИ-98', 'АИ-100', 'ДТ', '95*', 'ДТ*'];

db.all('SELECT id FROM stations', (err, stations) => {
    if (err) {
        console.error('❌ Ошибка получения станций:', err);
        return;
    }
    
    stations.forEach(station => {
        fuelTypes.forEach(fuel => {
            db.run(`
                INSERT OR IGNORE INTO fuel_stock (station_id, fuel_type, price, available)
                VALUES (?, ?, ?, ?)
            `, [station.id, fuel, 0, 1]);
        });
    });
    
    console.log(`✅ Топливо добавлено для ${stations.length} АЗС`);
    db.close();
});
