import type { QuasarElectronConfiguration } from "@quasar/app-vite/types/configuration/electron-conf";
import type { SnapOptions } from "app-builder-lib";
import type { QuasarFonts, QuasarIconSets, QuasarPlugins } from "quasar";

import { defineConfig } from "#q-app/wrappers";
import extractorPug from "@unocss/extractor-pug";
import { fileURLToPath } from "url";
import { mergeConfig } from "vite";

const boot: string[] = ["route", "quasar-lang-pack", "i18n", "monaco"];
const css: string[] = ["app.sass"];
const extras: (QuasarFonts | QuasarIconSets)[] = [
  "mdi-v7",
  "roboto-font",
  "material-icons",
];
const api = "modern-compiler";
const enumerable = true;
const sass = { api };
const preprocessorOptions = { sass };
const extendViteConf = (viteConf: Record<string, object>) => {
  {
    const value = mergeConfig(viteConf.define, {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    });
    Reflect.defineProperty(viteConf, "define", { value });
  }
  {
    const value = mergeConfig(viteConf.css, { preprocessorOptions });
    Reflect.defineProperty(viteConf, "css", { enumerable, value });
  }
};
const vueTsc = true;
const server = false;
const lintCommand = 'eslint "./**/*.{js,ts,mjs,cjs,vue}"';
const eslint = { lintCommand };
const include = [fileURLToPath(new URL("./src/i18n", import.meta.url))];
const extractors = [extractorPug()];
const configFile = "./uno.config.ts";
const vitePlugins = [
  ["@intlify/unplugin-vue-i18n/vite", { include }],
  ["vite-plugin-checker", { eslint, vueTsc }, { server }],
  ["@unocss/vite", { configFile, extractors }],
];
const build: object = { extendViteConf, vitePlugins };
const open = false;
const devServer = { open };
const plugins: (keyof QuasarPlugins)[] = ["Dialog", "Notify"];
const framework = { plugins };
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
