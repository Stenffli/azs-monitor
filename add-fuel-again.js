const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./gas_stations.db');

const fuelTypes = ['АИ-95', 'АИ-92', 'ДТ'];
const defaultPrices = { 'АИ-95': 75.85, 'АИ-92': 58.35, 'ДТ': 82.99 };

db.serialize(() => {
  // Получаем все АЗС
  db.all("SELECT id FROM gas_stations", (err, stations) => {
    if (err) {
      console.log('❌ Ошибка:', err.message);
      db.close();
      return;
    }

    console.log(`📊 Найдено ${stations.length} АЗС`);

    let added = 0;
    let skipped = 0;

    stations.forEach(station => {
      // Проверяем, есть ли у этой АЗС топливо
      db.get(
        "SELECT COUNT(*) as count FROM fuel_stock WHERE station_id = ?",
        [station.id],
        (err, row) => {
          if (err) {
            console.log('❌ Ошибка проверки:', err.message);
            return;
          }

          // Если топлива меньше 3 видов — добавляем недостающие
          const fuelCount = row.count;
          
          fuelTypes.forEach(fuel => {
            db.get(
              "SELECT id FROM fuel_stock WHERE station_id = ? AND fuel_type = ?",
              [station.id, fuel],
              (err, fuelRow) => {
                if (err) {
                  console.log('❌ Ошибка:', err.message);
                  return;
                }

                if (!fuelRow) {
                  // Топлива нет — добавляем
                  db.run(
                    `INSERT INTO fuel_stock (station_id, fuel_type, price, availability) VALUES (?, ?, ?, 1)`,
                    [station.id, fuel, defaultPrices[fuel]],
                    function(err) {
                      if (err) {
                        console.log('❌ Ошибка добавления:', err.message);
                      } else {
                        added++;
                        console.log(`✅ Добавлен ${fuel} для АЗС ${station.id}`);
                      }
                    }
                  );
                } else {
                  skipped++;
                }
              }
            );
          });
        }
      );
    });

    setTimeout(() => {
      db.close(() => {
        console.log(`\n✅ Готово! Добавлено: ${added}, пропущено: ${skipped}`);
        console.log('🔄 Перезапусти сервер: node server.js');
      });
    }, 3000);
  });
});