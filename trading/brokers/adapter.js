// Abstract base class for all broker adapters
class BrokerAdapter {
  constructor(config) {
    this.config = config;
  }

  async connect() {
    throw new Error('connect() not implemented');
  }

  async getBalance() {
    throw new Error('getBalance() not implemented');
  }

  async placeOrder(order) {
    throw new Error('placeOrder() not implemented');
  }

  async getPositions() {
    throw new Error('getPositions() not implemented');
  }

  async closePosition(symbol) {
    throw new Error('closePosition() not implemented');
  }

  async getMarketData(symbol) {
    throw new Error('getMarketData() not implemented');
  }
}

module.exports = BrokerAdapter;