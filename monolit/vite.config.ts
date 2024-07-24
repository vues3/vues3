import type { PluginOption } from "vite";

import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

const plugins: PluginOption[] = [vue()];
const alias: object = {
  "@": ".",
  app: fileURLToPath(new URL("..", import.meta.url)),
};
const resolve: object = { alias };
const manifest = true;
const outDir = "../public/monolit";
const manualChunks = (id: string) =>
  id.split("node_modules/")[1]?.split("/")[0];
const output: object = { manualChunks };
const rollupOptions: object = { output };
const target = "esnext";
const build: object = { manifest, outDir, rollupOptions, target };
const define: object = {
  __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  __VUE_PROD_DEVTOOLS__: true,
};
export default defineConfig({ build, define, plugins, resolve });
