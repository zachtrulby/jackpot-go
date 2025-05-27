const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const tradingEngine = require('./src/trading/engine');
const apiRoutes = require('./src/routes');
const { initializeDatabase } = require('./src/database');
const logger = require('./src/utils/logger');
const { initializeRedis } = require('./src/services/redis');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api', apiRoutes);

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.on('subscribe_market_data', (symbols) => {
    socket.join('market_data');
    tradingEngine.subscribeToMarketData(symbols, socket);
  });
  
  socket.on('start_trading', (config) => {
    tradingEngine.startTrading(config, socket);
  });
  
  socket.on('stop_trading', () => {
    tradingEngine.stopTrading(socket);
  });
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Initialize services
async function initializeServices() {
  try {
    await initializeDatabase();
    await initializeRedis();
    await tradingEngine.initialize();
    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

const PORT = process.env.PORT || 3000;

server.listen(PORT, async () => {
  logger.info(`Trading Bot Server running on port ${PORT}`);
  await initializeServices();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

module.exports = { app, io };
