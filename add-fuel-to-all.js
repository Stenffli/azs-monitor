const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./gas_stations.db');

const fuelTypes = ['АИ-92', 'АИ-95', 'ДТ'];
const defaultPrices = { 'АИ-92': 58.35, 'АИ-95': 75.85, 'ДТ': 82.99 };

db.all('SELECT id FROM gas_stations', (err, stations) => {
  if (err) {
    console.error('❌ Ошибка получения АЗС:', err);
    return;
  }

  stations.forEach(station => {
    fuelTypes.forEach(fuel => {
      db.run(`
        INSERT OR IGNORE INTO fuel_stock (station_id, fuel_type, price, availability)
        VALUES (?, ?, ?, 1)
      `, [station.id, fuel, defaultPrices[fuel]]);
    });
  });

  console.log(`✅ Топливо добавлено для ${stations.length} АЗС`);
  db.close();
});
