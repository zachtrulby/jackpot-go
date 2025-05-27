const express = require('express');
const router = express.Router();
const tradingEngine = require('../trading/engine');
const logger = require('../utils/logger');
router.post('/start', async (req, res) => {
  try {
    const config = req.body;
    await tradingEngine.startTrading(config, res.socket);
    res.json({ status: 'success', message: 'Trading started' });
  } catch (error) {
    logger.error('Failed to start trading:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});
router.post('/stop', async (req, res) => {
  try {
    await tradingEngine.stopTrading(res.socket);
    res.json({ status: 'success', message: 'Trading stopped' });
  } catch (error) {
    logger.error('Failed to stop trading:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});
router.get('/status', (req, res) => {
  res.json({ status: tradingEngine.isRunning ? 'running' : 'stopped' });
});
router.get('/strategies', (req, res) => {
  const strategies = Array.from(tradingEngine.strategies.values());
  res.json({ status: 'success', data: strategies });
});
router.post('/strategies/activate', async (req, res) => {
  try {
    const { strategyId } = req.body;
    const strategy = tradingEngine.strategies.get(strategyId);
    if (!strategy) {
      return res.status(404).json({ status: 'error', message: 'Strategy not found' });
    }
    strategy.isActive = true;
    res.json({ status: 'success', message: 'Strategy activated' });
  } catch (error) {
    logger.error('Failed to activate strategy:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});
router.post('/strategies/deactivate', async (req, res) => {
  try {
    const { strategyId } = req.body;
    const strategy = tradingEngine.strategies.get(strategyId);
    if (!strategy) {
      return res.status(404).json({ status: 'error', message: 'Strategy not found' });
    }
    strategy.isActive = false;
    res.json({ status: 'success', message: 'Strategy deactivated' });
  } catch (error) {
    logger.error('Failed to deactivate strategy:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});
router.get('/market-data', (req, res) => {
  const marketData = Array.from(tradingEngine.marketData.values());
  res.json({ status: 'success', data: marketData });
});
router.get('/positions', (req, res) => {
  const positions = Array.from(tradingEngine.positions.values());
  res.json({ status: 'success', data: positions });
});
router.get('/orders', (req, res) => {
  const orders = Array.from(tradingEngine.activeOrders.values());
  res.json({ status: 'success', data: orders });
});
router.get('/balance', (req, res) => {
  const exchange = tradingEngine.exchanges.get('paper');
  res.json({ status: 'success', balance: exchange.balance });
});
router.get('/performance', async (req, res) => {
  try {
    const performance = await tradingEngine.calculatePerformance();
    res.json({ status: 'success', data: performance });
  } catch (error) {
    logger.error('Failed to calculate performance:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
router.get('/logs', (req, res) => {
  res.sendFile(require('path').join(__dirname, '../../logs/app.log'));
});
router.get('/config', (req, res) => {
  res.json({ status: 'success', config: tradingEngine.config });
});
router.post('/config', (req, res) => {
  const newConfig = req.body;
  tradingEngine.config = { ...tradingEngine.config, ...newConfig };
  res.json({ status: 'success', message: 'Configuration updated', config: tradingEngine.config });
});
router.get('/status', (req, res) => {
  res.json({ status: tradingEngine.isRunning ? 'running' : 'stopped' });
});
router.get('/logs', (req, res) => {
  res.sendFile(require('path').join(__dirname, '../../logs/app.log'));
});
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
router.get('/config', (req, res) => {
  res.json({ status: 'success', config: tradingEngine.config });
});
router.post('/config', (req, res) => {
  const newConfig = req.body;
  tradingEngine.config = { ...tradingEngine.config, ...newConfig };
  res.json({ status: 'success', message: 'Configuration updated', config: tradingEngine.config });
});
router.get('/status', (req, res) => {
  res.json({ status: tradingEngine.isRunning ? 'running' : 'stopped' });
});
router.get('/logs', (req, res) => {
  res.sendFile(require('path').join(__dirname, '../../logs/app.log'));
});
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
router.get('/config', (req, res) => {
  res.json({ status: 'success', config: tradingEngine.config });
});
router.post('/config', (req, res) => {
  const newConfig = req.body;
  tradingEngine.config = { ...tradingEngine.config, ...newConfig };
  res.json({ status: 'success', message: 'Configuration updated', config: tradingEngine.config });
});
router.get('/status', (req, res) => {
  res.json({ status: tradingEngine.isRunning ? 'running' : 'stopped' });
});
router.get('/logs', (req, res) => {
  res.sendFile(require('path').join(__dirname, '../../logs/app.log'));
});
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
router.get('/config', (req, res) => {
  res.json({ status: 'success', config: tradingEngine.config });
});
router.post('/config', (req, res) => {
  const newConfig = req.body;
  tradingEngine.config = { ...tradingEngine.config, ...newConfig };
  res.json({ status: 'success', message: 'Configuration updated', config: tradingEngine.config });
});
router.get('/status', (req, res) => {
  res.json({ status: tradingEngine.isRunning ? 'running' : 'stopped' });
});
router.get('/logs', (req, res) => {
  res.sendFile(require('path').join(__dirname, '../../logs/app.log'));
});
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
router.get('/config', (req, res) => {
  res.json({ status: 'success', config: tradingEngine.config });
});
router.post('/config', (req, res) => {
  const newConfig = req.body;
  tradingEngine.config = { ...tradingEngine.config, ...newConfig };
  res.json({ status: 'success', message: 'Configuration updated', config: tradingEngine.config });
});
router.get('/status', (req, res) => {
  res.json({ status: tradingEngine.isRunning ? 'running' : 'stopped' });
});
router.get('/logs', (req, res) => {
  res.sendFile(require('path').join(__dirname, '../../logs/app.log'));
});
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
router.get('/config', (req, res) => {
  res.json({ status: 'success', config: tradingEngine.config });
});
router.post('/config', (req, res) => {
  const newConfig = req.body;
  tradingEngine.config = { ...tradingEngine.config, ...newConfig };
  res.json({ status: 'success', message: 'Configuration updated', config: tradingEngine.config });
});
router.get('/status', (req, res) => {
  res.json({ status: tradingEngine.isRunning ? 'running' : 'stopped' });
});
router.get('/logs', (req, res) => {
  res.sendFile(require('path').join(__dirname, '../../logs/app.log'));
});
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
router.get('/config', (req, res) => {
  res.json({ status: 'success', config: tradingEngine.config });
});
router.post('/config', (req, res) => {
  const newConfig = req.body;
  tradingEngine.config = { ...tradingEngine.config, ...newConfig };
  res.json({ status: 'success', message: 'Configuration updated', config: tradingEngine.config });
});
router.get('/status', (req, res) => {
  res.json({ status: tradingEngine.isRunning ? 'running' : 'stopped' });
});
router.get('/logs', (req, res) => {
  res.sendFile(require('path').join(__dirname, '../../logs/app.log'));
});
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
router.get('/config', (req, res) => {
  res.json({ status: 'success', config: tradingEngine.config });
});
router.post('/config', (req, res) => {
  const newConfig = req.body;
  tradingEngine.config = { ...tradingEngine.config, ...newConfig };
  res.json({ status: 'success', message: 'Configuration updated', config: tradingEngine.config });
});
router.get('/status', (req, res) => {
  res.json({ status: tradingEngine.isRunning ? 'running' : 'stopped' });
});
router.get('/logs', (req, res) => {
  res.sendFile(require('path').join(__dirname, '../../logs/app.log'));
});
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
router.get('/config', (req, res) => {
  res.json({ status: 'success', config: tradingEngine.config });
});
router.post('/config', (req, res) => {
  const newConfig = req.body;
  tradingEngine.config = { ...tradingEngine.config, ...newConfig };
  res.json({ status: 'success', message: 'Configuration updated', config: tradingEngine.config });
});
router.get('/status', (req, res) => {
  res.json({ status: tradingEngine.isRunning ? 'running' : 'stopped' });
});
router.get('/logs', (req, res) => {
  res.sendFile(require('path').join(__dirname, '../../logs/app.log'));
});
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
router.get('/config', (req, res) => {
  res.json({ status: 'success', config: tradingEngine.config });
});
router.post('/config', (req, res) => {
  const newConfig = req.body;
  tradingEngine.config = { ...tradingEngine.config, ...newConfig };
  res.json({ status: 'success', message: 'Configuration updated', config: tradingEngine.config });
});
router.get('/status', (req, res) => {
  res.json({ status: tradingEngine.isRunning ? 'running' : 'stopped' });
});
router.get('/logs', (req, res) => {
  res.sendFile(require('path').join(__dirname, '../../logs/app.log'));
});
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
router.get('/config', (req, res) => {
  res.json({ status: 'success', config: tradingEngine.config });
});
router.post('/config', (req, res) => {
  const newConfig = req.body;
  tradingEngine.config = { ...tradingEngine.config, ...newConfig };
  res.json({ status: 'success', message: 'Configuration updated', config: tradingEngine.config });
});
router.get('/status', (req, res) => {
  res.json({ status: tradingEngine.isRunning ? 'running' : 'stopped' });
});
router.get('/logs', (req, res) => {
  res.sendFile(require('path').join(__dirname, '../../logs/app.log'));
});
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
router.get('/config', (req, res) => {
  res.json({ status: 'success', config: tradingEngine.config });
});
router.post('/config', (req, res) => {
  const newConfig = req.body;
  tradingEngine.config = { ...tradingEngine.config, ...newConfig };
  res.json({ status: 'success', message: 'Configuration updated', config: tradingEngine.config });
});
router.get('/status', (req, res) => {
  res.json({ status: tradingEngine.isRunning ? 'running' : 'stopped' });
});
router.get('/logs', (req, res) => {
  res.sendFile(require('path').join(__dirname, '../../logs/app.log'));
});
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
router.get('/config', (req, res) => {
  res.json({ status: 'success', config: tradingEngine.config });
});
router.post('/config', (req, res) => {
  const newConfig = req.body;
  tradingEngine.config = { ...tradingEngine.config, ...newConfig };
  res.json({ status: 'success', message: 'Configuration updated', config: tradingEngine.config });
});
module.exports = router;
