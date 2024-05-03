import { MotionPlugin } from "@vueuse/motion";
import type { App } from "vue";

/**
 * @param boot - Boot object
 * @param boot.app - Vue app instance
 */
export default ({ app }: { app: App }) => {
  app.use(MotionPlugin);
};
