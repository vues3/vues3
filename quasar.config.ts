import path from "node:path";

import type { PluginEntry } from "@quasar/app-vite/types/configuration/build";
import type { QuasarElectronConfiguration } from "@quasar/app-vite/types/configuration/electron-conf";
import type {
  QuasarFonts,
  QuasarIconSets,
  QuasarLanguageCodesHolder,
  QuasarPlugins,
} from "quasar";
import { configure } from "quasar/wrappers";

/** @type {string[]} */
const boot: string[] = ["main", "uno", "route"];

/** @type {string[]} */
const css: string[] = ["app.sass"];

/** @type {(QuasarIconSets | QuasarFonts)[]} */
const extras: (QuasarIconSets | QuasarFonts)[] = [
  "mdi-v6",
  "roboto-font",
  "material-icons",
];

/**
 * @type {{
 *   [key: string]: string;
 * }}
 */
const alias: {
  [key: string]: string;
} = {
  "@": path.join(__dirname, "./src"),
  "~": __dirname,
};

/** @type {"history"} */
const vueRouterMode: "history" = "history";

// /** @type {boolean} */
// const polyfillModulePreload: boolean = true;

/** @type {string} */
const tsconfigPath: string = "tsconfig.vue-tsc.json";

/** @type {object} */
const vueTsc: object = { tsconfigPath };

/** @type {string} */
const lintCommand: string = 'eslint "./**/*.{js,ts,mjs,cjs,vue}"';

/** @type {object} */
const eslint: object = { lintCommand };

/** @type {boolean} */
const server: boolean = false;

/** @type {PluginEntry[]} */
const vitePlugins: PluginEntry[] = [
  ["vite-plugin-checker", { vueTsc, eslint }, { server }],
];

/** @type {"terser"} */
const minify: "terser" = "terser";

/** @type {object} */
const build: object = {
  alias,
  vueRouterMode,
  // polyfillModulePreload,
  vitePlugins,
  minify,
};

/** @type {boolean} */
const open: boolean = true;

/** @type {object} */
const devServer: object = { open };

/** @type {keyof QuasarLanguageCodesHolder} */
const lang: keyof QuasarLanguageCodesHolder = "ru";

/** @type {(keyof QuasarPlugins)[]} */
const plugins: (keyof QuasarPlugins)[] = ["Dialog", "Notify"];

/** @type {object} */
const framework: object = { lang, plugins };

/** @type {object} */
const cordova: object = {};

/** @type {boolean} */
const hideSplashscreen: boolean = true;

/** @type {object} */
const capacitor: object = { hideSplashscreen };

/** @type {number} */
const inspectPort: number = 5858;

/** @type {"packager"} */
const bundler: "packager" = "packager";

/** @type {object} */
const packager: object = {};

/** @type {QuasarElectronConfiguration} */
const electron: QuasarElectronConfiguration = {
  inspectPort,
  bundler,
  packager,
};

/** @type {string[]} */
const contentScripts: string[] = ["my-content-script"];

/** @type {object} */
const bex: object = { contentScripts };

export default configure(() => ({
  boot,
  css,
  extras,
  build,
  devServer,
  framework,
  cordova,
  capacitor,
  electron,
  bex,
}));
