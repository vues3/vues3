import type {
  AliasOptions,
  BuildOptions,
  PluginOption,
  SassPreprocessorOptions,
  UserConfig,
} from "vite";
import type { RenameFunc } from "vite-plugin-static-copy";

import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { version } from "vue";

const dest = "assets";
const src = "../node_modules/vue/dist/vue.esm-browser.prod.js";
const rename: RenameFunc = (fileName, fileExtension) =>
  `${fileName}-${version}.${fileExtension}`;
const targets = [{ dest, rename, src }];
const plugins: PluginOption[] = [vue(), viteStaticCopy({ targets })];
const app = fileURLToPath(new URL("..", import.meta.url));
const alias: AliasOptions = { "@": ".", app };
const resolve: UserConfig["resolve"] = { alias };
const manifest = true;
const outDir = "../public/monolit";
const manualChunks = (id: string) =>
  id.split("node_modules/")[1]?.split("/")[0]?.replace(/^@/, "");
const output = { manualChunks };
const external = ["vue"];
const rollupOptions: BuildOptions["rollupOptions"] = { external, output };
// const target = "esnext";
const build: BuildOptions = {
  manifest,
  outDir,
  rollupOptions,
  //  target,
};
const define: object = {
  __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  __VUE_PROD_DEVTOOLS__: true,
};
const api = "modern-compiler";
const sass: SassPreprocessorOptions = { api };
const preprocessorOptions = { sass };
const css = { preprocessorOptions };
const base = "./";
export default defineConfig({ base, build, css, define, plugins, resolve });
