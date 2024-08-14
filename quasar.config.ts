import type { QuasarElectronConfiguration } from "@quasar/app-vite/types/configuration/electron-conf";
import type { SnapOptions } from "app-builder-lib";
import type {
  QuasarFonts,
  QuasarIconSets,
  QuasarLanguageCodesHolder,
  QuasarPlugins,
} from "quasar";

import extractorPug from "@unocss/extractor-pug";
import { fileURLToPath } from "node:url";
import { configure } from "quasar/wrappers";
import { mergeConfig } from "vite";

const boot: string[] = ["route", "i18n"];
const css: string[] = ["app.sass"];
const extras: (QuasarFonts | QuasarIconSets)[] = [
  "mdi-v7",
  "roboto-font",
  "material-icons",
];
const vueRouterMode = "history";
const extendViteConf = (viteConf: Record<string, object>) => {
  const value = mergeConfig(viteConf.define, {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  });
  Reflect.defineProperty(viteConf, "define", { value });
};
const tsconfigPath = "tsconfig.vue-tsc.json";
const vueTsc = { tsconfigPath };
const server = false;
const lintCommand = 'eslint "./**/*.{js,ts,mjs,cjs,vue}"';
const eslint = { lintCommand };
const include = [fileURLToPath(new URL("./src/i18n", import.meta.url))];
const extractors = [extractorPug()];
const configFile = "./uno.config.js";
const vitePlugins = [
  ["@intlify/unplugin-vue-i18n/vite", { include }],
  ["vite-plugin-checker", { eslint, vueTsc }, { server }],
  ["@unocss/vite", { configFile, extractors }],
];
const browser = ["esnext"];
const target = { browser };
const build: object = { extendViteConf, target, vitePlugins, vueRouterMode };
const open = false;
const devServer = { open };
const lang: keyof QuasarLanguageCodesHolder = "ru";
const plugins: (keyof QuasarPlugins)[] = ["Dialog", "Notify"];
const framework = { lang, plugins };
const inspectPort = 5858;
const bundler = "builder";
const appId = "com.electron.vues3";
const grade: SnapOptions["grade"] = "stable";
const snap = { grade };
const builder = { appId, snap };
const preloadScripts = ["electron-preload"];
const electron: QuasarElectronConfiguration = {
  builder,
  bundler,
  inspectPort,
  preloadScripts,
};
export default configure(() => ({
  boot,
  build,
  css,
  devServer,
  electron,
  extras,
  framework,
}));
