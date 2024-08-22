import { Lang } from "quasar";
import { boot } from "quasar/wrappers";
import messages from "src/i18n";
import { createI18n } from "vue-i18n";

export default boot(({ app }) => {
  const locale = Lang.getLocale() === "ru-RU" ? "ru-RU" : "en-US";
  app.use(createI18n({ locale, messages }));
});
