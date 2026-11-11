# Report: lint (T004, T013)

## Files

Created: `eslint.config.ts`, `eslint/no-color-literals.ts`, `eslint/no-color-literals.test.ts`,
`eslint/jsx-a11y.d.ts` (jsx-a11y ships no types; typed lint of the config needs them),
`prettier.config.js`, `.prettierignore`.
Edited (allowed): `src/app/index.tsx` (non-null assertion -> explicit `#root` check),
`src/shared/ui/button.tsx`, `src/shared/lib/utils.ts` (Prettier only: double -> single quotes).

## ESLint config

- `defineConfig`/`globalIgnores` from `eslint/config`; `**/*.{ts,tsx}`: typescript-eslint
  `strictTypeChecked` + `stylisticTypeChecked`, `projectService: true`.
  Tweaks: `no-confusing-void-expression` with `ignoreArrowShorthand` (JSX `onClick={() => setX(1)}`),
  `restrict-template-expressions` with `allowNumber`.
- `src/**/*.{ts,tsx}`: react-hooks 7 `configs.flat.recommended` (the plain `configs.recommended` is
  legacy format), react-refresh `configs.vite`, jsx-a11y `flatConfigs.recommended`,
  `@tanstack/eslint-plugin-query` `flat/recommended`, `local/no-color-literals: error`.
- `src/shared/ui/**/*.tsx`: `react-refresh/only-export-components` off (shadcn exports cva variants
  beside the component, e.g. `buttonVariants`).
- `eslint-config-prettier/flat` last. Ignores: dist, public/catalog, .catalog-cache, .claude,
  .specify, coverage, playwright-report, test-results (node_modules is ignored by default).

**jsx-a11y under ESLint 10: works.** 6.10.2 declares `eslint ^3..^9` (peer warning only). Its
`lib/` uses none of the context methods ESLint 10 removed (`getSourceCode`, `getScope`,
`getAncestors`, `parserServices`, ... grep found nothing). Smoke test via stdin on a `src/` file
reported `jsx-a11y/alt-text`, `click-events-have-key-events`, `no-static-element-interactions`,
plus `react-hooks/set-state-in-effect`, `exhaustive-deps` and `local/no-color-literals`.

**jiti: no direct dependency needed.** pnpm resolved `eslint@10.14.0_jiti@2.7.0` (jiti is linked
as eslint's optional peer), and `pnpm exec eslint .` loads `eslint.config.ts` (and the `.ts` rule it
imports) without errors.

## T013 colour rule

`eslint/no-color-literals.ts` checks string `Literal`s (this covers JSX attribute strings) and
`TemplateElement`s for: hex `#rgb/#rgba/#rrggbb/#rrggbbaa` bounded on both sides, and
`rgb(a)/hsl(a)/hwb/lab/lch/oklab/oklch(`. Tailwind arbitrary values (`bg-[#fff]`,
`text-[rgb(...)]`, `shadow-[0_0_4px_#000]`) are caught; `color-mix(in_oklch, var(...))` is not.
Not flagged: `'#root'`, `'#add-button'`, `'/workouts#add'`, `https://…#section`, `&#123;`,
`#12345`, SVG path data. Known limit: a bare fragment made only of hex letters (`href="#add"`)
or `'#123'` text is flagged; disable per line if it ever happens. JSX text children are not
checked (displayed text, not styling).

`pnpm exec vitest run eslint/no-color-literals.test.ts` -> `Tests 31 passed (31)` (picked up by
the `unit` project of the existing `vitest.config.ts`).

### CSS check (proposal, no package)

Verified on the repo (exit 0, `index.css` is clean) and on a fixture (flags `color:#fff` and
`@apply bg-[rgb(1,2,3)]`, ignores `#root {}`, `url(a.svg#abc)` and `tokens.css`). Exact
`package.json` line:

```json
"lint:colors": "! grep -rnEi --include='*.css' --exclude=tokens.css '(^|[^a-z0-9&/])#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})([^a-z0-9_-]|$)|(^|[^a-z0-9_-])(rgba?|hsla?|hwb|lab|lch|oklab|oklch)\\(' src",
```

Not covered by either check: Tailwind palette classes (`bg-red-500`) and named colours.
Suggestion for the tokens owner: `--color-*: initial;` in `@theme` in `tokens.css` removes the
default palette so such classes stop generating CSS.

## Prettier

`semi: false`, `singleQuote: true`, `printWidth: 100` (matches `src/app/index.tsx`,
`vite.config.ts`), `plugins: ['prettier-plugin-tailwindcss']` (only plugin, so last),
`tailwindStylesheet: './src/app/styles/index.css'`, `tailwindFunctions: ['cva', 'cn']`.
`.prettierignore`: build/test outputs, catalog, .claude, .specify, `pnpm-lock.yaml`, `*.log`, and
**`docs`, `specs`** (Prettier pads every Markdown table column, which bloats diffs of agent-written
docs; owner may drop these two lines).

## Verification

- `pnpm exec prettier --check .` -> only `src/app/styles/index.css` and `src/app/styles/tokens.css`
  fail (double -> single quotes in `@import` and `--font`; not mine, fix with `pnpm format`).
- `pnpm exec eslint .` -> `src/**` clean; 8 parsing errors "not found by the project service" for
  `eslint.config.ts`, `eslint/*`, `playwright.config.ts`, `steiger.config.ts`, `vitest.config.ts`,
  `tests/rules/smoke.test.ts`: no tsconfig includes them. Fixed by the tsconfig line below.
- With a scratch tsconfig extending `tsconfig.node.json` + that include: `tsc --noEmit` clean, and
  ESLint reports only files of other agents:
  - `steiger.config.ts:4:29` `no-unsafe-argument`, `5:3` `no-unsafe-assignment`:
    `fsd.configs.recommended` is error-typed (the types of `@feature-sliced/steiger-plugin` do not
    resolve under this tsconfig). Owner T005.
  - `tests/rules/smoke.test.ts:32:16` `no-unnecessary-condition` (unneeded `?.`). Owner T007/rules.

