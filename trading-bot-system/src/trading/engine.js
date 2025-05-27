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
