# WarehouseHub frontend

One Next.js app for both sides of WarehouseHub, talking to the crunch Go API:

- **Public site** — `/` home search, `/search` (filters generated from the admin's attribute setup, map, AI "describe it" search), `/warehouses/<slug>` listing pages (SSR + JSON-LD, 301 for old slugs, "removed" page with nearby listings), `/enquire`, `/account`.
- **Admin panel** — `/admin/*`: dashboard, warehouses + editor (form generated from the attribute tree), review queue, needs info, attributes, industries, enquiries, search analytics, change log, users & access. Nav and buttons follow `whoami` permissions; the backend enforces everything.

Stack mirrors central-frontend: Next 16 (App Router) · React 19 · Clerk v7 · Tailwind 4 + shadcn/base-ui · recharts · sonner.

## How data flows

```
component → feature api (features/<f>/api) → HttpClient (core/api) → /api/proxy → crunch API
                 ↑ entity model                  ↓ network model
            mapper (features/<f>/mappers) turns network → entity (and entity → request body)
```

- `src/core/api/http-client.ts` — the generic client. Unwraps crunch's `{success, data, error, code}` envelope, returns the raw network model, throws `ApiError` (status + machine `code` + `data`).
- Transports: `browserApi` (client components → same-origin `/api/proxy`), `serverApi()` (server, with the visitor's Clerk token), `publicServerApi()` (server, anonymous, cached — listing pages, sitemap).
- `src/core/api/proxy.ts` — `/api/proxy/[...path]` forwards to `BACKEND_URL` with the Clerk session token. Only API prefixes are reachable; mutating calls need the `x-wh-client` header and same-site (CSRF guard). The browser never sees the API origin, so the backend needs no CORS entry for this app.
- Every feature uses the same layout; entities are what the UI uses everywhere.

```
src/
  app/            routes only: (site)/… public, (admin)/admin/… panel, api/proxy, sitemap, robots
  core/           api client + transports + proxy, env, hooks (useLoad, useAction, useUrlState), visitor session
  features/<f>/   network/ (wire types) · entities/ · mappers/ · api/ · components/ · lib/ · index.ts
                  access, attributes, catalog, search, listings, enquiries, analytics, changes, users
  components/     ui/ (shadcn, from central), common/ (pager, states, diff…), site/, admin/, maps/
  lib/            utils, format, units
```

## Run locally

```bash
cp .env.example .env.local   # fill in Clerk keys + BACKEND_URL
npm install
npm run dev                  # http://localhost:3000, admin at /admin
```

Checks: `npm run typecheck`, `npm run lint`, `npm run build`.

## Deploy (e.g. Vercel)

1. Set every key from `.env.example` in the host. Clerk keys must belong to the **same Clerk application** as the backend's `CLERK_SECRET_KEY`.
2. Backend env: `PUBLIC_BASE_URL` and `ADMIN_BASE_URL` = this app's origin (admin links in the inbox, JSON-LD urls).
3. Google Maps key (optional): enable *Maps JavaScript API*, restrict it to this origin.
4. S3 media buckets: add this app's origin to the bucket CORS rule (browsers PUT uploads straight to S3) — see crunch `deploy/AWS_SETUP.md`.
5. First superuser: `go run ./cmd/superuser` in crunch; other staff sign in once, then get access under **Users & access**.
