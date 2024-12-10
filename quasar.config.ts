import type { QuasarBootConfiguration } from "@quasar/app-vite/types/configuration/boot";
import type { QuasarElectronConfiguration } from "@quasar/app-vite/types/configuration/electron-conf";
import type { QuasarFrameworkConfiguration } from "@quasar/app-vite/types/configuration/framework-conf";
import type { SnapOptions } from "app-builder-lib";
import type { QuasarFonts, QuasarIconSets, QuasarPlugins } from "quasar";

import { defineConfig } from "#q-app/wrappers";
import extractorPug from "@unocss/extractor-pug";
import { fileURLToPath } from "url";
import { mergeConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

/** Boot files to load. Order is important. */
const boot: QuasarBootConfiguration = [
  "route",
  "quasar-lang-pack",
  "i18n",
  "monaco",
];
/**
 * Global CSS/Stylus/SCSS/SASS/... files from /src/css/, except for theme files,
 * which are included by default.
 */
const css = ["app.sass"];
// eslint-disable-next-line tsdoc/syntax
/** What to import from @quasar/extras package. */
const extras: (QuasarFonts | QuasarIconSets)[] = [
  "mdi-v7",
  "roboto-font",
  "material-icons",
];
const extendViteConf = (viteConf: Record<string, object>) => {
  const value = mergeConfig(viteConf.define, {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  });
  Reflect.defineProperty(viteConf, "define", {
    value,
  });
};
const vueTsc = true;
const lintCommand = 'eslint "./**/*.{js,ts,mjs,cjs,vue}"';
const eslint = { lintCommand };
const include = [fileURLToPath(new URL("./src/i18n", import.meta.url))];
const extractors = [extractorPug()];
const configFile = "./uno.config.ts";
const src = "./node_modules/@vues3/runtime/dist/*";
const dest = "runtime";
const targets = [{ dest, src }];
const vitePlugins = [
  ["@intlify/unplugin-vue-i18n/vite", { include }],
  ["vite-plugin-checker", { eslint, vueTsc }, { server: false }],
  ["@unocss/vite", { configFile, extractors }],
  [viteStaticCopy, { targets }],
];
const strict = true;
const vueShim = true;
const typescript = { strict, vueShim };
const build: object = { extendViteConf, typescript, vitePlugins };
const open = false;
const devServer = { open };
const plugins: (keyof QuasarPlugins)[] = ["Dialog", "Notify"];
/**
 * What Quasar language pack to use, what Quasar icon set to use for Quasar
 * components, etc.
 */
const framework: QuasarFrameworkConfiguration = { plugins };
const bundler = "builder";
const appId = "com.electron.vues3";
const grade: SnapOptions["grade"] = "stable";
const snap = { grade };
const builder = { appId, snap };
const preloadScripts = ["electron-preload"];
const electron: QuasarElectronConfiguration = {
  builder,
  bundler,
  preloadScripts,
};
export default defineConfig(() => ({
  boot,
  build,
  css,
  devServer,
  electron,
  extras,
  framework,
}));
