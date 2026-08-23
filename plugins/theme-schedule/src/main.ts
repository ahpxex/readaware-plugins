/**
 * Theme Schedule — switch the app theme and the book page color at the times
 * you choose.
 *
 * Two rules shape the whole plugin:
 *
 *  1. **It acts on transitions, never continuously.** Once a slot's themes
 *     have been applied, the plugin leaves the appearance alone until the
 *     next slot begins — so changing the theme by hand at 21:00 sticks until
 *     the morning slot starts, instead of being overwritten a minute later.
 *     The last transition is remembered in storage, so a relaunch inside the
 *     same slot does not re-apply it either.
 *  2. **The host owns the appearance; this plugin owns only the clock.** Every
 *     change goes through the Settings Domain, so
 *     a scheduled switch is indistinguishable from a hand-picked one — a
 *     plugin reader theme still applies its typography preset, and a book
 *     pinned to its own appearance keeps it.
 */
import type {
  PluginContext,
  PluginModule,
  PluginSelectOption,
} from "../../../types/plugin-api";
import {
  KEEP,
  SLOT_IDS,
  activeSlot,
  minuteOfDay,
  minutesUntilNextSlot,
  readSlots,
  withDefaults,
  type Settings,
  type Slot,
} from "./schedule";
import { text, tr } from "./strings";

/**
 * The longest the plugin will sleep, however far away the next slot is.
 *
 * A timer that spans hours is a timer that has to survive a suspended
 * webview, a laptop lid, and a clock the user just moved. Waking at least
 * once a minute costs nothing (the work is a comparison against stored
 * state) and makes every one of those cases self-correcting.
 */
const MAX_SLEEP_MS = 60_000;
const MIN_SLEEP_MS = 1_000;

/** What was applied last, so a transition happens once and only once. */
type AppliedMark = { slot: string; app: string; reader: string };

function settingsOf(ctx: PluginContext): Settings {
  return withDefaults(ctx.services.storage.get<Settings>("settings"));
}

function isEnabled(settings: Settings): boolean {
  return settings.enabled !== false;
}

/**
 * Options for one of the declared theme selects: "keep" first, then every
 * value the host currently offers for that surface — built-ins and themes
 * from any enabled plugin alike, already labelled in the app's language.
 */
async function themeOptions(
  ctx: PluginContext,
  surface: "app" | "reader",
): Promise<PluginSelectOption[]> {
  const path = surface === "app" ? "appearance.theme" : "reading.theme";
  const entries = await ctx.domains.settings.queries.discover({
    section: surface === "app" ? "appearance" : "reading",
  });
  const themes = entries.find((entry) => entry.path === path)?.options ?? [];
  return [
    { value: KEEP, label: text("keep") },
    ...themes
      .filter((theme): theme is typeof theme & { value: string } =>
        typeof theme.value === "string",
      )
      .map((theme) => ({
        value: theme.value,
        label: theme.pluginName ? `${theme.label} · ${theme.pluginName}` : theme.label,
      })),
  ];
}

/**
 * Apply a slot unless it is already the one in force.
 *
 * The mark is written even when a surface refuses the value (its theme's
 * plugin was disabled since the schedule was written), so the user is told
 * once per transition rather than once a minute.
 */
async function applySlot(
  ctx: PluginContext,
  slot: Slot,
  options: { force?: boolean; announce?: boolean } = {},
): Promise<void> {
  const mark: AppliedMark = { slot: slot.id, app: slot.app, reader: slot.reader };
  const previous = ctx.services.storage.get<AppliedMark>("applied");
  const unchanged =
    previous?.slot === mark.slot &&
    previous.app === mark.app &&
    previous.reader === mark.reader;
  if (unchanged && !options.force) return;

  const failures: string[] = [];
  const attempt = async (run: () => Promise<void>) => {
    try {
      await run();
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }
  };
  if (slot.app !== KEEP) {
    await attempt(async () => {
      await ctx.domains.settings.commands.update([
        { path: "appearance.theme", value: slot.app, target: { kind: "global" } },
      ]);
    });
  }
  if (slot.reader !== KEEP) {
    await attempt(async () => {
      await ctx.domains.settings.commands.update([
        { path: "reading.theme", value: slot.reader, target: { kind: "global" } },
      ]);
    });
  }
  ctx.services.storage.set("applied", mark);

  if (failures.length > 0) {
    ctx.services.ui.showToast(
      tr(ctx.locale, `failed_${slot.id}`, { message: failures.join("; ") }),
    );
    return;
  }
  if (options.announce) {
    ctx.services.ui.showToast(tr(ctx.locale, `applied_${slot.id}`, { time: slot.label }));
  }
}

/** Set while the plugin is active; cleared by `deactivate`. */
let stopClock: (() => void) | null = null;

const plugin: PluginModule = {
  activate(ctx: PluginContext) {
    // ── The declared theme selects ────────────────────────────────────────
    // Static options cannot know what themes are installed, so each slot's
    // two pickers resolve their list at open time.
    for (const id of SLOT_IDS) {
      ctx.contributions.settingsOptions.register(`${id}App`, () => themeOptions(ctx, "app"));
      ctx.contributions.settingsOptions.register(`${id}Reader`, () => themeOptions(ctx, "reader"));
    }

    /** Evaluate the schedule against the clock and act if a slot changed. */
    const evaluate = async (options: { force?: boolean; announce?: boolean } = {}) => {
      const settings = settingsOf(ctx);
      if (!isEnabled(settings)) {
        // Nothing is reverted: the user's current appearance is theirs. Only
        // the mark is cleared, so re-enabling applies the slot in force.
        ctx.services.storage.remove("applied");
        if (options.announce) ctx.services.ui.showToast(tr(ctx.locale, "disabled"));
        return;
      }
      const slots = readSlots(settings);
      const slot = activeSlot(slots, minuteOfDay(new Date()));
      if (!slot) {
        if (options.announce) ctx.services.ui.showToast(tr(ctx.locale, "noSlots"));
        return;
      }
      await applySlot(ctx, slot, options);
    };

    // ── The clock ─────────────────────────────────────────────────────────
    let timer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    const sleepMs = (): number => {
      const settings = settingsOf(ctx);
      if (!isEnabled(settings)) return MAX_SLEEP_MS;
      const now = new Date();
      const untilNext =
        minutesUntilNextSlot(readSlots(settings), minuteOfDay(now)) * 60_000 -
        now.getSeconds() * 1_000 -
        now.getMilliseconds();
      return Math.max(MIN_SLEEP_MS, Math.min(untilNext, MAX_SLEEP_MS));
    };

    const arm = () => {
      if (stopped) return;
      timer = setTimeout(() => {
        void evaluate().finally(arm);
      }, sleepMs());
    };

    // A settings edit takes effect at once — waiting out a tick to see the
    // theme you just picked reads as the setting not having worked.
    ctx.services.storage.onChange(() => {
      void evaluate({ force: true });
    });

    ctx.contributions.commands.register({
      id: "apply-now",
      title: text("applyNow"),
      icon: "clock",
      keywords: "theme schedule appearance day night",
      run: async () => {
        await evaluate({ force: true, announce: true });
        return {};
      },
    });

    stopClock = () => {
      stopped = true;
      if (timer !== null) clearTimeout(timer);
      timer = null;
    };

    void evaluate().finally(arm);
  },

  deactivate() {
    stopClock?.();
    stopClock = null;
  },
};

export default plugin;
