const axios = require('axios');
const logger = require('../utils/logger');
async function analyze(symbol) {
  try {
    const response = await axios.get(`https://api.sentimentanalysis.com/v1/sentiment/${symbol}`, {
      headers: {
        'Authorization': `Bearer ${process.env.SENTIMENT_API_KEY}`
      }
    });
    if (response.status === 200) {
      const data = response.data;
      return {
        score: data.score,
        confidence: data.confidence
      };
    } else {
      logger.warn(`Sentiment API returned status ${response.status} for ${symbol}`);
      return { score: 0, confidence: 0 };
    }
  } catch (error) {
    logger.error(`Failed to analyze sentiment for ${symbol}:`, error);
    return { score: 0, confidence: 0 };
  }
}
async function initialize() {
  if (!process.env.SENTIMENT_API_KEY) {
    logger.warn('Sentiment analysis is disabled due to missing API key');
  } else {
    logger.info('Sentiment analysis service initialized');
  }
}
module.exports = {
  analyze,
  initialize
};
