# OFFSCRIPT

> Curated fashion discovery, affiliate redirects, and authorized Cash on Delivery (COD) platform.

This monorepo contains:
- `client/`: A Lovable-generated TanStack Start (React 19 + TypeScript + Vite + Tailwind CSS) editorial frontend.
- `server/`: A robust Node.js + Express + TypeScript + MongoDB (Mongoose) backend API with Zod validation, rate limiting, and an admin management API.

---

## Quick Start: Running Client and Server Together

### 1. Prerequisites
- **Node.js**: v20 or higher (v22+ recommended)
- **MongoDB**: A running MongoDB instance (local or MongoDB Atlas connection string)
- **Bun** or **npm** (the client uses Bun/Vite, the server uses npm/tsx)

---

### 2. Setting Up the Server (`server/`)

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Configure environment:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Default settings in `.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/offscript
   CLIENT_ORIGIN=http://localhost:3000
   JWT_SECRET=replace_with_a_secure_random_secret_at_least_32_chars
   ADMIN_EMAIL=admin@offscript.in
   ADMIN_PASSWORD=change_this_secure_admin_password_123
   PUBLIC_BASE_URL=http://localhost:5000
   ```

3. **Seed Database and Static Assets:**
   Populates 14 products, 27 rule-based collections, 5 campaign edits, copies seed images to `server/uploads/seed/`, and creates the initial admin user:
   ```bash
   npm run seed
   ```

4. **Start the Backend Development Server:**
   ```bash
   npm run dev
   ```
   The server will start listening at `http://localhost:5000`.

---

### 3. Setting Up the Frontend (`client/`)

1. **Navigate to `client/` and install dependencies:**
   ```bash
   cd ../client
   bun install
   # or: npm install
   ```

2. **Configure frontend environment:**
   Create or update `client/.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

3. **Start the Frontend Development Server:**
   ```bash
   bun dev
   # or: npm run dev
   ```
   The client will open at `http://localhost:3000` (or `http://localhost:8080` depending on port availability; ensure `CLIENT_ORIGIN` in `server/.env` matches this).

---

## Server Scripts

Inside `server/`:

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | `tsx watch src/server.ts` | Starts backend with hot reloading |
| `npm run build` | `tsc` | Compiles TypeScript to `dist/` |
| `npm start` | `node dist/server.js` | Runs compiled production server |
| `npm test` | `vitest run` | Runs full test suite using in-memory MongoDB |
| `npm run seed` | `tsx src/scripts/seed.ts` | Idempotent database & image seeder |
| `npm run create-admin` | `tsx src/scripts/createAdmin.ts` | Creates/updates admin account |
| `npm run lint` | `tsc --noEmit` | Strict TypeScript typechecking |

---

## Architecture & Features

### Server Security & Resiliency
- **Data-Driven Match Rules**: Collections use declarative rule expressions (`eq`, `in`, `lt`, `containsAny`, `isTrue`, `matchAll`) translated dynamically to MongoDB filters (`collectionMatcher`).
- **Server-Authoritative COD Orders**: The server never trusts client pricing. All order totals are calculated dynamically from product database snapshots (`grandTotal = price * qty + shippingCharge`).
- **Anti-Abuse & Rate Limiting**:
  - Hidden honeypot fields (`_hp`) prevent automated bot submissions.
  - Duplicate order guard blocks repeated submissions (same mobile + product + size within 10 minutes, returning 429 `DUPLICATE_ORDER`).
  - Supports `Idempotency-Key` headers for safe retries.
  - Stricter rate limits on write endpoints (`/orders`, `/contact`, `/newsletter`, `/auth/login`).
- **PII-Safe Logging**: Morgan HTTP logging records method, status, and latency without logging request bodies, headers, or PII (phone numbers, addresses, emails).
- **Stateless Admin API**: Protected by JWT Bearer tokens and bcrypt password hashing. Includes CSV export for orders and CRM, plus product stock toggles and price updates.
- **Affiliate Engine**: PII-free click tracking and 302 redirection preserving `rel="sponsored nofollow"` attributes.

For complete API endpoint details, payloads, and response formats, see [`server/API.md`](server/API.md).
