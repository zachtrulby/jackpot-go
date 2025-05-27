# Project Setup Guide

Follow these steps to get your trading bot system up and running:

## 1. Clone the Repository

```sh
git clone https://github.com/your-org/jackpot-go.git
cd jackpot-go/trading-bot-system
```

## 2. Configure Environment Variables

Copy the example environment file and edit as needed:

```sh
cp ../staging/.env.example .env
# Edit .env to set your secrets and API keys
```

## 3. Build and Start Dependencies

Make sure Docker and Docker Compose are installed.

```sh
docker-compose up -d
```

This will start:
- PostgreSQL (with TimescaleDB)
- Redis
- The trading bot server

## 4. Install Node and Python Dependencies (if running locally)

```sh
npm install
pip3 install -r requirements.txt
```

## 5. Build the Project

```sh
npm run build
```

## 6. Start the Application

```sh
npm start
```

Or, for development with hot reload:

```sh
npm run dev
```

## 7. Access the API

- REST API: [http://localhost:3000/api](http://localhost:3000/api)
- Health check: [http://localhost:3000/health](http://localhost:3000/health)

## 8. Logs

Logs are written to `logs/app.log` and can be tailed with:

```sh
docker-compose logs -f
```

---

**Note:**  
- Update `.env` with your actual API keys and secrets before running in production.
- For troubleshooting, check the logs and ensure all services are healthy.