# API Endpoint Reference

This document describes the REST API and WebSocket endpoints for the Trading Bot System.

---

## Base URL

- REST: `http://localhost:3000/api`
- WebSocket: `ws://localhost:3000`

---

## Table of Contents

- [General](#general)
- [Trading](#trading)
- [Health](#health)
- [User](#user)
- [Strategy](#strategy)
- [Market Data](#market-data)
- [Trade](#trade)
- [Signal](#signal)
- [Portfolio](#portfolio)
- [Performance](#performance)
- [Sentiment](#sentiment)
- [Risk](#risk)
- [Redis](#redis)
- [WebSocket Events](#websocket-events)

---

## General

### `GET /api/`
Returns a welcome message.

**Response:**
```json
{ "message": "Welcome to the Trading Bot API" }
```

---

## Trading

### `POST /api/trading/start`
Start trading with a given configuration.

**Body:**  
```json
{ "configKey": "value", ... }
```

**Response:**  
```json
{ "status": "success", "message": "Trading started" }
```

---

### `POST /api/trading/stop`
Stop trading.

**Response:**  
```json
{ "status": "success", "message": "Trading stopped" }
```

---

### `GET /api/trading/status`
Get trading engine status.

**Response:**  
```json
{ "status": "running" }
```

---

### `GET /api/trading/strategies`
List all strategies.

---

### `POST /api/trading/strategies/activate`
Activate a strategy.

**Body:**  
```json
{ "strategyId": 1 }
```

---

### `POST /api/trading/strategies/deactivate`
Deactivate a strategy.

**Body:**  
```json
{ "strategyId": 1 }
```

---

### `GET /api/trading/market-data`
Get current market data.

---

### `GET /api/trading/positions`
Get current positions.

---

### `GET /api/trading/orders`
Get active orders.

---

### `GET /api/trading/balance`
Get paper trading balance.

---

### `GET /api/trading/performance`
Get performance metrics.

---

### `GET /api/trading/logs`
Download application logs.

---

### `GET /api/trading/health`
Health check for trading engine.

---

### `GET /api/trading/config`
Get current trading configuration.

---

### `POST /api/trading/config`
Update trading configuration.

**Body:**  
```json
{ "configKey": "value", ... }
```

---

## Health

### `GET /api/health/`
Basic health check.

---

### `GET /api/health/status`
Get system status.

---

### `GET /api/health/logs`
Download logs.

---

### `GET /api/health/config`
Get health-related config.

---

### `POST /api/health/config`
Update health-related config.

---

## User

### `GET /api/user/`
User info and management endpoints (see implementation for details).

---

## Strategy

### `GET /api/strategy/`
Strategy management endpoints (see implementation for details).

---

## Market Data

### `GET /api/market-data/`
Market data endpoints (see implementation for details).

---

## Trade

### `GET /api/trade/`
Trade management endpoints (see implementation for details).

---

## Signal

### `GET /api/signal/`
Signal endpoints (see implementation for details).

---

## Portfolio

### `GET /api/portfolio/`
Portfolio endpoints (see implementation for details).

---

## Performance

### `GET /api/performance/`
Performance endpoints (see implementation for details).

---

## Sentiment

### `GET /api/sentiment/`
Sentiment analysis endpoints (see implementation for details).

---

## Risk

### `GET /api/risk/`
Risk management endpoints (see implementation for details).

---

## Redis

### `GET /api/redis/`
Redis cache endpoints (see implementation for details).

---

## WebSocket Events

Connect to: `ws://localhost:3000`

### Events

- `subscribe_market_data`  
  **Payload:** `{ symbols: ["AAPL", "GOOGL"] }`

- `start_trading`  
  **Payload:** `{ config: { ... } }`

- `stop_trading`

- `trading_started`  
  **Payload:** `{ status: "success" }`

- `trading_stopped`  
  **Payload:** `{ status: "success" }`

---

## Error Handling

All endpoints return errors in the following format:
```json
{ "status": "error", "message": "Error message" }
```

---

## Notes

- Most endpoints require authentication (JWT) in production.
- See individual route files in [`src/routes/`](trading-bot-system/src/routes/) for further details and custom endpoints.
- For advanced usage, refer to the [Software Requirements Specification](REQUIREMENTS.md).
