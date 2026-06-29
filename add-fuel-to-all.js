const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./gas_stations.db');

const fuelTypes = ['АИ-95', 'АИ-92', 'ДТ'];
const defaultPrices = { 'АИ-95': 75.85, 'АИ-92': 58.35, 'ДТ': 82.99 };

db.serialize(() => {
  db.all("SELECT id FROM gas_stations", (err, rows) => {
    if (err) {
      console.log('❌ Ошибка:', err.message);
      db.close();
      return;
    }

    let total = 0;
    rows.forEach(station => {
      fuelTypes.forEach(fuel => {
        db.run(
          `INSERT OR IGNORE INTO fuel_stock (station_id, fuel_type, price) VALUES (?, ?, ?)`,
          [station.id, fuel, defaultPrices[fuel]],
          function(err) {
            if (err) {
              console.log('❌ Ошибка:', err.message);
            } else if (this.changes > 0) {
              total++;
            }
          }
        );
      });
    });

    setTimeout(() => {
      db.close(() => {
        console.log(`✅ Добавлено топливо для ${total} записей`);
        console.log('🔄 Перезапусти сервер: node server.js');
      });
    }, 2000);
  });
});