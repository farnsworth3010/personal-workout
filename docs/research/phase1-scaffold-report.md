# Report: Phase 1 scaffold (T001, T002, T003, T009) and Phase 1 dependencies

Date: 2026-11-11. Nothing staged or committed by me; no `git config`, no subagents.

## Summary

- T001, T002, T003, T009 done. `pnpm typecheck` and `pnpm build` pass; the built page shows the dark theme
  (screenshot: `<scratchpad>/shots/scaffold.png`).
- **4 approved packages NOT installed** because pnpm's `trustPolicy: no-downgrade` refuses a transitive or
  direct version and does not fall back by itself: `lefthook`, `steiger`, `firebase-tools`, `vite-plugin-pwa`.
- **Every `pnpm install` / `pnpm add` exits 1** with `ERR_PNPM_IGNORED_BUILDS` for `@firebase/util` and
  `protobufjs` (dependencies of `firebase`). node_modules is complete and usable, but the exit code is 1,
  so `pnpm install --frozen-lockfile` (and CI) fails until the owner decides (see Decisions, item 1).
- **TypeScript resolved to 7.0.2**, which `typescript-eslint` 8.72.x does not support (peer `<6.1.0`).
  This blocks T004 type-aware linting until the owner decides (Decisions, item 4).

## Versions actually used

- pnpm: global 11.10.0 switched itself to **12.17.0** via `devEngines.packageManager` (`pnpm --version` in the
  project prints `12.17.0`). Lockfile records `packageManagerDependencies` pnpm + @pnpm/exe 12.17.0.
- Node: shell Node is 26.4.0; pnpm downloaded the `devEngines.runtime` Node and runs scripts with it:
  `pnpm exec node -v` prints **v26.13.0** (lockfile has `node@runtime:26.13.0`).

## Installed packages (exact)

dependencies:

| Package | Version |
|---|---|
| @tailwindcss/vite | 4.3.4 |
| @tanstack/react-query | 5.105.3 |
| class-variance-authority | 0.7.1 (added by shadcn init) |
| cn | 0.5.2 (added by shadcn init) |
| firebase | 13.2.0 |
| lucide-react | 1.68.0 (added by shadcn init) |
| radix-ui | 1.8.1 (added by shadcn init) |
| react | 19.3.1 |
| react-dom | 19.3.1 |
| react-router | 8.5.1 |
| shadcn | 4.23.0 (added by shadcn init) |
| tailwindcss | 4.3.4 |
| tw-animate-css | 1.4.0 (added by shadcn init) |
| zustand | 5.0.16 |

devDependencies:

| Package | Version |
|---|---|
| @commitlint/cli | 21.2.4 |
| @commitlint/config-conventional | 21.2.4 |
| @feature-sliced/steiger-plugin | 0.8.2 |
| @firebase/rules-unit-testing | 6.0.0 |
| @playwright/test | 1.64.1 |
| @tanstack/eslint-plugin-query | 5.105.3 |
| @testing-library/jest-dom | 7.0.1 |
| @testing-library/react | 16.3.3 |
| @testing-library/user-event | 14.6.8 |
| @types/node | 26.6.6 |
| @types/react | 19.3.0 |
| @types/react-dom | 19.3.0 |
| @vitejs/plugin-react | 6.2.1 |
| eslint | 10.14.0 |
| eslint-config-prettier | 10.1.8 |
| eslint-plugin-jsx-a11y | 6.10.2 |
| eslint-plugin-react-hooks | 7.1.1 |
| eslint-plugin-react-refresh | 0.5.7 |
| jsdom | 30.1.3 |
| prettier | 3.9.10 |
| prettier-plugin-tailwindcss | 0.8.1 |
| typescript | 7.0.2 |
| typescript-eslint | 8.72.1 |
| vite | 8.3.5 |
| vitest | 5.1.0 |

Not installed (refused): lefthook, steiger, firebase-tools, vite-plugin-pwa. Not installed (my choice, see
below): `@fontsource-variable/inter`.

Note: shadcn 4.23.0 no longer adds `clsx` + `tailwind-merge`; it adds `cn` (shadcn-ui's own package,
repo `github.com/shadcn-ui/cn`, "drop-in replacement for clsx + tailwind-merge"). It also adds `shadcn` itself
as a runtime dependency for `@import "shadcn/tailwind.css"` (Radix keyframes and `data-*` variants).

## Resolved to an older version because of the 7-day release age

| Package | Installed | Latest (date) |
|---|---|---|
| @playwright/test | 1.64.1 | 1.65.0 (2026-11-05) |
| @tailwindcss/vite | 4.3.4 | 4.3.5 (2026-11-06) |
| tailwindcss | 4.3.4 | 4.3.5 (2026-11-06) |
| @tanstack/react-query | 5.105.3 | 5.107.1 (2026-11-06) |
| @tanstack/eslint-plugin-query | 5.105.3 | 5.107.1 (2026-11-06) |
| @testing-library/user-event | 14.6.8 | 14.6.9 (2026-11-10) |
| @vitejs/plugin-react | 6.2.1 | 6.3.0 (2026-11-09) |
| jsdom | 30.1.3 | 31.0.0 (2026-11-05) |
| lucide-react | 1.68.0 | 1.72.0 (2026-11-11) |
| prettier | 3.9.10 | 3.10.0 (2026-11-11) |
| typescript-eslint | 8.72.1 | 8.72.2 (2026-11-09) |
| vite | 8.3.5 | 8.3.8 (2026-11-11) |
| zustand | 5.0.16 | 5.1.0 (2026-11-06) |
| steiger (refused anyway) | 0.9.0 would be picked | 0.10.0 (2026-11-09) |
| firebase-tools (refused anyway) | 15.34.2 would be picked | 15.35.0 (2026-11-04) |

