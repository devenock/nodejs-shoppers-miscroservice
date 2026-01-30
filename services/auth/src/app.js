const express = require('express');
const authRoutes = require('./routes/auth.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'auth' }));
app.get('/health/ready', async (req, res) => {
  const mongoose = require('mongoose');
  const dbOk = mongoose.connection.readyState === 1;
  res.status(dbOk ? 200 : 503).json({ ready: dbOk });
});
app.get('/health/live', (req, res) => res.status(200).json({ live: true }));

app.use('/api/auth', authRoutes);
app.use(errorHandler);

module.exports = app;