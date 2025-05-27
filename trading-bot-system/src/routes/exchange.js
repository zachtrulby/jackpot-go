const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const tradingEngine = require('../trading/engine');
router.get('/', (req, res) => {
  const exchanges = Array.from(tradingEngine.exchanges.values());
  res.json({ status: 'success', data: exchanges });
});
router.get('/:exchangeId', (req, res) => {
  const { exchangeId } = req.params;
  const exchange = tradingEngine.exchanges.get(exchangeId);
  if (!exchange) {
    return res.status(404).json({ status: 'error', message: 'Exchange not found' });
  }
  res.json({ status: 'success', data: exchange });
});
router.post('/create', (req, res) => {
  const { name, type, apiKey, secret } = req.body;
  if (!name || !type || !apiKey || !secret) {
    return res.status(400).json({ status: 'error', message: 'Name, type, API key, and secret are required' });
  }
  const exchangeId = Date.now();
  tradingEngine.exchanges.set(exchangeId, { id: exchangeId, name, type, apiKey, secret });
  res.json({ status: 'success', message: 'Exchange created', exchangeId });
});
router.post('/update', (req, res) => {
  const { exchangeId, name, type, apiKey, secret } = req.body;
  const exchange = tradingEngine.exchanges.get(exchangeId);
  if (!exchange) {
    return res.status(404).json({ status: 'error', message: 'Exchange not found' });
  }
  exchange.name = name || exchange.name;
  exchange.type = type || exchange.type;
  exchange.apiKey = apiKey || exchange.apiKey;
  exchange.secret = secret || exchange.secret;
  res.json({ status: 'success', message: 'Exchange updated', data: exchange });
});
router.delete('/:exchangeId', (req, res) => {
  const { exchangeId } = req.params;
  if (!tradingEngine.exchanges.has(exchangeId)) {
    return res.status(404).json({ status: 'error', message: 'Exchange not found' });
  }
  tradingEngine.exchanges.delete(exchangeId);
  res.json({ status: 'success', message: 'Exchange deleted' });
});
router.get('/status', (req, res) => {
  const exchangeStatus = Array.from(tradingEngine.exchanges.values()).map(exchange => ({
    id: exchange.id,
    name: exchange.name,
    status: 'active' // Placeholder for actual status check
  }));
  res.json({ status: 'success', data: exchangeStatus });
});
router.use((err, req, res, next) => {
  logger.error('Exchange Route Error:', err);
  res.status(500).json({ status: 'error', message: 'Internal Server Error' });
});
module.exports = router;
