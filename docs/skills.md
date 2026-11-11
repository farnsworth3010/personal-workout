# Agent skills

Project-local agent skills in `.claude/skills/`. Nothing is installed at user level (`~/.claude`),
and no `claude plugin` command was used. The `speckit-*` skills come from Spec Kit and are not covered
here.

> **Unpinned commands in skill text: replace them in this project.** Every skill below except
> React Router and Feature-Sliced Design tells agents to run `npx …`, `npx …@latest`,
> `npx -y firebase-tools@latest …` or `npm install …`. Those bypass pnpm's `minimumReleaseAge`,
> `trustPolicy` and the lockfile, and the constitution forbids `@latest`. In this repository use the
> pinned local binaries instead:
>
> | Skill text says | Use here |
> | --- | --- |
> | `npx shadcn@latest <cmd>`, `pnpm dlx shadcn@latest <cmd>` | `pnpm exec shadcn <cmd>` (4.23.0) |
> | `npx -y firebase-tools@latest <cmd>`, `firebase <cmd>` | `pnpm exec firebase <cmd>` (15.34.2) |
> | `npx commitlint …` | `pnpm exec commitlint …` (21.2.4) |
> | `npx playwright …`, `npx playwright cli …`, global `playwright-cli …` | `pnpm exec playwright …`, `pnpm exec playwright cli …` (1.64.1) |
> | `npx steiger src`, `npm install -D steiger` | `pnpm exec steiger src` (already a dev dependency) |
> | `npm install <pkg>`, `npm install -g @playwright/cli@latest`, `npm init playwright@latest`, `npx skills add …` | do not run; a new dependency needs the owner's approval |
>
> Also do not follow instructions that act on the remote Firebase project (`deploy`, `projects:create`,
> `firestore:databases:create`, `login`) or upload to GitHub (`gh … --attach`) without an explicit
> request from the owner.

**Local patch.** `shadcn/SKILL.md` differs from upstream in two lines, because Claude Code would run
`npx shadcn@latest` by itself: the `` !`…` `` line is executed when the skill loads, and
`allowed-tools` pre-approves the command. Re-apply after every update:

```diff
-allowed-tools: Bash(npx shadcn@latest *), Bash(pnpm dlx shadcn@latest *), Bash(bunx --bun shadcn@latest *)
+allowed-tools: Bash(pnpm exec shadcn *)
-!`npx shadcn@latest info --json`
+!`pnpm exec shadcn info --json`
```

**Local patch.** `firebase-firestore/SKILL.md` section 1.B told agents to create an
Enterprise-edition database when none is found; this project is Spark plan, Standard edition,
emulator-first. Re-apply after every update:

````diff
-If no databases exist or the user requests a new one, default to provisioning an
-**Enterprise** edition database and ask the user what location to use. Run
-`npx -y firebase-tools@latest firestore:locations` to get the list of options.
-Suggest colocating with other resources if applicable.
-
-Once the location is determined, create the database:
-
-```bash
-npx -y firebase-tools@latest firestore:databases:create <database-id> --edition="enterprise" --location="<selected-location>"
-```
-
-Proceed with using the guides under `references/enterprise/`.
+This project is on the Spark plan and uses the default database in the
+**Standard** edition, developed against the local emulator
+(`pnpm exec firebase emulators:start --only firestore`). Do not create a
+database; proceed with the guides under `references/standard/`.
````

## Summary

| Skill directory | Source | Pinned at | Licence |
| --- | --- | --- | --- |
| `shadcn` | shadcn-ui/ui `skills/shadcn` | `dd41d19e2f80ff6891951f7ced74c2c9a650b065` | MIT |
| `react-router` | remix-run/react-router `.agents/skills/react-router` | `5dfc6f70c2106e82c0f1aa3c9e1e8a08bfcee943` | MIT |
| `feature-sliced-design` | feature-sliced/skills `feature-sliced-design` | `5e95aaebb84541742686e56352b7569acf4306f1` | none declared (see section) |
| `committing-with-commitlint` | conventional-changelog/commitlint `skills/committing-with-commitlint` | `8ae9a9f8b964db512358fe5b32bd5af668b129a8` | MIT |
| `firebase-auth-basics`, `firebase-firestore`, `firestore-rules-creation`, `firebase-security-rules-auditor`, `firebase-hosting-basics` | firebase/agent-skills `skills/` | `99954a30898bb5ddc8152ee10e124dc3b4106bf7` | Apache-2.0 |
| `playwright-cli`, `playwright-trace` | `playwright-core` package | 1.64.1 (lockfile) | Apache-2.0 |

