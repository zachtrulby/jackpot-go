const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const tradingEngine = require('../trading/engine');
router.get('/', (req, res) => {
  const signals = Array.from(tradingEngine.activeOrders.values());
  res.json({ status: 'success', data: signals });
});
router.get('/:symbol', (req, res) => {
  const { symbol } = req.params;
  const signal = tradingEngine.activeOrders.get(symbol);
  if (!signal) {
    return res.status(404).json({ status: 'error', message: 'Signal not found' });
  }
  res.json({ status: 'success', data: signal });
});
router.post('/create', async (req, res) => {
  const { symbol, action, confidence } = req.body;
  if (!symbol || !action || !confidence) {
    return res.status(400).json({ status: 'error', message: 'Symbol, action, and confidence are required' });
  }
  try {
    const signal = await tradingEngine.createSignal(symbol, action, confidence);
    res.json({ status: 'success', data: signal });
  } catch (error) {
    logger.error('Failed to create signal:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});
router.post('/execute', async (req, res) => {
  const { symbol, action } = req.body;
  if (!symbol || !action) {
    return res.status(400).json({ status: 'error', message: 'Symbol and action are required' });
  }
  try {
    const result = await tradingEngine.executeSignal(symbol, action);
    res.json({ status: 'success', data: result });
  } catch (error) {
    logger.error('Failed to execute signal:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});
router.get('/history', async (req, res) => {
  try {
    const history = await tradingEngine.getSignalHistory();
    res.json({ status: 'success', data: history });
  } catch (error) {
    logger.error('Failed to fetch signal history:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});
router.use((err, req, res, next) => {
  logger.error('Signal Route Error:', err);
  res.status(500).json({ status: 'error', message: 'Internal Server Error' });
});
module.exports = router;
