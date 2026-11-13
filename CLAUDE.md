# Personal Workout

Workout app for home and gym: React, Feature-Sliced Design, shadcn/ui, Tailwind CSS, Firebase (Spark plan: Hosting, Auth, Firestore). Russian UI (exercise catalog data stays in English for now), one dark theme built on design tokens, installable PWA with offline sessions.

## Read first

- `docs/requirements.md` — agreed requirements and the backlog.
- `.specify/memory/constitution.md` — binding principles; this file must not contradict it.
- `../personal-workout-design/` — HTML prototypes approved by the owner.

## How to work here

- The owner is a developer and leads the development: write specs, plans and reports for a technical reader, with the technical detail they need to decide.
- Stages are approved by the owner one by one: requirements → design → spec → plan → tasks → implementation. Do not start the next stage on your own.
- The owner makes key technical decisions. Offer options with AskUserQuestion; do not pick a library, build tool, data model or testing approach yourself.
- pnpm only, with the supply-chain settings from the constitution (pinned version, frozen lockfile, blocked install scripts, minimum release age, exact versions).
- Do not install a dependency without approval. For each technology, look for its official CLI and agent skills and propose them.
- Use the Spec Kit skills (`/speckit-specify`, `/speckit-plan`, `/speckit-tasks`, `/speckit-implement`). Implementation tasks go to Opus agents.
- Do not build backlog items (template sharing, family).
- Agent skills are listed in docs/skills.md; replace any npx/@latest command in a skill with the pinned pnpm exec form given there.

## Environment notes

- Headless Chrome must be started with `--password-store=basic` (`google-chrome --headless=new --password-store=basic --hide-scrollbars --window-size=390,844 --virtual-time-budget=4000 --screenshot=<file> <url>`). Without it every http page hangs: Chrome waits on the locked GNOME keyring. Playwright adds the flag itself. Headless Chrome cannot make a window narrower than 500px, so `--window-size=390,…` renders a 500px viewport and crops it: for phone-size screenshots use `pnpm exec playwright screenshot --viewport-size=390,844 <url> <file>`.
- Node comes from nvm and is not on the default PATH of helper terminals: use `~/.nvm/versions/node/v26.4.0/bin`. That directory provides pnpm; inside the project pnpm switches itself to the pinned 12.17.0 and runs scripts with the pinned Node 24.

## Code rules

- FSD layers: `app`, `pages`, `widgets`, `features`, `entities`, `shared`. Import only downwards and only through a slice's public API.
- Segments by role: `ui` components only, `model` hooks, state, derived data and shared types (`model/types.ts`), `lib` pure helpers and formatters, `config` static data (labels, option lists, limits). A `.tsx` file holds one component and its own Props type: no module-level constants, helpers or shared types. Every component has its own folder: `ui/<name>/<name>.tsx`, its test beside it and an `index.ts` that exports the component. A sub-component, even one used by a single parent, gets its own sibling folder under `ui/` (`ui/today-sets/`, `ui/set-body/`); folders of one slice import each other only through their `index.ts`. shadcn compound primitives (Sheet, Chart, StatRow) keep their parts in one file, and a `cva` variants object stays next to its component. The local ESLint rules `local/one-component` and `local/no-module-code` check this.
- Typography: section headings and page titles use the `Heading` / `Title` components from `shared/ui`; the focus outline is the `focus-ring` utility from `app/styles`. No class-string constants in `.ts` or `.tsx`.
- Module constants: `UPPER_SNAKE` for tunable primitives (limits, durations, page sizes: `PAGE_SIZE`, `MAX_SETS`), `camelCase` for lookup tables and lists (`placeLabels`, `weightSteps`).
- No hard-coded colours: use the theme tokens.
- No Cloud Functions or Cloud Storage. Per-user data isolation is enforced in Firestore security rules.
- A workout session must never be blocked by a form, a network call or navigation.
- Interface text is Russian; everything in the repository is English.
- ESLint, formatting and the commit linter must pass before handing work over.
