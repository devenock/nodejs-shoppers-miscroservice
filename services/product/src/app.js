const express = require('express');
const mongoose = require('mongoose');
const productRoutes = require('./routes/product.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'product' }));
app.get('/health/ready', async (req, res) => {
  const dbOk = mongoose.connection.readyState === 1;
  res.status(dbOk ? 200 : 503).json({ ready: dbOk });
});
app.get('/health/live', (req, res) => res.status(200).json({ live: true }));

app.use('/api/products', productRoutes);
app.use(errorHandler);

module.exports = app;
