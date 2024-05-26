import type { App } from "vue";

import { Icon } from "@iconify/vue";

export default ({ app }: { app: App }) => {
  // eslint-disable-next-line vue/multi-word-component-names
  app.component("Icon", Icon);
};
