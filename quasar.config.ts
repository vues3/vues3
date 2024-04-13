import path from "node:path";

import { configure } from "quasar/wrappers";

export default configure(() => ({
  boot: ["main", "uno", "route"],
  css: ["app.sass"],
  extras: ["mdi-v6", "roboto-font", "material-icons"],
  build: {
    alias: {
      "@": path.join(__dirname, "./src"),
      "~": __dirname,
    },
    vueRouterMode: "history",
    // polyfillModulePreload: true,
    vitePlugins: [
      [
        "vite-plugin-checker",
        {
          vueTsc: {
            tsconfigPath: "tsconfig.vue-tsc.json",
          },
          eslint: {
            lintCommand: 'eslint "./**/*.{js,ts,mjs,cjs,vue}"',
          },
        },
        { server: false },
      ],
    ],
    minify: "terser",
  },
  devServer: { open: true },
  framework: {
    lang: "ru",
    plugins: ["Dialog", "Notify"],
  },
  ssr: {
    pwa: false,
    prodPort: 3000,
    middlewares: ["render"],
  },
  pwa: {
    workboxMode: "GenerateSW",
    injectPwaMetaTags: true,
    swFilename: "sw.js",
    manifestFilename: "manifest.json",
    useCredentialsForManifestTag: false,
  },
  cordova: {},
  capacitor: { hideSplashscreen: true },
  electron: {
    inspectPort: 5858,
    bundler: "packager",
    packager: {},
    builder: { appId: "vues3" },
  },
  bex: { contentScripts: ["my-content-script"] },
}));
