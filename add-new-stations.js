const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./gas_stations.db');

// ===== СПИСОК НОВЫХ АЗС (которых ещё нет в базе) =====
const newStations = [
  // Новороссийск
  { name: 'Лукойл (ул. Ленина, 1)', network: 'Лукойл', address: 'ул. Ленина, 1', lat: 44.7242, lon: 37.7698 },
  { name: 'Лукойл (пр. Ленина, 2)', network: 'Лукойл', address: 'пр. Ленина, 2', lat: 44.7267, lon: 37.7723 },
  { name: 'Лукойл (ул. Советов, 15)', network: 'Лукойл', address: 'ул. Советов, 15', lat: 44.7198, lon: 37.7653 },
  { name: 'Лукойл (ул. Энгельса, 33)', network: 'Лукойл', address: 'ул. Энгельса, 33', lat: 44.7258, lon: 37.7603 },
  { name: 'Роснефть (ул. Кутузова, 8)', network: 'Роснефть', address: 'ул. Кутузова, 8', lat: 44.7278, lon: 37.7623 },
  { name: 'Роснефть (ул. Краснодарская, 2)', network: 'Роснефть', address: 'ул. Краснодарская, 2', lat: 44.7148, lon: 37.7803 },
  { name: 'Газпромнефть (ул. Ленина, 8)', network: 'Газпромнефть', address: 'ул. Ленина, 8', lat: 44.7248, lon: 37.7713 },
  { name: 'Газпромнефть (ул. Советов, 22)', network: 'Газпромнефть', address: 'ул. Советов, 22', lat: 44.7178, lon: 37.7683 },
  { name: 'Shell (ул. Мира, 12)', network: 'Shell', address: 'ул. Мира, 12', lat: 44.7238, lon: 37.7763 },
  { name: 'Shell (ул. Толстого, 25)', network: 'Shell', address: 'ул. Толстого, 25', lat: 44.7223, lon: 37.7693 },
  { name: 'BP (ул. Ленина, 45)', network: 'BP', address: 'ул. Ленина, 45', lat: 44.7283, lon: 37.7703 },
  { name: 'Транснефть (ул. Молодежная, 3)', network: 'Транснефть', address: 'ул. Молодежная, 3', lat: 44.7208, lon: 37.7733 },

  // Новые Славянские
  { name: 'Лукойл (А-289, Прикубанское с/п)', network: 'Лукойл', address: 'А-289, Прикубанское с/п', lat: 45.211699, lon: 38.116785 },
  { name: 'Rusoil (Строительная ул., 34)', network: 'Rusoil', address: 'Строительная ул., 34', lat: 45.286945, lon: 38.096787 },
  { name: 'АГЗС (Прибрежное с/п)', network: 'АГЗС', address: 'Прибрежное с/п, Славянский р-н', lat: 45.286423, lon: 38.097739 }
];

// ============================================================
// ДОБАВЛЕНИЕ
// ============================================================
db.serialize(() => {
  let added = 0;
  let skipped = 0;

  newStations.forEach(station => {
    db.get(
      "SELECT id FROM gas_stations WHERE name = ? AND latitude = ?",
      [station.name, station.lat],
      (err, row) => {
        if (err) {
          console.log('❌ Ошибка:', err.message);
          return;
        }

        if (row) {
          console.log(`⏩ Пропущено (уже есть): ${station.name}`);
          skipped++;
          return;
        }

        db.run(
          `INSERT INTO gas_stations (name, network, address, latitude, longitude) VALUES (?, ?, ?, ?, ?)`,
          [station.name, station.network, station.address, station.lat, station.lon],
          function(err) {
            if (err) {
              console.log('❌ Ошибка добавления:', err.message);
              return;
            }

            const stationId = this.lastID;
            console.log(`✅ Добавлена: ${station.name}`);

            db.run(`INSERT INTO fuel_stock (station_id, fuel_type, price) VALUES (?, 'АИ-95', 75.85)`, [stationId]);
            db.run(`INSERT INTO fuel_stock (station_id, fuel_type, price) VALUES (?, 'АИ-92', 58.35)`, [stationId]);
            db.run(`INSERT INTO fuel_stock (station_id, fuel_type, price) VALUES (?, 'ДТ', 82.99)`, [stationId]);

            added++;
          }
        );
      }
    );
  });

  setTimeout(() => {
    db.close(() => {
      console.log(`\n✅ Готово! Добавлено: ${added}, пропущено: ${skipped}`);
      console.log('🔄 Перезапусти сервер: node server.js');
    });
  }, 2000);
});