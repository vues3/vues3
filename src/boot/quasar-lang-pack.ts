import { Lang } from "quasar";

export default async () => {
  if (Lang.getLocale() === "ru-RU")
    Lang.set(
      (await import("quasar/lang/ru")).default as unknown as Parameters<
        typeof Lang.set
      >[0],
    );
};
