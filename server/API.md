# OFFSCRIPT API Documentation

The OFFSCRIPT API is a Node.js + Express + TypeScript + MongoDB (Mongoose) backend powering the OFFSCRIPT fashion discovery, affiliate links, and cash-on-delivery (COD) request platform.

All responses use standard HTTP status codes and JSON payloads.

---

## Centralized Error Format

All error responses from the API adhere to this unified format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "mobile": "Enter a valid 10-digit Indian mobile number.",
      "pin": "Enter a valid 6-digit PIN code."
    }
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR` (422): Sent when payload validation fails. `details` is a dictionary keyed by input field names.
- `INVALID_JSON` (400): Malformed JSON body.
- `UNAUTHORIZED` (401): Missing, expired, or invalid JWT Bearer token.
- `INVALID_CREDENTIALS` (401): Incorrect email or password during admin login.
- `CORS_FORBIDDEN` (403): Request origin is not permitted by CORS policy.
- `NOT_FOUND` / `PRODUCT_NOT_FOUND` / `COLLECTION_NOT_FOUND` (404): Resource not found.
- `SLUG_EXISTS` (409): Duplicate slug when creating products/collections/edits.
- `DUPLICATE_ORDER` (429): Duplicate COD request placed for same mobile + product + size within 10 minutes.
- `RATE_LIMITED` / `TOO_MANY_ATTEMPTS` (429): Rate limiter threshold exceeded.
- `INTERNAL_SERVER_ERROR` (500): Unhandled exception.

---

## Client Integration Guide

### 1. Unified API Client
The frontend (`client/`) was designed to swap mock data from `src/data/*` with backend calls seamlessly without changing components. We recommend creating `client/src/lib/api.ts` that exports fetchers with the same return types.

### 2. Environment Variables
Add the following to `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Server-Side Rendering (SSR) Considerations
TanStack Start uses SSR loaders. Ensure that:
- Server-side loaders use the **absolute URL** (e.g. `http://localhost:5000/api/products`), as relative URLs like `/api/products` will fail during server pre-rendering.
- The `CLIENT_ORIGIN` env variable on the backend must match the frontend origin (`http://localhost:3000`) so CORS headers are permitted.

### 4. Affiliate Links & SEO
When rendering affiliate outbound links:
- Always preserve `rel="sponsored nofollow"` on anchor tags for compliance and SEO best practices.
- Use the redirect endpoint `/r/:slug` (e.g. `<a href="http://localhost:5000/r/minimal-everyday-sneakers" rel="sponsored nofollow">Buy on Sole Street</a>`).

---

## Public API Endpoints

### Health Check
- **`GET /api/health`** (or **`GET /health`**)
  - Returns `200 OK`
  - Response:
    ```json
    {
      "status": "ok",
      "timestamp": "2026-10-28T19:52:25.000Z"
    }
    ```

---

### Products

#### 1. List Products
- **`GET /api/products`**
- **Query Parameters:**
  - `collection` *(string)*: Collection slug (e.g. `oversized-tees`, `discover`)
  - `category` *(string | string[])*: e.g. `Tops`, `Shirts`, `Bottoms`, `Dresses`, `Footwear`, `Accessories`
  - `price` *(string | string[])*: Price bucket IDs: `u500`, `500-999`, `1000-1499`, `1500+`
  - `retailer` *(string | string[])*: e.g. `Northlane`, `Thread & Co.`
  - `size` *(string | string[])*: e.g. `S`, `M`, `L`, `UK 8`
  - `color` *(string | string[])*: e.g. `Washed Black`, `White`
  - `inStock` *(boolean)*: Filter by in-stock availability (`true`)
  - `sort` *(string)*: `recommended` (default), `newest`, `price-asc`, `price-desc`
  - `page` *(number)*: Default `1`
  - `limit` *(number)*: Default `24`
- **Response (200 OK):**
  ```json
  {
    "items": [
      {
        "id": "671ff8...",
        "slug": "washed-black-oversized-tee",
        "name": "Washed Black Oversized Tee",
        "description": "A heavyweight boxy tee...",
        "category": "Tops",
        "subcategory": "T-Shirts",
        "gender": "unisex",
        "retailer": "OFFSCRIPT Select",
        "brand": "Northlane",
        "price": 699,
        "currency": "INR",
        "images": ["http://localhost:5000/static/seed/p-tee.jpg"],
        "availableSizes": ["XS", "S", "M", "L", "XL"],
        "availableColors": ["Washed Black"],
        "tags": ["oversized", "tee", "black"],
        "collectionIds": ["oversized-tees", "streetwear"],
        "affiliateUrl": null,
        "purchaseMode": "authorized_cod",
        "codEnabled": true,
        "shippingCharge": 49,
        "inStock": true,
        "isFeatured": true,
        "isNew": false,
        "isEditorsPick": true,
        "lastUpdatedAt": "2026-10-24T10:00:00.000Z"
      }
    ],
    "total": 14,
    "page": 1,
    "limit": 24
  }
  ```

#### 2. Get Product by Slug with Recommendation Rails
- **`GET /api/products/:slug`**
- Returns product document plus three computed rails:
  - `similar`: Up to 4 products in the same category.
  - `collection`: Up to 4 products sharing a collection ID (excluding those in similar).
  - `budget`: Up to 4 products within ±₹400 of the current item's price.
- **Response (200 OK):**
  ```json
  {
    "id": "671ff8...",
    "slug": "washed-black-oversized-tee",
    "name": "Washed Black Oversized Tee",
    "price": 699,
    "currency": "INR",
    "purchaseMode": "authorized_cod",
    "codEnabled": true,
    "similar": [ ... ],
    "collection": [ ... ],
    "budget": [ ... ]
  }
  ```

#### 3. Get Filter Options
- **`GET /api/products/filters?collection=:slug`**
- Returns the distinct filter options available for that collection (or all products if omitted).
- **Response (200 OK):**
  ```json
  {
    "category": ["Tops", "Shirts", "Bottoms", "Footwear", "Accessories"],
    "retailer": ["Denimwala", "Kora Studio", "Northlane", "Sole Street", "Thread & Co."],
    "size": ["XS", "S", "M", "L", "XL", "28", "30", "32"],
    "color": ["Black", "Bone", "Mid Blue", "Olive", "Silver", "Sky Blue", "White", "Wine"]
  }
  ```

---

### Collections

#### 1. List Collections
- **`GET /api/collections`**
- **Query Parameters:**
  - `surface` *(string, optional)*: `trend` | `occasion` | `mood`. Filters and returns collections ordered with display label and note.
- **Response (200 OK):**
  ```json
  [
    {
      "id": "...",
      "slug": "oversized-tees",
      "title": "The Oversized Tee Rotation",
      "eyebrow": "Seen on your feed",
      "description": "Boxy, heavy and drop-shouldered.",
      "image": "http://localhost:5000/static/seed/p-cream-tee.jpg",
      "productCount": 2,
      "placements": [ ... ]
    }
  ]
  ```

#### 2. Get Single Collection
- **`GET /api/collections/:slug`**
- **Response (200 OK):**
  ```json
  {
    "id": "...",
    "slug": "clean-fit",
    "title": "The Clean-Fit Edit",
    "eyebrow": "Seen on your feed",
    "description": "Whites, blues and nothing loud.",
    "image": "http://localhost:5000/static/seed/cat-everyday.jpg",
    "productCount": 5
  }
  ```

---

### Campaign Edits

#### 1. List Edits
- **`GET /api/edits`**
- Returns all editorial campaign pages with resolved primary collection and related collections (including their `productCount`).
- **Response (200 OK):**
  ```json
  [
    {
      "slug": "oversized-tees",
      "headline": ["5 oversized tees", "that actually", "look good."],
      "intro": "Boxy cuts, heavy cotton, and shoulders that drop just enough...",
      "image": "http://localhost:5000/static/seed/p-cream-tee.jpg",
      "collection": {
        "slug": "oversized-tees",
        "title": "The Oversized Tee Rotation",
        "productCount": 2
      },
      "relatedCollections": [
        { "slug": "streetwear", "title": "Streetwear", "productCount": 3 },
        { "slug": "monochrome", "title": "Monochrome Everything", "productCount": 2 }
      ]
    }
  ]
  ```

#### 2. Get Edit by Slug
- **`GET /api/edits/:slug`**
- **Response (200 OK):** Returns single resolved edit or `404 EDIT_NOT_FOUND`.

---

### Search
- **`GET /api/search?q=query`**
- Faithful port of client natural search engine:
  - Parses price ceilings (e.g. `under 1000`, `below 500`).
  - Ignores stop-words (`the`, `and`, `for`, `fits`, `outfits`, `outfit`).
  - Trims plurals (`-s`).
  - Matches up to 4 relevant collections.
- **Response (200 OK):**
  ```json
  {
    "products": [ ... ],
    "collections": [ ... ]
  }
  ```

---

### Cash on Delivery (COD) Orders
- **`POST /api/orders`**
- **Rate Limit:** 10 requests / 15 minutes per IP.
- **Headers:** Optional `Idempotency-Key` (returns cached order response if re-submitted).
- **Request Body:**
  ```json
  {
    "productSlug": "washed-black-oversized-tee",
    "fullName": "Asha Rao",
    "mobile": "9876543210",
    "email": "asha@example.com",
    "house": "12B",
    "street": "MG Road",
    "landmark": "Near Metro",
    "city": "Pune",
    "state": "Maharashtra",
    "pin": "411001",
    "size": "M",
    "color": "Washed Black",
    "quantity": 1,
    "instructions": "Call before delivery",
    "confirmed": true,
    "attribution": {
      "utm_source": "instagram",
      "utm_medium": "story"
    }
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "ref": "OS-20261028-A7K92M",
    "status": "pending",
    "product": {
      "name": "Washed Black Oversized Tee",
      "image": "http://localhost:5000/static/seed/p-tee.jpg"
    },
    "size": "M",
    "color": "Washed Black",
    "quantity": 1,
    "itemTotal": 699,
    "shipping": 49,
    "grandTotal": 748
  }
  ```

---

### Contact Messages
- **`POST /api/contact`**
- **Rate Limit:** 10 requests / 15 minutes per IP.
- **Request Body:**
  ```json
  {
    "name": "Aarav Sharma",
    "email": "aarav@example.com",
    "subject": "Collab with OFFSCRIPT",
    "message": "Hi team, we would love to feature our handmade accessories on OFFSCRIPT."
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Thank you for getting in touch."
  }
  ```

---

### Newsletter
- **`POST /api/newsletter`**
  - **Request Body:** `{ "email": "you@example.com", "source": "footer" }`
  - **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Thank you for subscribing to OFFSCRIPT."
    }
    ```
- **`GET /api/newsletter/unsubscribe?token=:token`**
  - Sets subscriber `unsubscribed: true`.
  - **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "You have been unsubscribed from OFFSCRIPT updates."
    }
    ```

---

### Affiliate Redirect
- **`GET /r/:slug`** (or **`GET /api/r/:slug`**)
  - Logs click anonymously to `AffiliateClick` document with UTM parameters.
  - Returns `302 Found` with `Location: <retailer_url>`.
  - Returns `404` if product is not in affiliate mode or has no URL.

---

## Admin API (`/api/admin`)

All routes except `/api/admin/auth/login` require the header:
```
Authorization: Bearer <JWT_TOKEN>
```

### 1. Authentication
- **`POST /api/admin/auth/login`** (Rate limited: 5 attempts / 15 min)
  - Body: `{ "email": "admin@offscript.in", "password": "adminpassword123" }`
  - Response: `{ "token": "...", "user": { "email": "...", "role": "admin" } }`
- **`GET /api/admin/auth/me`**: Returns authenticated user payload.

### 2. Products Management
- **`GET /api/admin/products`**: List all products with pagination and filters.
- **`POST /api/admin/products`**: Create new product (Zod validated).
- **`GET /api/admin/products/:slug`**: Get single product.
- **`PUT /api/admin/products/:slug`**: Full product update.
- **`PATCH /api/admin/products/:slug/price`**: Update price/originalPrice (auto-updates `lastUpdatedAt`).
- **`PATCH /api/admin/products/bulk-stock`**: `{ "slugs": ["..."], "inStock": true|false }`.
- **`DELETE /api/admin/products/:slug`**: Delete product.

### 3. Collections & Edits
- **`GET|POST /api/admin/collections`**, **`GET|PUT|DELETE /api/admin/collections/:slug`**
- **`GET|POST /api/admin/edits`**, **`GET|PUT|DELETE /api/admin/edits/:slug`**

### 4. Orders Management
- **`GET /api/admin/orders`**: Filter by `status`, `from`, `to`, `search` (ref/mobile/name).
- **`GET /api/admin/orders/:ref`**: Detailed order document.
- **`PATCH /api/admin/orders/:ref/status`**:
  - Body: `{ "status": "confirmed", "note": "Verified phone" }`
  - Valid transitions:
    - `pending` -> `confirmed` | `cancelled`
    - `confirmed` -> `shipped` | `cancelled`
    - `shipped` -> `delivered` | `rto`
- **`GET /api/admin/orders/export`**: Exports orders matching filters as `orders.csv`.

### 5. CRM & Subscribers
- **`GET /api/admin/crm/contact`**: List customer inquiries (`status: new|read|replied`).
- **`PATCH /api/admin/crm/contact/:id/status`**: Mark status.
- **`GET /api/admin/crm/contact/export`**: CSV download.
- **`GET /api/admin/crm/newsletter`**: List email subscribers.
- **`GET /api/admin/crm/newsletter/export`**: CSV download.

### 6. Analytics & Uploads
- **`GET /api/admin/stats/affiliate-clicks`**: Aggregate counts by product and date.
- **`POST /api/admin/uploads`**:
  - `multipart/form-data` with field `image`.
  - Max 5 MB. Formats: JPG, PNG, WebP.
  - Response: `{ "url": "http://localhost:5000/static/filename.png" }`.