`shadcn` for `dlx`: 4.23.0 (2026-10-27) is the latest and passes the rule; used as `pnpm dlx shadcn@4.23.0`.

## Refusals and errors (exact messages)

1. Every install (`pnpm add`, `pnpm install --frozen-lockfile`), exit code 1, node_modules still complete:
   ```
   Error: ERR_PNPM_IGNORED_BUILDS
     × adding a new package
     ╰─▶ Ignored build scripts: @firebase/util@1.15.3, protobufjs@7.6.6
     help: Run "pnpm approve-builds" to pick which dependencies should be allowed
           to run scripts.
   ```
   What the scripts do (read in node_modules):
   - `@firebase/util` `postinstall: node ./postinstall.js`: if env `FIREBASE_WEBAPP_CONFIG` is set, reads it
     (JSON or file path), may fetch `https://firebase.googleapis.com/v1alpha/projects/<id>/apps/<appId>/webConfig`
     and writes the config into `dist/postinstall.{js,mjs}` (Firebase App Hosting auto-init). The tarball
     already ships those files as stubs returning `undefined`, so skipping the script changes nothing for us.
   - `protobufjs` `postinstall: node scripts/postinstall`: only prints a warning if the parent package.json
     uses a different semver prefix for protobufjs. No effect.
   - Verified in a throwaway copy (not in the project) that
     `allowBuilds: { '@firebase/util': false, protobufjs: false }` (explicit deny) makes installs exit 0.
2. `lefthook` (direct):
   ```
   Failed to resolve dependency tree: Failed to resolve dependency: High-risk trust downgrade for
   "lefthook@2.2.2" (possible package takeover)
   ```
   Registry: 2.1.5–2.2.1 published by "GitHub Actions" (trusted publisher + provenance); 2.1.15 and 2.2.2
   published by user `mrexox` without provenance. The platform binary `lefthook-linux-x64@2.2.2` is still
   trusted + provenance. 2.2.1 (2026-10-08) is the newest trusted version.
3. `steiger@0.9.0` (via `chokidar`):
   ```
   Failed to resolve dependency: High-risk trust downgrade for "chokidar@4.0.3" (possible package takeover)
   Failed to resolve chokidar@^4.0.3
   This error happened while installing the dependencies of steiger@0.9.0
   ```
   chokidar 4.0.0/4.0.1 had provenance; 4.0.2/4.0.3 (Dec 2024, same maintainer `paulmillr`) do not.
   `^4.0.3` has no other candidate. steiger 0.10.0 still requires `chokidar@^4.0.3`, so waiting does not help.
   `@feature-sliced/steiger-plugin@0.8.2` installed fine on its own (no chokidar).
4. `firebase-tools@15.34.2` (via `chokidar`), same message:
   `This error happened while installing the dependencies of firebase-tools@15.34.2`. 15.35.0 also requires
   `chokidar@^4.0.3`.
5. `vite-plugin-pwa` (2.0.0 → `workbox-build@7.4.1`):
   ```
   Failed to resolve dependency: High-risk trust downgrade for
   "@trickfilm400/rollup-plugin-off-main-thread@3.0.0-pre1" (possible package takeover)
   Failed to resolve @trickfilm400/rollup-plugin-off-main-thread@^3.0.0-pre1
   This error happened while installing the dependencies of workbox-build@7.4.1
   ```
   That package (a third-party fork of rollup-plugin-off-main-thread) had provenance on 2.4.3 and 2.5.0;
   3.0.0-pre1 and 3.1.0-pre2 (Dec 2025) have none. workbox-build 7.4.1 is the latest workbox-build.
6. Peer warnings (installed, not refused; `pnpm peers check`):
   - `typescript-eslint@8.72.1` (and all `@typescript-eslint/*`) want `typescript >=4.8.4 <6.1.0`; installed
     7.0.2. 8.72.2 (latest) has the same range. TypeScript 6 line: 6.0.3 (2026-04-16).
   - `eslint-plugin-jsx-a11y@6.10.2` (latest, 2024-10-26) wants `eslint ^3 … ^9`; installed 10.14.0.
   - `tsconfck@3.1.6` (from `@feature-sliced/steiger-plugin`) wants `typescript ^5.0.0`.
7. Headless screenshot: Chrome inside the Bash sandbox cannot load any `http://127.0.0.1` page (it hangs to
   the 40 s timeout, also for a plain `python -m http.server`), while `curl` gets HTTP 200 from `vite preview`
   and Chrome renders `data:`/`file:` URLs. Running Chrome outside the sandbox was denied. I screenshotted the
   real build output instead: `dist/index.html` with its built CSS and JS inlined into one file
   (`file://`), same bundle the preview serves.

## Needed but not installed

- `@fontsource-variable/inter` 5.3.0: `shadcn init` requires a preset, and every preset adds a font package
  (Vega = Lucide/Inter). Not on the list and not needed to work, so I did not install it. The theme uses
  the prototype's stack `"Inter", system-ui, sans-serif`; without the package Inter is used only if the device
  has it (screenshot shows the system fallback). Bundling Inter for offline use is an owner decision.
- `jiti` (for `eslint.config.ts` in T004): ESLint 10 declares it as an optional peer. It is already present
  transitively (jiti 2.7.0 via `@tailwindcss/vite`, `@vitejs/plugin-react`, `vitest`) and pnpm linked it as
  eslint's peer (`node_modules/.pnpm/eslint@10.14.0_jiti@2.7.0`), so a TS config should load, but it is not a
  direct dependency: the T004 agent should confirm, and the owner may want it explicit.
