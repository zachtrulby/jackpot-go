const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const tradingEngine = require('../trading/engine');
router.get('/', (req, res) => {
  const portfolio = Array.from(tradingEngine.positions.values());
  res.json({ status: 'success', data: portfolio });
});
router.get('/:symbol', (req, res) => {
  const { symbol } = req.params;
  const position = tradingEngine.positions.get(symbol);
  if (!position) {
    return res.status(404).json({ status: 'error', message: 'Position not found' });
  }
  res.json({ status: 'success', data: position });
});
router.post('/add', async (req, res) => {
  const { symbol, quantity, price } = req.body;
  if (!symbol || !quantity || !price) {
    return res.status(400).json({ status: 'error', message: 'Symbol, quantity, and price are required' });
  }
  try {
    const position = await tradingEngine.addPosition(symbol, quantity, price);
    res.json({ status: 'success', data: position });
  } catch (error) {
    logger.error('Failed to add position:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});
router.post('/update', async (req, res) => {
  const { symbol, quantity, price } = req.body;
  if (!symbol || !quantity || !price) {
    return res.status(400).json({ status: 'error', message: 'Symbol, quantity, and price are required' });
  }
  try {
    const position = await tradingEngine.updatePosition(symbol, quantity, price);
    res.json({ status: 'success', data: position });
  } catch (error) {
    logger.error('Failed to update position:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});
router.delete('/:symbol', async (req, res) => {
  const { symbol } = req.params;
  if (!tradingEngine.positions.has(symbol)) {
    return res.status(404).json({ status: 'error', message: 'Position not found' });
  }
  try {
    await tradingEngine.removePosition(symbol);
    res.json({ status: 'success', message: 'Position removed' });
  } catch (error) {
    logger.error('Failed to remove position:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});
router.get('/performance', async (req, res) => {
  try {
    const performance = await tradingEngine.calculatePortfolioPerformance();
    res.json({ status: 'success', data: performance });
  } catch (error) {
    logger.error('Failed to calculate portfolio performance:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});
router.use((err, req, res, next) => {
  logger.error('Portfolio Route Error:', err);
  res.status(500).json({ status: 'error', message: 'Internal Server Error' });
});
module.exports = router;
