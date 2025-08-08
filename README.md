# BitPit

A Bitcoin wallet application.

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
npm run test

# Start development server
npm run dev

# Or run in production mode:
npm run start

```

## Assumptions

Address balance and transactions sync is initiated by the user. If I had a node
then rolling updates could be done. Or a cron job hitting the API.

Addresses are not verified so many users can claim the same address. They could
be verified through signing but that's well out of scope.

Integrating with the bitcoin APIs is difficult due to rate limiting. I assume
that there is no rate limiting to keep the scope of this project small.

## Interesting Architectural Decisions

I went with an HTTP API because it's familiar and CoinTracker is a SaaS product
so that's what I'd be building (I assume).

There is a lot of duplication of types between the models and the database.
It's necessary to keep the frontend from trying to import nodejs-only modules.
This doesn't matter for this project, however.

I use Zod extensively because it simplifies assurance of type over the wire.
