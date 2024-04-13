import presetAttributify from "@unocss/preset-attributify";
import presetTagify from "@unocss/preset-tagify";
import presetTypography from "@unocss/preset-typography";
import presetUno from "@unocss/preset-uno";
import presetWebFonts from "@unocss/preset-web-fonts";
import transformerDirectives from "@unocss/transformer-directives";
import transformerVariantGroup from "@unocss/transformer-variant-group";

/** {@link https://type.today/ru/journal/old-style Динамические антиквы} */
import dynamicSerifs from "./src/assets/fonts/DynamicSerifs.json";
/** {@link http://type.today/ru/journal/geo Геометрические гротески} */
import geometricGrotesques from "./src/assets/fonts/GeometricGrotesques.json";
/** {@link https://type.today/ru/journal/scripts Рукописные шрифты} */
import handwrittenFonts from "./src/assets/fonts/HandwrittenFonts.json";
/** {@link https://type.today/ru/journal/humanist Гуманистические гротески} */
import humanisticGrotesques from "./src/assets/fonts/HumanisticGrotesques.json";
/** {@link https://type.today/ru/journal/neo Неогротески} */
import neogrotesques from "./src/assets/fonts/Neogrotesques.json";
/** {@link https://type.today/ru/journal/gfdidones Статические антиквы} */
import staticSerifs from "./src/assets/fonts/StaticSerifs.json";
/** {@link https://type.today/ru/journal/transitional Переходные антиквы} */
import transitionalSerifs from "./src/assets/fonts/TransitionalSerifs.json";

export const fonts = Object.fromEntries(
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

export default {
  presets: [
    presetUno(),
    presetAttributify(),
    presetTypography(),
    presetTagify(),
    presetWebFonts({ fonts }),
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()],
};
