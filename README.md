# BitPit

A Bitcoin wallet application built with a modern TypeScript monorepo architecture.

## Prerequisites

- Node.js >= 23
- npm

## Quick Start

```bash
# Set up the .env file
echo JWT_SECRET=SOME_TOTAL_SECRET > .env
echo DB_PATH=`pwd`/bitpit.db >> .env

# Install dependencies
npm install && npm install -ws

# Build everything
npm run build

# Initialize database
npm run db:migrate

# Run the assignment test:
npm run build+test:backend

# Or start development servers (backend + web)
npm run dev

# Or run individually:
npm run dev:backend  # Backend API server
npm run dev:web      # Frontend development server

# Or run the backend and web in production mode:
npm run start:backend  # Start backend in production mode
npm run start:web      # Start web in production mode

```

## Assumptions

Address balance and transactions sync is initiated by the user. If I had a node
then rolling updates could be done. Or a cron job hitting the API.

Addresses are not verified so many users can claim the same address. They could
be verified through signing but that's well out of scope.

Due to getting rate limited, I am forced to assume that my blockchain.com
integration works as intended.

## Intersting Archiectural Decisions

I went with an HTTP API because it's familiar and CoinTracker is a SaaS product
so that's what I'd be building (I assume).

There is a lot of duplication of types between the models and the database.
It's necessary to keep the frontend from trying to import nodejs-only modules.
This doesn't matter for this project, however.

I use Zod extensively because it simplifies assurance of type over the wire.

## What I'd Do Differently

I have been building a side project for the past few months so I took heavily
from there. That turned out to be a big mistake because I didn't need very much
of that code. Hence the overbuilt project!

I'd have set up a VPN so I could get past the IP blocking or build a mock of
of the blockchain.com API to test against.
