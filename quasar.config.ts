import type { QuasarElectronConfiguration } from "@quasar/app-vite/types/configuration/electron-conf";
import type {
  QuasarFonts,
  QuasarIconSets,
  QuasarLanguageCodesHolder,
  QuasarPlugins,
} from "quasar";

import { fileURLToPath } from "node:url";
import { configure } from "quasar/wrappers";
import { mergeConfig } from "vite";

const boot: string[] = ["uno", "route", "i18n"];
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
const vitePlugins = [
  ["@intlify/unplugin-vue-i18n/vite", { include }],
  ["vite-plugin-checker", { eslint, vueTsc }, { server }],
];
const build: object = { extendViteConf, vitePlugins, vueRouterMode };
const open = false;
const devServer = { open };
const lang: keyof QuasarLanguageCodesHolder = "ru";
const plugins: (keyof QuasarPlugins)[] = ["Dialog", "Notify"];
const framework = { lang, plugins };
const inspectPort = 5858;
const bundler = "builder";
const appId = "com.electron.vues3";
const builder = { appId };
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
