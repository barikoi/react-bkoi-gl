# Framework compatibility tests

Reproduces the **real consumer environments** the README documents — one
minimal app per bundler, each installed from the **packed tarball** (tarball
method, never `npm link`) and verified headlessly for basic map rendering.

Each app proves one README claim:

| App | Bundler | What is validated |
|---|---|---|
| `vite5-app` | Vite 5 (build + preview) | zero-config auto worker URL, oldest supported Vite major |
| `vite6-app` | Vite 6 (build + preview) | same, previous Vite major |
| `vite-app` (`vite7`) | Vite 7 (build + preview) | zero-config auto worker URL |
| `next15-app` | Next.js 15 — `next build` (webpack) and `next build --turbopack` | zero-config auto worker URL (self-contained worker asset emission) |
| `next16-app` | Next.js 16 — `next build` (Turbopack default) and `next build --webpack` | same, plus **pnpm strict layout** cell (`--pm pnpm`) |
| `cra-app` | react-scripts 5 (webpack 5) + Jest | zero-config build; Jest module resolution recipe |

## What "map renders" means here

`verify.mjs` (Playwright, headless Chromium) asserts per app:

1. a `Worker` was actually constructed (URL captured via an init-script shim),
2. every constructed worker URL fetches with HTTP 200,
3. `window.__READY` — wrapper `onLoad` fired (style fetched and applied),
4. `window.__IDLE` — the engine `idle` event fired (**vector tiles parsed by
   the worker and rendered** — the exact thing that silently fails when the
   worker URL is broken),
5. no uncaught page errors.

## Run

```bash
# default matrix: npm for every app (builds lib + packs tarball first)
node tests/framework/run.mjs

# single app
node tests/framework/run.mjs --only=next16

# package-manager matrix (apps share the same source; PM changes the layout)
node tests/framework/run.mjs --only=next16 --pm=pnpm   # strict layout proof
node tests/framework/run.mjs --only=vite5,vite6,vite7  --pm=yarn
node tests/framework/run.mjs --only=vite5,vite6,vite7  --pm=bun
```

Requires `BARIKOI_API_KEY` in the repo `.env` (exact name, matching
`.env.example`) — real Barikoi style + tiles are the contract under test.

## Layout notes

- Apps read the key through their own standard env mechanism
  (`VITE_` / `NEXT_PUBLIC_` / `REACT_APP_` prefixes) — no invented globals.
- The runner writes `results.json` (gitignored); headed-review evidence lands in `review-report/`.
- Lockfiles and build output are gitignored; `node_modules` per app is normal.
- yarn Plug'n'Play is **unsupported** (needs `nodeLinker: node-modules`);
  yarn 1 / npm / pnpm / bun with hoisted node_modules are the tested layouts.
