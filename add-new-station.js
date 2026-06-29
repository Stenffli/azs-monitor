const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./gas_stations.db');

const newStation = {
  name: 'Лукойл (Пролетарская ул., 9/16)',
  network: 'Лукойл',
  address: 'Пролетарская ул., 9/16',
  lat: 45.246920,
  lon: 38.100739
};

db.run(`
  INSERT OR IGNORE INTO gas_stations (name, network, address, latitude, longitude)
  VALUES (?, ?, ?, ?, ?)
`, [newStation.name, newStation.network, newStation.address, newStation.lat, newStation.lon], function(err) {
  if (err) {
    console.error('❌ Ошибка добавления:', err.message);
  } else if (this.changes === 0) {
    console.log('⚠️ АЗС уже существует');
  } else {
    console.log('✅ Добавлена АЗС:', newStation.name);
    
    // Добавляем топливо для новой АЗС
    db.run(`
      INSERT INTO fuel_stock (station_id, fuel_type, price, availability)
      SELECT last_insert_rowid(), 'АИ-95', 75.85, 1
      UNION ALL
      SELECT last_insert_rowid(), 'АИ-92', 58.35, 1
      UNION ALL
      SELECT last_insert_rowid(), 'ДТ', 82.99, 1
    `);
  }
  db.close();
});
