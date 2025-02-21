import type { Preset } from "@unocss/core";

import attributify from "@unocss/preset-attributify";
import icons from "@unocss/preset-icons/browser";
import tagify from "@unocss/preset-tagify";
import typography from "@unocss/preset-typography";
import wind3 from "@unocss/preset-wind3";

/* -------------------------------------------------------------------------- */

const cdn = "https://cdn.jsdelivr.net/npm/",
  presets: Preset[] = [
    wind3(),
    typography(),
    icons({ cdn }),
    tagify(),
    attributify(),
  ];

/* -------------------------------------------------------------------------- */

export default { presets };
