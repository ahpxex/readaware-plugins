// ../../../../private/tmp/readaware-marketplace-cambria/plugins/theme-schedule/src/schedule.ts
var KEEP = "keep";
var SLOT_IDS = ["day", "night"];
var DEFAULT_SETTINGS = {
  enabled: true,
  dayTime: "07:00",
  dayApp: "light",
  dayReader: "warm",
  nightTime: "19:00",
  nightApp: "dark",
  nightReader: "dark"
};
function withDefaults(stored) {
  return { ...DEFAULT_SETTINGS, ...stored ?? {} };
}
function parseTimeOfDay(value) {
  if (typeof value !== "string")
    return null;
  const text = value.trim();
  if (!text)
    return null;
  const match = /^(\d{1,2})(?:\s*[:：.]\s*(\d{1,2}))?$/.exec(text);
  if (!match)
    return null;
  const hours = Number(match[1]);
  const minutes = match[2] === undefined ? 0 : Number(match[2]);
  if (!Number.isInteger(hours) || hours > 23)
    return null;
  if (!Number.isInteger(minutes) || minutes > 59)
    return null;
  return hours * 60 + minutes;
}
function formatTimeOfDay(minutes) {
  const hours = Math.floor(minutes / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}
function themeValue(raw) {
  return typeof raw === "string" && raw.trim() !== "" ? raw.trim() : KEEP;
}
function readSlots(settings) {
  const slots = [];
  for (const id of SLOT_IDS) {
    const startsAt = parseTimeOfDay(settings[`${id}Time`]);
    if (startsAt === null)
      continue;
    if (slots.some((slot) => slot.startsAt === startsAt))
      continue;
    const app = themeValue(settings[`${id}App`]);
    const reader = themeValue(settings[`${id}Reader`]);
    if (app === KEEP && reader === KEEP)
      continue;
    slots.push({ id, startsAt, label: formatTimeOfDay(startsAt), app, reader });
  }
  return slots.sort((left, right) => left.startsAt - right.startsAt);
}
function activeSlot(slots, minuteOfDay) {
  if (slots.length === 0)
    return null;
  let current = slots[slots.length - 1];
  for (const slot of slots) {
    if (slot.startsAt <= minuteOfDay)
      current = slot;
    else
      break;
  }
  return current;
}
function minutesUntilNextSlot(slots, minuteOfDay) {
  if (slots.length === 0)
    return 24 * 60;
  const next = slots.find((slot) => slot.startsAt > minuteOfDay);
  if (next)
    return next.startsAt - minuteOfDay;
  return 24 * 60 - minuteOfDay + slots[0].startsAt;
}
function minuteOfDay(now) {
  return now.getHours() * 60 + now.getMinutes();
}

// ../../../../private/tmp/readaware-marketplace-cambria/plugins/theme-schedule/src/strings.ts
var STRINGS = {
  en: {
    keep: "Keep current",
    applyNow: "Theme Schedule: apply now",
    disabled: "Theme Schedule is off.",
    noSlots: "No usable time — check the start times in settings.",
    applied_day: "Daytime themes applied ({time}).",
    applied_night: "Night themes applied ({time}).",
    failed_day: "The daytime themes could not be applied: {message}",
    failed_night: "The night themes could not be applied: {message}"
  },
  "zh-Hans": {
    keep: "保持不变",
    applyNow: "主题时间表：立即应用",
    disabled: "主题时间表已关闭。",
    noSlots: "没有可用的时间——检查设置里的开始时间。",
    applied_day: "已应用白天主题（{time}）。",
    applied_night: "已应用夜间主题（{time}）。",
    failed_day: "白天主题应用失败：{message}",
    failed_night: "夜间主题应用失败：{message}"
  },
  "zh-Hant": {
    keep: "保持不變",
    applyNow: "主題時間表：立即套用",
    disabled: "主題時間表已關閉。",
    noSlots: "沒有可用的時間——檢查設定裡的開始時間。",
    applied_day: "已套用白天主題（{time}）。",
    applied_night: "已套用夜間主題（{time}）。",
    failed_day: "白天主題套用失敗：{message}",
    failed_night: "夜間主題套用失敗：{message}"
  },
  ja: {
    keep: "変更しない",
    applyNow: "テーマスケジュール：今すぐ適用",
    disabled: "テーマスケジュールはオフです。",
    noSlots: "使える時刻がありません。設定の開始時刻を確認してください。",
    applied_day: "昼のテーマを適用しました（{time}）。",
    applied_night: "夜のテーマを適用しました（{time}）。",
    failed_day: "昼のテーマを適用できませんでした：{message}",
    failed_night: "夜のテーマを適用できませんでした：{message}"
  },
  ru: {
    keep: "Не менять",
    applyNow: "Расписание тем: применить сейчас",
    disabled: "Расписание тем выключено.",
    noSlots: "Нет пригодного времени — проверьте время начала в настройках.",
    applied_day: "Дневные темы применены ({time}).",
    applied_night: "Ночные темы применены ({time}).",
    failed_day: "Не удалось применить дневные темы: {message}",
    failed_night: "Не удалось применить ночные темы: {message}"
  },
  fr: {
    keep: "Ne rien changer",
    applyNow: "Horaire des thèmes : appliquer maintenant",
    disabled: "L’horaire des thèmes est désactivé.",
    noSlots: "Aucune heure utilisable — vérifiez les heures de début dans les réglages.",
    applied_day: "Thèmes de jour appliqués ({time}).",
    applied_night: "Thèmes de nuit appliqués ({time}).",
    failed_day: "Impossible d’appliquer les thèmes de jour : {message}",
    failed_night: "Impossible d’appliquer les thèmes de nuit : {message}"
  },
  de: {
    keep: "Unverändert lassen",
    applyNow: "Theme-Zeitplan: jetzt anwenden",
    disabled: "Der Theme-Zeitplan ist aus.",
    noSlots: "Keine brauchbare Zeit — prüfen Sie die Startzeiten in den Einstellungen.",
    applied_day: "Tag-Themes angewendet ({time}).",
    applied_night: "Nacht-Themes angewendet ({time}).",
    failed_day: "Die Tag-Themes ließen sich nicht anwenden: {message}",
    failed_night: "Die Nacht-Themes ließen sich nicht anwenden: {message}"
  },
  es: {
    keep: "Sin cambios",
    applyNow: "Horario de temas: aplicar ahora",
    disabled: "El horario de temas está desactivado.",
    noSlots: "No hay ninguna hora utilizable: revisa las horas de inicio en los ajustes.",
    applied_day: "Temas de día aplicados ({time}).",
    applied_night: "Temas de noche aplicados ({time}).",
    failed_day: "No se pudieron aplicar los temas de día: {message}",
    failed_night: "No se pudieron aplicar los temas de noche: {message}"
  }
};
function bundle(locale) {
  const exact = STRINGS[locale];
  if (exact)
    return exact;
  const base = locale.split("-")[0];
  const match = Object.keys(STRINGS).find((key) => key.split("-")[0] === base);
  return (match ? STRINGS[match] : undefined) ?? STRINGS.en;
}
function tr(locale, key, values = {}) {
  const template = bundle(locale)[key] ?? STRINGS.en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (whole, name) => (name in values) ? String(values[name]) : whole);
}
function text(key) {
  const fallback = STRINGS.en[key] ?? key;
  return {
    default: fallback,
    translations: Object.fromEntries(Object.entries(STRINGS).filter(([locale]) => locale !== "en").map(([locale, entries]) => [locale, entries[key] ?? fallback]))
  };
}

