import { MotionPlugin } from "@vueuse/motion";
import type { App } from "vue";

export default ({ app }: { app: App }) => {
  app.use(MotionPlugin);
};
