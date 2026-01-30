const { createProxyMiddleware } = require('http-proxy-middleware');
const config = require('../config');

const proxyOptions = (target) => ({
  target,
  changeOrigin: true,
  onError(err, req, res) {
    res.status(502).json({ error: 'Bad Gateway', type: 'GatewayError' });
  },
});

function registerProxies(app) {
  app.use('/api/auth', createProxyMiddleware({ ...proxyOptions(config.services.auth), pathRewrite: { '^/api/auth': '/api/auth' } }));
  app.use('/api/products', createProxyMiddleware({ ...proxyOptions(config.services.product), pathRewrite: { '^/api/products': '/api/products' } }));
  app.use('/api/comments', createProxyMiddleware({ ...proxyOptions(config.services.comments), pathRewrite: { '^/api/comments': '/api/comments' } }));
  app.use('/api/payments', createProxyMiddleware({ ...proxyOptions(config.services.payment), pathRewrite: { '^/api/payments': '/api/payments' } }));
  app.use('/api/orders', createProxyMiddleware({ ...proxyOptions(config.services.order), pathRewrite: { '^/api/orders': '/api/orders' } }));
}

module.exports = { registerProxies };
