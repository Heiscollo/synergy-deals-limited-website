# Synergy Deals Backend

Node.js + Express API backing the product catalog and admin dashboard. Talks to Supabase (Postgres + Storage + Auth).

## Setup

```bash
cd backend
npm install
```

Create `backend/.env` (already present in this project, not committed) with:

```
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
PORT=5000
FRONTEND_ORIGIN=http://localhost:5500
```

- `SUPABASE_URL` / `SUPABASE_ANON_KEY` — used for public reads and password login (respects Row Level Security).
- `SUPABASE_SERVICE_ROLE_KEY` — used only server-side for admin writes/deletes and verifying login tokens. Never expose this key to any frontend code.
- `FRONTEND_ORIGIN` — the origin the admin dashboard / static site is served from, allowed by CORS (e.g. the URL of your local dev server or Live Server port).

## Run

```bash
npm start        # production
npm run dev       # auto-restart on changes (nodemon)
```

Server starts on `http://localhost:5000` by default.

## API

| Method | Route                | Auth        | Description                                    |
|--------|-----------------------|-------------|------------------------------------------------|
| GET    | `/api/products`       | Public      | List available products, optional `?category=` |
| GET    | `/api/products?all=true` | Bearer token | List every product regardless of availability (admin dashboard) |
| GET    | `/api/products/:id`   | Public      | Single product detail                          |
| POST   | `/api/products`       | Bearer token | Create a product (multipart form, `image` file field) |
| PUT    | `/api/products/:id`   | Bearer token | Update a product (multipart form, `image` optional) |
| DELETE | `/api/products/:id`   | Bearer token | Delete a product and its stored image          |
| POST   | `/api/auth/login`     | Public      | `{ email, password }` → Supabase session       |

Protected routes require `Authorization: Bearer <access_token>`, where the token comes from `/api/auth/login`.

## Category slugs

Must match exactly across the DB, backend, and frontend:
`branding`, `office-supplies`, `telecommunication`, `networking`, `ict-equipment`, `construction-materials`, `electrical`.
