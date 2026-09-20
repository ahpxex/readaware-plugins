# Theme Schedule

Switches the **app theme** and the **book page color** at the two times you
set — a light app and warm paper when your day starts, a dark app and dark
paper from the hour you call night.

## How it behaves

- **It acts on transitions, not continuously.** Once a slot has been applied
  the plugin leaves your appearance alone until the next slot starts, so a
  theme you pick by hand at 21:00 survives the evening instead of being
  overwritten a minute later. Relaunching the app inside the same slot does
  not re-apply it either.
- **Each surface is independent.** Day and night each choose an app theme and
  a page color separately, and either can be set to *Keep current* — schedule
  only the page color and your app chrome is never touched.
- **Any installed theme is fair game.** The pickers list the built-in values
  plus every theme contributed by an enabled theme plugin, so night can be
  e.g. Editorial Themes' Nocturne.
- **Night carries past midnight.** With day at 07:00 and night at 19:00,
  02:00 is still night — a day is a cycle, not a line.
- **Nothing is reverted when you turn it off.** The appearance you are looking
  at is yours; disabling the schedule simply stops future switches.
- Times are read on the device's own clock, and nothing happens while the app
  is closed — the schedule catches up the moment it opens again.

## Settings

| Field | What it does |
|---|---|
| Switch themes on a schedule | Master switch. |
| Day starts at / Night starts at | Picked from hour and minute dropdowns. |
| Daytime / Night app theme | App chrome theme, or *Keep current*. |
| Daytime / Night page color | Book page color, or *Keep current*. |

The command palette carries **Theme Schedule: apply now**, which re-applies
whichever of the two is in force (handy after editing times, or to undo a
manual override).

## Permissions

Exact Settings access to `appearance.theme` and `reading.theme`, for discovery
and writes. That is the whole of what this plugin touches: no library access,
no network, no AI calls.

## Development

```sh
bun run build   # bundles src/main.ts into main.js
bun test        # the schedule logic (parsing, slot choice, wrap-around)
```

Requires ReadAware ≥ 0.6.0. Storage writes are awaited before a scheduled
transition is acknowledged.
