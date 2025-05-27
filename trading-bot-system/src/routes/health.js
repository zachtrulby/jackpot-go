const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
router.get('/', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
router.get('/status', (req, res) => {
  res.json({ status: 'running', timestamp: new Date().toISOString() });
});
router.get('/logs', (req, res) => {
  res.sendFile(require('path').join(__dirname, '../../logs/app.log'));
});
router.get('/config', (req, res) => {
  res.json({ status: 'success', config: {} });
});
router.post('/config', (req, res) => {
  const newConfig = req.body;
  // Update config logic here
  res.json({ status: 'success', message: 'Configuration updated', config: newConfig });
});
router.use((err, req, res, next) => {
  logger.error('Health Check Error:', err);
  res.status(500).json({ status: 'error', message: 'Internal Server Error' });
});
module.exports = router;
