const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const db = new sqlite3.Database('./gas_stations.db');

// ============================================================
// ВСЕ АЗС
// ============================================================
const STATIONS = [
  // ===== КРАСНОДАР =====
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

  // ===== СЛАВЯНСК-НА-КУБАНИ =====
  { name: 'Роснефть (Красная ул., 141)', network: 'Роснефть', address: 'Красная ул., 141', lat: 45.248870, lon: 38.098440 },
  { name: 'Роснефть (Маевское ш., 25)', network: 'Роснефть', address: 'Маевское ш., 25', lat: 45.238155, lon: 38.150282 },
  { name: 'Панда (Рыночная ул., 295)', network: 'Панда', address: 'Рыночная ул., 295', lat: 45.273980, lon: 38.094515 },
  { name: 'Газпромнефть (Пролетарская ул., 1Д)', network: 'Газпромнефть', address: 'Пролетарская ул., 1Д', lat: 45.233658, lon: 38.109846 },
  { name: 'Rusoil (ул. Дружбы Народов, 65/1)', network: 'Rusoil', address: 'ул. Дружбы Народов, 65/1', lat: 45.221889, lon: 38.109681 },
  { name: 'Роснефть (Артиллерийский пр., 1)', network: 'Роснефть', address: 'Артиллерийский пр., 1', lat: 45.228900, lon: 38.113922 },
  { name: 'Лукойл (Славянск-на-Кубани)', network: 'Лукойл', address: 'Славянск-на-Кубани', lat: 45.212501, lon: 38.119253 },
  { name: 'Rusoil (Маевское с/п)', network: 'Rusoil', address: 'Маевское с/п', lat: 45.217346, lon: 38.167217 },
  { name: 'Ника (ул. Дружбы Народов, 5)', network: 'Ника', address: 'ул. Дружбы Народов, 5', lat: 45.236255, lon: 38.141647 },
  { name: 'Лукойл (Пролетарская ул., 9/16)', network: 'Лукойл', address: 'Пролетарская ул., 9/16', lat: 45.246920, lon: 38.100739 },

  // ===== НОВЫЕ АЗС (СЛАВЯНСКИЙ РАЙОН) =====
  { name: 'Газпромнефть (Рисовое с/п)', network: 'Газпромнефть', address: 'Рисовое сельское поселение', lat: 45.228316, lon: 37.947956 },
  { name: 'АГЗС (Анастасиевская)', network: 'АГЗС', address: 'Анастасиевское с/п, ст. Анастасиевская', lat: 45.225126, lon: 37.930215 },
  { name: 'Роснефть (Анастасиевская, Красная ул., 1Г)', network: 'Роснефть', address: 'Красная ул., 1Г, ст. Анастасиевская', lat: 45.222693, lon: 37.924687 },
  { name: 'Роснефть (Коржевский, Краснодарская ул., 48/1)', network: 'Роснефть', address: 'Краснодарская ул., 48/1, х. Коржевский', lat: 45.200071, lon: 37.727744 },
  { name: 'Pnb (Коржевский, Краснодарская ул., 61)', network: 'Pnb', address: 'Краснодарская ул., 61, х. Коржевский', lat: 45.195715, lon: 37.706471 },
  { name: 'Лукойл (Коржевский, Краснодарская ул., 152)', network: 'Лукойл', address: 'Краснодарская ул., 152, х. Коржевский', lat: 45.195723, lon: 37.702409 }
];

