# Base API

REST API built with Ts.ED framework and TypeScript.

## Prerequisites

- Node.js 22+
- MySQL
- Redis

## Setup

```sh
cp .env.example .env
yarn install
```

## Docker

```sh
docker build -t base-api .
docker run -p 3000:3000 --env-file .env base-api
```

## PM2

```sh
pm2 start npm --name base-api-dev -- start
pm2 start npm --name base-api-prod -- start:prod
pm2 save
```

## Running

```sh
# Development
yarn start

# Production
yarn build && yarn start:prod
```

## Features

- **Authentication**: JWT, Google OAuth, session management, email verification, password recovery
- **Database**: Sequelize ORM with MySQL
- **Cache**: Redis for sessions and rate limiting
- **Email**: SendGrid, Brevo, Postmark providers
- **SMS**: Infobip provider
- **Storage**: AWS S3 integration
- **Calendar**: Google Calendar sync
- **Payments**: Stripe integration
- **WebSocket**: Socket.io for real-time communication
- **Webhooks**: Inbound webhook processing

## Project Structure

```
src/
├── controllers/      # API and page controllers
├── database/        # Models and migrations
├── interfaces/      # TypeScript interfaces
├── providers/       # Email/SMS providers
├── schemas/         # Validation schemas
├── services/       # Business logic
├── types/           # Type definitions
└── utils/          # Utilities
```

## Scripts

| Command | Description |
|---------|-------------|
| `yarn start` | Run in development |
| `yarn build` | Compile TypeScript |
| `yarn start:prod` | Run in production |
| `yarn migrate:db` | Run database migrations |
| `yarn script:stripe` | Run Stripe scripts |

## License

MIT