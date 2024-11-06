import { route } from "quasar/wrappers";
import { createMemoryHistory, createRouter } from "vue-router";

import routes from "./routes";

export default route(() => {
  const history = createMemoryHistory(process.env.VUE_ROUTER_BASE);
  return createRouter({ history, routes });
});
