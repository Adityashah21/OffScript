# OFFSCRIPT Admin Dashboard

A private, owner-only administration console and fulfillment dashboard for **OFFSCRIPT** — built with React 19, TypeScript (strict), Vite, Tailwind CSS, TanStack Query, and Recharts.

---

## 1. Overview & Architecture

The admin console provides complete operational management for the OFFSCRIPT e-commerce platform:
- **Cash-on-Delivery (COD) Order Fulfillment**: Real-time order review, tap-to-call, WhatsApp direct messaging, thermal shipping label printing (A6 format), and status state-machine transitions.
- **Product Catalog & Invariants**: Multi-variant clothing management, image uploads with drag-and-drop, real-time live storefront preview cards, and strict invariant validation.
- **Dynamic Collections & Editorial Edits**: Rule-based collections, product pinning, and Markdown editorial drops.
- **Customer CRM & Inbox**: Inbound support tickets, subscriber list, and CSV exports.
- **Affiliate Analytics**: Outbound merchant referral tracking and retailer leaderboards.

---

## 2. Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite 6](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (strict mode)
- **Routing**: [React Router v7](https://reactrouter.com/) (code-split with `React.lazy` and `Suspense`)
- **Server State & Polling**: [TanStack Query v5](https://tanstack.com/query)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with neutral stone palette, high typography, dark mode, and print stylesheets
- **Form Validation**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Charts**: [Recharts](https://recharts.org/) (used strictly for dashboard trends and affiliate analytics)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/)
- **Testing**: [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) (28/28 tests passing)

---

## 3. Auth & Security

1. **Token Storage**:
   - Authentication tokens are maintained in memory and synchronized to `sessionStorage` (never persisted to `localStorage`).
   - Every request injects `Authorization: Bearer <token>`.
2. **Inactivity Auto-Logout**:
   - An activity listener monitors user interaction (mouse, keyboard, touch, scroll) and automatically logs out the admin session after **30 minutes of inactivity**.
3. **401 Interception**:
   - Any `401 Unauthorized` response immediately purges the session and redirects the user to `/login`.
4. **Data Privacy (PII Protection)**:
   - Customer personally identifiable information (full names, mobile numbers, delivery addresses) is never exposed in URLs, console logs, or analytics trackers.
   - Order detail views identify orders strictly by their unique reference (e.g. `/orders/OS-2026-0001`).
5. **Search Engine Protection**:
   - Includes `<meta name="robots" content="noindex, nofollow" />` and `/public/robots.txt` disallowing all crawler indexing.
6. **Render Cold-Start Handling**:
   - When the backend is sleeping on Render's free tier, login and API calls detect latency and provide a friendly *"Waking up server, this can take ~30s"* notification.

---

## 4. Key Features

### Orders Management (`/orders`, `/orders/:ref`)
- **Status Tabs**: Live counts for `All`, `Pending`, `Confirmed`, `Shipped`, `Delivered`, `Cancelled`, and `RTO`.
- **Search & Filters**: Search by order reference or customer name; filter by start/end date range and product keywords.
- **Bulk Status Actions**: Sequential bulk status advancement with progress feedback toasts.
- **Customer Communication**: Direct tap-to-call link (`tel:...`) and pre-filled WhatsApp link (`https://wa.me/91XXXXXXXXXX`).
- **Shipping Label Print Layout**: Formatted for A6 thermal/standard courier printers with bold COD collection amount, address blocks, package breakdown, and return hub details.
- **Address Clipboard Copy**: Single-click copy of clean, multi-line delivery address block.
- **Strict State Transitions**:
  - `pending` $\rightarrow$ `confirmed`, `cancelled`
  - `confirmed` $\rightarrow$ `shipped`, `cancelled`
  - `shipped` $\rightarrow$ `delivered`, `rto`
  - `delivered`, `cancelled`, `rto` are terminal states.
- **CSV Export**: RFC 4180-compliant export with proper character escaping.

### Products Management (`/products`, `/products/new`, `/products/:id/edit`)
- **Catalog Table**: Thumbnails, brand, category, selling price with strikethrough original price, and highlight badges (`New Drop`, `Editor's Pick`, `Featured`).
- **Inline Optimistic In-Stock Toggle**: Updates UI instantly and synchronizes via `PATCH /api/admin/products/bulk-stock`.
- **Purchase Mode Invariant Guard**:
  - `codEnabled === (purchaseMode === 'authorized_cod')`
  - Selecting "Affiliate link" displays the external affiliate URL and disables COD.
  - Selecting "Cash on Delivery" displays shipping charge and authorizes COD requests.
- **Pricing Invariant**:
  - `originalPrice` is strictly enforced to be greater than `price`.
- **Image Uploader**:
  - Drag-and-drop multi-file upload connected to `POST /api/admin/uploads`.
  - Client-side format (JPG, PNG, WebP) and 5 MB size validation.
  - Thumbnails reordering (first image becomes main cover).
  - External image URL paste fallback.
- **Variant Chips**:
  - Quick presets for Apparel (`XS`–`XXL`), Waist (`28`–`36`), Footwear (`UK 5`–`UK 10`), Popular colors, and "No sizes" (for accessories).
- **Live Storefront Preview**:
  - Side card showing live reflection of the product card as displayed to buyers.
- **Duplicate Product Action**: Opens the form pre-filled with the source piece and a fresh slug.
- **Unsaved Changes Warning**: `beforeunload` listener warns when navigating away with unsaved edits.

### Dashboard Overview (`/`)
- **KPI Stat Cards**: Orders Today, Pending Orders, Pending COD Value (₹), Catalog Pieces, and Out of Stock.
- **14-Day Orders & Revenue Chart**: Daily trend visualization in IST with custom currency tooltips.
- **Needs Attention Alert**: Flags any pending order older than 24 hours to prevent fulfillment delays.
- **Latest 5 Orders**: Immediate summary of newest incoming orders.

### Collections & Edits (`/collections`, `/edits`)
- **Rule-Based Collections**: Dynamic rules matching products by `category`, `brand`, `gender`, `tags`, or `price` with operators (`=`, `≠`, `in`, `≥`, `≤`).
- **Pinned Pieces**: Prioritize hero products at the top of collections.
- **Editorial Lookbooks**: Markdown articles and lookbooks with linked pieces and cover images.

### Inbox & Affiliate Analytics (`/inbox`, `/analytics`)
- **Customer Messages**: Inbound contact inquiries filtered by status (`new`, `read`, `replied`) with mailto replies.
- **Newsletter Subscribers**: Active subscriber list with CSV export.
- **Affiliate Analytics**: Outbound referral clicks, 30-day activity bar chart, and partner retailer performance ranking.

---

## 5. Local Development Setup

### Prerequisites
- Node.js $\ge 20$
- Backend server running (default `http://localhost:5000`)

### Installation & Execution
```bash
# Navigate to admin folder
cd admin

# Install dependencies
npm install

# Start development server (runs on port 5174)
npm run dev

# Run Vitest test suite
npm test

# Run TypeScript type check
npm run lint

# Build production bundle
npm run build
```

---

## 6. Environment Variables

Create `.env` in the `admin/` folder (see `.env.example`):

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL for the Express API | `http://localhost:5000` |
| `VITE_STORE_URL` | Public URL for the TanStack Start storefront | `http://localhost:8080` |

---

## 7. Production Deployment

The admin frontend is a client-side Single Page Application (SPA).

### Render Static Site Setup
1. Create a new **Static Site** on Render.
2. Connect your repository: `https://github.com/Adityashah21/OffScript.git`.
3. Set **Root Directory** to `admin`.
4. Set **Build Command**: `npm install && npm run build`
5. Set **Publish Directory**: `dist`
6. Add **Rewrite Rule** in Render:
   - Source: `/*`
   - Destination: `/index.html`
   - Action: `Rewrite`
7. Set Environment Variables:
   - `VITE_API_URL`: Your deployed backend URL (e.g. `https://offscript-server.onrender.com`)
   - `VITE_STORE_URL`: Your storefront URL
