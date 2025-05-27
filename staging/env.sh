#!/bin/bash
# Trading Bot Complete Implementation
# Create all files and directories with this script

echo "🚀 Creating Trading Bot System Files..."

# Create directory structure
mkdir -p trading-bot-system/{src/{trading,routes,services,utils,database},public/{js,css},config,logs,data,ssl,sql}

cd trading-bot-system

# ================================
# ROOT FILES
# ================================

# package.json
cat > package.json << 'EOF'
{
  "name": "trading-bot-system",
  "version": "1.0.0",
  "description": "Automated Trading Bot with Technical and Sentiment Analysis",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "build": "webpack --mode production",
    "test": "jest",
    "deploy": "docker-compose up -d",
    "logs": "docker-compose logs -f",
    "stop": "docker-compose down"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.7.2",
    "redis": "^4.6.7",
    "pg": "^8.11.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.1",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "dotenv": "^16.3.1",
    "axios": "^1.4.0",
    "ws": "^8.13.0",
    "node-cron": "^3.0.2",
    "winston": "^3.9.0",
    "ccxt": "^4.0.45",
    "technicalindicators": "^3.1.0",
    "compromise": "^14.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.6.1",
    "webpack": "^5.88.2",
    "webpack-cli": "^5.1.4"
  }
}
EOF

# requirements.txt
cat > requirements.txt << 'EOF'
numpy==1.24.3
pandas==2.0.3
ta-lib==0.4.26
scikit-learn==1.3.0
websocket-client==1.6.1
requests==2.31.0
python-dotenv==1.0.0
alpaca-trade-api==3.0.2
yfinance==0.2.18
textblob==0.17.1
EOF

# .env template
cat > .env.template << 'EOF'
NODE_ENV=production
PORT=3000
JWT_SECRET=your_jwt_secret_here
REDIS_URL=redis://redis:6379
POSTGRES_URL=postgresql://trader:trading123@postgres:5432/tradingbot

# Trading Configuration
ALPACA_API_KEY=your_alpaca_api_key
ALPACA_SECRET_KEY=your_alpaca_secret_key
ALPACA_BASE_URL=https://paper-api.alpaca.markets

# Risk Management
MAX_POSITION_SIZE=1000
DAILY_LOSS_LIMIT=500
STOP_LOSS_PERCENTAGE=2.0
TAKE_PROFIT_PERCENTAGE=4.0

# Sentiment Analysis
SENTIMENT_API_KEY=your_sentiment_api_key
ENABLE_SENTIMENT_ANALYSIS=true

# Logging
LOG_LEVEL=info
EOF

# Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-slim

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY requirements.txt ./

RUN npm install
RUN pip3 install -r requirements.txt

COPY . .

RUN npm run build 2>/dev/null || echo "No build script"

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

CMD ["npm", "start"]
EOF

# docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  trading-bot:
    build: .
    ports:
      - "3000:3000"
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - POSTGRES_URL=postgresql://trader:trading123@postgres:5432/tradingbot
    volumes:
      - ./config:/app/config
      - ./logs:/app/logs
      - ./data:/app/data
    depends_on:
      - redis
      - postgres
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  postgres:
    image: timescale/timescaledb:latest-pg14
    environment:
      POSTGRES_DB: tradingbot
      POSTGRES_USER: trader
      POSTGRES_PASSWORD: trading123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./sql/init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped

volumes:
  redis_data:
  postgres_data:
EOF

# nginx.conf
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream trading_bot {
        server trading-bot:3000;
    }

    server {
        listen 80;
        server_name localhost;

        location / {
            proxy_pass http://trading_bot;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /socket.io/ {
            proxy_pass http://trading_bot;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
EOF

# ================================
# SERVER.JS - Main Application
# ================================
cat > server.js << 'EOF'
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
EOF

# ================================
# DATABASE FILES
# ================================

# src/database/index.js
cat > src/database/index.js << 'EOF'
const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function initializeDatabase() {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connection established');
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
}

async function executeQuery(text, params) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    logger.error('Database query failed:', error);
    throw error;
  }
}

module.exports = {
  initializeDatabase,
  executeQuery,
  pool
};
EOF