## Lines for the integrator

`tsconfig.node.json`:

```json
"include": ["*.ts", "eslint", "tests", "scripts"]
```

(`e2e/` has its own `e2e/tsconfig.json` and is already found.)

`package.json` scripts:

```json
"lint": "eslint . && pnpm lint:colors",
"lint:fix": "eslint . --fix",
"lint:colors": "<line above>",
"format": "prettier --write .",
"format:check": "prettier --check .",
```

(T005 appends `&& steiger ./src` to `lint`.)

## Packages needed but not installed

None.

## Open problems

- `src/shared/lib/utils.ts` re-exports `cn` from the npm package `cn@0.5.2`, not the shadcn
  `clsx` + `tailwind-merge` helper. Worth checking that `cn` merges conflicting Tailwind classes.
- Re-running `shadcn add` produces double-quoted files; `pnpm format` after each add.

# T005 Steiger — report (steiger)

## Files created

- `steiger.config.ts` — `fsd.configs.recommended` + one global ignore block
  (`**/*.test.*`, `**/*.spec.*`, `**/__mocks__/**`, `**/__tests__/**`, `src/shared/lib/test/**`).
  **No rule adjustments**: nothing in plan.md justifies one (details below). shadcn in `shared/ui`
  and `shared/lib` pass the recommended rules as they are.

Versions: `pnpm exec steiger --version` → `0.9.0`, `@feature-sliced/steiger-plugin 0.8.2`.
Typecheck of the config alone: `tsc --noEmit --ignoreConfig --module nodenext --moduleResolution nodenext --skipLibCheck steiger.config.ts` → exit 0.

## Current tree (`pnpm exec steiger ./src --fail-on-warnings`)

Tree: `src/app/{index.tsx,styles/*}`, `src/shared/lib/{index.ts,utils.ts,utils.test.ts,test/setup.ts}`,
`src/shared/ui/{index.ts,button.tsx,button.test.tsx}`.

```
✔ No problems found!   EXIT=0
```

No findings, so nothing to change in source. Facts checked in the plugin code that matter for shadcn:
- `shared/ui` and `shared/lib` may be imported per file (`@/shared/ui/button`) — the sidestep rule only
  fires for a **subfolder** imported past its own `index.ts` (`@/shared/ui/sheet/sheet` → error).
  So keep shadcn components as flat files (the CLI does this) and give any subfolder an `index.ts`.
- shadcn's `hooks` alias (`@/shared/lib/hooks`) is allowed: `hooks` is only a bad *segment* name,
  not a bad folder inside `shared/lib`.
- `shared/lib` allows up to 15 top-level modules (`shared-lib-grouping`); ignored test files do not count.
- Every `shared` segment that is a folder needs an `index.ts` (`public-api`), e.g. `shared/api`, `shared/config`.

## Planned layout (plan.md "Source Code") — dry run

Throwaway copy with stub files and a realistic import graph (pages → entities/features/widgets as
the plan comments describe; app → widgets/app-nav and pages; segments `ui`/`model`/`api`; every slice
with `index.ts`): `<scratchpad>/fsd-layout`
(variants next to it as `v-*`). Steiger run with the same config.

**Baseline: 2 errors, both naming in plan.md:**

| Rule | Where | Reading | Fix (owner/lead decides) |
|---|---|---|---|
| `fsd/inconsistent-naming` | `src/entities` | `settings` is plural, the other 4 entities are singular. `user-settings` also fails. | Rename the entity to `profile` (data-model already calls it "profile document") — verified: passes. Alternative: turn the rule off (not recommended). |
| `fsd/segments-by-purpose` | `src/app/providers` | `providers` is in the plugin's React "bad names" list (with `hooks`, `context`, `provider`). | Name the app segment by purpose, e.g. `app/entrypoint` or put providers in `app/routes`/`app/layout` (`app/layout` verified: passes). |

**Variants — what will be rejected when later tasks do it:**

| Variant | Result |
|---|---|
| Entity used by only one page (e.g. `entities/settings` only by `pages/settings`) | `fsd/insignificant-slice` error: "only one reference in slice pages/settings. Consider merging them." References from other entities do not count (same layer), references from `app` count as fine. |
| `widgets/app-nav` imported by one page instead of `app` | `insignificant-slice` error. Imported from `app/*` → passes. |
| Entity importing another entity (`entities/workout` → `@/entities/exercise`) | `fsd/forbidden-imports` "Forbidden cross-import". Passes with an `@x` API: `entities/exercise/@x/workout.ts`, imported as `@/entities/exercise/@x/workout`. Relevant for workout→exercise (muscle load) and session→workout (prediction). |
| Page without segments (`pages/login/login-page.tsx` + `index.ts`) | `fsd/no-segmentless-slices`. Pages need `ui/` (and `model/` etc.). |
| `app/ui/` | `fsd/no-ui-in-app`. `app/layout/` passes. |
| Segments `hooks`, `types`, `components` in any slice | `fsd/segments-by-purpose`. Use `model`, `lib`, `ui`, `api`, `config`. |
| Import past a slice's public API (`@/entities/exercise/model/types`) | `fsd/no-public-api-sidestep`. |
| `shared/lib` with > 15 top-level modules | `fsd/shared-lib-grouping`. |
| `shared/config` without `index.ts` | `fsd/public-api`. |
| Ignores: `components/a.test.tsx` and `__mocks__/m.ts` in slices | ignored, no findings → ignore globs work. |

