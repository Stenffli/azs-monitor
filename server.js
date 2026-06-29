const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const db = new sqlite3.Database('./gas_stations.db');

// ============================================================
// ВСЕ АЗС (СЛАВЯНСК + НОВОРОССИЙСК)
// ============================================================
const STATIONS = [
  // ===== СЛАВЯНСК-НА-КУБАНИ И РАЙОН =====
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
  { name: 'Газпромнефть (Рисовое с/п)', network: 'Газпромнефть', address: 'Рисовое сельское поселение', lat: 45.228316, lon: 37.947956 },
  { name: 'АГЗС (Анастасиевская)', network: 'АГЗС', address: 'Анастасиевское с/п, ст. Анастасиевская', lat: 45.225126, lon: 37.930215 },
  { name: 'Роснефть (Анастасиевская, Красная ул., 1Г)', network: 'Роснефть', address: 'Красная ул., 1Г, ст. Анастасиевская', lat: 45.222693, lon: 37.924687 },
  { name: 'Роснефть (Коржевский, Краснодарская ул., 48/1)', network: 'Роснефть', address: 'Краснодарская ул., 48/1, х. Коржевский', lat: 45.200071, lon: 37.727744 },
  { name: 'Pnb (Коржевский, Краснодарская ул., 61)', network: 'Pnb', address: 'Краснодарская ул., 61, х. Коржевский', lat: 45.195715, lon: 37.706471 },
  { name: 'Лукойл (Коржевский, Краснодарская ул., 152)', network: 'Лукойл', address: 'Краснодарская ул., 152, х. Коржевский', lat: 45.195723, lon: 37.702409 },

  // ===== НОВОРОССИЙСК =====
  { name: 'Уфимнефть (Владимировка, 1)', network: 'Уфимнефть', address: 'Краснодарский край, городской округ Новороссийск, село Владимировка', lat: 44.787138, lon: 37.673779 },
  { name: 'Уфимнефть (Владимировка, ул. Кирова, 4ГК)', network: 'Уфимнефть', address: 'ул. Кирова, 4ГК, село Владимировка', lat: 44.784806, lon: 37.678516 },
  { name: 'Rusoil (Цемдолина)', network: 'Rusoil', address: 'Новороссийск, село Цемдолина', lat: 44.772916, lon: 37.694304 },
  { name: 'Газпромнефть (Гайдук)', network: 'Газпромнефть', address: 'городской округ Новороссийск, село Гайдук', lat: 44.773570, lon: 37.694965 },
  { name: 'Галеас (Промышленная ул., 3)', network: 'Галеас', address: 'Промышленная ул., 3, территория Цемдолина', lat: 44.769144, lon: 37.710786 },
  { name: 'Лукойл (ул. Ленина, 171)', network: 'Лукойл', address: 'ул. Ленина, 171, территория Цемдолина', lat: 44.766989, lon: 37.710494 },
  { name: 'Роснефть (ул. Ленина, Цемдолина)', network: 'Роснефть', address: 'территория Цемдолина, улица Ленина', lat: 44.766716, lon: 37.711791 },
  { name: 'Уфимнефть (Цемдолина, ул. Ленина)', network: 'Уфимнефть', address: 'Новороссийск, село Цемдолина, улица Ленина', lat: 44.749637, lon: 37.727491 },
  { name: 'Роснефть (ул. Ленина, 7А)', network: 'Роснефть', address: 'ул. Ленина, 7А, территория Цемдолина', lat: 44.747397, lon: 37.726272 },
  { name: 'Лукойл (ул. Ленина, 2)', network: 'Лукойл', address: 'ул. Ленина, 2, территория Цемдолина', lat: 44.743975, lon: 37.725734 },
  { name: 'АЗС (Анапское ш., 53А)', network: 'АЗС', address: 'Анапское ш., 53А', lat: 44.736722, lon: 37.741850 },
  { name: 'Экспорт Плюс (Шиллеровская ул., 2)', network: 'Экспорт Плюс', address: 'Шиллеровская ул., 2, Новороссийск', lat: 44.728824, lon: 37.761649 },
  { name: 'Роснефть (Центральный район)', network: 'Роснефть', address: 'Новороссийск, Центральный район', lat: 44.695566, lon: 37.762245 },
  { name: 'Уфимнефть (Малоземельская ул., 16А)', network: 'Уфимнефть', address: 'Малоземельская ул., 16А, Новороссийск', lat: 44.689782, lon: 37.767685 },
  { name: 'Лукойл (ул. Куникова)', network: 'Лукойл', address: 'Новороссийск, улица Куникова', lat: 44.692490, lon: 37.774436 },
  { name: 'Лукойл (Суворовская ул., 54)', network: 'Лукойл', address: 'Суворовская ул., 54, Новороссийск', lat: 44.694575, lon: 37.787735 },
  { name: 'Уфимнефть (наб. Адмирала Серебрякова, 83)', network: 'Уфимнефть', address: 'наб. Адмирала Серебрякова, 83, Новороссийск', lat: 44.689761, lon: 37.793869 },
  { name: 'Роснефть (просп. Дзержинского, 188)', network: 'Роснефть', address: 'просп. Дзержинского, 188, Новороссийск', lat: 44.683997, lon: 37.780944 },
  { name: 'Лукойл (просп. Дзержинского, 211А/1)', network: 'Лукойл', address: 'просп. Дзержинского, 211А/1, Новороссийск', lat: 44.680927, lon: 37.779456 },
  { name: 'Уфимнефть (просп. Дзержинского, 227)', network: 'Уфимнефть', address: 'просп. Дзержинского, 227', lat: 44.675314, lon: 37.779609 }
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
