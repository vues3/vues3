import { MotionPlugin } from "@vueuse/motion";
import type { App } from "vue";

/**
 * @param {object} boot - Boot object
 * @param {App} boot.app - Vue app instance
 */
export default ({ app }: { app: App }) => {
  app.use(MotionPlugin);
};