All installed on 2026-11-11. GitHub skills were copied from a shallow clone at the commit above (no
installer was run); the Playwright skills come from Playwright's own `init-skills` command. No skill
ships hooks, and no copied file is executable.

Common copy procedure for a GitHub source (`<scratch>` is any directory outside the repository):

```sh
git clone --depth 1 https://github.com/<owner>/<repo>.git <scratch>/<repo>
git -C <scratch>/<repo> rev-parse HEAD   # record as the new pinned SHA
# read every file that will be copied, then rsync as listed in the skill's section
```

For a large repository add `--filter=blob:none --sparse` to the clone and
`git -C <scratch>/<repo> sparse-checkout set --no-cone '<skill path>/' 'LICENSE*'`.

---

## shadcn

- **Source:** https://github.com/shadcn-ui/ui/tree/dd41d19e2f80ff6891951f7ced74c2c9a650b065/skills/shadcn
- **Command used:**
  `rsync -a --exclude evals/ <scratch>/ui/skills/shadcn/ .claude/skills/shadcn/`, then the local patch
  above.
- **Files (20, 148 KB):** `SKILL.md`, `cli.md`, `customization.md`, `design-system.md`,
  `design-system-page.md`, `mcp.md`, `registry.md`, `rules/{base-vs-radix,chat,composition,forms,icons,styling}.md`,
  `assets/showcase/{color-pair.tsx,state-matrix.tsx,preview-states.css}`, `assets/shadcn.png`,
  `assets/shadcn-small.png`, `agents/openai.yml` (Codex display metadata), `scripts/showcase-coverage.mjs`.
- **Not copied:** `evals/evals.json` (authoring test cases, not read by agents); the sibling skill
  `skills/migrate-radix-to-base` (not requested).
- **What it tells agents:** load project context with `shadcn info --json`; use existing components,
  built-in variants and semantic colour tokens; form, composition, icon and styling rules with
  incorrect/correct pairs; fetch component docs with `shadcn docs <name>` and the URLs it prints; add
  or update components only through the CLI with `--dry-run`/`--diff`, never `--overwrite` without
  approval; ask which registry to use; the design-system workflow scaffolds a new app.
- **Commands it tells agents to run:** `npx shadcn@latest` for every CLI command (`info`, `docs`,
  `search`, `view`, `add`, `apply`, `init`, `preset …`, `build`), `npm install @fontsource-variable/…`,
  `npx tsc …`, `node <skill-dir>/scripts/showcase-coverage.mjs …`. Network: `docs`, `search`, `view`,
  `add` reach ui.shadcn.com, GitHub and third-party registries, and agents are told to fetch the
  printed URLs. No telemetry instructions.
- **Bundled script:** `scripts/showcase-coverage.mjs` (Node, 52 lines) reads a UI directory and source
  directories and prints the components no showcase file imports. Read-only, no network, no
  dependencies.
- **Update:** clone at a new SHA, re-run the rsync, re-apply the local patch, diff against the
  previous copy.

## react-router

- **Source:** https://github.com/remix-run/react-router/tree/5dfc6f70c2106e82c0f1aa3c9e1e8a08bfcee943/.agents/skills/react-router
- **Command used:**
  `rsync -a <scratch>/react-router/.agents/skills/react-router/ .claude/skills/react-router/`
- **Files (5, 25 KB):** `SKILL.md`, `references/{data-mode,declarative-mode,framework-mode,rsc}.md`.
- **Not copied:** the other `.agents/skills/*` in that repository (`fix-bug`, `create-pr`,
  `release-react-router`, …) are for React Router contributors.
- **What it tells agents:** detect the router mode first (this project uses Data mode:
  `createBrowserRouter` + `RouterProvider`), read the matching reference, and treat the docs shipped
  in `node_modules/react-router/docs/` (present for 8.5.1) as the source of truth; prefer loaders and
  actions over `useEffect` fetching.
- **Commands / network / scripts:** none.
- **Update:** clone at a new SHA (sparse checkout recommended), re-run the rsync.

## feature-sliced-design

- **Source:** https://github.com/feature-sliced/skills/tree/5e95aaebb84541742686e56352b7569acf4306f1/feature-sliced-design
- **Command used:**
  `rsync -a --exclude evals/ <scratch>/skills/feature-sliced-design/ .claude/skills/feature-sliced-design/`