- `globals`: not installed. Only needed if the ESLint config wants browser/node globals for plain JS files.

## Lefthook install script (read in the 2.2.1 and 2.2.2 tarballs; identical apart from versions)

- `package.json`: `"postinstall": "node postinstall.js"`, `bin: lefthook → bin/index.js`, binaries come from
  `optionalDependencies` `lefthook-<os>-<arch>` (2.2.2 adds `lefthook-android-arm64`).
- `postinstall.js`: if `CI` is set and `LEFTHOOK` is not, does nothing. Otherwise resolves the platform binary
  (`get-exe.js`: `require.resolve("lefthook-${os}-${arch}/bin/lefthook")`) and runs `lefthook install` with
  `cwd = INIT_CWD || process.cwd()`, `stdio: inherit`; errors are caught and only printed. No network, no
  downloads; `lefthook install` writes the git hooks into `.git/hooks` from `lefthook.yml`.
- `bin/index.js`: spawns the same binary with the CLI arguments.
- Since lefthook was refused, I did **not** add it to `allowBuilds`.

## Files created

- `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` (owner's settings verbatim, `allowBuilds: {}`),
  `.npmrc` (registry only), `.nvmrc` (26.13.0)
- `index.html` (`lang="ru"`, entry `/src/app/index.tsx`), `vite.config.ts` (react + tailwindcss, `@` alias),
  `tsconfig.json` (references + `paths` for shadcn), `tsconfig.app.json` (strict, `@/*`), `tsconfig.node.json`
- `.gitignore` (node_modules, dist, tsbuildinfo, `public/catalog/exercises.json`, `public/catalog/images`,
  `.catalog-cache`, emulator data and debug logs, test outputs, local env)
- `components.json` (style `radix-vega`, Radix base, CSS variables, lucide, FSD aliases:
  ui/components `@/shared/ui`, utils `@/shared/lib/utils`, lib `@/shared/lib`, hooks `@/shared/lib/hooks`,
  css `src/app/styles/tokens.css`)
- `src/app/index.tsx` (heading + shadcn Button), `src/app/styles/index.css` (Tailwind, tw-animate-css,
  shadcn/tailwind.css, tokens, base layer), `src/app/styles/tokens.css` (the theme)
- `src/shared/ui/button.tsx` (shadcn, unchanged), `src/shared/ui/index.ts`,
  `src/shared/lib/utils.ts` (shadcn, `export { cn } from "cn"`), `src/shared/lib/index.ts`
- `dist/` from the build (ignored)

## Token mapping (`src/app/styles/tokens.css`, values in `:root` only)

| Prototype | shadcn variable(s) | Tailwind names |
|---|---|---|
| `--bg` #0a0a0a | `--background` | `bg-background` |
| `--text` #fafafa | `--foreground`, `*-foreground` of card/popover/secondary/accent | `text-foreground` |
| `--surface` #161616 | `--card`, `--popover` | `bg-card`, also `bg-surface` |
| `--surface-2` #222 | `--secondary`, `--muted`, `--accent` | also `bg-surface-2` |
| `--border` #2a2a2a | `--border`, `--input` | `border-border` |
| `--accent` #c6ff3d | `--primary`, `--ring`, `--chart-1` | `bg-primary` |
| `--on-accent` #0a0a0a | `--primary-foreground` | also `text-on-accent` |
| `--muted` #8a8a8a | `--muted-foreground`, `--chart-4` | `text-muted-foreground` |
| `--warn` #ff8a3d | `--destructive`, `--chart-2` | also `text-warn` |
| `--scrim` | — | `bg-scrim` |
| `--radius` 6px | `--radius` (sm…4xl scale derived) | `rounded-lg` = 6px |
| `--font` | `--font-sans` | `font-sans` |

`--chart-3` = text, `--chart-5` = surface-2. The prototype's `--accent` and `--muted` cannot keep their
names in `:root` because shadcn uses them for other roles; their values live in `--primary` and
`--muted-foreground`. `color-scheme: dark` is set. No `.dark` class and no light values.

## Deviations from the tasks

- shadcn init was run in a throwaway copy of the project in my scratchpad (the only way to keep the preset's
  font package out of the project); its generated files were moved into the FSD paths and its dependencies
  (minus the font) installed in the project with `pnpm add` at the versions it resolved. In that copy only,
  `allowBuilds` had `false` entries for the two firebase packages so init could finish.
- Preset `vega` (Lucide icons, Inter font, classic shadcn look) chosen by me because init requires one;
  the owner did not choose a shadcn style. Other presets: nova (Lucide/Geist), maia, lyra, mira, luma, sera, rhea.
- `@custom-variant dark (&);` so the `dark:` classes inside shadcn components always apply (one dark theme).
- T003: only `src/app`, `src/shared/ui`, `src/shared/lib` exist; `pages`, `widgets`, `features`, `entities`
  have no code yet, so they were not created. Public APIs: `shared/ui/index.ts`, `shared/lib/index.ts`.
- `typecheck` is `tsc -b` (tsconfigs use `noEmit`).
- Prototype typography tokens (`--title-weight`, `--title-transform`, `--title-spacing`) not carried over;
  the demo heading uses Tailwind classes. Easy to add if wanted.
- The git index was written at 14:39:14 (local time) by someone else: `git status` shows most files as
  staged (`A`), `src/app/index.tsx` and `src/app/styles/index.css` as `AM` (staged earlier versions),
  `components.json`, `tokens.css`, `src/shared/` untracked. I did not run any git command that writes the
  index in the project; the index was left as found.

## Decisions for the owner

1. `@firebase/util`, `protobufjs` build scripts: add an explicit deny
   `allowBuilds: { '@firebase/util': false, protobufjs: false }` (recommended; scripts are useless here), or
   keep `{}` and accept exit code 1 on every install (breaks frozen install in CI).
2. `chokidar@4.0.3` (blocks steiger and firebase-tools): `trustPolicyExclude: ['chokidar@4.0.3']` (exact
   version, narrow), or `trustPolicyIgnoreAfter` (minutes; skips the check for versions older than that), or
   drop steiger / install firebase-tools globally (outside the lockfile; conflicts with plan R9/constitution).
3. `lefthook`: pin `lefthook@2.2.1` (newest trusted, passes the policy) or exclude `lefthook@2.2.2`. Then add
   `lefthook` to `allowBuilds` (script reviewed above).
4. TypeScript: keep 7.0.2 (no typescript-eslint support: no type-aware lint, parser fails) or pin
   `typescript@6.0.3` (supported by typescript-eslint 8.72). TS 7 builds this scaffold fine.
5. `vite-plugin-pwa`: `trustPolicyExclude: ['@trickfilm400/rollup-plugin-off-main-thread@3.0.0-pre1']`
   (third-party fork used by workbox-build 7.4.1) or another PWA approach. Needed in Phase 7, not Phase 1.
6. Font: bundle Inter (`@fontsource-variable/inter` 5.3.0) for offline, or rely on system fonts.
7. `eslint-plugin-jsx-a11y` 6.10.2 does not declare ESLint 10 support (works or not: to be seen in T004).
# deps2: owner decisions of 2026-11-11 applied

Status: **partly done; stopped on `firebase-tools`** (engine mismatch in its dependency `superstatic@10.0.0`).
All other items are applied and verified. Nothing staged or committed, git config untouched.
pnpm 12.17.0 in the project (pnpm downloads Node 26.13.0 for its own runs via `devEngines`; PATH node is 26.4.0).

## What changed

- `pnpm-workspace.yaml`
  ```yaml
  allowBuilds:
    '@firebase/util': false
    protobufjs: false
    lefthook: true
  trustPolicyExclude:
    # chokidar 4.0.2+ lost provenance; needed by steiger and firebase-tools, approved by the owner 2026-11-11
    - chokidar@4.0.3
    # workbox-build fork dep without provenance; needed by vite-plugin-pwa, approved by the owner 2026-11-11
    - '@trickfilm400/rollup-plugin-off-main-thread@3.0.0-pre1'
  ```
  Both excluded versions are in the lockfile now (chokidar via steiger only, since firebase-tools is not installed;
  the fork via vite-plugin-pwa → workbox-build 7.4.1).
- `package.json` devDependencies: `+ lefthook 2.2.1`, `+ steiger 0.9.0`, `+ vite-plugin-pwa 2.0.0`,
  `typescript 7.0.2 → 6.0.3`. **firebase-tools not added.**
- `pnpm-lock.yaml` updated accordingly (+199 / −43 packages).
- Written by lefthook's postinstall (`lefthook install`), see below: `lefthook.yml` (new, untracked) and
  `.git/hooks/prepare-commit-msg`.
- Fonts: nothing done (system stack, no package), per decision 4. cn / shadcn / radix-ui untouched.

## Versions chosen (7-day rule: published before 2026-11-04 13:54 UTC)

| Package | Installed | Newer, rejected by age |
|---|---|---|
| lefthook | 2.2.1 (2026-10-08, as decided) | — |
| steiger | 0.9.0 (2026-11-01) | 0.10.0 (2026-11-09) |
| firebase-tools | **not installed**; target was 15.34.2 (2026-10-28) | 15.35.0 (2026-11-04 19:16 UTC) |
| vite-plugin-pwa | 2.0.0 (2026-10-03, latest) | — |
| typescript | 6.0.3 | — |

## Refusal: firebase-tools → superstatic (exact message)

Command: `pnpm add -D lefthook@2.2.1 steiger@0.9.0 firebase-tools@15.34.2 vite-plugin-pwa@2.0.0 typescript@6.0.3`, exit 1,
nothing written (package.json, lockfile, node_modules unchanged):
```
? Verifying lockfile against supply-chain policies (827 entries)...
Progress: resolved 0, reused 978, downloaded 1, added 0
[WARN] 10 deprecated subdependencies found: @opentelemetry/sdk-trace-base@2.10.0, @opentelemetry/sdk-trace-base@2.9.0, @opentelemetry/sdk-trace-web@2.10.0, @opentelemetry/sdk-trace-web@2.9.0, glob@10.5.0, glob@11.1.0, json-ptr@3.1.1, node-domexception@1.0.0, tsconfck@3.1.6, uuid@9.0.1
✗ Lockfile failed supply-chain policy check (827 entries in 9.5s)
Error: ERR_PNPM_UNSUPPORTED_ENGINE

  × adding a new package
  ╰─▶ Unsupported engine for superstatic@10.0.0: wanted: {"node":"20 || 22 ||
      24"} (current: {"node":"26.13.0"})
```
(`engineStrict: true` turns this into an error.) pnpm stops at the first failure, so there may be more engine
mismatches deeper in the firebase-tools tree; I did not probe further.

Publishing history of `superstatic` (all published by npm user `google-wombot`, Google's release bot; no provenance
attestations on any of them):

| Version | Published | engines.node |
|---|---|---|
| 9.1.0 | 2024-11-13 | — |
| 9.2.0 | 2025-02-06 | `18 \|\| 20 \|\| 22` |
| 10.0.0 | 2025-09-11 | `20 \|\| 22 \|\| 24` |
| 11.0.0 | 2026-07-08 | — |
| 11.0.1-bk-test-release.0 | 2026-10-14 (tag `preview`) | — |
| 11.1.0 | 2026-10-14 (`latest`) | `22 \|\| 24 \|\| 26` |

firebase-tools 15.34.2 and 15.35.0 (latest) both depend on `superstatic: ^10.0.0`, so no published firebase-tools
picks up the Node-26-ready superstatic 11; waiting a week does not help until firebase-tools bumps it.
firebase-tools itself declares `node: ">=20.0.0 || >=22.0.0 || >=24.0.0"` (accepts 26).

Options for the owner (none applied): an exact-version override `superstatic: 11.1.0` in `pnpm-workspace.yaml`
(major bump under firebase-tools, untested by Google); an engine-check exception for `superstatic@10.0.0` (if pnpm 12
has one; `engineStrict: false` would be global); install firebase-tools outside the lockfile (global / pinned `dlx`);
or wait for a firebase-tools release with superstatic 11.

## Install output (second run, without firebase-tools), exit 0

`pnpm add -D lefthook@2.2.1 steiger@0.9.0 vite-plugin-pwa@2.0.0 typescript@6.0.3`:
```
? Verifying lockfile against supply-chain policies (827 entries)...
[WARN] 6 deprecated subdependencies found: @opentelemetry/sdk-trace-base@2.10.0, @opentelemetry/sdk-trace-base@2.9.0, @opentelemetry/sdk-trace-web@2.10.0, @opentelemetry/sdk-trace-web@2.9.0, glob@11.1.0, tsconfck@3.1.6
✓ Lockfile passes supply-chain policies (827 entries in 7.5s)
Packages: +199 -43
.../lefthook@2.2.1/node_modules/lefthook postinstall$ node postinstall.js
.../lefthook@2.2.1/node_modules/lefthook postinstall: Config not found, creating...
.../lefthook@2.2.1/node_modules/lefthook postinstall: Added config:~/Documents/projects/personal/personal-workout/lefthook.yml
.../lefthook@2.2.1/node_modules/lefthook postinstall: sync hooks: ✔️
.../lefthook@2.2.1/node_modules/lefthook postinstall: Done
[WARN] Issues with peer dependencies found. Run "pnpm peers check" to list them.

devDependencies:
+ lefthook 2.2.1
+ steiger 0.9.0
- typescript 7.0.2
+ typescript 6.0.3
+ vite-plugin-pwa 2.0.0

Done in 7.9s using pnpm v12.17.0
```
No `ERR_PNPM_IGNORED_BUILDS` any more; no trust-downgrade refusal.

## Lefthook: what it wrote

- Before: `.git/hooks` held only the stock `*.sample` files; `core.hooksPath` unset.
- `lefthook.yml` (new, project root, untracked): lefthook's template, **every line commented out** (example
  pre-push/pre-commit jobs with yarn/rubocop/go). No hooks configured. Left in place: deleting it is pointless,
  the postinstall recreates it on the next uncached install. To be replaced by the real config in the Lefthook task.