// ../../../../private/tmp/readaware-marketplace-cambria/plugins/theme-schedule/src/main.ts
var MAX_SLEEP_MS = 60000;
var MIN_SLEEP_MS = 1000;
function settingsOf(ctx) {
  return withDefaults(ctx.services.storage.get("settings"));
}
function isEnabled(settings) {
  return settings.enabled !== false;
}
async function themeOptions(ctx, surface) {
  const path = surface === "app" ? "appearance.theme" : "reading.theme";
  const entries = await ctx.domains.settings.queries.discover({
    section: surface === "app" ? "appearance" : "reading"
  });
  const themes = entries.find((entry) => entry.path === path)?.options ?? [];
  return [
    { value: KEEP, label: text("keep") },
    ...themes.filter((theme) => typeof theme.value === "string").map((theme) => ({
      value: theme.value,
      label: theme.pluginName ? `${theme.label} · ${theme.pluginName}` : theme.label
    }))
  ];
}
async function applySlot(ctx, slot, options = {}) {
  const mark = { slot: slot.id, app: slot.app, reader: slot.reader };
  const previous = ctx.services.storage.get("applied");
  const unchanged = previous?.slot === mark.slot && previous.app === mark.app && previous.reader === mark.reader;
  if (unchanged && !options.force)
    return;
  const failures = [];
  const attempt = async (run) => {
    try {
      await run();
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }
  };
  if (slot.app !== KEEP) {
    await attempt(async () => {
      await ctx.domains.settings.commands.update([
        { path: "appearance.theme", value: slot.app, target: { kind: "global" } }
      ]);
    });
  }
  if (slot.reader !== KEEP) {
    await attempt(async () => {
      await ctx.domains.settings.commands.update([
        { path: "reading.theme", value: slot.reader, target: { kind: "global" } }
      ]);
    });
  }
  await ctx.services.storage.set("applied", mark);
  if (failures.length > 0) {
    ctx.services.ui.showToast(tr(ctx.locale, `failed_${slot.id}`, { message: failures.join("; ") }));
    return;
  }
  if (options.announce) {
    ctx.services.ui.showToast(tr(ctx.locale, `applied_${slot.id}`, { time: slot.label }));
  }
}
var stopClock = null;
var plugin = {
  activate(ctx) {
    for (const id of SLOT_IDS) {
      ctx.contributions.settingsOptions.register(`${id}App`, () => themeOptions(ctx, "app"));
      ctx.contributions.settingsOptions.register(`${id}Reader`, () => themeOptions(ctx, "reader"));
    }
    const evaluate = async (options = {}) => {
      const settings = settingsOf(ctx);
      if (!isEnabled(settings)) {
        await ctx.services.storage.remove("applied");
        if (options.announce)
          ctx.services.ui.showToast(tr(ctx.locale, "disabled"));
        return;
      }
      const slots = readSlots(settings);
      const slot = activeSlot(slots, minuteOfDay(new Date));
      if (!slot) {
        if (options.announce)
          ctx.services.ui.showToast(tr(ctx.locale, "noSlots"));
        return;
      }
      await applySlot(ctx, slot, options);
    };
    let timer = null;
    let stopped = false;
    const sleepMs = () => {
      const settings = settingsOf(ctx);
      if (!isEnabled(settings))
        return MAX_SLEEP_MS;
      const now = new Date;
      const untilNext = minutesUntilNextSlot(readSlots(settings), minuteOfDay(now)) * 60000 - now.getSeconds() * 1000 - now.getMilliseconds();
      return Math.max(MIN_SLEEP_MS, Math.min(untilNext, MAX_SLEEP_MS));
    };
    const arm = () => {
      if (stopped)
        return;
      timer = setTimeout(() => {
        evaluate().catch((error) => console.error("[theme-schedule] Evaluation failed", error)).finally(arm);
      }, sleepMs());
    };
    ctx.services.storage.onChange(() => {
      return evaluate({ force: true });
    });
    ctx.contributions.commands.register({
      id: "apply-now",
      title: text("applyNow"),
      icon: "clock",
      keywords: "theme schedule appearance day night",
      run: async () => {
        await evaluate({ force: true, announce: true });
        return {};
      }
    });
    stopClock = () => {
      stopped = true;
      if (timer !== null)
        clearTimeout(timer);
      timer = null;
    };
    ctx.services.schedules.bind("theme-clock", async () => {
      if (timer === null)
        arm();
      await evaluate();
    });
  },
  deactivate() {
    stopClock?.();
    stopClock = null;
  }
};
var main_default = plugin;
export {
  main_default as default
};
