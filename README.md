# Personal Workout

Workout app for home and gym: React + Vite, Feature-Sliced Design, shadcn/ui, Tailwind CSS,
Firebase (Spark plan: Hosting, Auth, Firestore). Russian UI, one dark theme, installable PWA.

## Prerequisites

- Node 24 via nvm (`nvm use`, version in `.nvmrc`).
- pnpm: any pnpm on PATH switches itself to the version pinned in `package.json` (`devEngines`).
- Java 21 for the Firebase emulators.

```sh
pnpm install --frozen-lockfile
pnpm catalog   # first run downloads about 100 MB from GitHub into .catalog-cache/
```

Firebase settings are optional in development: see `.env.example`.

## Commands

| Command                        | What it does                                                               |
| ------------------------------ | -------------------------------------------------------------------------- |
| `pnpm dev`                     | Auth and Firestore emulators (UI on :4000) plus Vite on 127.0.0.1:5173     |
| `pnpm dev:app`                 | Vite only                                                                  |
| `pnpm catalog`                 | Fetch the exercise dataset (checksum-verified) and build `public/catalog/` |
| `pnpm emulators`               | Auth and Firestore emulators only                                          |
| `pnpm build`, `pnpm preview`   | Type-check and build into `dist/`, serve the build                         |
| `pnpm typecheck`               | `tsc -b` over the app, root configs, `eslint/`, `tests/`, `e2e/`           |
| `pnpm lint`                    | ESLint, Prettier check, Steiger (FSD), colour literals in CSS              |
| `pnpm lint:fix`, `pnpm format` | ESLint autofix and Prettier write; Prettier write only                     |
| `pnpm test`, `pnpm test:watch` | Vitest projects `unit` and `ui`                                            |
| `pnpm test:rules`              | Firestore rules tests on the emulator                                      |
| `pnpm e2e`, `pnpm e2e:ui`      | Playwright, mobile 390×844 and desktop 1280×800; starts `pnpm dev`         |
| `pnpm check`                   | catalog, typecheck, test, build, lint, test:rules, e2e, audits             |

`pnpm test:rules` and `pnpm e2e` start their own emulators on the ports of `firebase.json`, so stop
`pnpm dev` before `pnpm check`.
`TEST_PORT_OFFSET=<1-999> pnpm test:rules` (or `pnpm e2e`) shifts every emulator, Vite and preview port by the offset
(`scripts/lib/test-ports.ts`), so several runs can go side by side; 0, the default, keeps the ports above.
Offsets that would hit a `pnpm dev:remote` port (100, for example) are refused with a message.
`pnpm e2e` skips `e2e/offline.spec.ts` and its production build; `pnpm e2e:offline` runs it alone, CI and `pnpm check` run both.

In development `/dev/ui` shows every shared UI component; the route is not in production builds.
The dev server also answers on Tailscale names (`*.ts.net`).
`DEV_HOST=<tailscale-ip> pnpm dev:remote` serves Vite (optional `DEV_PORT`, default 5173) and the emulators
(Auth :9199, Firestore :8180) on that address only, so a phone or another computer on the tailnet can sign in.
Vite proxies the Auth emulator on the app's own origin (`scripts/vite.remote.config.ts`), so sign-in is the
same-origin redirect production uses, not a popup.
`DEV_HOST=<tailscale-ip> pnpm preview:remote` is the same over a production bundle: it builds
`dist-remote/` in mode `e2e` with the remote emulators and project `demo-workout-remote` (never
`.env.production.local`) and serves it with `vite preview`, so a phone loads a few bundled files instead of
the dev server's hundreds of modules. No hot reload; rerun it after changes. Over plain http the service
worker stays off. `TEST_PORT_OFFSET=<n>` moves its emulators to that test environment's ports, to try it
beside a running demo.

## PWA and offline

