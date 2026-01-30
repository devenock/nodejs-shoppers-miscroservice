const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { registerProxies } = require('./routes/proxy');
const { proxyAuth } = require('./middleware/proxyAuth');
const config = require('./config');

const app = express();

app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests' },
});
app.use(limiter);

app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'gateway' }));
app.get('/health/ready', (req, res) => res.status(200).json({ ready: true }));

app.use(proxyAuth);
registerProxies(app);

app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Internal server error', type: 'InternalError' });
});

module.exports = app;
