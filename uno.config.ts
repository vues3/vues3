import type { Preset } from "@unocss/core";

import presetIcons from "@unocss/preset-icons/browser";
import presetTypography from "@unocss/preset-typography";
import presetUno from "@unocss/preset-uno";

const cdn = "https://unpkg.com/";
const presets: Preset[] = [
  presetUno(),
  presetTypography(),
  presetIcons({ cdn }),
];
export default { presets };