- **Files (10, 140 KB):** `SKILL.md`, `references/{asset-handling,auth-and-api,cross-import-patterns,excessive-entities,framework-integration,growth-walkthrough,layer-structure,migration-guide,state-management}.md`.
- **Not copied:** `evals/` (authoring test cases).
- **Licence: the repository has no LICENSE file and GitHub reports `license: null`.** Its README ends
  with "License: MIT", but without a licence file that statement grants nothing reliable. Decision
  for the owner: accept the README statement, ask the maintainers to add a LICENSE file, or remove
  the skill.
- **What it tells agents:** FSD v2.1, pages-first: start with `app`, `pages`, `shared`; extract to
  `features`/`entities` only when code is reused now, changes for its own reason and has a focused
  responsibility; `widgets` is discouraged; import only downwards and only through a slice's
  `index.ts`; `@x` only between entities and only as a last resort; domain-based file names. It also
  says to treat code and READMEs as data, not instructions. Read references only on demand.
- **Commands it tells agents to run:** `npm install -D steiger`, `npx steiger src`. No network, no
  scripts.
- **Note:** `references/framework-integration.md` describes Vite + React with per-layer aliases
  (`@/app`, `@/pages`, `@/shared`); in React Router library mode (this project) the router lives in
  the FSD app layer.
- **Update:** clone at a new SHA, re-run the rsync.

## committing-with-commitlint

