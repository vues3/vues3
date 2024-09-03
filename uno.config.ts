import type { Preset } from "@unocss/core";

import presetIcons from "@unocss/preset-icons/browser";
import presetTypography from "@unocss/preset-typography";
import presetUno from "@unocss/preset-uno";
// import presetWebFonts from "@unocss/preset-web-fonts";

/** @see {@link https://type.today/ru/journal/old-style} Динамические антиквы */
import dynamicSerifs from "./src/assets/fonts/DynamicSerifs.json";
/** @see {@link http://type.today/ru/journal/geo} Геометрические гротески */
import geometricGrotesques from "./src/assets/fonts/GeometricGrotesques.json";
/** @see {@link https://type.today/ru/journal/scripts} Рукописные шрифты */
import handwrittenFonts from "./src/assets/fonts/HandwrittenFonts.json";
/** @see {@link https://type.today/ru/journal/humanist} Гуманистические гротески */
import humanisticGrotesques from "./src/assets/fonts/HumanisticGrotesques.json";
/** @see {@link https://type.today/ru/journal/neo} Неогротески */
import neogrotesques from "./src/assets/fonts/Neogrotesques.json";
/** @see {@link https://type.today/ru/journal/gfdidones} Статические антиквы */
import staticSerifs from "./src/assets/fonts/StaticSerifs.json";
/** @see {@link https://type.today/ru/journal/transitional} Переходные антиквы */
import transitionalSerifs from "./src/assets/fonts/TransitionalSerifs.json";

export const fonts: Record<string, string> = Object.fromEntries(
  [
    // "Arial",
    // "Arial Black",
    // "Comic Sans MS",
    // "Courier New",
    // "Impact",
    // "Lucida Grande",
    // "Times New Roman",
    // "Verdana",
    ...dynamicSerifs,
    ...geometricGrotesques,
    ...humanisticGrotesques,
    ...neogrotesques,
    ...transitionalSerifs,
    ...staticSerifs,
    ...handwrittenFonts,
  ].map((value) => [value.toLowerCase().replaceAll(" ", "_"), value]),
);
export const customFetch = async (url: string) => (await fetch(url)).text();
const cdn = "https://esm.sh/";
const presets: Preset[] = [
  presetUno(),
  presetTypography(),
  // presetWebFonts({ customFetch, fonts }),
  presetIcons({ cdn }),
];
export default { presets };
