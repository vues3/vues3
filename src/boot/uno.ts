import "@unocss/reset/tailwind-compat.css";
import initUnocssRuntime from "@unocss/runtime";
import defaults from "app/uno.config";

export default () => {
  initUnocssRuntime({ defaults });
};