// ============================================================
// ИНИЦИАЛИЗАЦИЯ БД
// ============================================================
async function initDB() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS gas_stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT, network TEXT, address TEXT,
      latitude REAL, longitude REAL,
      queue_length INTEGER DEFAULT 0,
      tanker_active INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS fuel_stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      station_id INTEGER,
      fuel_type TEXT,
      price REAL,
      availability INTEGER DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(station_id, fuel_type)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS user_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      station_id INTEGER,
      user_name TEXT,
      report_type TEXT,
      fuel_type TEXT,
      price REAL,
      queue_length INTEGER,
      availability INTEGER,
      tanker_active INTEGER DEFAULT 0,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      verified INTEGER DEFAULT 0,
      FOREIGN KEY (station_id) REFERENCES gas_stations(id)
    )`);

    db.get("SELECT COUNT(*) as count FROM gas_stations", (err, row) => {
      if (row.count === 0) {
        const stmt = db.prepare(`INSERT INTO gas_stations (name, network, address, latitude, longitude) VALUES (?, ?, ?, ?, ?)`);
        STATIONS.forEach(s => stmt.run(s.name, s.network, s.address, s.lat, s.lon));
        stmt.finalize();

        db.run(`INSERT INTO fuel_stock (station_id, fuel_type, price, availability) SELECT id, 'АИ-95', 75.85, 1 FROM gas_stations`);
        db.run(`INSERT INTO fuel_stock (station_id, fuel_type, price, availability) SELECT id, 'АИ-92', 58.35, 1 FROM gas_stations`);
        db.run(`INSERT INTO fuel_stock (station_id, fuel_type, price, availability) SELECT id, 'ДТ', 82.99, 1 FROM gas_stations`);

        console.log(`✅ Добавлено ${STATIONS.length} АЗС и топливо`);
      } else {
        console.log(`📊 В базе уже есть ${row.count} АЗС`);
      }
    });
  });
}

// ============================================================
// API
// ============================================================
app.get('/api/gas-stations', (req, res) => {
  db.all(`
    SELECT gs.*, 
           json_group_array(
               json_object('fuel_type', fs.fuel_type, 'price', fs.price, 'availability', fs.availability)
           ) as fuel_stock
    FROM gas_stations gs
    LEFT JOIN fuel_stock fs ON gs.id = fs.station_id
    GROUP BY gs.id
  `, (err, rows) => {
    if (err) {
      console.error('❌ Ошибка получения станций:', err);
      return res.status(500).json({ error: err.message });
    }
    const stations = rows.map(row => {
      let fuelStock = [];
      if (row.fuel_stock) {
        try {
          fuelStock = JSON.parse(row.fuel_stock);
          fuelStock = fuelStock.filter(f => f !== null);
        } catch (e) {
          fuelStock = [];
        }
      }
      return {
        ...row,
        fuel_stock: fuelStock,
        fuel_stock_raw: undefined
      };
    });
    res.json(stations);
  });
});

app.post('/api/report', (req, res) => {
  const {
    station_id, user_name, report_type, fuel_type,
    price, queue_length, availability, tanker_active, description
  } = req.body;

  if (!station_id || !report_type) {
    return res.status(400).json({ error: 'station_id и report_type обязательны' });
  }

  db.run(`
    INSERT INTO user_reports (
      station_id, user_name, report_type, fuel_type,
      price, queue_length, availability, tanker_active, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [station_id, user_name || 'Аноним', report_type, fuel_type || null,
    price || null, queue_length || null, availability || null, tanker_active || 0, description || null
  ], function(err) {
    if (err) return res.status(500).json({ error: err.message });

    if (report_type === 'price' && price && fuel_type) {
      db.run(`
        INSERT INTO fuel_stock (station_id, fuel_type, price, availability)
        VALUES (?, ?, ?, 1)
        ON CONFLICT(station_id, fuel_type)
        DO UPDATE SET price = ?, updated_at = CURRENT_TIMESTAMP
      `, [station_id, fuel_type, price, price]);
    }

    if (report_type === 'availability' && availability !== undefined && fuel_type) {
      db.run(`
        INSERT INTO fuel_stock (station_id, fuel_type, price, availability)
        VALUES (?, ?, (SELECT price FROM fuel_stock WHERE station_id = ? AND fuel_type = ?), ?)
        ON CONFLICT(station_id, fuel_type)
        DO UPDATE SET availability = ?, updated_at = CURRENT_TIMESTAMP
      `, [station_id, fuel_type, station_id, fuel_type, availability, availability]);
    }

    if (report_type === 'queue' && queue_length !== undefined) {
      db.run(`UPDATE gas_stations SET queue_length = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [queue_length, station_id]);
    }

    if (report_type === 'tanker') {
      db.run(`UPDATE gas_stations SET tanker_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [tanker_active || 0, station_id]);
    }

    db.run(`UPDATE gas_stations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [station_id]);

    res.json({ success: true, id: this.lastID, message: 'Спасибо! Ваш отчёт отправлен.' });
  });
});

// ============================================================
// МАРШРУТ ДЛЯ ПОЛУЧЕНИЯ ОТЧЁТОВ (КОММЕНТАРИИ + ГРАФИКИ)
// ============================================================
app.get('/api/reports/:stationId', (req, res) => {
  const { stationId } = req.params;
  db.all(
    `SELECT * FROM user_reports 
     WHERE station_id = ? 
     ORDER BY created_at DESC 
     LIMIT 50`,
    [stationId],
    (err, rows) => {
      if (err) {
        console.error('❌ Ошибка получения отчётов:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// ============================================================
// ЗАПУСК
// ============================================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  await initDB();
});
