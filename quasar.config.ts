import { defineConfig } from "#q-app/wrappers";
import extractorPug from "@unocss/extractor-pug";
import { fileURLToPath } from "url";
import { mergeConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
export default defineConfig(() => ({
  animations: ["zoomIn", "zoomOut"],
  boot: ["main", "route", "quasar-lang-pack", "i18n", "monaco"],
  build: {
    alias: { "node:path": "path-browserify" },
    extendViteConf: (config) => {
      config.base = "./";
      config.define = mergeConfig(
        config.define ?? {},
        {
          __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
        },
        false,
      );
    },
    typescript: { strict: true, vueShim: true },
    vitePlugins: [
      [
        "@intlify/unplugin-vue-i18n/vite",
        { include: [fileURLToPath(new URL("./src/i18n", import.meta.url))] },
      ],
      [
        "vite-plugin-checker",
        {
          eslint: {
            lintCommand:
              'eslint -c ./eslint.config.ts "./src*/**/*.{ts,js,mjs,cjs,vue}"',
            useFlatConfig: true,
          },
          vueTsc: true,
        },
        { server: false },
      ],
      [
        "@unocss/vite",
        { configFile: "./uno.config.ts", extractors: [extractorPug()] },
      ],
      [
        // @ts-expect-error Plugin<any>[]
        viteStaticCopy,
        {
          targets: [
            { dest: "runtime", src: "./node_modules/@vuebro/runtime/dist/*" },
          ],
        },
      ],
    ],
  },
  css: ["app.css"],
  devServer: { open: false },
  electron: {
    builder: { appId: "vuebro" },
    bundler: "builder",
    preloadScripts: ["electron-preload"],
  },
  extras: ["mdi-v7", "roboto-font", "material-icons"],
  framework: { plugins: ["Dialog", "Notify"] },
}));
