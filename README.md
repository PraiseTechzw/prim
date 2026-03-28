# ZimBus: Production-Ready Bus Booking System for Zimbabwe

ZimBus is a professional bus ticketing platform designed specifically for the unique operational requirements of the Zimbabwean transport market. It bridges the gap between digital convenience and real-world logistics (branch networks, manual payments, and offline manifest management).

## Tech Stack
- **Frontend/Backend:** Next.js 15 (App Router, Server Actions)
- **Database:** PostgreSQL with [Kysely](https://kysely.dev/)
- **Caching/Concurrency:** Redis (Distributed locking for seat selection)
- **Validation:** Zod
- **Styling:** Tailwind CSS + Framer Motion (Mobile-first)

## Getting Started

### 1. Prerequisites
- **Node.js 18+**
- **PostgreSQL** instance
- **Redis** server

### 2. Environment Setup
Create a `.env` file in the root directory (refer to `.env.example`):
```env
DATABASE_URL=postgresql://user:password@localhost:5432/zimbus
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_key
```

### 3. Database Initialization
Run the provided `schema.sql` against your PostgreSQL database to create tables, enums, and indexes:
```bash
psql -d zimbus -f schema.sql
```

### 4. Seed Testing Data
Run the seeding script to populate operators, buses, and routes:
```bash
npx ts-node src/lib/seed.ts
```

### 5. Start Development
```bash
npm run dev
```

## Key Features Implemented (Phase 1)
- **Visual Seat Map:** Mobile-optimized 2x2 layout with real-time status fetching.
- **Seat Locking:** 10-minute pessimistic locks via Redis to prevent double booking.
- **Search Engine:** Filter by Zimbabwean cities (Harare, Bulawayo, etc.) and travel dates.
- **Admin Manifests:** High-level dashboard for operators to track occupancy and schedules.
- **Payment Abstraction:** Interfaces for EcoCash (USSD Push), InnBucks, and Manual Cash verification.

## Deployment Strategy
1. **Frontend:** Deploy on Vercel for worldwide CDN and fast Edge rendering.
2. **Backend Services:** Use Railway or Render for Node.js API and Worker processes.
3. **Database:** Supabase or Amazon RDS (AF-South-1 Region for Zim/SADC low-latency).
4. **Cache:** Upstash Redis (Serverless).

## Contact & Credits
ZimBus Project Team - 2024