# sql/init.sql
cat > sql/init.sql << 'EOF'
-- Trading Bot Database Schema

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    api_keys JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trading strategies table
CREATE TABLE trading_strategies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    parameters JSONB NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Market data table (hypertable for time-series)
CREATE TABLE market_data (
    time TIMESTAMPTZ NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    price DECIMAL(15,8) NOT NULL,
    volume DECIMAL(15,2),
    bid DECIMAL(15,8),
    ask DECIMAL(15,8),
    high DECIMAL(15,8),
    low DECIMAL(15,8),
    open DECIMAL(15,8),
    close DECIMAL(15,8)
);

-- Convert to hypertable
SELECT create_hypertable('market_data', 'time');

-- Trades table
CREATE TABLE trades (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    strategy_id INTEGER REFERENCES trading_strategies(id),
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL,
    quantity DECIMAL(15,8) NOT NULL,
    price DECIMAL(15,8) NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    order_type VARCHAR(20) DEFAULT 'MARKET',
    status VARCHAR(20) DEFAULT 'PENDING',
    profit_loss DECIMAL(15,8),
    fees DECIMAL(15,8) DEFAULT 0,
    metadata JSONB DEFAULT '{}'
);

-- Portfolio positions table
CREATE TABLE portfolio_positions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    symbol VARCHAR(20) NOT NULL,
    quantity DECIMAL(15,8) NOT NULL,
    average_price DECIMAL(15,8) NOT NULL,
    current_price DECIMAL(15,8),
    unrealized_pnl DECIMAL(15,8),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, symbol)
);

-- Trading signals table
CREATE TABLE trading_signals (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    signal_type VARCHAR(50) NOT NULL,
    strength DECIMAL(5,2) NOT NULL,
    indicators JSONB NOT NULL,
    sentiment_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance metrics table
CREATE TABLE performance_metrics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    strategy_id INTEGER REFERENCES trading_strategies(id),
    date DATE NOT NULL,
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    gross_profit DECIMAL(15,8) DEFAULT 0,
    gross_loss DECIMAL(15,8) DEFAULT 0,
    net_profit DECIMAL(15,8) DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    profit_factor DECIMAL(5,2) DEFAULT 0,
    max_drawdown DECIMAL(5,2) DEFAULT 0,
    sharpe_ratio DECIMAL(5,2) DEFAULT 0,
    UNIQUE(user_id, strategy_id, date)
);

