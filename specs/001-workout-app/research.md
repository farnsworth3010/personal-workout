# Research: Personal Workout App (v1)

Sources with URLs: `docs/research/tooling-2026-11-11.md`, `docs/research/pnpm12-2026-11-11.md`,
`docs/research/plan-2026-11-11.md`. R1, R3 and the data model were decided by the owner on 2026-11-11; R7 is deferred.

## R1. Exercise photos delivery

- **Decision (owner, 2026-11-11)**: download the dataset at build time from free-exercise-db
  pinned to commit `79ca7b47d77cd5a6dd7a50440e9f0bf24da6a142` (876 exercises, 1,746 JPEG,
  98.7 MB) into `public/catalog/`, which is not committed.
- **Integrity**: `git fetch --depth 1 <sha>` into a cache directory (git verifies objects by
  hash), then every file is checked against a committed SHA-256 manifest
  (`scripts/catalog-manifest.sha256`). GitHub tarballs are not byte-stable, so the manifest covers
  the extracted files, not an archive. A mismatch or a missing file fails the build.
- **Rationale**: the repository stays small; upgrading the dataset is one SHA and a regenerated
  manifest, reviewed in a diff.
- **Costs**: the first build and every CI build need GitHub to be reachable; CI caches the
  download keyed on the SHA.
- **Alternatives**: committing the snapshot (simplest build, +100 MB in history forever);
  hotlinking raw.githubusercontent.com (rejected: contradicts "static hosting assets", unpublished
  rate limits, GitHub may throttle).
- **Consequence**: photos are never precached (all of them would cost 27% of the daily Hosting
  transfer); they are cached as viewed, about 2.3 MB per new workout.

## R2. Firestore offline and TanStack Query

- **Decision**: `initializeFirestore` with `persistentLocalCache` and the multi-tab manager.
  TanStack Query defaults: `networkMode: 'always'`, `staleTime: Infinity`, `retry: false`, no
  refetch on focus. Subscribed data (profile, templates, active workout) is pushed into the query
  cache from one `onSnapshot` per key; one-off reads (history ranges) use `getDocs`.
- **Rule**: a Firestore write is never awaited in the UI. Its promise resolves only after the
  server acknowledges, so awaiting would block the session offline. Writes are fired, errors are
  reported through a non-blocking notice, and the UI reads the latency-compensated cache.
- **Alternatives**: Firestore listeners without TanStack Query (rejected by the owner's stack
  decision); TanStack persistence plugins (unneeded: Firestore already persists).
- **Unconfirmed**: there is no official TanStack + Firestore recipe; this is our design.

## R3. Google sign-in

- **Decision (owner, 2026-11-11)**: `signInWithRedirect` with `authDomain` set to the app's own Hosting
  domain, so the flow stays first-party; `signInWithPopup` as the fallback if the device test fails.
- **Rationale**: third-party storage blocking breaks redirects unless `authDomain` is the serving
  domain; Firebase Hosting serves `/__/auth/handler` on our origin. Popups are "less smooth on
  mobile" and open outside an installed iOS app.
- **Must verify on devices** (no official statement for iOS standalone mode): installed PWA on an
  iPhone and on Android, in the first implementation phase, before anything depends on it.
- **Tests**: Playwright signs in against the Auth emulator with `signInWithCredential` and a fake
  Google token through a test-only hook.
- **Safari finding (2026-11-11)**: on `pnpm dev:remote` Safari came back from the emulator's handler to /login signed out, and the
  new test account was gone. Evidence (SDK and emulator source): the handler keeps the result in its own origin's storage, the app
  reads it through a handler-origin iframe, and the account is created only once the app gets the result. Hypothesis: WebKit
  partitions that iframe's storage by the top origin, port included. Chrome partitions by site, so it worked there.
- **Rule**: `signInWithGoogle` redirects only when the handler origin (emulator or `https://<authDomain>`) equals `location.origin`,
  otherwise it opens a popup; `VITE_AUTH_FLOW` overrides. Production must be opened on the authDomain host (`*.firebaseapp.com`), or set authDomain to the serving host.
- **iOS popup finding (2026-11-11)**: on `pnpm dev:remote` iPhone Safari opened the cross-origin popup as a tab and the original tab
  stayed on /login until tapped again. `dev:remote` now proxies the Auth emulator on the app's origin, so it redirects like production.

## R4. Keeping the screen on (FR-043)

- **Decision**: Screen Wake Lock API, requested when a session starts and re-requested on
  `visibilitychange`; failure is silent and never blocks the session.
- **Support**: Chrome/Edge 84+, Firefox 126+, Safari 16.4+; installed iOS apps only from iOS 18.4.
  On older iOS the screen will dim; timers stay correct because they are computed from timestamps.

## R5. Sounds

- **Decision**: generated tones through Web Audio (no audio files), context created lazily and
  resumed in the "start workout" tap; if the context is not running the sound is skipped.
- **Limit**: no sound while the app is in the background or the phone is locked (iOS interrupts the
  audio context). This is why R4 matters. The default audio session is kept so the user's music
  keeps playing.

## R6. PWA

