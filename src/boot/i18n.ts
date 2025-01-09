/* -------------------------------------------------------------------------- */
/*                                   Imports                                  */
/* -------------------------------------------------------------------------- */

import type { BootCallback } from "@quasar/app-vite";

import { defineBoot } from "#q-app/wrappers";
import { Lang } from "quasar";
import messages from "src/i18n";
import { createI18n } from "vue-i18n";

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

const callback: BootCallback = ({ app }) => {
  const locale = Lang.getLocale() === "ru-RU" ? "ru-RU" : "en-US";
  app.use(createI18n({ locale, messages }));
};

/* -------------------------------------------------------------------------- */
/*                                   Exports                                  */
/* -------------------------------------------------------------------------- */

export default defineBoot(callback);

/* -------------------------------------------------------------------------- */
