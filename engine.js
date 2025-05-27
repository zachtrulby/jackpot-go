const { loadBrokers } = require('./brokers');
const logger = require('../utils/logger');
const EventEmitter = require('events');

class TradingEngine extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.brokers = loadBrokers();
    this.broker = null;
  }

  async selectBroker(brokerName, brokerConfig) {
    if (!this.brokers[brokerName]) throw new Error('Unknown broker: ' + brokerName);
    this.broker = new this.brokers[brokerName](brokerConfig);
    await this.broker.connect();
    logger.info(`${brokerName} broker connected`);
  }

  // Now use this.broker for trading actions:
  async executeSignal(symbol, signal, marketData) {
    if (!this.broker) throw new Error('No broker selected');
    // ... use this.broker.placeOrder({...})
  }

  // ...rest of your TradingEngine logic
}

module.exports = new TradingEngine();