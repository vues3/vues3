import { MotionPlugin } from "@vueuse/motion";

/**
 * @param {object} boot - Boot object
 * @param {object} boot.app - Vue app instance
 */
export default ({ app }) => {
  app.use(MotionPlugin);
};
