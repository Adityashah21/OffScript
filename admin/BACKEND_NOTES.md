# OFFSCRIPT Admin Backend Integration Notes

This document serves as the single source of truth for the `admin/` frontend, compiled directly from `server/API.md`, `server/src/routes/`, `server/src/models/`, and `server/src/schemas/`.

---

## 1. Centralized Error Format

Every error response returns HTTP status codes with the following standard payload:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "fieldName": "Specific error message"
    }
  }
}
```

### Common Error Codes Handled by Admin
- `401 UNAUTHORIZED`: Missing, expired, or invalid Bearer token. Trigger session logout & redirect to `/login`.
- `401 INVALID_CREDENTIALS`: Bad email or password on login.
- `422 VALIDATION_ERROR`: Zod schema failure. `details` is a dictionary where keys match input fields (`fullName`, `mobile`, `price`, `slug`, etc.).
- `400 INVALID_STATUS_TRANSITION`: Attempted illegal order status change.
- `400 INVALID_FILE_TYPE`: Uploaded file is not JPG, PNG, or WebP.
- `404 NOT_FOUND` / `PRODUCT_NOT_FOUND` / `ORDER_NOT_FOUND` / `COLLECTION_NOT_FOUND` / `EDIT_NOT_FOUND`: Resource missing.
- `409 SLUG_EXISTS`: Product, Collection, or Edit slug collision.
- `429 RATE_LIMITED` / `TOO_MANY_ATTEMPTS`: Rate limiter tripped (e.g., >5 login attempts in 15 mins).
- `500 INTERNAL_SERVER_ERROR`: Server unexpected error.

---

## 2. Admin Endpoints Reference

All admin endpoints reside under `/api/admin` and require header:
`Authorization: Bearer <JWT_TOKEN>` (except `/api/admin/auth/login`).

### Authentication (`/api/admin/auth`)

| Method | Path | Request Body / Params | Response | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/admin/auth/login` | `{ email: string, password: string }` | `{ token: string, user: { email: string, role: string } }` | Authenticates admin, returns 7-day JWT. Rate limit: 5 / 15m. |
| `GET` | `/api/admin/auth/me` | None | `{ user: { id: string, email: string, role: string } }` | Verifies current session token. |

---

### Orders Management (`/api/admin/orders`)

| Method | Path | Request Body / Params | Response | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/orders` | Query: `status` (string), `from` (ISO date), `to` (ISO date), `search` (ref/mobile/name), `page` (num), `limit` (num, max 100) | `{ items: Order[], total: number, page: number, limit: number }` | List orders sorted by `createdAt: -1`. |
| `GET` | `/api/admin/orders/:ref` | Param: `ref` (string, e.g. `OS-YYYYMMDD-XXXXXX`) | `Order` object | Detailed order document including full customer address & status history. |
| `PATCH` | `/api/admin/orders/:ref/status` | Body: `{ status: OrderStatus, note?: string }` | Updated `Order` object | Appends to `statusHistory` and updates order status. |
| `GET` | `/api/admin/orders/export` | Query: same filter params as list | `text/csv` attachment (`orders.csv`) | Direct CSV download with name, mobile, address, totals, and product. |

#### Allowed Order Statuses & Transitions
Defined in `server/src/routes/admin/orders.routes.ts`:

- Valid Statuses: `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`, `rto`
- State Machine Transitions:
  - `pending` $\rightarrow$ `confirmed`, `cancelled`
  - `confirmed` $\rightarrow$ `shipped`, `cancelled`
  - `shipped` $\rightarrow$ `delivered`, `rto`
  - `delivered` $\rightarrow$ *None (Terminal)*
  - `cancelled` $\rightarrow$ *None (Terminal)*
  - `rto` $\rightarrow$ *None (Terminal)*

---

### Products Management (`/api/admin/products`)

| Method | Path | Request Body / Params | Response | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/products` | Query: `category`, `inStock` (boolean str), `q` (search term), `page`, `limit` (max 100) | `{ items: Product[], total: number, page: number, limit: number }` | Paginated product list sorted by `lastUpdatedAt: -1`. |
| `POST` | `/api/admin/products` | Body: `ProductInput` | `Product` (HTTP 201) | Create new product. Validates invariants. |
| `GET` | `/api/admin/products/:slug` | Param: `slug` (string) | `Product` | Single product by slug. |
| `PUT` | `/api/admin/products/:slug` | Body: `ProductInput` | `Product` | Full product update. |
| `PATCH` | `/api/admin/products/:slug/price`| Body: `{ price: number, originalPrice?: number }` | `Product` | Updates price and automatically updates `lastUpdatedAt` to ISO now. |
| `PATCH` | `/api/admin/products/bulk-stock` | Body: `{ slugs: string[], inStock: boolean }` | `{ success: true, modifiedCount: number }` | Bulk toggles stock status for multiple products. |
| `DELETE`| `/api/admin/products/:slug` | Param: `slug` (string) | `{ success: true, deletedSlug: string }` | Deletes product. |

