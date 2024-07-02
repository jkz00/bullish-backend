const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Configurazione di Sequelize per PostgreSQL
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectModule: pg,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Necessario per evitare errori con certificati self-signed
    }
  }
});

// Autenticazione alla connessione del database
sequelize.authenticate()
  .then(() => console.log('Connected to Database'))
  .catch(err => console.error('Unable to connect to the database:', err));

// Definizione del modello 'Sale'
const Sale = sequelize.define('Sale', {
  drink: {
    type: DataTypes.STRING,
    allowNull: false
  },
  time: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

// Sincronizzazione del modello con il database
sequelize.sync();

app.use(cors({
  origin: ['http://localhost:3000', 'https://bullish-bar.vercel.app']
}));
app.use(bodyParser.json());

// Rotte per l'applicazione
app.post('/sales', async (req, res) => {
  const { drink } = req.body;
  const currentTime = new Date().toISOString();
  try {
    const newSale = await Sale.create({ drink, time: currentTime });
    res.status(200).json(newSale);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/sales', async (req, res) => {
  try {
    const sales = await Sale.findAll();
    res.status(200).json(sales);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/clear', async (req, res) => {
  try {
    await Sale.destroy({ where: {}, truncate: true });
    res.status(200).json({ message: 'Database cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
