const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const tradingEngine = require('../trading/engine');
router.get('/', (req, res) => {
  const risks = tradingEngine.calculateRiskMetrics();
  res.json({ status: 'success', data: risks });
});
router.get('/exposure', (req, res) => {
  const exposure = tradingEngine.calculateExposure();
  res.json({ status: 'success', data: exposure });
});
router.get('/limits', (req, res) => {
  const limits = tradingEngine.getRiskLimits();
  res.json({ status: 'success', data: limits });
});
router.post('/limits', (req, res) => {
  const { maxExposure, maxDrawdown } = req.body;
  if (maxExposure < 0 || maxDrawdown < 0) {
    return res.status(400).json({ status: 'error', message: 'Limits must be non-negative' });
  }
  tradingEngine.setRiskLimits(maxExposure, maxDrawdown);
  res.json({ status: 'success', message: 'Risk limits updated' });
});
router.get('/history', async (req, res) => {
  try {
    const history = await tradingEngine.getRiskHistory();
    res.json({ status: 'success', data: history });
  } catch (error) {
    logger.error('Failed to fetch risk history:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});
router.use((err, req, res, next) => {
  logger.error('Risk Route Error:', err);
  res.status(500).json({ status: 'error', message: 'Internal Server Error' });
});
module.exports = router;
