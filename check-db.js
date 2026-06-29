const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./gas_stations.db');

db.serialize(() => {
  // Проверяем количество АЗС
  db.get("SELECT COUNT(*) as count FROM gas_stations", (err, row) => {
    if (err) {
      console.log('❌ Ошибка:', err.message);
      return;
    }
    console.log(`📊 Всего АЗС: ${row.count}`);
  });

  // Проверяем количество записей топлива
  db.get("SELECT COUNT(*) as count FROM fuel_stock", (err, row) => {
    if (err) {
      console.log('❌ Ошибка:', err.message);
      return;
    }
    console.log(`⛽ Всего записей топлива: ${row.count}`);
  });

  // Показываем топливо для первых 5 АЗС
  db.all(`
    SELECT gs.id, gs.name, fs.fuel_type, fs.price 
    FROM gas_stations gs
    LEFT JOIN fuel_stock fs ON gs.id = fs.station_id
    LIMIT 15
  `, (err, rows) => {
    if (err) {
      console.log('❌ Ошибка:', err.message);
      return;
    }
    console.log('\n📋 Примеры АЗС с топливом:');
    rows.forEach(row => {
      console.log(`${row.id}: ${row.name} → ${row.fuel_type || 'НЕТ ТОПЛИВА!'} ${row.price || ''}`);
    });
    db.close();
  });
});