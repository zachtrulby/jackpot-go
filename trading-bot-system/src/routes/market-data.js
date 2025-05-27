const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const tradingEngine = require('../trading/engine');
router.get('/', (req, res) => {
  const marketData = Array.from(tradingEngine.marketData.values());
  res.json({ status: 'success', data: marketData });
});
router.get('/:symbol', (req, res) => {
  const { symbol } = req.params;
  const data = tradingEngine.marketData.get(symbol);
  if (!data) {
    return res.status(404).json({ status: 'error', message: 'Market data not found' });
  }
  res.json({ status: 'success', data });
});
router.post('/update', (req, res) => {
  const { symbol, price, volume } = req.body;
  if (!symbol || !price || !volume) {
    return res.status(400).json({ status: 'error', message: 'Symbol, price, and volume are required' });
  }
  tradingEngine.marketData.set(symbol, { symbol, price, volume, timestamp: new Date() });
  res.json({ status: 'success', message: 'Market data updated' });
});
router.delete('/:symbol', (req, res) => {
  const { symbol } = req.params;
  if (!tradingEngine.marketData.has(symbol)) {
    return res.status(404).json({ status: 'error', message: 'Market data not found' });
  }
  tradingEngine.marketData.delete(symbol);
  res.json({ status: 'success', message: 'Market data deleted' });
});
router.use((err, req, res, next) => {
  logger.error('Market Data Route Error:', err);
  res.status(500).json({ status: 'error', message: 'Internal Server Error' });
});
module.exports = router;
