const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const tradingEngine = require('../trading/engine');
router.get('/', (req, res) => {
  const strategies = Array.from(tradingEngine.strategies.values());
  res.json({ status: 'success', data: strategies });
});
router.post('/create', (req, res) => {
  const { name, type, parameters } = req.body;
  if (!name || !type) {
    return res.status(400).json({ status: 'error', message: 'Name and type are required' });
  }
  const strategyId = Date.now();
  tradingEngine.strategies.set(strategyId, { id: strategyId, name, type, parameters, isActive: false });
  res.json({ status: 'success', message: 'Strategy created', strategyId });
});
router.post('/activate', (req, res) => {
  const { strategyId } = req.body;
  const strategy = tradingEngine.strategies.get(strategyId);
  if (!strategy) {
    return res.status(404).json({ status: 'error', message: 'Strategy not found' });
  }
  strategy.isActive = true;
  res.json({ status: 'success', message: 'Strategy activated' });
});
router.post('/deactivate', (req, res) => {
  const { strategyId } = req.body;
  const strategy = tradingEngine.strategies.get(strategyId);
  if (!strategy) {
    return res.status(404).json({ status: 'error', message: 'Strategy not found' });
  }
  strategy.isActive = false;
  res.json({ status: 'success', message: 'Strategy deactivated' });
});
router.get('/:strategyId', (req, res) => {
  const { strategyId } = req.params;
  const strategy = tradingEngine.strategies.get(parseInt(strategyId));
  if (!strategy) {
    return res.status(404).json({ status: 'error', message: 'Strategy not found' });
  }
  res.json({ status: 'success', data: strategy });
});
router.delete('/:strategyId', (req, res) => {
  const { strategyId } = req.params;
  if (!tradingEngine.strategies.has(parseInt(strategyId))) {
    return res.status(404).json({ status: 'error', message: 'Strategy not found' });
  }
  tradingEngine.strategies.delete(parseInt(strategyId));
  res.json({ status: 'success', message: 'Strategy deleted' });
});
router.use((err, req, res, next) => {
  logger.error('Strategy Route Error:', err);
  res.status(500).json({ status: 'error', message: 'Internal Server Error' });
});
module.exports = router;
