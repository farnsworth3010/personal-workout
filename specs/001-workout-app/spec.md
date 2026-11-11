# Feature Specification: Personal Workout App (v1)

**Feature Branch**: `001-workout-app`

**Created**: 2026-11-11

**Status**: Approved by the owner on 2026-11-11

**Input**: User description: "An app for personal workouts at home and in the gym, on phone and desktop. Each user's data and settings are stored per user. Choose a workout from ready-made sets of exercises or create your own. During a workout: a full-screen card of the current exercise with a visualization, timers, skip, go back, quick add of another exercise; after each set quick buttons for reps and weight; at the end a survey of wellbeing, energy and body weight. Detailed statistics with charts." Agreed requirements: `docs/requirements.md`. Approved screens: `../personal-workout-design/` (`index.html` lists them).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Run a workout without being interrupted (Priority: P1)

A signed-in person starts a workout from a set of exercises. The screen shows one exercise at a time as a full-screen card with its photos, the current set, the plan for this set and running timers. After each set a rest countdown starts, and on the same screen the person confirms or corrects the reps and weight of the set just done with quick taps. They can skip an exercise, go back, add another exercise on the fly and open the exercise description. After the last exercise they see a summary and a short survey.

**Why this priority**: this is the reason the app exists; every other story feeds it or reads its results.

**Independent Test**: with one ready-made set available, start it, complete all sets of two exercises, skip one, add one, finish, and check that the saved workout contains every set with its reps and weight, the skipped exercise, the duration and the survey answers.

**Acceptance Scenarios**:

1. **Given** a set with planned sets, reps and rest, **When** the person starts it, **Then** the first exercise is shown full screen with its photos, name, muscles, equipment, "set N of M", the plan for this set, the total workout time and the time on this exercise.
2. **Given** an exercise in progress, **When** the person marks the set as done, **Then** a rest countdown of the planned length starts and the same screen shows value strips for reps and weight already set to the predicted values for that set.
3. **Given** the rest screen, **When** the person changes nothing and continues, **Then** the predicted values are saved as the result of that set.
4. **Given** the rest screen, **When** the person scrolls a value strip and taps another value, **Then** that value is saved for the set; scrolling alone changes nothing.
5. **Given** the needed value is not on the strip's grid, **When** the person taps the selected value and types a number, **Then** that exact number is saved and shown in the strip.
6. **Given** the previous workout of this exercise had different weights in different sets, **When** the same exercise is done again, **Then** each set is prefilled from the same set number of the history, and the screen shows what was done last time in that set.
7. **Given** the person picked a weight different from the prediction, **When** the next sets of this exercise come up, **Then** their predicted weights are shifted by the same difference.
8. **Given** a phone, **When** the person taps "back", "skip" or "finish" briefly, **Then** nothing happens except a hint to hold; **When** they hold it for one second, **Then** the action fires. With a mouse or keyboard a single click fires it.
9. **Given** an exercise in progress, **When** the person skips it, **Then** it moves to a "postponed" list shown on the session screen with its count, its logged sets are kept, and the next exercise starts; **When** the person opens the list and picks it, **Then** it resumes from the first set not yet done.
10. **Given** a workout in progress, **When** the person adds an exercise from the catalog, **Then** they choose whether to do it now, next, or instead of the current one, and the workout continues accordingly.
11. **Given** a timed exercise, **When** it starts, **Then** a countdown of the planned duration runs and a signal marks its end.
12. **Given** the exercise card, **When** the person opens the description, **Then** technique steps, muscles and equipment are shown and all timers keep running.
13. **Given** the last exercise is finished or the person finishes early, **When** the summary opens, **Then** it shows duration, exercises done and skipped, total volume and new records, and asks for wellbeing (1–5), energy (1–5) and body weight (previous value with ±0.1 and ±0.5 kg buttons); each item can be skipped.
14. **Given** a workout in progress, **When** the app is closed, reloaded or loses the connection, **Then** on return the workout continues from the same set with the timers showing the real elapsed time and nothing logged is lost.
15. **Given** a workout in progress on a phone, **When** the person does not touch the screen during a set or a rest, **Then** the screen does not dim or lock.
16. **Given** postponed exercises remain, **When** the last exercise in the queue is finished, **Then** the app lists them and offers to do them now or to finish without them; those not done are saved as skipped.

