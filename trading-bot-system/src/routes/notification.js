const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const notificationService = require('../services/notification');
router.post('/send', async (req, res) => {
  const { type, message, recipient } = req.body;
  if (!type || !message || !recipient) {
    return res.status(400).json({ status: 'error', message: 'Type, message, and recipient are required' });
  }
  try {
    await notificationService.sendNotification(type, message, recipient);
    res.json({ status: 'success', message: 'Notification sent successfully' });
  } catch (error) {
    logger.error('Failed to send notification:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});
router.get('/history', async (req, res) => {
  try {
    const history = await notificationService.getNotificationHistory();
    res.json({ status: 'success', data: history });
  } catch (error) {
    logger.error('Failed to fetch notification history:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});
router.get('/status', (req, res) => {
  res.json({ status: 'success', message: 'Notification service is running' });
});
router.use((err, req, res, next) => {
  logger.error('Notification Route Error:', err);
  res.status(500).json({ status: 'error', message: 'Internal Server Error' });
});
module.exports = router;
