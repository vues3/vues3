import initUnocssRuntime from "@unocss/runtime";
import unocssConfig from "app/uno.config";

export default () => {
  initUnocssRuntime({
    autoPrefix: true,
    defaults: unocssConfig,
    // bypassDefined: true,
  });
};