---

### User Story 2 - Sign in and keep my data to myself (Priority: P1)

A person signs in with their Google account. Everything they create or log belongs to them only and follows them to any device where they sign in.

**Why this priority**: without an identity nothing can be stored per user; it is a precondition for a usable first release.

**Independent Test**: sign in on a phone, change a setting, sign in on a desktop and see the same setting; confirm that a second account sees none of the first account's data.

**Acceptance Scenarios**:

1. **Given** a signed-out visitor, **When** they open the app, **Then** they see only the sign-in screen.
2. **Given** a first sign-in, **When** it succeeds, **Then** the person lands on the "today" screen with ready-made sets available and default settings.
3. **Given** two accounts, **When** one tries to read or change the other's workouts, sets, schedule or settings by any means, **Then** access is denied.
4. **Given** a signed-in person, **When** they sign out, **Then** their data is no longer shown on that device.

---

### User Story 3 - Find exercises that fit where I train (Priority: P2)

A person browses the exercise catalog, searches by name and filters by muscle group and equipment. In their profile they mark the equipment they have at home; the "home only" switch then hides everything they cannot do at home, and exercises that need other equipment carry a "gym" mark everywhere.

**Why this priority**: the catalog is the material for sets, and the home/gym distinction is an explicit requirement.

**Independent Test**: mark dumbbells and a pull-up bar as home equipment, turn on "home only" and check that no listed exercise needs anything else and that gym-only exercises show the mark when the switch is off.

**Acceptance Scenarios**:

1. **Given** the catalog, **When** the person types part of a name, **Then** the list narrows to matching exercises; an empty result offers to reset search and filters.
2. **Given** an equipment profile, **When** "home only" is on, **Then** only exercises doable with that equipment or with body weight are listed.
3. **Given** any list or card showing an exercise that needs equipment outside the profile, **Then** it carries the "gym" mark.
4. **Given** an exercise in the catalog, **When** the person opens it, **Then** they see two photos, muscles, equipment and technique steps, and can add it to one of their sets.
5. **Given** the person changes the equipment profile, **Then** marks and the "home only" filter reflect it immediately.

---

### User Story 4 - Use ready-made sets and build my own (Priority: P2)

A person picks a ready-made set for home or gym, or builds their own: an ordered list of exercises, each with planned sets, reps or duration, and rest between sets. They can copy a ready-made set and change it.

**Why this priority**: a workout needs a set to start from; ready-made sets make the first session possible in a minute.

**Independent Test**: copy a ready-made set, reorder two exercises, change the planned sets of one, add an exercise from the catalog, save, and start a workout from it.

**Acceptance Scenarios**:

1. **Given** the sets screen, **Then** it lists the person's own sets and ready-made sets for: home without equipment, home with dumbbells and a pull-up bar, gym full body, gym split, stretching, cardio; each shows place (home or gym), exercise count, estimated duration and muscle groups.
2. **Given** a ready-made set, **When** the person copies it, **Then** an editable copy appears among their own sets and the original stays unchanged.
3. **Given** the editor, **When** the person adds, removes or reorders exercises and edits planned sets, reps or duration and rest, **Then** the saved set reflects it; strength and bodyweight exercises use reps, timed and cardio exercises use time.
4. **Given** a set containing exercises that need equipment outside the profile, **Then** the editor shows how many such exercises it contains.
5. **Given** a set without a name or without exercises, **When** the person saves, **Then** saving is refused with a clear message.
6. **Given** the place filter "home", **Then** only sets doable at home are listed.

---

### User Story 5 - See today's workouts from my weekly schedule (Priority: P3)

A person assigns one or several sets to each weekday, in order (for example a warm-up, back exercises for prevention, stretching). The "today" screen lists the sets planned for today, each with its own start button and its own "done" mark, so they can be done at different times of the day. It also shows the week with done days marked and the last workout. A home/gym switch swaps a set for its counterpart; any other set can be started instead.

