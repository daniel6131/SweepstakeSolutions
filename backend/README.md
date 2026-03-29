# Serverless Backend

## Setup

```bash
npm install
```

## Local Development

```bash
# Create .env file
cp .env.example .env
# Add your API_FOOTBALL_KEY

# Start local server
npx serverless offline
# Runs on http://localhost:3001
```

## Deploy

```bash
# Deploy to dev
npm run deploy:dev

# Deploy to production
npm run deploy:prod
```

## Endpoints

- GET /health
- GET /api/fixtures
- GET /api/fixture/{id}
- GET /api/standings
