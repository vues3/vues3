import "@unocss/reset/tailwind-compat.css";
import initUnocssRuntime from "@unocss/runtime";
import { autoPrefix } from "app/src/stores/defaults";
import defaults from "app/uno.config";

export default () => {
  initUnocssRuntime({ autoPrefix, defaults });
};