- **Decision**: vite-plugin-pwa 2, `generateSW`, `registerType: 'prompt'`. Precache the app shell
  and `catalog/exercises.json` (1.0 MB, 169 KB gzip). Runtime `CacheFirst` for
  `/catalog/images/**` with a cap of 600 entries (about 34 MB). `navigateFallbackDenylist: [/^\/__\//]`
  keeps Firebase's reserved paths out of the app shell.
- **Rule**: the update prompt is shown only outside a running session.

## R7. Deploy from GitHub Actions

- **Decision (owner, 2026-11-11)**: deploy from GitHub Actions on every push to `main`, authenticated
  by a Firebase service account whose key is a repository secret; the owner creates the account and the
  secret. The workflow runs the pinned `firebase-tools` with `firebase deploy --only hosting,firestore`.
- **Upgrade path (earlier proposal)**: `firebase-tools` from the project's dev dependencies, authenticated by
  `google-github-actions/auth` with Workload Identity Federation through a deploy service account
  (no long-lived key); `firebase deploy --only hosting,firestore`.
- **Rationale**: keyless; deploys Hosting and rules together; uses the pinned `firebase-tools`
  instead of `latest`. All actions are pinned by SHA (list in `docs/research/plan-2026-11-11.md`).
- **Alternatives**: `FirebaseExtended/action-hosting-deploy` (Hosting only, needs a service-account
  JSON key in secrets, pulls `firebase-tools@latest`); a JSON key with `firebase-tools` (long-lived secret).
- **Owner's part**: create the Firebase project, a WIF pool and provider restricted to this
  repository, and the deploy service account. The exact minimal IAM roles are to be confirmed then.

## R8. Security rules

- **Decision**: one `match` per document kind under `/users/{uid}` with `isOwner(uid)` and a
  `valid*` function each; no catch-all write rule (with rules v2 any matching allow wins, so a
  catch-all would bypass validation). Rules validate key allow-lists, scalar types and list sizes.
- **Tests**: `@firebase/rules-unit-testing` under Vitest (node environment) run by
  `firebase emulators:exec --only firestore`.

## R9. Runtime and package manager

- **Decision**: Node 24.22.2 ("Krypton", LTS) and pnpm 12.17.0 pinned through
  `devEngines.runtime` and `devEngines.packageManager` with `onFail: download`, plus `.nvmrc`.
  Node 26 was dropped on 2026-11-11: superstatic 10 (inside firebase-tools) admits only Node 20, 22
  and 24, and `engineStrict` stays on. TypeScript is 6.0.3 until typescript-eslint supports 7.
  Owner-approved exceptions (exact versions, commented in `pnpm-workspace.yaml`): trust policy for
  `chokidar@4.0.3` and `@trickfilm400/rollup-plugin-off-main-thread@3.0.0-pre1`; install scripts
  allowed for `lefthook` and `re2`, denied for `@firebase/util` and `protobufjs`.
- **pnpm settings** (`pnpm-workspace.yaml`): `minimumReleaseAge: 10080`, `minimumReleaseAgeStrict: true`,
  `minimumReleaseAgeIgnoreMissingTime: false`, `trustPolicy: no-downgrade`, `trustLockfile: false`,
  `blockExoticSubdeps: true`, `strictDepBuilds: true`, `allowBuilds` (only `lefthook`, reviewed),
  `saveExact: true`, `engineStrict: true`, `audit.level: high`. `.npmrc` holds only the registry.
  pnpm 12 fails on an unknown key, so a typo cannot silently disable a protection.
- **CI**: `pnpm/setup` (SHA-pinned) with `require-lockfile: true`, then `pnpm audit signatures`
  and `pnpm audit`.

## R10. Feature-Sliced Design v2.1

- **Decision**: "pages first". Logic and UI live in the page slice until a second page needs them;
  only then they move to `entities`, `features` or `widgets`. Steiger's recommended config
  enforces this (`insignificant-slice` flags a slice used by one page).
- **Placement**: Firebase init, `db`, `auth`, converters in `shared/api`; router, providers and the
  auth gate in `app`; reused Firestore queries in `entities/<e>/api`; page-only queries in
  `pages/<p>/api`.
- **Widgets**: kept only for blocks reused across pages (app navigation, exercise details).
- **Phasing**: `insignificant-slice` is a warning until Phase 11 (owner, 2026-11-11); naming and
  cross-import constraints found by the Steiger dry run are listed in plan.md.

## R11. Exercise kind and pull-up bar

- **Decision**: the build script derives `kind` from the dataset: `category: stretching` → timed;
  `category: cardio` → cardio; `equipment: body only` → bodyweight; everything else → strength.
  A small override file corrects exceptions (plank and holds → timed) and assigns `pull-up bar`
  to hanging exercises, which the dataset labels `body only`.
- **Rationale**: the dataset has no duration flag and no pull-up bar equipment value.

## Open items carried into implementation

1. Device test of sign-in in installed iOS and Android apps (R3).
2. Minimal IAM roles for the deploy service account (R7).
3. The deploy method (R7), to be decided by the owner before phase 8.
4. vite-plugin-pwa 2.0 documents only the Node ≥ 20.19 bump as breaking; verify at install.