**Why this priority**: it removes the daily decision of what to train, but workouts can be run without it.

**Independent Test**: assign two sets to today's weekday, open "today", start and finish the first, see it marked done and the second still waiting; clear the day and see the rest-day state.

**Acceptance Scenarios**:

1. **Given** sets assigned to today's weekday, **When** the person opens the app, **Then** they are listed in their order, each with its exercise count, estimated duration and a start action; the first not yet done is shown expanded with its exercise list.
2. **Given** no set assigned today, **Then** the screen shows a rest day, the next planned workout and an action to start any set.
3. **Given** the week view, **When** the person taps a day, **Then** they can add sets to that weekday, remove them and change their order; at most 5 sets per day.
4. **Given** one of today's sets was finished today, **Then** that set is marked done on the "today" screen and the others are not; the day is marked done in the week view when every planned set is done, and partly done otherwise.
5. **Given** several sets planned today, **When** the person finishes one, **Then** it is saved as its own workout with its own summary and survey, and the "today" screen offers the next one.

---

### User Story 6 - Understand my progress (Priority: P3)

A person opens statistics and sees: a human figure, front and back, with muscles coloured by this week's load so that untrained muscles stand out; a calendar of workouts with counts and total time; progress of a chosen exercise over time with personal records; and charts of body weight, wellbeing and energy.

**Why this priority**: statistics are the payoff of logging, but they need logged workouts first.

**Independent Test**: after logging workouts across several weeks, check each chart against the logged data and confirm that a muscle group not trained this week is shown as untrained and listed by name.

**Acceptance Scenarios**:

1. **Given** workouts this week, **When** statistics open, **Then** each muscle group on the front and back figures is coloured by the number of sets that loaded it this week (Monday to today), untrained groups look clearly different, and they are also listed by name.
2. **Given** the figure, **When** the person taps a muscle, **Then** its name and this week's sets are shown.
3. **Given** logged workouts, **Then** a month calendar marks workout days and shows workouts this week, this month and total time.
4. **Given** an exercise with history, **When** the person selects it and a metric (weight, volume, reps), **Then** a chart over time and the records (max weight, max volume, best set) are shown.
5. **Given** survey answers over time, **Then** body weight, wellbeing and energy are charted.
6. **Given** no data yet, **Then** each section explains what will appear and nothing looks broken.

---

### User Story 7 - Use it like an app, even without a connection (Priority: P2)

A person installs the app to the phone's home screen and uses it full screen. In a gym with no signal they can open it, run and finish a workout; the data reaches their account when the connection returns.

**Why this priority**: gyms often have poor signal, and a lost workout destroys trust in the app.

**Independent Test**: install the app, go offline, run and finish a workout, go online and see it on another device.

**Acceptance Scenarios**:

1. **Given** a phone browser, **When** the person installs the app, **Then** it opens from the home screen without browser chrome.
2. **Given** the app was opened online before, **When** it is opened offline, **Then** it starts and shows the person's sets, schedule and history seen earlier.
3. **Given** no connection, **When** a workout is run and finished, **Then** it is saved locally, shown in history at once and synced later without the person doing anything.
4. **Given** exercise photos viewed earlier, **Then** they are shown offline; photos never seen show a neutral placeholder.

---

### User Story 8 - Hear and feel the workout (Priority: P4)

Sound signals mark the end of rest, the end of a countdown, a completed set and a completed workout. Transitions and feedback are animated. The profile has switches for sounds and animations, a default rest length and a default weight step.

**Why this priority**: it makes the session usable without looking at the screen, but the app works without it.

**Independent Test**: with sounds on, let a rest countdown end and hear the signal; turn sounds off and confirm silence.

**Acceptance Scenarios**:

1. **Given** sounds are on, **When** rest ends, a countdown ends, a set or the workout completes, **Then** a distinct signal plays.
2. **Given** sounds are off, **Then** no signal plays.
3. **Given** animations are off or the device asks for reduced motion, **Then** transitions are instant.
4. **Given** the profile, **When** the person changes the default rest or weight step, **Then** exercises added to a set of exercises afterwards get the new default rest, and exercises without their own weight step use the new default step; values already saved in existing sets of exercises do not change.

