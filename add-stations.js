const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'gas_stations.db');

if (!fs.existsSync(DB_PATH)) {
    console.log('❌ База данных не найдена!');
    process.exit(1);
}

const db = new sqlite3.Database(DB_PATH);

// ===== ТВОИ ЗАПРАВКИ (СЛАВЯНСК-НА-КУБАНИ) =====
const stations = [
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

// ===== ДОБАВЛЯЕМ =====
const stmt = db.prepare('INSERT OR IGNORE INTO stations (name, address, latitude, longitude, network) VALUES (?, ?, ?, ?, ?)');

stations.forEach(s => {
    stmt.run(s, (err) => {
        if (err) console.error('❌ Ошибка:', err.message);
        else console.log(`✅ Добавлена АЗС: ${s[0]} (${s[1]})`);
    });
});

stmt.finalize();
db.close(() => {
    console.log('✅ ГОТОВО! Все 9 заправок добавлены в базу.');
});
