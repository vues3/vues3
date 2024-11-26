import { defineBoot } from "#q-app/wrappers";
import { Lang } from "quasar";

export default defineBoot(async () => {
  if (Lang.getLocale() === "ru-RU")
    Lang.set((await import("quasar/lang/ru")).default);
});
