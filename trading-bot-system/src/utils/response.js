const createResponse = (status, message, data = null) => {
  return {
    status,
    message,
    data
  };
};
const createErrorResponse = (message, error = null) => {
  return {
    status: 'error',
    message,
    error
  };
};
module.exports = {
  createResponse,
  createErrorResponse
};
# src/services/redis.js
cat > src/services/redis.js << 'EOF'
const redis = require('redis');
const logger = require('../utils/logger');
const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});
async function initializeRedis() {
  try {
    await client.connect();
    logger.info('Connected to Redis');
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
}
async function get(key) {
  try {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error('Redis GET error:', error);
    throw error;
  }
}
async function set(key, value, ttl = 3600) {
  try {
    await client.set(key, JSON.stringify(value), 'EX', ttl);
  } catch (error) {
    logger.error('Redis SET error:', error);
    throw error;
  }
}
async function del(key) {
  try {
    await client.del(key);
  } catch (error) {
    logger.error('Redis DEL error:', error);
    throw error;
  }
}
async function flush() {
  try {
    await client.flushAll();
  } catch (error) {
    logger.error('Redis FLUSH error:', error);
    throw error;
  }
}
module.exports = {
  initializeRedis,
  get,
  set,
  del,
  flush,
  client
};
