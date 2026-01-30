const express = require('express');
const mongoose = require('mongoose');
const commentRoutes = require('./routes/comment.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'comments' }));
app.get('/health/ready', async (req, res) => {
  const dbOk = mongoose.connection.readyState === 1;
  res.status(dbOk ? 200 : 503).json({ ready: dbOk });
});
app.get('/health/live', (req, res) => res.status(200).json({ live: true }));

app.use('/api/comments', commentRoutes);
app.use(errorHandler);

module.exports = app;
