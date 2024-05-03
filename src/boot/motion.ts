import type { App } from "vue";

import { MotionPlugin } from "@vueuse/motion";

export default ({ app }: { app: App }) => {
  app.use(MotionPlugin);
};
