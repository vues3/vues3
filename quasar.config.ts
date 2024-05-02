import type { QuasarElectronConfiguration } from "@quasar/app-vite/types/configuration/electron-conf";
import type {
  QuasarFonts,
  QuasarIconSets,
  QuasarLanguageCodesHolder,
  QuasarPlugins,
} from "quasar";
import { configure } from "quasar/wrappers";
/** @type {string[]} */
const boot: string[] = ["uno", "route"];
/** @type {string[]} */
const css: string[] = ["app.sass"];
/** @type {(QuasarIconSets | QuasarFonts)[]} */
const extras: (QuasarIconSets | QuasarFonts)[] = [
  "mdi-v6",
  "roboto-font",
  "material-icons",
];
/** @type {"history"} */
const vueRouterMode: string = "history";
/** @type {object} */
const build: object = {
  vueRouterMode,
};
/** @type {boolean} */
const open: boolean = false;
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
/** @type {QuasarElectronConfiguration["bundler"]} */
const bundler: QuasarElectronConfiguration["bundler"] = "packager";
/** @type {object} */
const packager: object = {};
/** @type {QuasarElectronConfiguration} */
const electron: QuasarElectronConfiguration = {
  inspectPort,
  bundler,
  packager,
};
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
}));
