import type { Preset, SourceCodeTransformer } from "@unocss/core";

import presetAttributify from "@unocss/preset-attributify";
import presetIcons from "@unocss/preset-icons/browser";
import presetTagify from "@unocss/preset-tagify";
import presetTypography from "@unocss/preset-typography";
import presetUno from "@unocss/preset-uno";
import presetWebFonts from "@unocss/preset-web-fonts";
import transformerCompileClass from "@unocss/transformer-compile-class";
import transformerDirectives from "@unocss/transformer-directives";
import transformerVariantGroup from "@unocss/transformer-variant-group";

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

const fonts: Record<string, string> = Object.fromEntries(
  [
    ...dynamicSerifs,
    ...geometricGrotesques,
    ...humanisticGrotesques,
    ...neogrotesques,
    ...transitionalSerifs,
    ...staticSerifs,
    ...handwrittenFonts,
  ].map((value) => [value.toLowerCase().replaceAll(" ", "_"), value]),
);
const customFetch = async (url: string) => (await fetch(url)).text();
const cdn = "https://esm.sh/";
const display = "inline-block";
const extraProperties = { display, "vertical-align": "middle" };
const presets: Preset[] = [
  presetUno(),
  presetAttributify(),
  presetTypography(),
  presetTagify({
    extraProperties(matched: string) {
      return matched.startsWith("i-") ? { display } : {};
    },
  }),
  presetWebFonts({ customFetch, fonts }),
  presetIcons({ cdn, extraProperties }),
];
const transformers: SourceCodeTransformer[] = [
  transformerDirectives(),
  transformerVariantGroup(),
  transformerCompileClass(),
];
export { fonts };
export default { presets, transformers };
