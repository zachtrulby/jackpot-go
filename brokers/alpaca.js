const BrokerAdapter = require('./adapter');
const Alpaca = require('@alpacahq/alpaca-trade-api');

/**
 * Alpaca Broker Adapter (works for paper and live accounts)
 */
class AlpacaBroker extends BrokerAdapter {
  constructor(config) {
    super(config);
    this.alpaca = new Alpaca({
      keyId: config.apiKey,
      secretKey: config.secretKey,
      paper: config.paper !== false,
      baseUrl: config.baseUrl || 'https://paper-api.alpaca.markets',
    });
  }

  async connect() {
    try {
      await this.alpaca.getAccount();
      return true;
    } catch (err) {
      throw new Error('Alpaca authentication failed: ' + err.message);
    }
  }

  async getBalance() {
    const account = await this.alpaca.getAccount();
    return parseFloat(account.cash);
  }

  async placeOrder(order) {
    // order: {symbol, qty, side, type, time_in_force}
    return await this.alpaca.createOrder(order);
  }

  async getPositions() {
    return await this.alpaca.getPositions();
  }

  async closePosition(symbol) {
    return await this.alpaca.closePosition(symbol);
  }

  async getMarketData(symbol) {
    // Example: Get last trade price
    const barset = await this.alpaca.getBars('minute', symbol, { limit: 1 });
    return barset[symbol][0];
  }
}

module.exports = AlpacaBroker;