The service worker (vite-plugin-pwa, `generateSW`) exists only in production builds and is registered
by `src/app/layout/pwa-update.tsx` with the platform API (no workbox-window); `pnpm dev` and
the e2e runs on the dev server have none. Service workers and installation need a secure context:
`localhost`/`127.0.0.1` or HTTPS. Over plain http on a Tailscale address the app runs, but it neither
installs nor works offline, and `navigator.storage.persist()` is skipped; check those on the deployed
HTTPS site.

Icons: `public/icon.svg` is the source. The PNGs were rendered with Inkscape 1.4:
`inkscape public/icon.svg -w 192 -h 192 -o public/pwa-192x192.png` (and 512); the maskable 512 and
the 180 Apple touch icon come from the same drawing without the rounded corners (`rx`), so iOS and
Android launchers apply their own mask.

### Offline e2e

`e2e/offline.spec.ts` needs a production build, but `pnpm build` takes the real project from
`.env.production.local`. `vite build --mode e2e` loads `.env.e2e` instead (it outranks `.env.local`):
`VITE_E2E=1` connects the emulators and the project is `demo-workout`. `vite.config.ts` refuses to build
mode `e2e` with a project id that does not start with `demo-`, so this build can never reach a real
project. The output goes to `dist-e2e*/`, never to the `dist/` that `pnpm deploy` uploads.

Run it with `pnpm e2e:offline` (alone, the `offline` Playwright project) or as part of `pnpm check`;
Playwright builds and serves the preview itself, on 4173 plus `TEST_PORT_OFFSET`, with service workers
allowed. `pnpm preview:e2e` serves the same build by hand, for trying installation and offline mode in
local Chrome.

## Deploy

Every push to `main` deploys once `.github/workflows/ci.yml` passes: job `build-prod` (needs `check`, no
secrets) writes `.env.production.local` from the variables below, runs `pnpm catalog` and `pnpm build` and
uploads `dist/`; job `deploy` downloads it and runs `firebase-tools` installed from `deploy/` (its own lockfile and a copy
of the root supply-chain settings, without the app's dependencies) with
`firebase deploy --only firestore:rules,hosting --project personal-workout-1b06f`.
To change its version, edit `deploy/package.json` to match the root, copy `pnpm-lock.yaml` into `deploy/`
and run `pnpm install --lockfile-only` there: pnpm keeps the root's resolutions and drops the rest.
Add in GitHub, Settings → Secrets and variables → Actions:

- secret `FIREBASE_SERVICE_ACCOUNT_PERSONAL_WORKOUT_1B06F`: the deploy service account's JSON key (the one
  `firebase init hosting:github` creates);
- variables `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
  `VITE_FIREBASE_APP_ID`: the web app config, the values of `.env.production.local`.

## Adding a shadcn component

Every component in `src/shared/ui` lives in its own folder: `<name>/<name>.tsx`, its test and an
`index.ts` with its public names, re-exported from `src/shared/ui/index.ts`. The shadcn CLI writes
flat files, so either run `pnpm exec shadcn add <name>` in a scratch copy of the project and copy the
file over, or let it write `src/shared/ui/<name>.tsx` here and move it into `src/shared/ui/<name>/`.
Then add the folder's `index.ts` and the re-export. Inside `shared/ui`, import a sibling component
through its folder (`../button`), never its file.

## Supply chain

- pnpm only, lockfile committed, installs frozen; dependency install scripts blocked unless allow-listed.
- A version must be 7 days old, publisher trust must not drop, versions are saved exact; exceptions are commented entries.
- Settings live in `pnpm-workspace.yaml`; the rules are principle VIII of `.specify/memory/constitution.md`.

## First commit and Lefthook

Lefthook's pre-commit backs up unstaged changes with `git stash create`, which fails before the
repository has a commit. For the root commit only, stage whole files (no partially staged ones) or
commit with `LEFTHOOK=0`. Later commits run the hooks normally.

## Docs

- `docs/requirements.md` — requirements and backlog.
- `specs/001-workout-app/` — spec, plan, data model, contracts, tasks.
- `docs/skills.md` — installed agent skills and their local patches.
