// Example dynamic broker selection in your startup code
const tradingEngine = require('./src/trading/engine');

const brokerConfig = {
  apiKey: process.env.ALPACA_API_KEY,
  secretKey: process.env.ALPACA_SECRET_KEY,
  paper: true
};

(async () => {
  // Choose broker dynamically (e.g., from config, .env, or user)
  await tradingEngine.selectBroker(process.env.BROKER || 'paper', brokerConfig);
})();