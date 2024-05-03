import type { QuasarElectronConfiguration } from "@quasar/app-vite/types/configuration/electron-conf";
import type {
  QuasarFonts,
  QuasarIconSets,
  QuasarLanguageCodesHolder,
  QuasarPlugins,
} from "quasar";
import { configure } from "quasar/wrappers";

const boot: string[] = ["uno", "route"];
const css: string[] = ["app.sass"];
const extras: (QuasarIconSets | QuasarFonts)[] = [
  "mdi-v6",
  "roboto-font",
  "material-icons",
];
const vueRouterMode: string = "history";
const build: object = {
  vueRouterMode,
};
const open: boolean = false;
const devServer: object = { open };
const lang: keyof QuasarLanguageCodesHolder = "ru";
const plugins: (keyof QuasarPlugins)[] = ["Dialog", "Notify"];
const framework: object = { lang, plugins };
const cordova: object = {};
const hideSplashscreen: boolean = true;
const capacitor: object = { hideSplashscreen };
const inspectPort: number = 5858;
const bundler: QuasarElectronConfiguration["bundler"] = "packager";
const packager: object = {};
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
