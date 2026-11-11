# Contract: routes and screens

Each route maps to one FSD page and one approved prototype in `../personal-workout-design/`.

| Route | Page slice | Prototype | Navigation shown | Auth |
|---|---|---|---|---|
| `/login` | `pages/login` | `login.html` | no | signed out only |
| `/` | `pages/today` | `home.html` (`?rest-day`, `?day-sheet`) | yes | required |
| `/templates` | `pages/templates` | `templates.html` | yes | required |
| `/templates/new`, `/templates/:id` | `pages/template-edit` | `template-edit.html` | yes | required |
| `/exercises` | `pages/exercises` | `exercises.html` | yes | required |
| `/session` | `pages/session` | `card.html`, `card.html?rest` | no | required, needs an active workout |
| `/session/finish` | `pages/finish` | `finish.html` | no | required |
| `/stats` | `pages/stats` | `stats.html` | yes | required |
| `/settings` | `pages/settings` | `settings.html` | yes | required |
| `/workouts/:id` | `pages/workout` | `workout.html`, `workout.html?no-survey` | yes (Статистика current) | required |

Rules:

- Signed-out visitors are redirected to `/login`; signed-in visitors leave `/login` for `/`.
- `/session` without an active workout redirects to `/`. With an active workout, `/` shows a
  "continue workout" entry point, and starting another set asks to continue or finish the first.
- Search and filters of `/exercises` live in the URL (`?q=`, `?muscle=`, `?equipment=`, `?home`),
  as in the prototype.
- Navigation destinations and their order: Сегодня `/`, Наборы `/templates`, Упражнения
  `/exercises`, Статистика `/stats`, Профиль `/settings`; bottom bar on phones, left sidebar from
  900 px, icons as in the prototypes.
