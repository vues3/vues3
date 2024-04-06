// import "@unocss/reset/tailwind.css";
// eslint-disable-next-line import/no-unresolved
// import "virtual:uno.css";

import initUnocssRuntime from "@unocss/runtime";

import unocssConfig from "~/uno.config";

/** InitUnocssRuntime */
export default () => {
  initUnocssRuntime({
    autoPrefix: true,
    defaults: unocssConfig,
    // bypassDefined: true,
  });
};