**Phasing risk (important):** `insignificant-slice` checks the code as it is at each commit. Plan
phases build slices before their second consumer exists: phase 1 `entities/settings` (only
`pages/settings` until phase 2 exercises), phase 2 `widgets/exercise-details` (only `pages/exercises`
until phase 3), phase 4 `entities/session` (only `pages/session` until phase 5 finish),
`features/pick-exercise` in phase 3 (template-edit only until session in phase 4). Each will fail
`lint:fsd` (and the pre-commit/CI that runs it) until the second page lands. Options for the lead:
(a) start code inside the page and extract when the second page appears (what FSD 2.1 pages-first
intends), (b) set `'fsd/insignificant-slice': 'warn'` and run Steiger without `--fail-on-warnings`
during phases 1–5. I did not change the rule: plan.md does not justify it on its own.

## Lines for the integrator

`package.json` scripts:
```json
"lint:fsd": "steiger ./src --fail-on-warnings",
```
and include it in `lint` (exact form depends on the ESLint task's script), e.g.
```json
"lint": "eslint . && pnpm lint:fsd",
```
`tsconfig.node.json` — add the config so ESLint's typed linting and `tsc -b` see it:
```json
"include": ["vite.config.ts", "steiger.config.ts"]
```
(plus the other root configs from the wave).

## Packages needed but not installed

None. Note: the research doc lists Steiger 0.10.0 (2026-11-09) as latest; installed is 0.9.0 — fine.

## Open problems

- `prettier --check steiger.config.ts` warns, but only because no Prettier config existed yet (defaults =
  double quotes/semicolons). File follows the repo's single-quote/no-semicolon style; integrator's
  `prettier --write` will settle it once the Prettier task lands.
- The two baseline naming decisions above (`entities/settings`, `app/providers`) and the phasing risk
  should go to the owner before phase 1 code is written.

# Report: hooks (T006)

## Files

- `lefthook.yml` (replaced the template; working tree only, the staged template is untouched)
  - `pre-commit`, `parallel: true`:
    - `eslint`: glob `*.{ts,tsx}`, `pnpm exec eslint --no-warn-ignored -- {staged_files}`
    - `prettier`: `pnpm exec prettier --check --ignore-unknown -- {staged_files}`
    - `typecheck`: `pnpm run typecheck` (reuses the `tsc -b` script)
  - `commit-msg`: `pnpm exec commitlint --edit {1}`
  - No `stage_fixed` anywhere, so lefthook never runs `git add`.
- `commitlint.config.js`: `export default { extends: ['@commitlint/config-conventional'] }` (Prettier style: no semicolon)

## Index safety (checked in lefthook v2.2.1 source, internal/git/wrapper)

On pre-commit with partially staged files lefthook runs `git diff --output=.git/info/lefthook-unstaged*.patch`,
`git stash create` + `git stash store` (backup, no index write), `git checkout --force -- <files>` (worktree
from index), runs the jobs, then `git apply <patch>` (worktree only) and `git stash drop`. So linters see the
staged content and the index is never written. `git add` runs only for `stage_fixed` files: none here.
Index hash (`git diff --cached | sha1sum`) was identical before and after every run below.

## Verification

- `pnpm exec lefthook validate` → `All good`, exit 0
- `echo "feat: add x" | pnpm exec commitlint` → exit 0
- `echo "bad message" | pnpm exec commitlint` → exit 1 (`subject-empty`, `type-empty`)
- `pnpm exec lefthook run commit-msg <tmp msg "feat: add hooks">` → ✔ commitlint, exit 0
- `pnpm exec lefthook run commit-msg <tmp msg "bad message">` → 🥊 commitlint, exit 1
- `pnpm exec lefthook run pre-commit` → **fails before any job**:
  `git stash create` → `You do not have the initial commit yet` → `Failed to save unstaged changes`.
  Cause: no root commit + partially staged files (`AM lefthook.yml`, `AM src/shared/ui/button.tsx`). See open problems.
- `pnpm exec lefthook run pre-commit --no-stage-fixed` (skips that guard; jobs run on the 80+ staged files):
  - ✓ typecheck
  - ✗ prettier: `src/app/styles/index.css`, `src/app/styles/tokens.css` not formatted (not mine);
    `commitlint.config.js` was flagged too and fixed.
  - ✗ eslint: 8 × `Parsing error: <file> was not found by the project service` for `eslint.config.ts`,
    `eslint/*.ts`, `playwright.config.ts`, `steiger.config.ts`, `tests/rules/smoke.test.ts`, `vitest.config.ts`
    (ESLint config agent's file; the tsconfigs do not include these root/test files). The hooks work; the configs
    of other agents were present when I tested.
- Empty file list (`--exclude '*' --exclude '**/*'`): `eslint (skip) no files for inspection`,
  `prettier (skip) no files for inspection`, exit 0. Lefthook skips a job whose `{staged_files}` is empty, so no
  bare `eslint`/`prettier` call with no paths.
- Leftover `.git/info/lefthook-unstaged*.patch` from the failed run were removed by me.

## What `lefthook install` wrote

`pnpm exec lefthook install` → `sync hooks: ✔️(commit-msg, pre-commit)`. `.git/hooks/` now has
`pre-commit`, `commit-msg` (new) and `prepare-commit-msg` (already there from the lefthook postinstall at
`pnpm install`; lefthook's own hook used to auto-resync hooks when the config checksum changes). Each is a
`#!/bin/sh` wrapper that finds the lefthook binary (PATH, then
`node_modules/.pnpm/lefthook-linux-x64@2.2.1/...`, then fallbacks) and runs `lefthook run "<hook>" "$@"`.
Also `.git/info/lefthook.checksum`. No `core.hooksPath` set. `lefthook check-install` → exit 0.
Note: `lefthook run` also auto-syncs hooks when the config changed (the first `run` already wrote them).

## prepare / postinstall script

Not needed. `allowBuilds: { lefthook: true }` is already in `pnpm-workspace.yaml`, and lefthook's
`postinstall.js` runs `lefthook install` on every install of the package (skipped when `CI` is set unless
`LEFTHOOK=1`, which is what we want). Config changes are picked up by the auto-sync on each `lefthook run`.
A `prepare` script would only matter if `allowBuilds` for lefthook were ever revoked.

## Lines for shared files

None required. Optional: none.

## Packages needed

None.

## Open problems

1. **First commit with partially staged files fails** (`git stash create` needs HEAD). Lefthook 2.2.1 has no
   config or env switch for this guard (only the CLI flag `--no-stage-fixed`, which the git hook does not pass).
   Owner's choices for the root commit only: stage the whole files (no `AM` entries) before committing, or
   `LEFTHOOK=0 git commit …` / `git commit --no-verify` for that one commit. After the first commit it works.
2. Pre-commit will currently fail on the staged tree because of the ESLint project-service errors and the
   two unformatted CSS files above (other agents' files).
3. `typecheck` runs `tsc -b` on the working tree, not the staged snapshot of new untracked files; acceptable
   for a full typecheck.

# Report: vitest (T007)

## Files created
- `vitest.config.ts` — `mergeConfig(viteConfig, defineConfig({ test: { projects: [...] } }))`; every inline project has `extends: true`, so the `@` alias and the React/Tailwind plugins come from `vite.config.ts` (unchanged). Projects:
  - `unit`: node; `src/**/*.test.ts`, `scripts/**/*.test.ts`, `eslint/**/*.test.ts`
  - `ui`: jsdom; `src/**/*.test.tsx`; setup `src/shared/lib/test/setup.ts`
  - `rules`: node; `tests/rules/**/*.test.ts`
- `src/shared/lib/test/setup.ts` — imports `@testing-library/jest-dom/vitest`, registers `afterEach(cleanup)` (RTL auto-cleanup needs globals, which are off).
- `src/shared/lib/utils.test.ts` — kept: `cn` drops falsy values and lets a later Tailwind class win (`cn('px-2 py-1','px-4') === 'py-1 px-4'`).
- `src/shared/ui/button.test.tsx` — kept: renders `<Button>Начать</Button>`, finds it by role `button` and name.
- `tests/rules/smoke.test.ts` — `initializeTestEnvironment` with inline deny-all rules, `assertFails` on an unauthenticated `get` of `users/anyone`. `describe.skipIf(!FIRESTORE_EMULATOR_HOST)` with a suite name that says how to run it.

## Verification
- `pnpm exec vitest run --project unit` → 1 file, 2 tests passed.
- `pnpm exec vitest run --project ui` → 1 file, 1 test passed (~1 s).
- `pnpm exec vitest run --project rules` without the emulator → 1 file skipped, exit 0.
- `pnpm exec firebase emulators:exec --only firestore --project demo-workout --config <scratch>/firebase.json "pnpm exec vitest run --project rules"` (scratch config: firestore port 8085, UI off, singleProjectMode) → 1 test passed, "Script exited successfully (code 0)". Uses JDK 21. The emulator writes `firestore-debug.log` to the project root; `.gitignore` already ignores `*.log`. I deleted the one I created.
- `pnpm exec tsc -b` → clean (the `src` test files and setup are covered by `tsconfig.app.json`; jest-dom matcher types come from the setup import, which is in the same program).
- Ad-hoc `tsc --ignoreConfig --strict --types node --moduleResolution bundler ... vitest.config.ts tests/rules/smoke.test.ts` → clean.
- ESLint: not run, `eslint.config.*` does not exist yet (T004). Prettier `--check` flags all 5 files only because no Prettier config exists yet (defaults = double quotes and semicolons; I used the single-quote, no-semicolon style of `vite.config.ts`). Run `pnpm exec prettier --write` on them after T004 lands.

## Lines for the integrator
`package.json` scripts:
```json
"test": "vitest run --project unit --project ui",
"test:watch": "vitest --project unit --project ui",
"test:rules": "firebase emulators:exec --only firestore --project demo-workout \"vitest run --project rules\""
```
(`test` leaves out `rules` so it does not need the emulator; a plain `vitest run` would also work, because `rules` skips itself without the emulator.)

`tsconfig.node.json` `include` → `["vite.config.ts", "vitest.config.ts", "tests"]`. Otherwise `tsc -b` does not check those files. `types: ["node"]` there already covers `process.env`. No `vitest/globals` needed: every test imports from `vitest`. If `scripts/` and `eslint/` get tests, they need a tsconfig include too, wherever those folders end up.

## Packages needed but not installed
None.

## Open problems
- `vitest.config.ts` imports `./vite.config.ts` with the extension. Without it, Vite 8 warns that the import will break under the future `configLoader: 'native'`.
- The `rules` project assumes the project's `firebase.json` from T010. `test:rules` uses the Firestore port defined there (8080).

# Report: playwright (T008)

## Files created

- `playwright.config.ts`: testDir `e2e`, projects `mobile` (`devices['Pixel 7']` for a mobile Chrome UA,
  `isMobile`, `hasTouch`, overridden to 390x844 and deviceScaleFactor 3) and `desktop` (Desktop Chrome, 1280x800);
  baseURL `http://127.0.0.1:5173`; webServer `pnpm exec vite --host 127.0.0.1 --port 5173 --strictPort`,
  `reuseExistingServer: !CI`; retries 0 / 2 in CI; `forbidOnly` in CI; trace `on-first-retry`;
  reporter `list` locally, `html` (`playwright-report`, `open: 'never'`) in CI; outputDir `test-results`.
- `e2e/smoke.spec.ts`: opens `/`, expects heading "Personal Workout" and button "Начать тренировку",
  `scrollWidth <= innerWidth`, body background equals `--background` (both normalised to rgb via a probe
  element; also asserts the token is not transparent, so a missing stylesheet cannot pass as "equal").
- `e2e/tsconfig.json`: extends `tsconfig.node.json`, adds `DOM` lib (needed inside `page.evaluate`),
  includes `e2e/` and `../playwright.config.ts`.

## Browser choice: bundled Chromium (no `channel`)

`~/.cache/ms-playwright` already has `chromium-1248` and `chromium_headless_shell-1248`, exactly the
revisions Playwright 1.64.1 pins (`browsers.json`: Chrome for Testing 156.0.8078.4). Chosen over system
Chrome (`channel: 'chrome'`, 156.0.8078.79) because:
- the browser version is locked to the Playwright version in the lockfile, while system Chrome auto-updates
  under the tests;
- CI reproduces it with `pnpm exec playwright install --with-deps chromium`, no Google Chrome package needed;
- headless runs use the lighter headless shell.

## WebKit (decision for the owner)

The owner's phone is an iPhone; Chromium with a 390x844 touch viewport catches layout but not Safari
engine differences (`100dvh`, safe areas, PWA/service worker quirks, IndexedDB).
To add WebKit:
- `pnpm exec playwright install webkit` downloads WebKit 27.2 (rev 2370) into `~/.cache/ms-playwright/webkit-2370`
  from `cdn.playwright.dev` (dry run picks the `webkit-ubuntu-26.04.zip` build; host is Ubuntu 26.10, so it
  runs on a fallback build, not an officially listed distro). Roughly 90-100 MB download, ~300 MB unpacked
  (estimate, not measured).
- System libraries: `sudo pnpm exec playwright install-deps webkit` (apt: gstreamer, libwoff, libharfbuzz-icu,
  libenchant, libsecret, libmanette etc.). Needs sudo on this box; in CI `--with-deps` does it.
- Config: one more project, e.g. `{ name: 'iphone', use: { ...devices['iPhone 15'] } }` (WebKit, 393x852, dsf 3).
- Cost: about +1-2 s per run on the current smoke, more on the full suite; CI cache grows accordingly.
Still not real iOS Safari; a real-device check stays manual.

## Verification

```
$ pnpm exec playwright test          (no server on 5173 beforehand; webServer started Vite)
Running 2 tests using 2 workers
  ✓  [desktop] › e2e/smoke.spec.ts:3:1 › app shell renders in the dark theme without horizontal overflow (292ms)
  ✓  [mobile]  › e2e/smoke.spec.ts:3:1 › app shell renders in the dark theme without horizontal overflow (302ms)
  2 passed (1.2s)
real 1.9-2.2 s wall clock for the whole command (incl. Vite start)

$ CI=1 pnpm exec playwright test     -> 2 passed (1.1s), playwright-report/index.html written
$ pnpm exec tsc -p e2e/tsconfig.json --noEmit   -> OK
```

ESLint not run: no `eslint.config.*` existed yet. No Prettier config existed either; the files are
formatted with `--single-quote --no-semi --print-width 100` to match `src/app/index.tsx`. If the T005
config differs, run `pnpm exec prettier --write playwright.config.ts e2e`.

## Lines for the integrator

`package.json` scripts:
```json
"e2e": "playwright test",
"e2e:ui": "playwright test --ui"
```

`tsconfig.json` references (so `tsc -b` / `pnpm typecheck` covers e2e and the config):
```json
"references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }, { "path": "./e2e/tsconfig.json" }]
```

`.gitignore`: nothing to add, it already has `test-results`, `playwright-report`, `blob-report`.

Later (T011 / emulators): replace `webServer.command` with the script that also starts the emulators;
keep `url` on 5173 so Playwright waits for Vite.

ESLint (T005, if it uses typed linting): add `e2e/tsconfig.json` to `parserOptions.project` or rely on
`projectService` picking it up.

## Packages not installed

None needed. WebKit browser binary not downloaded (see above).

## Open problems

- The mobile project is Chromium, not Safari; see WebKit section.
- `devices['Pixel 7']` brings an Android Chrome UA; if the app ever branches on iOS UA, that path is untested.

# Report: firebase (T010)

## Files created

- `firebase.json` — Firestore rules/indexes; Hosting (`public: dist`, SPA rewrite `** → /index.html`,
  ignore list, cache headers); emulators auth 9099, firestore 8080, hosting 5000, ui 4000, all on
  127.0.0.1, `singleProjectMode: true`. Formatted with prettier.
- `.firebaserc` — default project `demo-workout`.
- `firestore.rules` — `rules_version = '2'`, `allow read, write: if false` on `/{document=**}`.
- `firestore.indexes.json` — empty `indexes` and `fieldOverrides`.

## Deviation from the brief: cache headers

Hosting matches header `source` against the **request** path, not the rewrite destination. With a
`no-cache` rule only for `/index.html`, the requests `/` and `/some/deep/route` (served index.html via
the rewrite) came back with **no Cache-Control at all** (production Hosting then applies its default
browser cache of 1 hour, so a stale shell after deploy). Fix: a first rule `** → no-cache`, then the
specific rules; the later matching rule overrides. This also covers `/sw.js` and
`/manifest.webmanifest` (vite-plugin-pwa default name) without listing them. Side effect: any other
unhashed public file (favicon, icons) is `no-cache` too; that is a revalidation, not a re-download.

Header order in `firebase.json`: `**` no-cache → `/assets/**` immutable 1y → `/catalog/images/**`
immutable 1y → `/catalog/*.json` `public, max-age=3600`.

## Verification

Ports: `ss -ltnp` showed nothing on 9099, 8080, 5000, 4000, nor on the extra ones the suite opens
(hub 4400, logging 4500, Firestore UI websocket 9150, Vite 5173). No conflicts, no port changed.
Java: OpenJDK 21.0.13.

1. `timeout 180 pnpm exec firebase emulators:exec --only auth,firestore --project demo-workout "echo emulators-ok"`
   ```
   i  emulators: Detected demo project ID "demo-workout", emulated services will use a demo configuration ...
   ✔  firestore: Firestore Emulator was started in standard edition.
   emulators-ok
   ✔  Script exited successfully (code 0)
   ```
   No rules warnings in the output or in `firestore-debug.log`.
2. Deny-all is in effect (REST against the emulator, unauthenticated): `read=403`, `write=403`.
3. `pnpm exec vite build` (ok), then hosting emulator with `curl -sI` (fake `catalog/`, `sw.js`,
   `manifest.webmanifest` placed in `dist/` for the test and removed afterwards):
   ```
   /                         200  Cache-Control: no-cache
   /some/deep/route          200  Cache-Control: no-cache
   /index.html               200  Cache-Control: no-cache
   /sw.js                    200  Cache-Control: no-cache
   /manifest.webmanifest     200  Cache-Control: no-cache
   /assets/index-*.js        200  Cache-Control: public, max-age=31536000, immutable
   /catalog/exercises.json   200  Cache-Control: public, max-age=3600
   /catalog/images/x/0.jpg   200  Cache-Control: public, max-age=31536000, immutable
   ```
4. Proposed `dev` form, run for 60 s then SIGINT:
   `pnpm exec firebase emulators:exec --only auth,firestore --ui "vite"` → Vite 5173 200, UI 4000 200,
   Auth 9099 200; Ctrl-C shut down Vite and every emulator cleanly, all ports released.

## Where the emulators cache their jars

`~/.cache/firebase/emulators/` (outside the project): `cloud-firestore-emulator-v1.22.0.jar`,
`ui-v1.15.0.zip` + `ui-v1.15.0/` (downloaded the first time the UI starts). Auth and Hosting are
pure Node and download nothing. CI should cache `~/.cache/firebase/emulators`.

## Files written into the project directory

- `firestore-debug.log` — on every Firestore start; deleted automatically on a clean exit of
  `emulators:exec`, left behind after Ctrl-C.
- `firebase-debug.log` — only when the CLI hits an error; `ui-debug.log` — when the UI runs.
- Export folder — only with `--export-on-exit` / `emulators:export` (name is ours, e.g. `emulator-data`).
- `.firebase/` — Hosting deploy cache (only on `firebase deploy`).

The current `.gitignore` already covers all of them (`.firebase`, `emulator-data`,
`firebase-debug.log*`, `firestore-debug.log*`, `ui-debug.log*`). **No lines to add.**

## Lines for the integrator (`package.json` scripts, T011)

```json
"dev": "firebase emulators:exec --only auth,firestore --ui vite",
"emulators": "firebase emulators:start --only auth,firestore"
```

- `dev`: one process, no extra package; the emulators start first, then Vite; Ctrl-C stops both.
  The emulator UI is on http://127.0.0.1:4000.
- Owner's choice, not added: persistent local data via
  `--import=emulator-data --export-on-exit` on either script (the folder is already gitignored).
- Hosting emulator for checking deploy headers: `pnpm build && firebase emulators:start --only hosting`
  (not proposed as a script; `vite preview` covers the everyday case).

## Packages needed but not installed

None. `firebase-tools` 15.34.2 and Java 21 are enough.

## Open problems

- Header precedence (later matching rule wins) is verified on the Hosting **emulator** only. Re-check
  `curl -sI` on `/` and `/assets/*` after the first real deploy.
- Other agents' untracked files seen during the run (`e2e/`, `playwright.config.ts`,
  `steiger.config.ts`, a temp `e2e/tsconfig.json.tmp.*`) were left untouched.

# Report: skills (T012)

## Files created

- `docs/skills.md` — one section per skill: source URL, pinned SHA/version, exact command, date,
  files, what the skill tells agents, commands/network/scripts, licence, how to update. Top note lists
  the unpinned commands and their `pnpm exec` replacements.
- `.claude/skills/` (new directories only; `speckit-*` untouched, confirmed with `git status`):
  - `shadcn/` (20 files) — shadcn-ui/ui @ `dd41d19e2f80ff6891951f7ced74c2c9a650b065`, MIT
  - `react-router/` (5) — remix-run/react-router @ `5dfc6f70c2106e82c0f1aa3c9e1e8a08bfcee943`, MIT
  - `feature-sliced-design/` (10) — feature-sliced/skills @ `5e95aaebb84541742686e56352b7569acf4306f1`, **no LICENSE file** (README says MIT)
  - `committing-with-commitlint/` (1) — conventional-changelog/commitlint @ `8ae9a9f8b964db512358fe5b32bd5af668b129a8`, MIT
  - `firebase-auth-basics/` (3), `firebase-firestore/` (4), `firestore-rules-creation/` (1),
    `firebase-security-rules-auditor/` (1), `firebase-hosting-basics/` (3) — firebase/agent-skills @
    `99954a30898bb5ddc8152ee10e124dc3b4106bf7`, Apache-2.0
  - `playwright-cli/` (11), `playwright-trace/` (1) — `pnpm exec playwright init-skills --loop claude`
    from playwright-core 1.64.1, Apache-2.0

No installer (`skills`, `claude plugin`) was run. GitHub sources: `git clone --depth 1` (sparse for
large repos) into my scratch dir, every copied file read, then `rsync`. Nothing written outside the
repository and my scratch dir. No package installed. No executable files or hooks copied.

## Decisions the owner should check

1. **Local patch to `shadcn/SKILL.md` (2 lines).** Upstream has `` !`npx shadcn@latest info --json` ``,
   which Claude Code executes automatically when the skill loads, and `allowed-tools` pre-approving
   `npx shadcn@latest *`. A note cannot stop an auto-executed command, so I changed both to
   `pnpm exec shadcn` (verified: `pnpm exec shadcn info --json` prints the project config and writes
   nothing). The diff is in `docs/skills.md`; revert if unwanted.
2. **`firebase-basics` not installed.** Its mandatory setup step tells agents to install the Firebase
   plugin at user level (`claude plugin marketplace add/install/update`), `npx skills add genkit-ai/skills`,
   and use `npx -y firebase-tools@latest` everywhere. Other Firebase skills point to it for login and
   project creation.
3. **Firebase: web + Standard edition only.** Android/iOS/Flutter/Python references and
   `firebase-firestore/references/enterprise/` not copied (SKILL.md links to them are dead here). Not
   installed: `agents/firestore-rules-author.md` (subagent, `commandExecutionPolicy: auto`),
   `.mcp.json`, the other 9 Firebase skills.
4. **`firebase-firestore` tells agents to create an Enterprise-edition database when none exists** —
   wrong for Spark/Standard. Flagged in docs; consider a local patch like shadcn's.
5. **FSD skill licence:** no LICENSE file, GitHub `license: null`, README says "MIT". Owner decides.
6. **`playwright-component-testing` removed** after `init-skills` (project uses Vitest + Testing
   Library for components). `cli install --skills` not used: it edits `.gitignore`, creates
   `.playwright/` and downloads a browser.
7. `evals/` folders of shadcn and FSD not copied (authoring test data).

## Verification

```
diff -r <clone>/skills/shadcn .claude/skills/shadcn        -> only evals/ missing + the 2 patched lines
diff -r <clone>/.agents/skills/react-router .claude/skills/react-router   -> identical
diff -r <clone>/feature-sliced-design .claude/skills/feature-sliced-design -> only evals/ missing
diff -r <clone>/skills/committing-with-commitlint ...       -> identical
cmp of every copied Firebase file against the clone        -> identical
diff -r node_modules/.../playwright-core/lib/tools/skills/playwright-{cli,trace} .claude/skills/... -> identical
find .claude/skills -perm /111 (excluding speckit)        -> none
```

`init-skills` implementation read in `playwright-core/lib/coreBundle.js` (`installSkills`): copies
`lib/tools/skills/<name>` to `<cwd>/.claude/skills/<name>`, no network. After install, Claude Code
listed all 11 new skills as available in this session. `.claude` is already in `.prettierignore` and
the ESLint ignores; `tsconfig.app.json` includes only `src`, so `shadcn/assets/showcase/*.tsx` is not
type-checked or linted.

## Lines for the integrator

- `.gitignore`: `.playwright-cli/` — `playwright-cli` writes snapshots, traces and state files there.
- `CLAUDE.md` (suggested, "How to work here"): `- Agent skills are listed in docs/skills.md; replace any npx/@latest command in a skill with the pinned pnpm exec form given there.`

## Packages needed but not installed

None.

## Open problems

- Skill text still contains many `npx …@latest` / `npm install` instructions (documented with
  replacements at the top of `docs/skills.md`; only the shadcn auto-executed line was patched).
- `playwright-cli`'s test-generation reference writes plans to `specs/<feature>.plan.md`, colliding
  with Spec Kit's `specs/`; noted in docs.

# Report: integrate (T011 + loose ends of T004–T013)

Result: `rm -rf node_modules dist && pnpm install --frozen-lockfile && pnpm check` passes, 41 s wall,
lockfile unchanged (byte-compared). No package installed, removed or upgraded. No git write command
run (no add/stash/reset/commit/config).

Index note: the index hash changed twice while I worked (55307ea… → 813fd1d… → 1b70d2d…), and at the
end `git status` shows every file as `A ` with no `AM` — someone staged the working tree by hand
during the run, my changes included. I did not touch the index.

## Changes per file

- `package.json` — scripts only:
  - `dev`: `firebase emulators:exec --only auth,firestore --ui "pnpm dev:app"` (firebase report form; Vite runs as the exec'd script).
  - `dev:app`: `vite --host 127.0.0.1 --port 5173 --strictPort`.
  - `build`, `preview`, `typecheck`: unchanged.
  - `lint`: `eslint . && pnpm format:check && pnpm lint:fsd && pnpm lint:colors`.
  - `lint:fix`: `eslint . --fix && prettier --write .`; `format`, `format:check`: Prettier write/check.
  - `lint:fsd`: `steiger ./src` (no `--fail-on-warnings`, owner's decision).
  - `lint:colors`: the CSS grep from the lint report, verbatim (verified: fails with exit 1 on a probe `color: #fff` CSS file, passes on the tree).
  - `test` / `test:watch`: Vitest `unit` + `ui`.
  - `test:rules`: `firebase emulators:exec --only firestore "vitest run --project rules"` (no `--project demo-workout`: `.firebaserc` already defaults to it).
  - `e2e`, `e2e:ui`, `emulators` (`emulators:start --only auth,firestore`).
  - `check`: `typecheck → test → build → lint → test:rules → e2e → audit → audit signatures` (order by measured wall time, see below; emulator-backed steps after the in-process ones, network audits last).
- `tsconfig.node.json` — `include: ["*.ts", "eslint", "scripts", "tests"]` (all root `.ts` configs, the ESLint rule + its test + `jsx-a11y.d.ts`, future `scripts/`, rules tests).
- `tsconfig.json` — reference to `./e2e/tsconfig.json` so `tsc -b` covers `e2e/`.
- `playwright.config.ts` — `webServer.command: 'pnpm dev'`; added `gracefulShutdown: { signal: 'SIGINT', timeout: 10_000 }`. Reason: with the default SIGKILL the Firestore emulator's JVM survived the run and kept 8080/9150 bound (observed), which would break the next `test:rules`. With SIGINT every port is released and no process is left (verified with `ss`/`pgrep`).
- `steiger.config.ts` — owner's decision: `'fsd/insignificant-slice': 'warn'` with the T079 comment (verified with a throwaway one-consumer slice: warning printed, exit 0; removed afterwards). Fixed 2 ESLint errors: the plugin's `.d.ts` imports `@steiger/toolkit`, which is not installed, so `fsd.configs.recommended` was error-typed; now cast once to `Parameters<typeof defineConfig>[0]` with a one-line comment. No package added.
- `tests/rules/smoke.test.ts` — `env?.cleanup()` → `env.cleanup()` (`no-unnecessary-condition`).
- `pnpm-workspace.yaml` — `audit.ignore: [GHSA-m9gg-hp2v-232j]` with the one-line approval comment; nothing else changed. `pnpm audit` → `6 vulnerabilities found, Severity: 2 low | 4 moderate, 1 ignored: 1 high`, exit 0.
- `.gitignore` — `.playwright-cli` (skills report). Firebase and Playwright reports needed nothing.
- `.claude/skills/firebase-firestore/SKILL.md` — section 1.B replaced: Standard edition, emulator-first, do not create a database (12 lines → 4). Diff recorded in `docs/skills.md` next to the shadcn patch (4-backtick fence because the removed text contains a code fence); the "what they tell agents" bullet now says "patched locally".
- `CLAUDE.md` — the suggested skills line under "How to work here".
- `src/app/styles/index.css`, `src/app/styles/tokens.css` — Prettier only (double → single quotes). Colour values still only in `tokens.css`.
- `README.md` — new: two-line summary, prerequisites, commands table, supply chain in three lines, the Lefthook first-commit note, doc pointers. No structure section, so the `entities/profile` / `app/layout` naming is not mentioned.

## Decisions the owner may want to revisit

1. **Dev server bound to 127.0.0.1:5173 with `--strictPort`** in `dev:app` (so Playwright's fixed URL always matches and a busy port fails instead of drifting to 5174). Consequence: not reachable from another machine (e.g. over Tailscale) without SSH forwarding; `pnpm dev:app --host 0.0.0.0` overrides it for `dev:app`, but not for `pnpm dev`.
2. **`e2e` uses `pnpm dev`, so it also starts the emulator UI** (`--ui`, port 4000; first run downloads the UI zip into `~/.cache/firebase/emulators`). Cost here ~1 s. If CI time matters, a separate `--ui`-less server command is a one-line change.
3. **`pnpm dev` running blocks `pnpm check`**: `test:rules` needs 8080. `e2e` would reuse a running `pnpm dev` locally (`reuseExistingServer: !CI`). README says to stop `pnpm dev` first.
4. **`check` order** is by measured time (typecheck 1.5 s, test 1.3 s, build 1.8 s, lint 5.9 s, test:rules 3.8 s, e2e 7.6 s, audit 0.8 s, signatures 0.4 s). Audits are cheap but network-bound, so they run last; move them first if you prefer.
5. **`lint` includes `format:check`**, so `lint` fails on unformatted files; `lint:fix` also runs `prettier --write`.
6. **Steiger cast** (`as Parameters<typeof defineConfig>[0]`): loses type checking of the plugin's config; the alternative would be adding `@steiger/toolkit` as a dev dependency (needs approval).
7. **`playwright.config.ts` `gracefulShutdown`** (above) — needed for correctness, not a preference.
8. The `firebase-firestore` patch leaves section 1.A as upstream (list remote databases, which needs a login); the `docs/skills.md` header already tells agents not to act on the remote project.

## Left red / skipped

- Nothing red. Not done on purpose: `catalog` script (Phase 2), WebKit project (owner: Chromium only).
- Lefthook's pre-commit cannot run on the root commit with partially staged files (`git stash create` needs HEAD); documented in README (stage whole files or `LEFTHOOK=0` for that commit). `pnpm exec lefthook run pre-commit --no-stage-fixed` on the final tree: eslint ✔ 4.9 s, prettier ✔, typecheck ✔.
- The emulator leaves `firestore-debug.log` (gitignored) after SIGINT shutdowns; I deleted the ones my runs created. Note: `firebase-debug.log` dumps the full environment, including session tokens; it is gitignored, but do not attach it anywhere.
- Open items from the wave reports that are not integration work and stay for the owner: `cn` comes from the npm package `cn@0.5.2`, not clsx + tailwind-merge (the existing test shows it merges `px-2`/`px-4`); FSD skill has no LICENSE file; mobile e2e is Chromium, not Safari; Hosting header precedence verified on the emulator only.

## Final check output (trimmed)

```
$ rm -rf node_modules dist && pnpm install --frozen-lockfile     # 0.8 s, lockfile unchanged
Done in 494ms using pnpm v12.17.0
$ pnpm typecheck && pnpm test && pnpm build && pnpm lint && pnpm test:rules && pnpm e2e && pnpm audit && pnpm audit signatures
$ tsc -b                                                          #  1.5 s
$ vitest run --project unit --project ui                          #  1.3 s
 Test Files  3 passed (3)
      Tests  34 passed (34)
$ tsc -b && vite build                                            #  1.8 s
✓ built in 159ms
$ eslint . && pnpm format:check && pnpm lint:fsd && pnpm lint:colors   #  5.9 s
All matched files use Prettier code style!
✔ No problems found!                                              # steiger
$ firebase emulators:exec --only firestore "vitest run --project rules"  #  3.8 s
✔  firestore: Firestore Emulator was started in standard edition.
 Test Files  1 passed (1)
      Tests  1 passed (1)
✔  Script exited successfully (code 0)
$ playwright test                                                 #  7.6 s
  ✓ [mobile]  › e2e/smoke.spec.ts › app shell renders in the dark theme without horizontal overflow
  ✓ [desktop] › e2e/smoke.spec.ts › app shell renders in the dark theme without horizontal overflow
  2 passed (6.9s)
$ pnpm audit                                                      #  0.8 s
6 vulnerabilities found
Severity: 2 low | 4 moderate
1 ignored: 1 high
$ pnpm audit signatures                                           #  0.4 s
1484 packages have verified registry signatures
( pnpm install --frozen-lockfile && pnpm check; )  41.26 s total, exit 0
```

Per-step times come from a separate run of each step on the same clean tree; the total is the single
chained run.

## Screenshots

`pnpm dev:app` on 127.0.0.1:5173, Chrome headless with `--password-store=basic`, server stopped after:

- `<scratchpad>/shots/phase1-m.png` (390×844)
- `<scratchpad>/shots/phase1-d.png` (1280×800)

Both show the dark shell: "PERSONAL WORKOUT" heading and the lime "Начать тренировку" button, no overflow.
