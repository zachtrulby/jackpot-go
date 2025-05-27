const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const tradingEngine = require('../trading/engine');
router.get('/', async (req, res) => {
  try {
    const performance = await tradingEngine.calculatePerformance();
    res.json({ status: 'success', data: performance });
  } catch (error) {
    logger.error('Failed to calculate performance:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});
router.get('/history', async (req, res) => {
  try {
    const history = await tradingEngine.getPerformanceHistory();
    res.json({ status: 'success', data: history });
  } catch (error) {
    logger.error('Failed to fetch performance history:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await tradingEngine.getPerformanceMetrics();
    res.json({ status: 'success', data: metrics });
  } catch (error) {
    logger.error('Failed to fetch performance metrics:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});
router.use((err, req, res, next) => {
  logger.error('Performance Route Error:', err);
  res.status(500).json({ status: 'error', message: 'Internal Server Error' });
});
module.exports = router;
