const express = require('express');
const router = express.Router();
const sentimentService = require('../services/sentiment');
const logger = require('../utils/logger');
router.get('/:symbol', async (req, res) => {
  const { symbol } = req.params;
  try {
    const sentiment = await sentimentService.analyze(symbol);
    res.json({ status: 'success', data: sentiment });
  } catch (error) {
    logger.error('Failed to analyze sentiment:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});
router.get('/initialize', async (req, res) => {
  try {
    await sentimentService.initialize();
    res.json({ status: 'success', message: 'Sentiment service initialized' });
  } catch (error) {
    logger.error('Failed to initialize sentiment service:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});
router.use((err, req, res, next) => {
  logger.error('Sentiment Route Error:', err);
  res.status(500).json({ status: 'error', message: 'Internal Server Error' });
});
module.exports = router;
