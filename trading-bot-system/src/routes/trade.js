const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const tradingEngine = require('../trading/engine');
router.get('/', (req, res) => {
  const trades = Array.from(tradingEngine.activeOrders.values());
  res.json({ status: 'success', data: trades });
});
router.get('/:tradeId', (req, res) => {
  const { tradeId } = req.params;
  const trade = tradingEngine.activeOrders.get(parseInt(tradeId));
  if (!trade) {
    return res.status(404).json({ status: 'error', message: 'Trade not found' });
  }
  res.json({ status: 'success', data: trade });
});
router.post('/execute', async (req, res) => {
  const { symbol, side, quantity, price } = req.body;
  if (!symbol || !side || !quantity || !price) {
    return res.status(400).json({ status: 'error', message: 'Symbol, side, quantity, and price are required' });
  }
  try {
    const trade = await tradingEngine.executeTrade(symbol, side, quantity, price);
    res.json({ status: 'success', data: trade });
  } catch (error) {
    logger.error('Failed to execute trade:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});
router.post('/cancel', async (req, res) => {
  const { tradeId } = req.body;
  if (!tradeId) {
    return res.status(400).json({ status: 'error', message: 'Trade ID is required' });
  }
  try {
    const result = await tradingEngine.cancelTrade(tradeId);
    res.json({ status: 'success', data: result });
  } catch (error) {
    logger.error('Failed to cancel trade:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});
router.get('/history', async (req, res) => {
  try {
    const history = await tradingEngine.getTradeHistory();
    res.json({ status: 'success', data: history });
  } catch (error) {
    logger.error('Failed to fetch trade history:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});
router.use((err, req, res, next) => {
  logger.error('Trade Route Error:', err);
  res.status(500).json({ status: 'error', message: 'Internal Server Error' });
});
module.exports = router;
