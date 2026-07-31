# include-cookie-frontend

Public, read-only project-showcase site for the **LumiSpace** platform. Renders the
projects catalog — the list, individual project pages — plus a handful of static pages
(About, Support, API docs). No accounts, no sign-in: this app is intentionally view-only.

> Formerly "Programmers & Cookies", a community site with its own login. The account
> features (Configurator, Members, Statistics, Sign-in, OAuth) were removed on 2026-07-31
> to keep this repo small and focused on the catalog. Nothing was thrown away — the full
> previous app still exists on the [`archive/login-features`](../../tree/archive/login-features)
> branch. See [Removed features](#removed-features) below before resurrecting any of it.

## Architecture

LumiSpace is a small set of independent services, each its own repo, talking over plain
REST/HTTP — no shared code, no shared database. This repo is the public-facing showcase;
the others are:

- **Catalog** — the actual product. Owns projects, tags, and their own database.
- **lumi-auth** — the *only* service allowed to talk to the shared identity backend (Ory
  Kratos) directly. Everything else asks it for identity data instead of touching Kratos
  itself.
- **Bot** — Telegram bot + community membership data.
- **S3-compatible object storage** (RustFS in dev) — where avatar/cover image *bytes*
  physically live.

```
                    ┌───────────────────────┐
  visitor ────────► │  this app (Next.js)    │
                    └───────────┬────────────┘
                                 │ REST — every arrow below is optional at runtime
       ┌───────────┬────────────┼────────────┬─────────────┐
       ▼           ▼            ▼            ▼             ▼
   Catalog     lumi-auth   S3 / RustFS      Bot          Umami
  (projects,   (identity    (avatar /    (Telegram      (pageview
   tags)        lookup)      cover        community      analytics,
                              bytes)       filter)         optional)
```

**Nothing here is structurally required for the app to start.** Next.js boots and serves
`/`, `/about`, `/support`, `/api-doc` with zero configuration. Whether the catalog itself
is populated — and how richly — depends on which of the services below you point it at.
Each one fails independently and only degrades its own slice of the UI; one being down
never breaks the others.

| Service | Env vars | What it's for | If it's missing or unreachable |
|---|---|---|---|
| **Catalog REST API** | `CATALOG_API_URL`, `CATALOG_INTERNAL_KEY` | The core of this app: project listings, project detail pages, the home page's project block | That UI just doesn't render — nav link hidden, home block hidden, `/project` shows a friendly "unavailable" message. Everything else on the site keeps working. |
| **lumi-auth** | `AUTH_SERVICE_URL`, `AUTH_INTERNAL_KEY` | Enriches project cards with the contributor's nickname/avatar (batch identity lookup) | Projects still render — contributors just show with no name/picture. Logged as a warning, nothing breaks. |
| **S3 / RustFS** | `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET` | Serves the actual avatar/cover image bytes (`/cdn/avatars/[id]`, `/cdn/covers/[id]`) | Individual images 404 (broken-image icon in the browser); the surrounding page still renders. |
| **Bot REST API** | `BOT_API_URL`, `BOT_INTERNAL_KEY`, `COMMUNITY_TG_CHAT_ID` | Optional: scope the whole catalog down to only projects with a contributor in one specific Telegram community | Off entirely unless `COMMUNITY_TG_CHAT_ID` is set. If you set the chat ID but not the URL/key, listings **fail closed** (hide everything) rather than risk leaking non-community projects — that's deliberate, not a bug. |
| **Umami** | `UMAMI_SRC`, `UMAMI_WEBSITE_ID_WEB` | Pageview analytics | The tracking script just doesn't render. Purely cosmetic, nothing depends on it. |

This app owns no database of its own. Catalog and Bot own their own data; identity
(nicknames, avatars) is canonically owned by Ory Kratos, reachable only through lumi-auth.

### Removed features

`archive/login-features` has the full pre-2026-07-31 app: Configurator (project
create/edit, profile editing, admin panel), Members directory, Statistics, Sign-in
(Telegram widget/Mini App, WebAuthn passkeys), and this app's former role as Ory Hydra's
OAuth2 login/consent/logout UI. If you need any of it back, start from that branch rather
than rebuilding from scratch — it was a deliberate, tested removal, not a half-finished
one.

## Getting started

**Prerequisites:** Node.js ≥ 20, npm.

```bash
git clone git@github.com:Axiks/include-cookie-frontend.git
cd include-cookie-frontend
npm install
cp .env.example .env.local
```

Open `.env.local` and fill in whichever services you actually have running — see the table
above. **You don't need all of them to get a working dev server**: with everything unset
you'll get the static pages and an empty-looking (but not broken) catalog. The most common
starting point is just `CATALOG_API_URL` pointed at a local Catalog instance.

```bash
npm run dev
```

Opens on **http://localhost:3000** (Turbopack, hot reload).

If you're working on this alongside the rest of LumiSpace, the sibling repos' own READMEs
cover running Catalog/Bot/lumi-auth/Kratos/RustFS locally (they're normally brought up
together via the platform's `docker compose` setup, not from this repo).

## Environment variables

See [`.env.example`](.env.example) for the full, current list with inline comments — it's
kept in sync with what the code actually reads (`grep -r process.env` is the source of
truth if the two ever drift). A couple of non-service ones worth knowing about:

- `DYNAMIC_FEATURES` — kill-switch for the whole read-only catalog (nav link, home block,
  `/project` pages). `on` (default) shows it, `off` hides it entirely. The name predates the
  2026-07-31 removal, when it also gated the login features — kept as-is to avoid an
  unrelated rename.
- `GIT_COMMIT` — shown in the UI as a build identifier. Auto-injected by the Docker build
  (`docker build --build-arg GIT_COMMIT=$(git rev-parse HEAD)`); leave it unset locally and
  it falls back to reading your local git HEAD.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server with hot reload (Turbopack), port 3000 |
| `npm run build` | Production build (`next build`, standalone output) |
| `npm start` | Runs a build produced by `npm run build` |
| `npm run lint` | ESLint |
| `npm test` | Run the test suite once (Vitest) |
| `npm run test:watch` | Vitest in watch mode |

## Docker

```bash
docker build -t include-cookie-frontend --build-arg GIT_COMMIT=$(git rev-parse HEAD) .
docker run -p 3000:3000 --env-file .env.local include-cookie-frontend
```

Multi-stage build, `output: "standalone"` — the final image only carries the compiled
server + static assets, no `node_modules`/source. All configuration is supplied at
container **runtime** via env vars (`--env-file`/`-e`/compose `environment:`), never baked
into the image — same image works for dev and prod.

## Testing

```bash
npm test
```

Two tests in `test/file.service.test.ts` fail without real S3 credentials configured in
the test environment — that's expected locally/in CI without a live RustFS instance, not a
regression. Everything else should be green.

## Project structure

```
app/                  Next.js App Router — pages & API routes
  _components/        Shared UI (header, footer, cards, form inputs, ...)
  project/             /project and /project/[id] — the catalog itself
  cdn/                 /cdn/avatars/[id], /cdn/covers/[id] — S3 image proxy
  about/, support/, api-doc/
lib/
  catalog-client.ts    Thin REST client for the Catalog service
  catalog/             Project DTO mapping + contributor hydration (project-hydrate.ts)
  auth-client.ts        Thin REST client for lumi-auth (batch profile lookup only)
  kratos-identities.ts  getProfilesByKratosIds — feeds contributor cards
  community-scope.ts    Bot-based community filtering
  shared/                Vendored subset of the platform's shared types + S3 CDN helpers
                          (no shared npm package across repos — see the comment at the top
                          of lib/shared/cdn/s3-client.ts if you're syncing a contract change)
features/
  cdn/FileService.ts    File save/delete helpers (S3) — currently write-side is unused; see
                         "Removed features" if you're wondering why
i18n/                  next-intl setup (uk locale)
```

## Contributing

Standard flow: branch off `development`, open a PR against `development`. `master` is
production — deploys are `development` → `master` merges, handled separately from this
repo's day-to-day. Run `npm run lint` and `npm test` before opening a PR; a green
`npm run build` locally is the closest thing to what CI checks.

Keep the "everything optional, nothing crashes" architecture in mind for any new external
call: check config presence explicitly, `try/catch` around the actual request, log a
`console.warn` with which integration failed and why, and degrade the smallest possible
slice of UI — follow the existing pattern in `lib/kratos-identities.ts` or
`lib/community-scope.ts` rather than letting a new integration threaded through several
call sites unguarded.