---

### Collections & Edits (`/api/admin/collections`, `/api/admin/edits`)

| Method | Path | Request Body / Params | Response | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/collections` | None | `Collection[]` | All collections. |
| `POST` | `/api/admin/collections` | Body: `CollectionInput` | `Collection` (HTTP 201) | Create collection with match rule and placements. |
| `GET` | `/api/admin/collections/:slug` | Param: `slug` | `Collection` | Get collection. |
| `PUT` | `/api/admin/collections/:slug` | Body: `CollectionInput` | `Collection` | Update collection. |
| `DELETE`| `/api/admin/collections/:slug` | Param: `slug` | `{ success: true, deletedSlug: string }` | Delete collection. |
| `GET` | `/api/admin/edits` | None | `Edit[]` | All editorial campaign landing pages. |
| `POST` | `/api/admin/edits` | Body: `EditInput` | `Edit` (HTTP 201) | Create campaign edit. |
| `GET` | `/api/admin/edits/:slug` | Param: `slug` | `Edit` | Get campaign edit. |
| `PUT` | `/api/admin/edits/:slug` | Body: `EditInput` | `Edit` | Update campaign edit. |
| `DELETE`| `/api/admin/edits/:slug` | Param: `slug` | `{ success: true, deletedSlug: string }` | Delete campaign edit. |

*(Note: Public endpoint `GET /api/collections` also returns `productCount` for each collection).*

---

### CRM & Analytics (`/api/admin/crm`, `/api/admin/stats`)

| Method | Path | Request Body / Params | Response | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/crm/contact` | Query: `status` (`new`\|`read`\|`replied`), `page`, `limit` | `{ items: ContactMessage[], total: number, page: number, limit: number }` | Customer messages. |
| `PATCH` | `/api/admin/crm/contact/:id/status` | Body: `{ status: "new" \| "read" \| "replied" }` | `ContactMessage` | Mark read or replied. |
| `GET` | `/api/admin/crm/contact/export` | None | `text/csv` (`contact-messages.csv`) | CSV download of messages. |
| `GET` | `/api/admin/crm/newsletter` | Query: `unsubscribed` (boolean str), `page`, `limit` | `{ items: NewsletterSubscriber[], total: number, page: number, limit: number }` | Subscribers list. |
| `GET` | `/api/admin/crm/newsletter/export`| None | `text/csv` (`newsletter-subscribers.csv`) | CSV download of subscribers. |
| `GET` | `/api/admin/stats/affiliate-clicks` | None | `{ totalClicks: number, byProduct: { productSlug: string, retailer: string, clicks: number }[], byDay: { date: string, clicks: number }[] }` | Affiliate click aggregation (all-time by product, last 30 days by day). |

---

### File Uploads (`/api/admin/uploads`)

| Method | Path | Request Body | Response | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/admin/uploads` | `multipart/form-data` with field `image` | `{ url: string, filename: string, mimetype: string, size: number }` | Uploads JPG/PNG/WebP (max 5 MB). Returns public URL on `/static/`. |

---

## 3. Exact Data Shapes & Field Names

### Product Model (`Product`)
From `server/src/models/Product.ts` and `schemas/product.schema.ts`:

- `id`: string (from MongoDB `_id`)
- `slug`: string (lowercase alphanumeric with hyphens, unique)
- `name`: string
- `description`: string
- `category`: `"Tops" | "Shirts" | "Bottoms" | "Dresses" | "Footwear" | "Accessories"`
- `subcategory`: string
- `gender`: `"women" | "men" | "unisex"`
- `retailer`: string
- `brand`: string
- `price`: number (integer INR)
- `originalPrice`?: number (optional integer; must be strictly greater than `price`)
- `currency`: `"INR"` (fixed constant)
- `images`: string[] (array of image URLs; at least 1 required)
- `availableSizes`: string[] (e.g., `["XS", "S", "M", "L", "XL"]` or `[]` for accessories)
- `availableColors`: string[]
- `tags`: string[]
- `collectionIds`: string[] (slugs of linked collections)
- `affiliateUrl`: string | null (valid URL or null)
- `purchaseMode`: `"affiliate" | "authorized_cod"`
- `codEnabled`: boolean (CRITICAL INVARIANT: `codEnabled === (purchaseMode === "authorized_cod")`)
- `shippingCharge`: number (integer, default 0)
- `inStock`: boolean (default true)
- `isFeatured`: boolean (default false)
- `isNew`: boolean (default false)
- `isEditorsPick`: boolean (default false)
- `material`?: string (optional)
- `fit`?: string (optional)
- `lastUpdatedAt`: string (ISO 8601 string)

### Order Model (`Order`)
From `server/src/models/Order.ts`:

- `id`: string
- `ref`: string (unique, format `OS-YYYYMMDD-XXXXXX`)
- `product`:
  - `productId`: string
  - `slug`: string
  - `name`: string
  - `image`: string
  - `unitPrice`: number
  - `shippingCharge`: number
- `customer`:
  - `fullName`: string
  - `mobile`: string (10 digits)
  - `email`?: string (optional)
  - `address`:
    - `house`: string
    - `street`: string
    - `landmark`?: string (optional)
    - `city`: string
    - `state`: string (one of the 36 Indian states/UTs)
    - `pin`: string (6-digit PIN)
- `size`?: string (optional)
- `color`: string
- `quantity`: number (1 to 5)
- `instructions`?: string (optional)
- `itemTotal`: number (`unitPrice * quantity`)
- `shipping`: number (`shippingCharge`)
- `grandTotal`: number (`itemTotal + shipping` = amount to collect on delivery)
- `status`: `"pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "rto"`
- `statusHistory`: array of `{ status: OrderStatus, timestamp: Date, note?: string }`
- `attribution`?: `{ utm_source?: string, utm_medium?: string, utm_campaign?: string, utm_content?: string, utm_term?: string, landing?: string, capturedAt?: string }`
- `paymentMode`: `"COD"` (fixed constant)
- `confirmedDetails`: boolean (true)
- `createdAt`: string (ISO date)
- `updatedAt`: string (ISO date)

