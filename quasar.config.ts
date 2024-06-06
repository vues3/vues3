import type { QuasarElectronConfiguration } from "@quasar/app-vite/types/configuration/electron-conf";
import type {
  QuasarFonts,
  QuasarIconSets,
  QuasarLanguageCodesHolder,
  QuasarPlugins,
} from "quasar";

import { configure } from "quasar/wrappers";
import { mergeConfig } from "vite";

const boot: string[] = ["uno", "route", "icon"];
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
const build: object = { extendViteConf, vueRouterMode };
const open = false;
const devServer: object = { open };
const lang: keyof QuasarLanguageCodesHolder = "ru";
const plugins: (keyof QuasarPlugins)[] = ["Dialog", "Notify"];
const framework: object = { lang, plugins };
const cordova: object = {};
const hideSplashscreen = true;
const capacitor: object = { hideSplashscreen };
const inspectPort = 5858;
const bundler: QuasarElectronConfiguration["bundler"] = "builder";
const builder: object = { snap: { publish: "github" } };
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
  capacitor,
  cordova,
  css,
  devServer,
  electron,
  extras,
  framework,
}));
