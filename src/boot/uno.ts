import initUnocssRuntime from "@unocss/runtime";
import unocssConfig from "app/uno.config";

/** InitUnocssRuntime */
export default () => {
  initUnocssRuntime({
    autoPrefix: true,
    defaults: unocssConfig,
    // bypassDefined: true,
  });
};