- `.git/hooks/prepare-commit-msg` (2467 bytes, mode 755): lefthook's standard shim, written even with an empty
  config. It exits 0 when `LEFTHOOK=0`, otherwise looks for the binary (PATH, then the absolute path
  `node_modules/.pnpm/lefthook-linux-x64@2.2.1/…/bin/lefthook`, then other fallbacks) and runs
  `lefthook run prepare-commit-msg`.
- Tested: `.git/hooks/prepare-commit-msg <tmpfile> message` → exit 0, message file unchanged. Not broken.
- Caveat: if node_modules is missing, one fallback in the shim is `pnpm lefthook -h`; with
  `verifyDepsBeforeRun: install` that could start an install during a commit. The last fallback only prints
  "Can't find lefthook in PATH" and exits 0, so it never blocks a commit.
- The frozen reinstall below did not re-run the postinstall (pnpm's side-effects cache); hook and lefthook.yml
  checksums were identical before and after.

## Verification

`rm -rf node_modules && pnpm install --frozen-lockfile` → **exit 0**:
```
✓ Lockfile passes supply-chain policies (verified 14s ago)
Lockfile is up to date, resolution step is skipped
Packages: +948
Progress: resolved 948, reused 948, downloaded 0, added 948, done
...
+ lefthook 2.2.1
+ node 26.13.0
+ steiger 0.9.0
+ typescript 6.0.3
+ vite-plugin-pwa 2.0.0
Done in 299ms using pnpm v12.17.0
```
No warnings in that run.

`pnpm peers check` → exit 1 (the typescript-eslint warning from Phase 1 is gone: 6.0.3 is inside `<6.1.0`):
```
Issues with peer dependencies found

✕ unmet peer eslint
  Installed: 10.14.0
  Wanted:
    "^3 || ^4 || ^5 || ^6 || ^7 || ^8 || ^9":
      eslint-plugin-jsx-a11y@6.10.2

✕ unmet peer typescript
  Installed: 6.0.3
  Wanted:
    ^5.0.0:
      tsconfck@3.1.6
```
(tsconfck 3.1.6 now comes from both `@feature-sliced/steiger-plugin` and steiger.)

`pnpm typecheck` → `$ tsc -b`, exit 0.

`pnpm build` → exit 0:
```
$ tsc -b && vite build
vite v8.3.5 building client environment for production...
✓ 123 modules transformed.
dist/index.html                   0.42 kB │ gzip:  0.27 kB
dist/assets/index-DxtEyVdk.css   22.18 kB │ gzip:  4.77 kB
dist/assets/index-DMbGjeft.js   252.99 kB │ gzip: 82.02 kB
✓ built in 148ms
```

Versions:
```
$ pnpm exec steiger --version
0.9.0

@feature-sliced/steiger-plugin	0.8.2
$ pnpm exec lefthook version
2.2.1
$ pnpm exec tsc -v
Version 6.0.3
$ pnpm exec firebase --version
Error: ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL

  × Command "firebase" not found
```

`pnpm audit` (configured `audit.level: high`) → exit 1, "5 vulnerabilities found / Severity: 2 low | 2 moderate | 1 high".
Full list (from `pnpm audit --audit-level low --json`), not fixed:

| Severity | Package (installed) | Vulnerable / patched | Advisory | Path |
|---|---|---|---|---|
| high | @grpc/grpc-js 1.9.16 | <1.13.6 / >=1.13.6 | GHSA-m9gg-hp2v-232j: getAuthContext can return unauthorized certificates as authorized | firebase → @firebase/firestore → @grpc/grpc-js (4 paths, also via @firebase/rules-unit-testing) |
| low | @grpc/grpc-js 1.9.16 | <1.13.6 / >=1.13.6 | GHSA-f596-whhp-79r4: server sends handler error messages to the client | same |
| low | deepmerge 4.3.1 | >=4.2.0 <=4.3.1 / none | GHSA-gcqx-w48m-w2h4: mergeObject() prototype poisoning | shadcn → @shadcn/registry → deepmerge |
| moderate | glob 11.1.0 | >=9.0.0 <=14.0.1 / >=14.0.2 | GHSA-3g3m-2fjr-6pw4: AbortSignal cancellation bypass | vite-plugin-pwa → workbox-build → glob (new with this change) |
| moderate | minimatch 10.2.6 | >=7.0.0 <11.0.1 / >=11.0.1 | GHSA-g3hv-75wg-m249: DoS via globparts amplification | shadcn → ts-morph → @ts-morph/common → minimatch |

The grpc-js finding is in the Firestore Node path of the firebase SDK (the browser bundle uses WebChannel, not grpc).

`pnpm audit signatures` → exit 0:
```
audited 1032 packages

1032 packages have verified registry signatures
```

## Not done / not checked

- firebase-tools (see refusal above); no override, exclusion or engine change made.
- ESLint, Prettier, commitlint were not run (no configs yet; out of scope).
- steiger was not run against `src` (only `--version`).
# node24: Node 24 pin + firebase-tools

Status: **stopped on `re2@1.27.0`** (blocked build script, `ERR_PNPM_IGNORED_BUILDS`).
Nothing staged or committed, git config and the index untouched, `pnpm-workspace.yaml` byte-identical to before.
The superstatic engine refusal from deps2 is gone under Node 24.

## Done

- Node: newest 24.x on nodejs.org/dist/index.json is **v24.22.2** (2026-10-27, LTS Krypton; 24.22.1 of 2026-10-20 was the security release).
  - `package.json` devEngines.runtime.version `26.13.0 → 24.22.2` (onFail `download` kept)
  - `package.json` engines.node `^26.13.0 → ^24.22.2`
  - `.nvmrc` `26.13.0 → 24.22.2`
  - pnpm stays 12.17.0 (`pnpm --version` → `12.17.0`)
- 7-day cutoff: published before 2026-11-04 14:03 UTC.
  - `@types/node`: newest 24.x is **24.19.2** (2026-10-09), no newer 24.x exists.
  - `firebase-tools`: **15.34.2** (2026-10-28); 15.35.0 (2026-11-04 19:16 UTC) is too young.

## Refusal (exact output)

`pnpm add -D @types/node@24.19.2 firebase-tools@15.34.2`, exit 1:
```
✓ Lockfile passes supply-chain policies (verified 8m ago)
[WARN] 10 deprecated subdependencies found: @opentelemetry/sdk-trace-base@2.10.0, @opentelemetry/sdk-trace-base@2.9.0, @opentelemetry/sdk-trace-web@2.10.0, @opentelemetry/sdk-trace-web@2.9.0, glob@10.5.0, glob@11.1.0, json-ptr@3.1.1, node-domexception@1.0.0, tsconfck@3.1.6, uuid@9.0.1
Downloading node@runtime:24.22.2: 0.00 B/58.29 MB
...
Packages: +573 -120
Progress: resolved 573, reused 1022, downloaded 2, added 573, done
[WARN] Issues with peer dependencies found. Run "pnpm peers check" to list them.

devDependencies:
- @types/node 26.6.6
+ @types/node 24.19.2
+ firebase-tools 15.34.2
- node 26.13.0
+ node 24.22.2

Error: ERR_PNPM_IGNORED_BUILDS

  × adding a new package
  ╰─▶ Ignored build scripts: re2@1.27.0
  help: Run "pnpm approve-builds" to pick which dependencies should be allowed
        to run scripts.
```
No engine, release-age or trust error was raised while resolving the new tree (the "verified 8m ago" line is a cached result; I did not re-run the check separately). Only `strictDepBuilds` failed.

**Unlike the deps2 refusal, this one wrote to disk**: `package.json` has `@types/node 24.19.2` and `firebase-tools 15.34.2`,
`pnpm-lock.yaml` holds the firebase-tools tree, and node_modules is installed with re2's install script **not run**
(no `re2/build`). I did not revert, so you can decide on top of it. To roll back: put `"@types/node": "26.6.6"` back,
remove `firebase-tools`, then run `pnpm install`. No lockfile backup was taken before the run.

## re2: where it comes from

`personal-workout → firebase-tools@15.34.2 → superstatic@10.0.0 → re2@1.27.0`, an **optionalDependency**
(`re2: ^1.17.7`, `optional: true` in the lockfile). superstatic does `try { require("re2") } catch { RE2 = null }`
and falls back to JS `RegExp`. Without re2, hosting `regex` rewrites/redirects that use RE2 named groups `?P<…>` are not
interpretable (`containsRE2Capture`); globs are unaffected. That matters only for the hosting emulator/`serve` with regex rules.

Install script (same shape in every recent version):
`install-from-cache --artifact build/Release/re2.node --host-var RE2_DOWNLOAD_MIRROR ... || node-gyp -j max rebuild`.
It downloads a prebuilt `.node` from the package's GitHub releases (`install-artifact-from-github`), and if that fails
it compiles with node-gyp (deps `nan`, `node-gyp@13.1.0`).

Publishing history (repo github.com/uhop/node-re2; sole maintainer and publisher npm user `elazutkin`; **no provenance on any version**):

| Version | Published | engines.node |
|---|---|---|
| 1.24.1 | 2026-05-12 | `>=22` |
| 1.25.0 | 2026-06-16 | `^22.22.2 \|\| ^24.15.0 \|\| >=26.0.0` |
| 1.25.1 | 2026-07-07 | same |
| 1.25.2 | 2026-07-07 | same |
| 1.26.0 | 2026-07-08 | same |
| 1.26.1 | 2026-07-21 | same |
| 1.27.0 | 2026-09-26 (installed) | same, admits 24.22.2 |
| 1.27.1 | 2026-11-08 (`latest`, too young) | same |

Options (none applied): `allowBuilds: re2: false` (same pattern as `@firebase/util`/`protobufjs`; superstatic runs on
the RegExp fallback), or `re2: true` (runs the GitHub binary download / native compile at install time).

## Not run (stopped before them)

`rm -rf node_modules && pnpm install --frozen-lockfile`, `pnpm exec node -v`, `pnpm peers check`, `pnpm typecheck`,
`pnpm build`, `--version` of firebase/steiger/vitest/playwright/eslint, the engines proof, `pnpm audit`,
`pnpm audit signatures`, the Firestore emulator. With `verifyDepsBeforeRun: install` every `pnpm exec` would start an
install that hits the same refusal.
# re2: owner decision of 2026-11-11 applied

Status: **done, every check ran.** Nothing staged or committed, git config and the index untouched
(worktree inspected with `git --no-optional-locks`).

## Change (the only edit)

`pnpm-workspace.yaml`, `allowBuilds`:
```yaml
  lefthook: true
  # optional native dependency of firebase-tools (superstatic), approved by the owner 2026-11-11
  're2@1.27.0': true
```
pnpm 12.17.0 **accepts the version-pinned key**: the install ran re2@1.27.0's script with no
`ERR_PNPM_IGNORED_BUILDS` and no other refusal. `package.json` and `pnpm-lock.yaml` were not changed by this run.

## Install that ran re2's script — `pnpm install`, exit 0

```
✓ Lockfile passes supply-chain policies (verified 2m ago)
Lockfile is up to date, resolution step is skipped
Already up to date
.../.pnpm/re2@1.27.0/node_modules/re2 install$ install-from-cache --artifact build/Release/re2.node --host-var RE2_DOWNLOAD_MIRROR --skip-path-var RE2_DOWNLOAD_SKIP_PATH --skip-ver-var RE2_DOWNLOAD_SKIP_VER --force-build-var RE2_DOWNLOAD_FORCE_BUILD || node-gyp -j max rebuild
.../lefthook@2.2.1/node_modules/lefthook postinstall$ node postinstall.js
.../lefthook@2.2.1/node_modules/lefthook postinstall: sync hooks: ✔️
.../lefthook@2.2.1/node_modules/lefthook postinstall: Done
.../.pnpm/re2@1.27.0/node_modules/re2 install: Trying https://github.com/uhop/node-re2/releases/download/1.27.0/linux-x64-137.br ...
.../.pnpm/re2@1.27.0/node_modules/re2 install: Writing to build/Release/re2.node ...
.../.pnpm/re2@1.27.0/node_modules/re2 install: Done.
.../.pnpm/re2@1.27.0/node_modules/re2 install: Done
Done in 914ms using pnpm v12.17.0
```
- **Prebuilt binary downloaded** from the package's GitHub release (`linux-x64-137.br`, ABI 137 = Node 24); node-gyp did not run, nothing compiled.
- `node_modules/.pnpm/re2@1.27.0/node_modules/re2/build/Release/re2.node` exists: 1 465 136 bytes, `ELF 64-bit LSB shared object, x86-64`.
- It loads under Node 24: `new RE2("(?P<x>a+)").exec("caab").groups` → `{ x: 'aa' }`.

## Runtime pins

- `pnpm --version` → `12.17.0`
- `pnpm exec node -v` → `v24.22.2`

## `rm -rf node_modules && pnpm install --frozen-lockfile` — exit 0

`Lockfile is up to date, resolution step is skipped`, `Packages: +1400`, `Done in 411ms using pnpm v12.17.0`.
re2's script did **not** run again: pnpm restored the built `re2.node` from its side-effects cache in the store
(the file is a hard link, link count 2). Lefthook's postinstall did not run either, for the same reason.

## `pnpm peers check` — exit 1 (same two issues as before)

```
✕ unmet peer eslint
  Installed: 10.14.0
  Wanted:
    "^3 || ^4 || ^5 || ^6 || ^7 || ^8 || ^9":
      eslint-plugin-jsx-a11y@6.10.2

✕ unmet peer typescript
  Installed: 6.0.3
  Wanted:
    ^5.0.0:
      tsconfck@3.1.6
```
`tsconfck@3.1.6` comes from `@feature-sliced/steiger-plugin@0.8.2` (directly and via `steiger@0.9.0`).

## `pnpm typecheck` / `pnpm build` — both exit 0

```
$ tsc -b && vite build
vite v8.3.5 building client environment for production...
✓ 123 modules transformed.
dist/index.html                   0.42 kB │ gzip:  0.27 kB
dist/assets/index-DxtEyVdk.css   22.18 kB │ gzip:  4.77 kB
dist/assets/index-DMbGjeft.js   252.99 kB │ gzip: 82.02 kB
✓ built in 148ms
```

## Tool versions (`pnpm exec … --version`)

| Tool | Version |
|---|---|
| firebase | 15.34.2 |
| steiger | 0.9.0 (`@feature-sliced/steiger-plugin` 0.8.2) |
| vitest | vitest/5.1.0 linux-x64 node-v24.22.2 |
| playwright | 1.64.1 |
| eslint | v10.14.0 |
| tsc | 6.0.3 |

## `pnpm audit` — exit 1

`7 vulnerabilities found`, `Severity: 2 low | 4 moderate | 1 high` (0 critical; 1484 packages).
With `audit.level: high` the table and `--json` show only the high one; the full list below comes from a one-off
`pnpm audit --audit-level low --json` (config not changed).

| Package | Severity | Advisory | Dependency path (example; count) | Patched |
|---|---|---|---|---|
| @grpc/grpc-js 1.9.16 | **high** | GHSA-m9gg-hp2v-232j — getAuthContext can return unauthorized certificates as authorized | `.>firebase>@firebase/firestore>@grpc/grpc-js` (4, also via `@firebase/rules-unit-testing`) | >=1.13.6 |
| @grpc/grpc-js 1.9.16 | low | GHSA-f596-whhp-79r4 — server sends handler error messages to the client | same 4 paths | >=1.13.6 |
| uuid 9.0.1 | moderate | GHSA-w5hq-g745-h8pq — missing buffer bounds check in v3/v5/v6 | `.>firebase-tools>gaxios>uuid` (4) | >=11.1.1 |
| @opentelemetry/core 1.30.1 | moderate | GHSA-8988-4f7v-96qf — unbounded allocation in W3C Baggage propagation | `.>firebase-tools>@google-cloud/pubsub>@opentelemetry/core` (1) | >=2.8.0 |
| glob 10.5.0, 11.1.0 | moderate | GHSA-3g3m-2fjr-6pw4 — AbortSignal cancellation bypass | `.>firebase-tools>@google-cloud/pubsub>google-gax>rimraf>glob` (10) | >=14.0.2 |
| minimatch 9.0.9, 10.2.6 | moderate | GHSA-g3hv-75wg-m249 — DoS via globparts amplification | `.>shadcn>ts-morph>@ts-morph/common>minimatch`, `.>typescript-eslint>…>eslint>@eslint/config-array>minimatch` (57) | >=11.0.1 |
| deepmerge 4.3.1 | low | GHSA-gcqx-w48m-w2h4 — mergeObject() prototype poisoning | `.>shadcn>deepmerge` (3) | none |

Notes for the decision (nothing applied):
- grpc-js 1.9.16 is pinned by `@firebase/firestore@4.19.1` (inside `firebase@13.2.0`); firebase-tools already gets 1.14.7.
  It is the Node build of Firestore; the browser bundle talks over WebChannel, not grpc-js. Fixing it would take a
  newer `firebase` or a pnpm `overrides` entry — an owner decision.
- Everything else is in dev tooling (firebase-tools, shadcn CLI, eslint/ts-morph), not in the shipped bundle.

## `pnpm audit signatures` — exit 0

```
audited 1484 packages

1484 packages have verified registry signatures
```

## Firestore emulator — exit 0

Java: `openjdk version "21.0.13.0.3" 2026-10-24`.
Temporary config (outside the project):
`<scratchpad>/emu/firebase.json`
= `{"emulators":{"firestore":{"port":8080},"ui":{"enabled":false}}}`.

`timeout 180 pnpm exec firebase emulators:exec --only firestore --project demo-workout --config <that file> "echo emulator-ok"`:
```
i  emulators: Starting emulators: firestore
i  emulators: Detected demo project ID "demo-workout", ...
⚠  firestore: Cloud Firestore Emulator does not support multiple databases yet.
⚠  firestore: Did not find a Cloud Firestore rules file specified in a firebase.json config file.
i  firestore: downloading cloud-firestore-emulator-v1.22.0.jar...
✔  firestore: Firestore Emulator was started in standard edition.
i  Running script: echo emulator-ok
emulator-ok
✔  Script exited successfully (code 0)
i  emulators: Shutting down emulators.
```
- Jar cached at `~/.cache/firebase/emulators/cloud-firestore-emulator-v1.22.0.jar` (136 707 194 bytes; the directory did not exist before).
- The emulator wrote `firestore-debug.log` into the project root (ignored by `*.log`); I moved it to the scratch `emu/` directory.

## Not done / not checked

- `pnpm lint`, `pnpm test`, steiger and the commit linter were not run (not asked).
- re2 1.27.1 is the current `latest` but too young for the 7-day rule; the allow-list key is pinned to 1.27.0, so
  a future bump of re2 will be refused by `strictDepBuilds` until the key is updated.
