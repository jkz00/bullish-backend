const express = require('express');
const betterSqlite3 = require('better-sqlite3');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const dbPath = process.env.DATABASE_URL || path.resolve(__dirname, 'db.sqlite');
const db = betterSqlite3(dbPath);

const corsOptions = {
  origin: ['http://localhost:3000', 'https://bullish-bar.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(bodyParser.json());

db.exec(`
  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    drink TEXT,
    time TEXT
  )
`);

app.post('/sales', (req, res) => {
  const { drink } = req.body;
  const currentTime = new Date().toISOString();
  const stmt = db.prepare('INSERT INTO sales (drink, time) VALUES (?, ?)');
  const info = stmt.run(drink, currentTime);
  res.status(200).send({ id: info.lastInsertRowid, drink, time: currentTime });
});

app.get('/sales', (req, res) => {
  const stmt = db.prepare('SELECT * FROM sales');
  const rows = stmt.all();
  res.status(200).json(rows);
});

app.get('/export', (req, res) => {
  res.download(dbPath, 'sales_data.sqlite', (err) => {
    if (err) {
      return res.status(500).send(err.message);
    }
  });
});

app.delete('/clear', (req, res) => {
  const stmt = db.prepare('DELETE FROM sales');
  stmt.run();
  res.status(200).send({ message: 'Database cleared' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});