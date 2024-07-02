const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const db = new sqlite3.Database(process.env.DATABASE_URL || path.resolve(__dirname, 'db.sqlite'));

app.use(cors({
  origin: ['http://localhost:3000', 'https://bullish-bar.vercel.app']
}));
app.use(bodyParser.json());

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    drink TEXT,
    time TEXT
  )`);
});

app.post('/sales', (req, res) => {
  const { drink } = req.body;
  const currentTime = new Date().toISOString();
  db.run(`INSERT INTO sales (drink, time) VALUES (?, ?)`, [drink, currentTime], function(err) {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.status(200).send({ id: this.lastID, drink, time: currentTime });
  });
});

app.get('/sales', (req, res) => {
  db.all(`SELECT * FROM sales`, [], (err, rows) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.status(200).json(rows);
  });
});

app.get('/export', (req, res) => {
  const filePath = path.resolve(__dirname, process.env.DATABASE_URL || 'db.sqlite');
  res.download(filePath, 'sales_data.sqlite', (err) => {
    if (err) {
      return res.status(500).send(err.message);
    }
  });
});

app.delete('/clear', (req, res) => {
  db.run(`DELETE FROM sales`, [], function(err) {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.status(200).send({ message: 'Database cleared' });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});