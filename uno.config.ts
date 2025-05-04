import type { Preset } from "@unocss/core";

import attributify from "@unocss/preset-attributify";
import icons from "@unocss/preset-icons/browser";
import tagify from "@unocss/preset-tagify";
import typography from "@unocss/preset-typography";
import wind4 from "@unocss/preset-wind4";

/* -------------------------------------------------------------------------- */

const cdn = "https://cdn.jsdelivr.net/npm/",
  presets: Preset[] = [
    wind4(),
    typography(),
    icons({ cdn }),
    tagify(),
    attributify(),
  ];

/* -------------------------------------------------------------------------- */

export default { presets };
