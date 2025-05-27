const path = require('path');
const fs = require('fs');

/**
 * Dynamically loads all broker adapters in this directory.
 * Returns: { [brokerName]: BrokerClass }
 */
function loadBrokers() {
  const brokers = {};
  const files = fs.readdirSync(__dirname);

  files.forEach((file) => {
    if (
      file !== 'adapter.js' &&
      file !== 'index.js' &&
      file.endsWith('.js')
    ) {
      const name = path.basename(file, '.js');
      brokers[name] = require(path.join(__dirname, file));
    }
  });

  return brokers;
}

module.exports = { loadBrokers };