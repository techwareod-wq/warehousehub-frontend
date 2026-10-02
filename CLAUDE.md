# WarehouseHub frontend — Claude instructions

- Read `README.md` for the data flow and folder layout. Read `node_modules/next/dist/docs/` before using a Next API you're unsure of (Next 16: `proxy.ts`, async `params`).
- Every backend call goes: feature `api/` → `HttpClient` (`src/core/api`) → network model → mapper → entity. Components never call `fetch` or use network types directly.
- New endpoint = network type in `network/`, entity in `entities/`, mapper in `mappers/`, function in `api/`. Wire shapes must match crunch's Go JSON tags exactly.
- Client components use `browserApi`; server code uses `serverApi()` / `publicServerApi()`.
- Permission gating in the UI is display-only (`useAccess().can`); the backend enforces.
- After changes: `npm run typecheck && npm run lint && npm run build` must pass.