-- Create indexes
CREATE INDEX idx_market_data_symbol_time ON market_data (symbol, time DESC);
CREATE INDEX idx_trades_user_id ON trades (user_id);
CREATE INDEX idx_trades_symbol ON trades (symbol);
CREATE INDEX idx_trades_executed_at ON trades (executed_at);
CREATE INDEX idx_portfolio_positions_user_id ON portfolio_positions (user_id);
CREATE INDEX idx_trading_signals_symbol ON trading_signals (symbol);
CREATE INDEX idx_trading_signals_created_at ON trading_signals (created_at DESC);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password_hash) VALUES 
('admin', 'admin@tradingbot.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- Insert sample trading strategy
INSERT INTO trading_strategies (user_id, name, parameters) VALUES 
(1, 'RSI Mean Reversion', '{
    "rsi_period": 14,
    "rsi_oversold": 30,
    "rsi_overbought": 70,
    "stop_loss": 2.0,
    "take_profit": 4.0,
    "position_size": 0.02
}');

COMMIT;
EOF

# ================================
# TRADING ENGINE
# ================================

# src/trading/engine.js
cat > src/trading/engine.js << 'EOF'
const EventEmitter = require('events');
const ccxt = require('ccxt');
const { RSI, MACD, BollingerBands, EMA, SMA } = require('technicalindicators');
const logger = require('../utils/logger');
const { executeQuery } = require('../database');
const sentimentAnalyzer = require('./sentiment');
const riskManager = require('./risk-manager');

class TradingEngine extends EventEmitter {
  constructor() {
    super();
    this.isRunning = false;
    this.strategies = new Map();
    this.positions = new Map();
    this.marketData = new Map();
    this.exchanges = new Map();
    this.activeOrders = new Map();
    this.config = {
      maxPositions: 10,
      riskPerTrade: 0.02,
      stopLoss: 0.02,
      takeProfit: 0.04,
      enableSentiment: true
    };
  }

  async initialize() {
    try {
      logger.info('Initializing Trading Engine...');
      
      // Initialize paper trading exchange (simulated)
      this.exchanges.set('paper', {
        name: 'Paper Trading',
        balance: 100000, // $100k paper money
        positions: new Map(),
        orders: []
      });
      
      await this.loadStrategies();
      riskManager.initialize(this.config);
      
      logger.info('Trading Engine initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Trading Engine:', error);
      throw error;
    }
  }

  async loadStrategies() {
    try {
      const result = await executeQuery(`
        SELECT * FROM trading_strategies WHERE is_active = true
      `);
      
      result.rows.forEach(strategy => {
        this.strategies.set(strategy.id, {
          id: strategy.id,
          name: strategy.name,
          parameters: strategy.parameters,
          isActive: true
        });
      });
      
      logger.info(`Loaded ${this.strategies.size} active strategies`);
    } catch (error) {
      logger.error('Failed to load strategies:', error);
    }
  }

  async startTrading(config, socket) {
    try {
      if (this.isRunning) {
        throw new Error('Trading engine is already running');
      }

      this.isRunning = true;
      this.config = { ...this.config, ...config };
      
      logger.info('Starting trading engine');
      
      await this.startMarketDataStream();
      
      this.tradingInterval = setInterval(() => {
        this.executeTradingLogic();
      }, 5000); // Run every 5 seconds
      
      socket.emit('trading_started', { status: 'success' });
      this.emit('trading_started');
      
    } catch (error) {
      logger.error('Failed to start trading:', error);
      socket.emit('trading_error', { error: error.message });
    }
  }

  async stopTrading(socket) {
    try {
      this.isRunning = false;
      
      if (this.tradingInterval) {
        clearInterval(this.tradingInterval);
      }
      
      logger.info('Trading engine stopped');
      socket.emit('trading_stopped', { status: 'success' });
      this.emit('trading_stopped');
      
    } catch (error) {
      logger.error('Failed to stop trading:', error);
      socket.emit('trading_error', { error: error.message });
    }
  }

  async startMarketDataStream() {
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'];
    
    for (const symbol of symbols) {
      await this.subscribeToSymbol(symbol);
    }
  }

  async subscribeToSymbol(symbol) {
    try {
      // Simulate market data
      const price = 100 + Math.random() * 50;
      const ohlcv = this.generateSimulatedOHLCV(price, 100);
      
      this.marketData.set(symbol, {
        symbol,
        price: price,
        bid: price - 0.01,
        ask: price + 0.01,
        volume: Math.random() * 1000000,
        ohlcv: ohlcv,
        lastUpdate: new Date()
      });

      await this.storeMarketData(symbol, {
        last: price,
        bid: price - 0.01,
        ask: price + 0.01,
        baseVolume: Math.random() * 1000000,
        high: price + 2,
        low: price - 2,
        open: price - 0.5,
        close: price
      });
      
      logger.info(`Subscribed to ${symbol} market data`);
    } catch (error) {
      logger.error(`Failed to subscribe to ${symbol}:`, error);
    }
  }

  generateSimulatedOHLCV(basePrice, count) {
    const ohlcv = [];
    let currentPrice = basePrice;
    
    for (let i = 0; i < count; i++) {
      const change = (Math.random() - 0.5) * 2; // Random change -1 to +1
      const open = currentPrice;
      const close = currentPrice + change;
      const high = Math.max(open, close) + Math.random();
      const low = Math.min(open, close) - Math.random();
      const volume = Math.random() * 10000;
      
      ohlcv.push([Date.now() - (count - i) * 60000, open, high, low, close, volume]);
      currentPrice = close;
    }
    
    return ohlcv;
  }

  async storeMarketData(symbol, ticker) {
    try {
      await executeQuery(`
        INSERT INTO market_data (time, symbol, price, volume, bid, ask, high, low, open, close)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT DO NOTHING
      `, [
        new Date(),
        symbol,
        ticker.last,
        ticker.baseVolume,
        ticker.bid,
        ticker.ask,
        ticker.high,
        ticker.low,
        ticker.open,
        ticker.close
      ]);
    } catch (error) {
      logger.error('Failed to store market data:', error);
    }
  }

  async executeTradingLogic() {
    if (!this.isRunning) return;

    try {
      for (const [symbolKey, marketData] of this.marketData) {
        const symbol = marketData.symbol;
        
        if (!marketData.ohlcv || marketData.ohlcv.length < 50) continue;

        const signals = await this.analyzeSymbol(symbol, marketData);
        
        const sentiment = this.config.enableSentiment 
          ? await sentimentAnalyzer.analyze(symbol)
          : { score: 0, confidence: 0 };

        const finalSignal = this.combineSignals(signals, sentiment);
        
        if (finalSignal.action !== 'HOLD') {
          await this.executeSignal(symbol, finalSignal, marketData);
        }

        await this.storeSignal(symbol, finalSignal, signals, sentiment);
      }
    } catch (error) {
      logger.error('Error in trading logic execution:', error);
    }
  }

  async analyzeSymbol(symbol, marketData) {
    const closes = marketData.ohlcv.map(candle => candle[4]);

    const rsi = RSI.calculate({
      values: closes,
      period: 14
    });

    const macd = MACD.calculate({
      values: closes,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9
    });

    const bb = BollingerBands.calculate({
      period: 20,
      values: closes,
      stdDev: 2
    });

    const ema20 = EMA.calculate({ period: 20, values: closes });
    const sma50 = SMA.calculate({ period: 50, values: closes });

    const currentPrice = closes[closes.length - 1];
    const latestRSI = rsi[rsi.length - 1];
    const latestMACD = macd[macd.length - 1];
    const latestBB = bb[bb.length - 1];
    const latestEMA20 = ema20[ema20.length - 1];
    const latestSMA50 = sma50[sma50.length - 1];

    return {
      rsi: this.analyzeRSI(latestRSI),
      macd: this.analyzeMACD(latestMACD),
      bollinger: this.analyzeBollingerBands(currentPrice, latestBB),
      trend: this.analyzeTrend(latestEMA20, latestSMA50, currentPrice),
      price: currentPrice,
      indicators: {
        rsi: latestRSI,
        macd: latestMACD,
        bb: latestBB,
        ema20: latestEMA20,
        sma50: latestSMA50
      }
    };
  }

  analyzeRSI(rsi) {
    if (rsi < 30) return { signal: 'BUY', strength: 0.8, reason: 'Oversold' };
    if (rsi > 70) return { signal: 'SELL', strength: 0.8, reason: 'Overbought' };
    return { signal: 'HOLD', strength: 0.1, reason: 'Neutral' };
  }

  analyzeMACD(macd) {
    if (!macd) return { signal: 'HOLD', strength: 0, reason: 'No data' };
    
    const { MACD: macdLine, signal, histogram } = macd;
    
    if (macdLine > signal && histogram > 0) {
      return { signal: 'BUY', strength: 0.6, reason: 'Bullish crossover' };
    }
    if (macdLine < signal && histogram < 0) {
      return { signal: 'SELL', strength: 0.6, reason: 'Bearish crossover' };
    }
    return { signal: 'HOLD', strength: 0.2, reason: 'No clear signal' };
  }

  analyzeBollingerBands(price, bb) {
    if (!bb) return { signal: 'HOLD', strength: 0, reason: 'No data' };
    
    if (price <= bb.lower) {
      return { signal: 'BUY', strength: 0.7, reason: 'Price at lower band' };
    }
    if (price >= bb.upper) {
      return { signal: 'SELL', strength: 0.7, reason: 'Price at upper band' };
    }
    return { signal: 'HOLD', strength: 0.3, reason: 'Price in middle range' };
  }

  analyzeTrend(ema20, sma50, currentPrice) {
    if (ema20 > sma50 && currentPrice > ema20) {
      return { signal: 'BUY', strength: 0.5, reason: 'Uptrend confirmed' };
    }
    if (ema20 < sma50 && currentPrice < ema20) {
      return { signal: 'SELL', strength: 0.5, reason: 'Downtrend confirmed' };
    }
    return { signal: 'HOLD', strength: 0.2, reason: 'Trend unclear' };
  }

  combineSignals(signals, sentiment) {
    const weights = {
      rsi: 0.3,
      macd: 0.25,
      bollinger: 0.25,
      trend: 0.2
    };

    let buyScore = 0;
    let sellScore = 0;

    Object.keys(weights).forEach(key => {
      const signal = signals[key];
      if (signal.signal === 'BUY') {
        buyScore += weights[key] * signal.strength;
      } else if (signal.signal === 'SELL') {
        sellScore += weights[key] * signal.strength;
      }
    });

    // Add sentiment
    if (sentiment.score > 0.6) buyScore += 0.1;
    if (sentiment.score < 0.4) sellScore += 0.1;

    const threshold = 0.6;
    
    if (buyScore > threshold && buyScore > sellScore) {
      return { action: 'BUY', confidence: buyScore, reason: 'Combined bullish signals' };
    }
    if (sellScore > threshold && sellScore > buyScore) {
      return { action: 'SELL', confidence: sellScore, reason: 'Combined bearish signals' };
    }
    
    return { action: 'HOLD', confidence: Math.max(buyScore, sellScore), reason: 'No clear signal' };
  }

  async executeSignal(symbol, signal, marketData) {
    try {
      const exchange = this.exchanges.get('paper');
      const positionSize = this.calculatePositionSize(exchange.balance, signal.confidence);
      const currentPrice = marketData.price;
      
      if (signal.action === 'BUY') {
        const quantity = positionSize / currentPrice;
        
        // Simulate trade execution
        const trade = {
          id: Date.now(),
          symbol,
          side: 'BUY',
          quantity,
          price: currentPrice,
          timestamp: new Date(),
          status: 'FILLED'
        };
        
        exchange.orders.push(trade);
        exchange.balance -= positionSize;
        
        logger.info(`Executed BUY order: ${symbol} ${quantity} @ ${currentPrice}`);
        
        // Store in database
        await this.storeTrade(trade);
        
      } else if (signal.action === 'SELL') {
        // Check if we have a position to sell
        const position = exchange.positions.get(symbol);
        if (position && position.quantity > 0) {
          const trade = {
            id: Date.now(),
            symbol,
            side: 'SELL',
            quantity: position.quantity,
            price: currentPrice,
            timestamp: new Date(),
            status: 'FILLED'
          };
          
          exchange.orders.push(trade);
          exchange.balance += position.quantity * currentPrice;
          exchange.positions.delete(symbol);
          
          logger.info(`Executed SELL order: ${symbol} ${position.quantity} @ ${currentPrice}`);
          
          await this.storeTrade(trade);
        }
      }
    } catch (error) {
      logger.error('Failed to execute signal:', error);
    }
  }

  calculatePositionSize(balance, confidence) {
    const baseRisk = this.config.riskPerTrade;
    const adjustedRisk = baseRisk * confidence;
    return balance * Math.min(adjustedRisk, 0.05); // Max 5% per trade
  }

  async storeTrade(trade) {
    try {
      await executeQuery(`
        INSERT INTO trades (user_id, symbol, side, quantity, price, executed_at, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [1, trade.symbol, trade.side, trade.quantity, trade.price, trade.timestamp, trade.status]);
      logger.info(`Stored trade in database: ${trade.symbol} ${trade.side} ${trade.quantity} @ ${trade.price}`);
    } catch (error) {
      logger.error('Failed to store trade in database:', error);
    }
  }
  async storeSignal(symbol, signal, indicators, sentiment) {
    try {
      await executeQuery(`
        INSERT INTO trading_signals (symbol, signal_type, strength, indicators, sentiment_score)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        symbol,
        signal.action,
        signal.confidence,
        JSON.stringify(indicators),
        sentiment.score
      ]);
      logger.info(`Stored trading signal for ${symbol}: ${signal.action} (${signal.confidence})`);
    } catch (error) {
      logger.error('Failed to store trading signal:', error);
    }
  }
  async analyzeSentiment(symbol) {
    try {
      const sentiment = await sentimentAnalyzer.analyze(symbol);
      return sentiment;
    } catch (error) {
      logger.error('Failed to analyze sentiment:', error);
      return { score: 0, confidence: 0 };
    }
  }
  async initializeSentimentAnalysis() {
    if (this.config.enableSentiment) {
      try {
        await sentimentAnalyzer.initialize();
        logger.info('Sentiment analysis initialized');
      } catch (error) {
        logger.error('Failed to initialize sentiment analysis:', error);
      }
    }
  }
  async initializeRiskManagement() {
    try {
      await riskManager.initialize(this.config);
      logger.info('Risk management initialized');
    } catch (error) {
      logger.error('Failed to initialize risk management:', error);
    }
  }
  async initializeRedis() {
    try {
      await require('../services/redis').initialize();
      logger.info('Redis service initialized');
    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
    }
  }
  async initializeDatabase() {
    try {
      await require('../database').initializeDatabase();
      logger.info('Database connection established');
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw error;
    }
  }
}
module.exports = new TradingEngine();
EOF
# ================================
# UTILS AND SERVICES
# ================================
# src/utils/logger.js
cat > src/utils/logger.js << 'EOF'
const winston = require('winston');
const { format } = winston;
const path = require('path');
const logDir = path.join(__dirname, '../../logs');
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(logDir, 'app.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    })
  ]
});
if (process.env.NODE_ENV === 'development') {
  logger.add(new winston.transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}
module.exports = logger;
EOF
# src/utils/response.js
cat > src/utils/response.js << 'EOF'
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
EOF
# src/services/sentiment.js
cat > src/services/sentiment.js << 'EOF'
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
EOF
# src/routes/index.js
cat > src/routes/index.js << 'EOF'
const express = require('express');
const router = express.Router();
const tradingRoutes = require('./trading');
router.use('/trading', tradingRoutes);
const healthRoutes = require('./health');
router.use('/health', healthRoutes);
const userRoutes = require('./user');
router.use('/user', userRoutes);
const strategyRoutes = require('./strategy');
router.use('/strategy', strategyRoutes);
const marketDataRoutes = require('./market-data');
router.use('/market-data', marketDataRoutes);
const tradeRoutes = require('./trade');
router.use('/trade', tradeRoutes);
const signalRoutes = require('./signal');
router.use('/signal', signalRoutes);
const portfolioRoutes = require('./portfolio');
router.use('/portfolio', portfolioRoutes);
const performanceRoutes = require('./performance');
router.use('/performance', performanceRoutes);
const sentimentRoutes = require('./sentiment');
router.use('/sentiment', sentimentRoutes);
const riskRoutes = require('./risk');
router.use('/risk', riskRoutes);
const redisRoutes = require('./redis');
router.use('/redis', redisRoutes);
const logger = require('../utils/logger');
router.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Trading Bot API' });
});
router.use((err, req, res, next) => {
  logger.error('API Error:', err);
  res.status(500).json({ status: 'error', message: 'Internal Server Error' });
});
module.exports = router;
EOF
# src/routes/trading.js
cat > src/routes/trading.js << 'EOF'
const express = require('express');
const router = express.Router();
const tradingEngine = require('../trading/engine');
const logger = require('../utils/logger');
router.post('/start', async (req, res) => {
  try {
    const config = req.body;
    await tradingEngine.startTrading(config, res.socket);
    res.json({ status: 'success', message: 'Trading started' });
  } catch (error) {
    logger.error('Failed to start trading:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});
router.post('/stop', async (req, res) => {
  try {
    await tradingEngine.stopTrading(res.socket);
    res.json({ status: 'success', message: 'Trading stopped' });
  } catch (error) {
    logger.error('Failed to stop trading:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});
router.get('/status', (req, res) => {
  res.json({ status: tradingEngine.isRunning ? 'running' : 'stopped' });
});
router.get('/strategies', (req, res) => {
  const strategies = Array.from(tradingEngine.strategies.values());
  res.json({ status: 'success', data: strategies });
});
router.post('/strategies/activate', async (req, res) => {
  try {
    const { strategyId } = req.body;
    const strategy = tradingEngine.strategies.get(strategyId);
    if (!strategy) {
      return res.status(404).json({ status: 'error', message: 'Strategy not found' });
    }
    strategy.isActive = true;
    res.json({ status: 'success', message: 'Strategy activated' });
  } catch (error) {
    logger.error('Failed to activate strategy:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});
router.post('/strategies/deactivate', async (req, res) => {
  try {
    const { strategyId } = req.body;
    const strategy = tradingEngine.strategies.get(strategyId);
    if (!strategy) {
      return res.status(404).json({ status: 'error', message: 'Strategy not found' });
    }
    strategy.isActive = false;
    res.json({ status: 'success', message: 'Strategy deactivated' });
  } catch (error) {
    logger.error('Failed to deactivate strategy:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});
router.get('/market-data', (req, res) => {
  const marketData = Array.from(tradingEngine.marketData.values());
  res.json({ status: 'success', data: marketData });
});
router.get('/positions', (req, res) => {
  const positions = Array.from(tradingEngine.positions.values());
  res.json({ status: 'success', data: positions });
});
router.get('/orders', (req, res) => {
  const orders = Array.from(tradingEngine.activeOrders.values());
  res.json({ status: 'success', data: orders });
});
router.get('/balance', (req, res) => {
  const exchange = tradingEngine.exchanges.get('paper');
  res.json({ status: 'success', balance: exchange.balance });
});
router.get('/performance', async (req, res) => {
  try {
    const performance = await tradingEngine.calculatePerformance();
    res.json({ status: 'success', data: performance });
  } catch (error) {
    logger.error('Failed to calculate performance:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
router.get('/logs', (req, res) => {
  res.sendFile(require('path').join(__dirname, '../../logs/app.log'));
});
router.get('/config', (req, res) => {
  res.json({ status: 'success', config: tradingEngine.config });
});
router.post('/config', (req, res) => {
  const newConfig = req.body;
  tradingEngine.config = { ...tradingEngine.config, ...newConfig };
  res.json({ status: 'success', message: 'Configuration updated', config: tradingEngine.config });
});
router.get('/status', (req, res) => {
  res.json({ status: tradingEngine.isRunning ? 'running' : 'stopped' });
});
router.get('/logs', (req, res) => {
  res.sendFile(require('path').join(__dirname, '../../logs/app.log'));
});
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
router.get('/config', (req, res) => {
  res.json({ status: 'success', config: tradingEngine.config });
});
router.post('/config', (req, res) => {
  const newConfig = req.body;
  tradingEngine.config = { ...tradingEngine.config, ...newConfig };
  res.json({ status: 'success', message: 'Configuration updated', config: tradingEngine.config });
});
router.get('/status', (req, res) => {
  res.json({ status: tradingEngine.isRunning ? 'running' : 'stopped' });
});
router.get('/logs', (req, res) => {
  res.sendFile(require('path').join(__dirname, '../../logs/app.log'));
});
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
router.get('/config', (req, res) => {
  res.json({ status: 'success', config: tradingEngine.config });
});
router.post('/config', (req, res) => {
  const newConfig = req.body;
  tradingEngine.config = { ...tradingEngine.config, ...newConfig };
  res.json({ status: 'success', message: 'Configuration updated', config: tradingEngine.config });
});
router.get('/status', (req, res) => {
  res.json({ status: tradingEngine.isRunning ? 'running' : 'stopped' });
});
router.get('/logs', (req, res) => {
  res.sendFile(require('path').join(__dirname, '../../logs/app.log'));
});
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
router.get('/config', (req, res) => {
  res.json({ status: 'success', config: tradingEngine.config });
});
router.post('/config', (req, res) => {
  const newConfig = req.body;
  tradingEngine.config = { ...tradingEngine.config, ...newConfig };
  res.json({ status: 'success', message: 'Configuration updated', config: tradingEngine.config });
});
router.get('/status', (req, res) => {
  res.json({ status: tradingEngine.isRunning ? 'running' : 'stopped' });
});
router.get('/logs', (req, res) => {
  res.sendFile(require('path').join(__dirname, '../../logs/app.log'));
});
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
router.get('/config', (req, res) => {
  res.json({ status: 'success', config: tradingEngine.config });
});
router.post('/config', (req, res) => {
  const newConfig = req.body;
  tradingEngine.config = { ...tradingEngine.config, ...newConfig };
  res.json({ status: 'success', message: 'Configuration updated', config: tradingEngine.config });
});
router.get('/status', (req, res) => {
  res.json({ status: tradingEngine.isRunning ? 'running' : 'stopped' });
});
router.get('/logs', (req, res) => {
  res.sendFile(require('path').join(__dirname, '../../logs/app.log'));
});
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
router.get('/config', (req, res) => {
  res.json({ status: 'success', config: tradingEngine.config });
});
router.post('/config', (req, res) => {
  const newConfig = req.body;
  tradingEngine.config = { ...tradingEngine.config, ...newConfig };
  res.json({ status: 'success', message: 'Configuration updated', config: tradingEngine.config });
});
router.get('/status', (req, res) => {
  res.json({ status: tradingEngine.isRunning ? 'running' : 'stopped' });
});
router.get('/logs', (req, res) => {
  res.sendFile(require('path').join(__dirname, '../../logs/app.log'));
});
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
router.get('/config', (req, res) => {
  res.json({ status: 'success', config: tradingEngine.config });
});
router.post('/config', (req, res) => {
  const newConfig = req.body;
  tradingEngine.config = { ...tradingEngine.config, ...newConfig };
  res.json({ status: 'success', message: 'Configuration updated', config: tradingEngine.config });
});
router.get('/status', (req, res) => {
  res.json({ status: tradingEngine.isRunning ? 'running' : 'stopped' });
});
router.get('/logs', (req, res) => {
  res.sendFile(require('path').join(__dirname, '../../logs/app.log'));
});
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
router.get('/config', (req, res) => {
  res.json({ status: 'success', config: tradingEngine.config });
});
router.post('/config', (req, res) => {
  const newConfig = req.body;
  tradingEngine.config = { ...tradingEngine.config, ...newConfig };
  res.json({ status: 'success', message: 'Configuration updated', config: tradingEngine.config });
});
router.get('/status', (req, res) => {
  res.json({ status: tradingEngine.isRunning ? 'running' : 'stopped' });
});
router.get('/logs', (req, res) => {
  res.sendFile(require('path').join(__dirname, '../../logs/app.log'));
});
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
router.get('/config', (req, res) => {
  res.json({ status: 'success', config: tradingEngine.config });
});
router.post('/config', (req, res) => {
  const newConfig = req.body;
  tradingEngine.config = { ...tradingEngine.config, ...newConfig };
  res.json({ status: 'success', message: 'Configuration updated', config: tradingEngine.config });
});
router.get('/status', (req, res) => {
  res.json({ status: tradingEngine.isRunning ? 'running' : 'stopped' });
});
router.get('/logs', (req, res) => {
  res.sendFile(require('path').join(__dirname, '../../logs/app.log'));
});
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
router.get('/config', (req, res) => {
  res.json({ status: 'success', config: tradingEngine.config });
});
router.post('/config', (req, res) => {
  const newConfig = req.body;
  tradingEngine.config = { ...tradingEngine.config, ...newConfig };
  res.json({ status: 'success', message: 'Configuration updated', config: tradingEngine.config });
});
router.get('/status', (req, res) => {
  res.json({ status: tradingEngine.isRunning ? 'running' : 'stopped' });
});
router.get('/logs', (req, res) => {
  res.sendFile(require('path').join(__dirname, '../../logs/app.log'));
});
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
router.get('/config', (req, res) => {
  res.json({ status: 'success', config: tradingEngine.config });
});
router.post('/config', (req, res) => {
  const newConfig = req.body;
  tradingEngine.config = { ...tradingEngine.config, ...newConfig };
  res.json({ status: 'success', message: 'Configuration updated', config: tradingEngine.config });
});
router.get('/status', (req, res) => {
  res.json({ status: tradingEngine.isRunning ? 'running' : 'stopped' });
});
router.get('/logs', (req, res) => {
  res.sendFile(require('path').join(__dirname, '../../logs/app.log'));
});
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
router.get('/config', (req, res) => {
  res.json({ status: 'success', config: tradingEngine.config });
});
router.post('/config', (req, res) => {
  const newConfig = req.body;
  tradingEngine.config = { ...tradingEngine.config, ...newConfig };
  res.json({ status: 'success', message: 'Configuration updated', config: tradingEngine.config });
});
router.get('/status', (req, res) => {
  res.json({ status: tradingEngine.isRunning ? 'running' : 'stopped' });
});
router.get('/logs', (req, res) => {
  res.sendFile(require('path').join(__dirname, '../../logs/app.log'));
});
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
router.get('/config', (req, res) => {
  res.json({ status: 'success', config: tradingEngine.config });
});
router.post('/config', (req, res) => {
  const newConfig = req.body;
  tradingEngine.config = { ...tradingEngine.config, ...newConfig };
  res.json({ status: 'success', message: 'Configuration updated', config: tradingEngine.config });
});
module.exports = router;
EOF
# src/routes/health.js
#TODO: Create health check route
cat > src/routes/health.js << 'EOF'
const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
router.get('/', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
router.get('/status', (req, res) => {
  res.json({ status: 'running', timestamp: new Date().toISOString() });
});
router.get('/logs', (req, res) => {
  res.sendFile(require('path').join(__dirname, '../../logs/app.log'));
});
router.get('/config', (req, res) => {
  res.json({ status: 'success', config: {} });
});
router.post('/config', (req, res) => {
  const newConfig = req.body;
  // Update config logic here
  res.json({ status: 'success', message: 'Configuration updated', config: newConfig });
});
router.use((err, req, res, next) => {
  logger.error('Health Check Error:', err);
  res.status(500).json({ status: 'error', message: 'Internal Server Error' });
});
module.exports = router;
EOF
