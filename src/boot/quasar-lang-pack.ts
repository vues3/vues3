import { Lang } from "quasar";

(async () => {
  if (Lang.getLocale() === "ru-RU")
    Lang.set((await import("quasar/lang/ru")).default);
})().catch(() => {});
