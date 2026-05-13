# Creditly System

Creditly is a backend-first system that models a production-style lending workflow:

- strict RBAC (backend-enforced)
- blind auction lifecycle
- event-driven account updates
- CRM integration with failure tracking
- **Angular UI** wired to the API (login, accounts, events, auctions, offers, analytics)

## Quick start (full demo)

You need **two terminals**: API on port **5000**, UI on port **4200**.

### 1) Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

### 2) Frontend

```bash
cd creditly-system
npm install
npm start
```

Open **http://localhost:4200** — you should see the **Creditly** login screen (not the old Angular placeholder).

### Demo users (after `npm run seed`)

Password for all: **`Creditly123!`**

| Role    | Email                    |
| ------- | ------------------------ |
| Admin   | `admin@creditly.demo`    |
| Manager | `manager@creditly.demo`  |
| Banker A | `banker@creditly.demo`  |
| Banker B | `banker-b@creditly.demo` |
| Customer (USER) | `customer@creditly.demo` |

**Try this flow:** log in as **manager** → open an account → **Open 3-day auction** → log out → log in as **banker** → **Open auctions** → submit an offer → log back in as **manager** → **Close auction** on that account.

The API allows CORS from `http://localhost:4200`. The UI calls `http://localhost:5000` (see `src/environments/environment.ts`).

## Repository Structure

- `src/` - Angular app (Creditly UI + SSR)
- `backend/` - Creditly API (Node.js + TypeScript + Express + Prisma)

## Backend Features

- JWT authentication (`POST /auth/login`)
- Role model: `ADMIN | MANAGER | USER | BANKER`
- Layered architecture:
  - controllers: HTTP handling only
  - services: business logic
  - repositories: data access
  - integrations: external CRM sync
- Banker-safe DTO filtering for sensitive account data
- Auction rules:
  - fixed 3-day duration
  - no offers after expiration
  - winner = lowest `interestRate`
  - no-offer close marks auction as `EXPIRED`
- Event processing:
  - `document_uploaded` updates `lastActivity`
  - high activity flag when `> 3` events in 24h
  - CRM sync with `syncStatus` + `failureReason`

## Backend Setup

1. Open terminal in `backend`:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment:

```bash
copy .env.example .env
```

4. Generate Prisma client and sync database:

```bash
npx prisma generate
npx prisma db push
```

5. Start backend in dev mode:

```bash
npm run dev
```

Backend runs on `http://localhost:5000` by default.

## Backend Scripts

From `backend/`:

- `npm run dev` - run with watch mode
- `npm run build` - compile TypeScript
- `npm run start` - run compiled server
- `npm run test` - run integration tests
- `npm run prisma:generate` - generate Prisma client
- `npm run prisma:push` - push schema to DB
- `npm run prisma:migrate` - create/apply migration locally

- `npm run seed` - insert demo users and accounts (local SQLite)

## API Endpoints

### Auth

- `POST /auth/login` — returns `{ token, user }`

### Accounts

- `GET /accounts`
- `GET /accounts/:id`
- `GET /accounts/:id/events` — timeline (not available to bankers)

### Events

- `POST /events`

### Auctions

- `POST /accounts/:id/auctions`
- `GET /auctions/open`
- `POST /auctions/:id/offers`
- `POST /auctions/:id/close`

### Analytics

- `GET /analytics/summary`

## Testing

Backend integration tests are in `backend/tests/integration.test.ts` and cover:

1. Banker cannot see sensitive account fields
2. RBAC enforcement behavior
3. Offer rejection after expiration
4. Best-offer winner selection
5. CRM integration failure persistence

Run:

```bash
cd backend
npm run test
```

## Notes

- Current Prisma datasource is SQLite for local development (`file:./dev.db`).
- Frontend and backend are currently separate apps in one repository.