### Edge Cases

- A workout is still in progress when the person starts another one: they are asked to continue or finish the first.
- The same account runs a workout on two devices at once: the later saved state wins per set; nothing crashes.
- The first time an exercise is done there is no history: predictions come from the set's plan, with no weight selected for weighted exercises until the person picks one.
- The history has fewer sets than today's plan: extra sets take the last known set's values.
- A set planned for an exercise that was later removed from the catalog data: it is shown by its saved name and can be removed.
- The person finishes a workout with zero completed sets: they are asked whether to discard it.
- The device cannot keep the screen on (unsupported browser, battery saver): the workout continues and timers stay correct after the screen wakes.
- The device sleeps or the app goes to the background during rest: on return the countdown shows the true remaining time, and a missed end-of-rest is signalled at once.
- A typed value is not a number or is negative: it is rejected and the previous value stays.
- Body weight is skipped in the survey: the chart simply has no point for that day.
- Storage quota or sync errors: the person sees a non-blocking notice; the workout continues.

## Requirements *(mandatory)*

### Functional Requirements

**Account and data ownership**

- **FR-001**: The system MUST let a person sign in with a Google account and sign out.
- **FR-002**: The system MUST keep each person's sets, schedule, workouts, survey answers and settings under that person and deny any other account access to them.
- **FR-003**: The system MUST show the same data on every device where the person is signed in.

**Catalog and equipment**

- **FR-004**: The system MUST provide a catalog of exercises with two photos, name, primary and secondary muscles, equipment, type and technique steps for each.
- **FR-005**: The system MUST support four exercise types: strength (sets × reps × weight), bodyweight (reps, optional added weight), timed (duration) and cardio (duration).
- **FR-006**: Persons MUST be able to search the catalog by name and filter it by muscle group and by equipment.
- **FR-007**: Persons MUST be able to record which equipment they have at home; body weight is always available.
- **FR-008**: The system MUST mark as "gym" every exercise that needs equipment outside the person's home equipment, wherever the exercise is shown.
- **FR-009**: The system MUST offer a "home only" filter that leaves only exercises doable with the home equipment.

**Sets and schedule**

