import type { SnapOptions } from "app-builder-lib";
import type { QuasarFonts, QuasarIconSets, QuasarPlugins } from "quasar";

import { defineConfig } from "#q-app/wrappers";
import extractorPug from "@unocss/extractor-pug";
import { fileURLToPath } from "url";
import { mergeConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

/* -------------------------------------------------------------------------- */

const extendViteConf = (viteConf: Record<string, object>) => {
  const { define = {} } = viteConf;
  const value = mergeConfig(define, {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  });
  Reflect.defineProperty(viteConf, "define", {
    value,
  });
};

/* -------------------------------------------------------------------------- */

const appId = "com.electron.vues3",
  boot = ["route", "quasar-lang-pack", "i18n", "monaco"],
  strict = true,
  typescript = { strict },
  configFile = "./uno.config.ts",
  lintCommand =
    'eslint -c ./eslint.config.ts "./src*/**/*.{ts,js,mjs,cjs,vue}"',
  useFlatConfig = true,
  eslint = { lintCommand, useFlatConfig },
  extractors = [extractorPug()],
  include = [fileURLToPath(new URL("./src/i18n", import.meta.url))],
  dest = "runtime",
  src = "./node_modules/@vues3/runtime/dist/*",
  targets = [{ dest, src }],
  vueTsc = true,
  vitePlugins = [
    ["@intlify/unplugin-vue-i18n/vite", { include }],
    ["vite-plugin-checker", { eslint, vueTsc }, { server: false }],
    ["@unocss/vite", { configFile, extractors }],
    [viteStaticCopy, { targets }],
  ],
  build: object = { extendViteConf, typescript, vitePlugins },
  grade: SnapOptions["grade"] = "stable",
  snap = { grade },
  builder = { appId, snap },
  bundler = "builder",
  css = ["app.css"],
  open = false,
  devServer = { open },
  extras: (QuasarFonts | QuasarIconSets)[] = [
    "mdi-v7",
    "roboto-font",
    "material-icons",
  ],
  plugins: (keyof QuasarPlugins)[] = ["Dialog", "Notify"],
  framework = { plugins },
  preloadScripts = ["electron-preload"];

/* -------------------------------------------------------------------------- */

export default defineConfig(() => ({
  boot,
  build,
  css,
  devServer,
  electron: {
    builder,
    bundler,
    preloadScripts,
  },
  extras,
  framework,
}));
