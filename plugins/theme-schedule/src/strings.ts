/**
 * Plugin-owned copy. Field labels live in manifest.json (the host resolves
 * those); everything the plugin itself says at runtime — option labels,
 * command titles, toasts — is resolved here against `ctx.locale`.
 */
import type { PluginLocalizedText } from "../../../types/plugin-api";

type Bundle = Record<string, string>;

const STRINGS: Record<string, Bundle> = {
  en: {
    keep: "Keep current",
    applyNow: "Theme Schedule: apply now",
    disabled: "Theme Schedule is off.",
    noSlots: "No usable time — check the start times in settings.",
    applied_day: "Daytime themes applied ({time}).",
    applied_night: "Night themes applied ({time}).",
    failed_day: "The daytime themes could not be applied: {message}",
    failed_night: "The night themes could not be applied: {message}",
  },
  "zh-Hans": {
    keep: "保持不变",
    applyNow: "主题时间表：立即应用",
    disabled: "主题时间表已关闭。",
    noSlots: "没有可用的时间——检查设置里的开始时间。",
    applied_day: "已应用白天主题（{time}）。",
    applied_night: "已应用夜间主题（{time}）。",
    failed_day: "白天主题应用失败：{message}",
    failed_night: "夜间主题应用失败：{message}",
  },
  "zh-Hant": {
    keep: "保持不變",
    applyNow: "主題時間表：立即套用",
    disabled: "主題時間表已關閉。",
    noSlots: "沒有可用的時間——檢查設定裡的開始時間。",
    applied_day: "已套用白天主題（{time}）。",
    applied_night: "已套用夜間主題（{time}）。",
    failed_day: "白天主題套用失敗：{message}",
    failed_night: "夜間主題套用失敗：{message}",
  },
  ja: {
    keep: "変更しない",
    applyNow: "テーマスケジュール：今すぐ適用",
    disabled: "テーマスケジュールはオフです。",
    noSlots: "使える時刻がありません。設定の開始時刻を確認してください。",
    applied_day: "昼のテーマを適用しました（{time}）。",
    applied_night: "夜のテーマを適用しました（{time}）。",
    failed_day: "昼のテーマを適用できませんでした：{message}",
    failed_night: "夜のテーマを適用できませんでした：{message}",
  },
  ru: {
    keep: "Не менять",
    applyNow: "Расписание тем: применить сейчас",
    disabled: "Расписание тем выключено.",
    noSlots: "Нет пригодного времени — проверьте время начала в настройках.",
    applied_day: "Дневные темы применены ({time}).",
    applied_night: "Ночные темы применены ({time}).",
    failed_day: "Не удалось применить дневные темы: {message}",
    failed_night: "Не удалось применить ночные темы: {message}",
  },
  fr: {
    keep: "Ne rien changer",
    applyNow: "Horaire des thèmes : appliquer maintenant",
    disabled: "L’horaire des thèmes est désactivé.",
    noSlots: "Aucune heure utilisable — vérifiez les heures de début dans les réglages.",
    applied_day: "Thèmes de jour appliqués ({time}).",
    applied_night: "Thèmes de nuit appliqués ({time}).",
    failed_day: "Impossible d’appliquer les thèmes de jour : {message}",
    failed_night: "Impossible d’appliquer les thèmes de nuit : {message}",
  },
  de: {
    keep: "Unverändert lassen",
    applyNow: "Theme-Zeitplan: jetzt anwenden",
    disabled: "Der Theme-Zeitplan ist aus.",
    noSlots: "Keine brauchbare Zeit — prüfen Sie die Startzeiten in den Einstellungen.",
    applied_day: "Tag-Themes angewendet ({time}).",
    applied_night: "Nacht-Themes angewendet ({time}).",
    failed_day: "Die Tag-Themes ließen sich nicht anwenden: {message}",
    failed_night: "Die Nacht-Themes ließen sich nicht anwenden: {message}",
  },
  es: {
    keep: "Sin cambios",
    applyNow: "Horario de temas: aplicar ahora",
    disabled: "El horario de temas está desactivado.",
    noSlots: "No hay ninguna hora utilizable: revisa las horas de inicio en los ajustes.",
    applied_day: "Temas de día aplicados ({time}).",
    applied_night: "Temas de noche aplicados ({time}).",
    failed_day: "No se pudieron aplicar los temas de día: {message}",
    failed_night: "No se pudieron aplicar los temas de noche: {message}",
  },
};

/** Exact locale, then base language, then English. */
function bundle(locale: string): Bundle {
  const exact = STRINGS[locale];
  if (exact) return exact;
  const base = locale.split("-")[0];
  const match = Object.keys(STRINGS).find((key) => key.split("-")[0] === base);
  return (match ? STRINGS[match] : undefined) ?? STRINGS.en;
}

export function tr(
  locale: string,
  key: keyof (typeof STRINGS)["en"] | string,
  values: Record<string, string | number> = {},
): string {
  const template = bundle(locale)[key] ?? STRINGS.en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in values ? String(values[name]) : whole,
  );
}

/**
 * The same copy as a localized bundle, for strings the HOST resolves rather
 * than the plugin: a contribution's title outlives the moment it was
 * registered, so it must not be frozen to the language that was active then.
 */
export function text(key: string): PluginLocalizedText {
  const fallback = STRINGS.en[key] ?? key;
  return {
    default: fallback,
    translations: Object.fromEntries(
      Object.entries(STRINGS)
        .filter(([locale]) => locale !== "en")
        .map(([locale, entries]) => [locale, entries[key] ?? fallback]),
    ),
  };
}