- **FR-010**: The system MUST provide ready-made sets for home without equipment, home with dumbbells and a pull-up bar, gym full body, gym split, stretching, cardio, warm-up and back prevention.
- **FR-011**: Persons MUST be able to create, copy, edit and delete their own sets; ready-made sets cannot be changed, only copied.
- **FR-012**: A set MUST be an ordered list of exercises, each with planned sets, reps or duration, and rest between sets.
- **FR-013**: The system MUST show for each set its place (home or gym), exercise count, estimated duration and muscle groups, and warn in the editor about exercises that need gym equipment.
- **FR-014**: Persons MUST be able to assign up to 5 sets to each weekday, in an order they choose, and remove them.
- **FR-015**: The system MUST show today's planned sets in order, each with its own start action and done mark, a rest-day state when nothing is planned, the current week with done and partly done days, and the last workout. Each set of a day is run and saved as a separate workout.
- **FR-016**: Persons MUST be able to start any set at any time, regardless of the schedule.
- **FR-044**: The "today" screen MUST offer «Другая тренировка», a sheet listing every own and ready-made set; the chosen set is started for today only and the schedule is not changed (US5; owner's decision, 2026-11-11).
- **FR-045**: Every action on the "today" screen that starts a workout (the open set's start, a waiting set's «Начать», a set picked in «Другая тренировка») MUST, on touch input, fire only after a one-second hold with visible progress, as FR-027; with mouse or keyboard a single activation is enough (owner's decision, 2026-11-11).

**Workout session**

- **FR-017**: The system MUST present the current exercise as a full-screen card with its photos, name, muscles, equipment, set counter, the plan for the current set and position in the workout.
- **FR-018**: The system MUST run four timers: total workout time, time on the current exercise, rest countdown between sets, and countdown for timed exercises.
- **FR-019**: The system MUST record every set separately with its reps and weight (or duration).
- **FR-020**: Logging MUST happen on the rest screen through scrollable value strips for reps and weight; a tap selects a value, scrolling does not, and an untouched strip saves the predicted value.
- **FR-021**: Persons MUST be able to enter an exact number that is not on the strip.
- **FR-022**: The system MUST predict reps and weight for each set number of an exercise from that person's history of the same set number, show what was done last time, and shift the remaining sets' predicted weight by the difference when the person picks another weight.
- **FR-023**: The weight step of the strip MUST be configurable per exercise, with a default from settings (2.5 kg initially).
- **FR-024**: Persons MUST be able to skip an exercise, which postpones it: it is listed on the session screen, can be resumed at any moment with its logged sets kept, and is offered again after the last exercise; a postponed exercise never done is saved as skipped. Persons MUST also be able to go back to the previous set or exercise to redo it or correct its result.
- **FR-025**: Persons MUST be able to add a catalog exercise during the workout and choose to do it now, next, or instead of the current one.
- **FR-026**: Persons MUST be able to open the exercise description during the workout without stopping any timer.
- **FR-027**: On touch input, "back", "skip" and "finish workout" MUST fire only after a one-second hold with visible progress; with mouse or keyboard a single activation is enough.
  The same hold applies to "set done" and "next set" (owner's decision, 2026-11-11).
- **FR-028**: No step of a workout may require a network response before the person can continue.
- **FR-029**: A workout in progress MUST survive reload, app close, device sleep and loss of connection, restoring position, logged sets and correct timer values.
- **FR-043**: The device screen MUST stay on while a workout is in progress and the app is in the foreground, including during rest; the lock is released when the workout ends or is left.
- **FR-030**: At the end the system MUST show a summary (duration, exercises done and skipped, total volume, new records) and ask for wellbeing 1–5, energy 1–5 and body weight, each skippable.

**Statistics**

- **FR-031**: The system MUST derive records, volume and muscle load from logged sets; none of them is entered by hand.
- **FR-032**: The system MUST show the current week's load per muscle group on a front and back human figure, with untrained groups visually distinct and listed by name.
- **FR-033**: The system MUST show a calendar of workout days with workouts this week, this month and total time.
- **FR-034**: The system MUST show, for a chosen exercise, weight, volume and reps over time and its personal records.
- **FR-035**: The system MUST chart body weight, wellbeing and energy over time.
- **FR-047**: Persons MUST be able to open a finished workout at `/workouts/:id` from a done set on the "today" screen and from a statistics calendar day, and see its exercises in the order done with every logged set (reps, weight or time) and the best set, partly done and skipped exercises, the summary (time, sets, volume) and the survey answers; the screen has no actions (owner's decision, 2026-11-11).

**Platform and experience**

- **FR-036**: Every screen MUST work on a phone (from 360 px wide) and on a desktop, with a layout that uses the desktop width.
- **FR-037**: The app MUST be installable to a home screen and start without a connection after the first online use.
- **FR-038**: Workouts logged offline MUST sync automatically when a connection returns.
- **FR-046**: While the device is offline, a thin strip at the top MUST say so and that data will be sent on reconnect; it takes its own space instead of covering content and disappears when the connection returns.
- **FR-039**: The interface MUST be in Russian; exercise catalog data is shown in English in this version.
- **FR-040**: The app MUST use one dark theme whose colours all come from a single set of named values, so another theme can be added without restyling screens.
- **FR-041**: The system MUST play distinct sound signals for end of rest, end of countdown, completed set and completed workout, and animate transitions and feedback; both can be switched off, and reduced-motion preferences are respected.
- **FR-042**: Screens MUST follow the approved prototypes in `../personal-workout-design/` for layout, navigation and states.

### Key Entities

- **Person**: an account identified by Google sign-in; owns everything below.
- **Settings**: home equipment list, default rest, default weight step, sounds on/off, animations on/off.
- **Exercise**: catalog item with name, type, primary and secondary muscles, equipment, technique steps, two photos. Shared and read-only.
- **Set of exercises (template)**: name, ordered entries; each entry references an exercise and holds planned sets, reps or duration, rest. Either ready-made (shared, read-only) or owned by a person.
- **Schedule**: for each weekday, an ordered list of up to 5 sets.
- **Workout**: one session of a person: when it started and ended, the set it came from, its entries in the order done, the survey answers. May be in progress.
- **Workout entry**: an exercise within a workout, with status (done, skipped) and its logged sets.
- **Logged set**: set number, reps, weight or duration.
- **Body measurement**: body weight recorded with a workout's survey.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A signed-in person starts today's planned workout in at most 2 taps from opening the app.
- **SC-002**: Logging a set whose result matches the prediction takes 0 extra taps; correcting reps or weight takes at most 2 taps per value in 90% of sets.
- **SC-003**: During a workout no action waits on the network: every tap responds within 100 ms on a mid-range phone, online or offline.
- **SC-004**: 100% of sets logged offline appear in the account after the connection returns, verified over 20 offline workouts.
- **SC-005**: After the app is force-closed mid-workout, the session resumes at the same set with timers within 1 second of the true elapsed time.
- **SC-006**: Zero accidental "back", "skip" or "finish" actions from a brief touch in a scripted test of 100 short taps.
- **SC-007**: A person can build a new set of 6 exercises in under 3 minutes.
- **SC-008**: From the statistics screen a person can name which muscle groups were not trained this week within 5 seconds.
- **SC-009**: No account can read or change another account's data in an automated access test covering every kind of stored data.
- **SC-010**: Every screen is usable without horizontal scrolling at 360 px width and at 1280 px width.
- **SC-011**: The app stays within the free usage limits of its hosting and data service for a household of up to 5 active users.

## Technical Constraints

Decided by the owner, who is a developer and leads the development. The plan must follow them; changing any of them needs the owner's decision.

- **App**: Vite, React, TypeScript, React Router, Feature-Sliced Design.
- **Data and state**: Firebase on the Spark plan (Auth with Google, Firestore, Hosting; no Cloud Functions, no Cloud Storage); TanStack Query for Firestore data; Zustand for the running session; per-user isolation enforced by Firestore security rules.
- **UI**: shadcn/ui on Radix UI, Tailwind CSS, shadcn Charts (Recharts); the muscle figure is our own SVG taken from the `stats.html` prototype; one dark theme on design tokens.
- **PWA**: vite-plugin-pwa; offline sessions; exercise photos cached as viewed; catalog and photos shipped as static hosting assets.
- **Quality**: ESLint, Prettier, Steiger, Lefthook, commitlint (Conventional Commits); Vitest, Testing Library, Firestore rules tests on the emulator, Playwright in mobile and desktop viewports.
- **Runtime and packages**: Node 24 LTS and pnpm 12.17.0, both pinned in the repository; pnpm with the supply-chain rules of constitution principle VIII; the approved dependency list is in `docs/research/tooling-2026-11-11.md`; every further package needs the owner's approval.
- **Delivery**: local work against the Firebase emulator; deploy to Firebase Hosting from GitHub Actions on push to `main` after the checks pass.

## Assumptions

The owner confirmed these on 2026-11-11.

- Sign-in is Google only; there is no email/password and no account deletion flow in this version.
- Weights are in kilograms; there is no unit setting.
- Muscle load counts a set as 1 for each primary muscle of the exercise and ½ for each secondary muscle, as in the approved statistics prototype.
- Estimated duration of a set is computed from planned sets, reps or time and rests; it is an estimate, not a promise.
- "Gym" means "needs equipment that is not in the person's home equipment list"; a set is a "home" set when none of its exercises is marked "gym".
- The home/gym switch on the "today" screen swaps between paired ready-made variants; for the person's own sets it is shown only when a counterpart exists.
- Volume is the sum of reps × weight over sets; the best set is ranked by estimated one-rep maximum.
- Only one workout can be in progress per person.
- The exercise catalog is the public-domain free-exercise-db dataset (800+ exercises); it ships with the app and is not editable by users in this version. Persons cannot create custom exercises in this version.
- Out of scope, kept in the backlog of `docs/requirements.md`: sharing sets between users, family and partner progress, Russian translation of the catalog, workout streak.
- Notifications and reminders outside the open app are out of scope.