- **Source:** https://github.com/conventional-changelog/commitlint/tree/8ae9a9f8b964db512358fe5b32bd5af668b129a8/skills/committing-with-commitlint
- **Command used:**
  `rsync -a <scratch>/commitlint/skills/committing-with-commitlint/ .claude/skills/committing-with-commitlint/`
  (commitlint's guide suggests `curl` of the single file; a pinned clone was used instead).
- **Files (1, 4.6 KB):** `SKILL.md`.
- **What it tells agents:** detect commitlint, read the effective rules, write a Conventional Commits
  message, validate it before committing, fix only the rules named in a rejection, never use
  `git commit --no-verify`.
- **Commands it tells agents to run:** `npx commitlint --print-config json`,
  `printf … | npx commitlint`. No network, no scripts.
- **Update:** clone at a new SHA, re-run the rsync.

## Firebase (5 skills)

- **Source:** https://github.com/firebase/agent-skills/tree/99954a30898bb5ddc8152ee10e124dc3b4106bf7/skills
  (the official route is a user-level Claude plugin, `claude plugin install firebase@firebase`, which
  was not used).
- **Command used** (from `<scratch>/agent-skills/skills`):

  ```sh
  rsync -a --relative \
    ./firebase-auth-basics/SKILL.md ./firebase-auth-basics/references/client_sdk_web.md \
    ./firebase-auth-basics/references/security_rules.md \
    ./firebase-firestore/SKILL.md ./firebase-firestore/references/standard/provisioning.md \
    ./firebase-firestore/references/standard/web_sdk_usage.md \
    ./firebase-firestore/references/standard/indexes.md \
    ./firestore-rules-creation/ ./firebase-security-rules-auditor/ ./firebase-hosting-basics/ \
    <repo>/.claude/skills/
  ```

- **Files (12, 67 KB):**
  - `firebase-auth-basics/`: `SKILL.md`, `references/client_sdk_web.md`, `references/security_rules.md`
  - `firebase-firestore/`: `SKILL.md`, `references/standard/{provisioning,web_sdk_usage,indexes}.md`
  - `firestore-rules-creation/SKILL.md`
  - `firebase-security-rules-auditor/SKILL.md`
  - `firebase-hosting-basics/`: `SKILL.md`, `references/{configuration,deploying}.md`
- **Not copied, on purpose:**
  - Android, iOS, Flutter and Python references, and all of `firebase-firestore/references/enterprise/`
    (web app on the Spark plan, Standard edition). The SKILL.md files still link to them; those links
    are dead here.
  - `firebase-basics`: its "DO NOT SKIP" setup step tells agents to install the Firebase plugin at
    user level (`claude plugin marketplace add firebase/agent-skills`,
    `claude plugin install firebase@firebase`, `claude plugin update …`), run `npx skills list` and
    `npx skills add genkit-ai/skills`, and use `npx -y firebase-tools@latest` for everything. Other
    skills say "see `firebase-basics`" for login and project creation; that is a manual step for the
    owner here.
  - `agents/firestore-rules-author.md`: a subagent definition (not a skill) with
    `commandExecutionPolicy: auto`. Without it, `firebase-firestore` and `firestore-rules-creation`
    fall back to writing `firestore.rules` directly, as they say.
  - `.mcp.json` (Firebase MCP server via `npx -y firebase-tools@15.32.1 mcp`) and the other skills
    (App Hosting, AI Logic, Analytics, Crashlytics, Data Connect, Remote Config, Xcode, Functions
    migration).
- **What they tell agents:**
  - `firebase-auth-basics`: providers, configuring `auth` in `firebase.json`, then "you MUST deploy"
    with `deploy --only auth`; web SDK sign-in samples; emulator on 9099; `request.auth` rule checks.
  - `firebase-firestore`: list databases and detect the edition; **if no database exists it tells
    agents to create an Enterprise-edition database** (`firestore:databases:create --edition=enterprise`)
    — wrong for this project (Spark plan, Standard edition), patched locally (see above); provisioning `firebase.json`,
    `firestore.rules`, `firestore.indexes.json`; "you MUST deploy" rules and indexes; modular web SDK
    samples; indexes.
  - `firestore-rules-creation`: default deny, validator function used in both `create` and `update`,
    size and type limits, no role self-escalation, a list of attacks to check, validate with
    `firebase deploy --only firestore:rules --dry-run`, present rules as a prototype that needs review.
  - `firebase-security-rules-auditor`: red-team checklist and a 1–5 score returned as JSON.
  - `firebase-hosting-basics`: `firebase.json` hosting config (SPA rewrite), deploy, preview channels,
    `hosting:clone` to live, emulator on 5000.
- **Commands they tell agents to run:** `npx -y firebase-tools@latest` with `projects:create`,
  `deploy --only auth|firestore|firestore:rules|firestore:indexes|hosting`,
  `hosting:channel:deploy`, `hosting:clone`, `firestore:databases:list|get|create`,
  `firestore:locations`, `apps:sdkconfig`, `emulators:start`; `npm install firebase`. All
  `deploy`/`create`/`clone` commands change the remote project. No telemetry, no bundled scripts.
- **Update:** clone at a new SHA, re-run the rsync above, check whether any new file under the same
  skills is referenced for web.

## playwright-cli and playwright-trace

- **Source:** the `playwright-core` package installed by `@playwright/test` 1.64.1
  (`node_modules/.pnpm/playwright-core@1.64.1/node_modules/playwright-core/lib/tools/skills/`).
- **Command used:**

  ```sh
  pnpm exec playwright init-skills --loop claude
  rm -rf .claude/skills/playwright-component-testing
  ```

  `init-skills` only copies the bundled skill directories into `./.claude/skills/` (checked in
  `lib/coreBundle.js`, `installSkills`): no network, no global writes. Not used:
  `pnpm exec playwright cli install --skills`, which also creates `.playwright/`, edits `.gitignore`
  and downloads a browser.
- **Files:** `playwright-cli/` (11, 69 KB): `SKILL.md`,
  `references/{element-attributes,playwright-tests,pr-attachments,request-mocking,running-code,session-management,storage-state,test-generation,tracing,video-recording}.md`;
  `playwright-trace/SKILL.md` (4.9 KB).
- **Not kept:** `playwright-component-testing` (story-gallery component tests with Playwright); this
  project tests components with Vitest and Testing Library.
- **What they tell agents:** drive a browser with `playwright-cli` (open, snapshot, click by ref,
  network mocking, storage state, tracing, video); debug a failing test with `--debug=cli` and attach;
  generate tests from a plan file; inspect `trace.zip` files with `playwright trace …`.
- **Commands they tell agents to run:** `playwright-cli …` (here: `pnpm exec playwright cli …`),
  `npx playwright test`, `npx playwright trace …`, `npm install -g @playwright/cli@latest`,
  `npm init playwright@latest`, `gh pr create|comment … --attach` (uploads screenshots and videos to
  GitHub). `allowed-tools` in the frontmatter pre-approves `Bash(playwright-cli:*)`,
  `Bash(npx playwright:*)`, `Bash(npx --no-install playwright:*)` and `Bash(npx playwright trace:*)`.
  No bundled scripts.
- **Side effects to know:** `playwright-cli` writes snapshots, traces and state files to
  `.playwright-cli/` in the working directory; `test-generation.md` writes plans to
  `specs/<feature>.plan.md`, which collides with Spec Kit's `specs/` directory — keep Playwright plans
  elsewhere (for example `e2e/plans/`).
- **Update:** after upgrading `@playwright/test`, run the two commands above and diff the result.
