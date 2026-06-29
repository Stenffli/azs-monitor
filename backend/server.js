const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Создаём подключение к SQLite
const db = new sqlite3.Database('./gas_stations.db', (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
    initDatabase();
  }
});

// Инициализация базы данных
function initDatabase() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS gas_stations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        network TEXT,
        address TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        phone TEXT,
        queue_length INTEGER DEFAULT 0,
        has_shop INTEGER DEFAULT 0,
        has_cafe INTEGER DEFAULT 0,
        has_wc INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS fuel_stock (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        station_id INTEGER,
        fuel_type TEXT NOT NULL,
        price REAL NOT NULL,
        availability INTEGER DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (station_id) REFERENCES gas_stations(id),
        UNIQUE(station_id, fuel_type)
      )
    `);

    // Проверяем, есть ли данные
    db.get("SELECT COUNT(*) as count FROM gas_stations", (err, row) => {
      if (row.count === 0) {
        insertMockData();
      }
    });
  });
}

// Вставка тестовых данных
function insertMockData() {
  const stations = [
    {
      name: 'Лукойл №123',
      network: 'Лукойл',
      address: 'Краснодар, ул. Красная, 1',
      latitude: 45.0355,
      longitude: 38.9753,
      queue_length: 2,
      fuels: [
        { type: 'АИ-92', price: 52.50, available: 1 },
        { type: 'АИ-95', price: 56.80, available: 1 },
        { type: 'ДТ', price: 58.20, available: 1 }
      ]
    },
    {
      name: 'Роснефть №456',
      network: 'Роснефть',
      address: 'Краснодар, ул. Северная, 100',
      latitude: 45.0450,
      longitude: 38.9850,
      queue_length: 5,
      fuels: [
        { type: 'АИ-92', price: 52.30, available: 1 },
        { type: 'АИ-95', price: 56.50, available: 1 },
        { type: 'АИ-98', price: 62.00, available: 0 }
      ]
    },
    {
      name: 'Газпромнефть №789',
      network: 'Газпромнефть',
      address: 'Краснодар, ул. Красная, 200',
      latitude: 45.0250,
      longitude: 38.9650,
      queue_length: 1,
      fuels: [
        { type: 'АИ-92', price: 52.40, available: 1 },
        { type: 'АИ-95', price: 56.70, available: 1 },
        { type: 'ДТ', price: 58.00, available: 1 }
      ]
    }
  ];

  const insertStation = `
    INSERT INTO gas_stations (name, network, address, latitude, longitude, queue_length)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const insertFuel = `
    INSERT INTO fuel_stock (station_id, fuel_type, price, availability)
    VALUES (?, ?, ?, ?)
  `;

  db.serialize(() => {
    stations.forEach(station => {
      db.run(insertStation, [
        station.name,
        station.network,
        station.address,
        station.latitude,
        station.longitude,
        station.queue_length
      ], function(err) {
        if (err) {
          console.error('Error inserting station:', err);
          return;
        }
        
        const stationId = this.lastID;
        station.fuels.forEach(fuel => {
          db.run(insertFuel, [stationId, fuel.type, fuel.price, fuel.available]);
        });
      });
    });
  });

  console.log('✅ Mock data inserted');
}

// GET all gas stations
app.get('/api/gas-stations', (req, res) => {
  const query = `
    SELECT 
      gs.*,
      json_group_array(
        json_object(
          'fuel_type', fs.fuel_type,
          'price', fs.price,
          'availability', CASE WHEN fs.availability = 1 THEN 1 ELSE 0 END
        )
      ) as fuel_stock
    FROM gas_stations gs
    LEFT JOIN fuel_stock fs ON gs.id = fs.station_id
    GROUP BY gs.id
    ORDER BY gs.updated_at DESC
  `;

  db.all(query, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }

    const stations = rows.map(row => {
      return {
        ...row,
        fuel_stock: JSON.parse(`[${row.fuel_stock}]`)
      };
    });

    res.json(stations);
  });
});

// GET station by ID
app.get('/api/gas-stations/:id', (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT 
      gs.*,
      json_group_array(
        json_object(
          'fuel_type', fs.fuel_type,
          'price', fs.price,
          'availability', CASE WHEN fs.availability = 1 THEN 1 ELSE 0 END
        )
      ) as fuel_stock
    FROM gas_stations gs
    LEFT JOIN fuel_stock fs ON gs.id = fs.station_id
    WHERE gs.id = ?
    GROUP BY gs.id
  `;

  db.get(query, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Station not found' });
    }

    const station = {
      ...row,
      fuel_stock: JSON.parse(`[${row.fuel_stock}]`)
    };

    res.json(station);
  });
});

// GET fuel prices statistics
app.get('/api/fuel-prices/stats', (req, res) => {
  const query = `
    SELECT 
      fuel_type,
      AVG(price) as avg_price,
      MIN(price) as min_price,
      MAX(price) as max_price,
      COUNT(*) as stations_count
    FROM fuel_stock
    WHERE availability = 1
    GROUP BY fuel_type
  `;

  db.all(query, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('🔒 Database connection closed');
    process.exit(0);
  });
});