### Collection Model (`Collection`)
- `id`: string
- `slug`: string
- `title`: string
- `eyebrow`: string
- `description`: string
- `image`: string
- `match`:
  - `matchAll`?: boolean
  - `any`?: array of `{ field: "gender" | "category" | "collectionIds" | "tags" | "price" | "isNew" | "isFeatured" | "isEditorsPick", op: "eq" | "in" | "lt" | "containsAny" | "isTrue", value: string | number | boolean | string[] }`
- `placements`: array of `{ surface: "trend" | "occasion" | "mood", label?: string, note?: string, order: number }`

### Campaign Edit Model (`Edit`)
- `id`: string
- `slug`: string
- `headline`: string[] (array of headline line fragments)
- `intro`: string
- `image`: string
- `collection`: string (slug of primary collection)
- `related`: string[] (slugs of related collections)

---

## 4. Missing Backend Endpoints & Frontend Handling

Per the feature requirements and backend code inspection, the following endpoints are not implemented in `server/`. We will not modify `server/` or invent endpoints; the `admin/` frontend is designed around them as follows:

1. **Bulk Order Status Update Endpoint**:
   - *Status*: The backend provides `PATCH /api/admin/orders/:ref/status` for single orders only; there is no bulk orders endpoint.
   - *Frontend Handling*: The bulk actions UI on the Orders list will execute sequential status update requests with individual state transition checks, showing a progress toast with success/failure summary.

2. **Dedicated Dashboard Summary / Metrics Endpoint**:
   - *Status*: There is no dedicated `/api/admin/dashboard` or aggregate metrics endpoint.
   - *Frontend Handling*: The frontend Dashboard will query `GET /api/admin/orders?limit=100` and `GET /api/admin/products?limit=100` via TanStack Query and compute:
     - Orders today count
     - Pending orders count & pending COD value (sum of `grandTotal` where status is `pending`)
     - Total products & out-of-stock product count
     - Needs attention orders (pending orders with `createdAt < now - 24 hours`)
     - 14-day orders volume chart (grouped by `createdAt` YYYY-MM-DD)

3. **Live Ad-Hoc Match Rule Preview Endpoint**:
   - *Status*: No endpoint exists to test unsaved rule JSON against products without saving the collection.
   - *Frontend Handling*: The Collection form will display saved collection counts from `GET /api/collections` and show a clear client-side schema description for rule conditions.

4. **Product-Scoped Order Filtering on Backend**:
   - *Status*: `GET /api/admin/orders` supports `status`, `from`, `to`, and `search` (matching `ref`, `customer.mobile`, `customer.fullName`), but does not accept `productSlug` as a backend query parameter.
   - *Frontend Handling*: Product-level filtering on the Orders list will be applied client-side across retrieved order items.

5. **Date-Range Parameters for Affiliate Click Analytics**:
   - *Status*: `GET /api/admin/stats/affiliate-clicks` returns a fixed structure (all-time clicks by product, and the last 30 days by day) without query param support.
   - *Frontend Handling*: The Clicks page will display the 30-day timeline chart and allow client-side filtering/sorting of the daily table.
