# 🛍️ Xeno-Shopify

**Xeno-Shopify** is a full-stack Shopify integration project that provides merchants with a custom storefront and backend analytics dashboard. It enables seamless product synchronization, order management, and storefront customization.


##  Setup Instructions

### 1. Prerequisites
- **Node.js** ≥ 18  
- **npm** or **yarn**  
- **MongoDB** (or any configured database, depending on `.env`)  
- A **Shopify Partner account** and **Shopify app credentials** (`SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`)


### 2. Installation

Clone the repository:

```bash
git clone https://github.com/devrihan/xeno-shopify.git
cd xeno-shopify
```

#### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit your `.env` file:

```bash
PORT=5000
MONGO_URI=mongodb://localhost:27017/xeno_shopify
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_SCOPES=read_products,write_orders
SHOPIFY_REDIRECT_URI=https://yourapp.com/auth/callback
```

Run the backend server:

```bash
npm run dev
```

#### Frontend Setup

```bash
cd ../frontend
npm install
npm start
```

##  Architecture Diagram

```plaintext
                       ┌─────────────────────┐
                       │     Shopify API     │
                       └──────────┬──────────┘
                                  │
                     OAuth 2.0 + Webhooks
                                  │
        ┌─────────────────────────┴────────────────────────┐
        │                    Backend (Node.js/Express)     │
        │  - REST API endpoints                            │
        │  - MongoDB integration                           │
        │  - Shopify API client                            │
        └──────────────┬───────────────────────────────────┘
                       │ JSON / HTTPS
        ┌──────────────┴──────────────┐
        │        Frontend (React)     │
        │  - Admin dashboard UI       │
        │  - Storefront management    │
        └─────────────────────────────┘
```


##  API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|-----------|-------------|
| `GET`  | `/auth` | Initiates Shopify OAuth login |
| `GET`  | `/auth/callback` | Handles OAuth callback and token storage |

### Products
| Method | Endpoint | Description |
|--------|-----------|-------------|
| `GET`  | `/api/products` | Get all products from Shopify |
| `POST` | `/api/products/sync` | Sync local DB with Shopify products |

### Orders
| Method | Endpoint | Description |
|--------|-----------|-------------|
| `GET`  | `/api/orders` | Fetch all store orders |
| `POST` | `/api/orders/create` | Create a new Shopify order |

### Webhooks
| Method | Endpoint | Description |
|--------|-----------|-------------|
| `POST` | `/webhooks/orders/create` | Triggered on order creation |
| `POST` | `/webhooks/products/update` | Triggered on product update |


##  Database Schema (MongoDB)

### `users`
```json
{
  "_id": "ObjectId",
  "shopDomain": "my-shop.myshopify.com",
  "accessToken": "string",
  "createdAt": "Date"
}
```

### `products`
```json
{
  "_id": "ObjectId",
  "shopDomain": "string",
  "productId": "number",
  "title": "string",
  "price": "string",
  "inventory": "number",
  "updatedAt": "Date"
}
```

### `orders`
```json
{
  "_id": "ObjectId",
  "orderId": "number",
  "customer": {
    "name": "string",
    "email": "string"
  },
  "total": "number",
  "status": "string",
  "createdAt": "Date"
}
```


##  Known Limitations / Assumptions

- Currently supports **one Shopify store per account**.  
- Webhooks must be **manually configured** during app setup.  
- The backend assumes **MongoDB**; no SQL support yet.  
- Shopify API rate limits may throttle requests for large stores.  
- Frontend assumes API base URL is set to `http://localhost:5000`.


##  Future Enhancements

- Add PostgreSQL support.  
- Improve error handling and webhook resilience.
- Add real time automated email service for Abandoned carts
- Add live AI chatbot for dashboard and insights assitance
