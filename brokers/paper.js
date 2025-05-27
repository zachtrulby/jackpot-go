const BrokerAdapter = require('./adapter');

/**
 * Simulated paper trading broker adapter.
 */
class PaperBroker extends BrokerAdapter {
  constructor(config) {
    super(config);
    this.balance = config.balance || 100000;
    this.positions = {};
    this.orders = [];
  }

  async connect() {
    return true;
  }

  async getBalance() {
    return this.balance;
  }

  async placeOrder(order) {
    // Simulate immediate order fill
    this.orders.push(order);
    // Simulate updating balance/positions
    // (Add your own logic as needed)
    return { ...order, status: 'FILLED' };
  }

  async getPositions() {
    return Object.entries(this.positions).map(([symbol, qty]) => ({ symbol, qty }));
  }

  async closePosition(symbol) {
    delete this.positions[symbol];
    return { symbol, status: 'CLOSED' };
  }

  async getMarketData(symbol) {
    // Return mock price data
    return { symbol, price: 100 + Math.random() * 10 };
  }
}

module.exports = PaperBroker;