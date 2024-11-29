import type { Preset } from "@unocss/core";

import presetAttributify from "@unocss/preset-attributify";
import presetIcons from "@unocss/preset-icons/browser";
import presetTagify from "@unocss/preset-tagify";
import presetTypography from "@unocss/preset-typography";
import presetUno from "@unocss/preset-uno";

const cdn = "https://cdn.jsdelivr.net/npm/";
const presets: Preset[] = [
  presetUno(),
  presetTypography(),
  presetIcons({ cdn }),
  presetTagify(),
  presetAttributify(),
];
export default { presets };
