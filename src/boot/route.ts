/* -------------------------------------------------------------------------- */
/*                                   Imports                                  */
/* -------------------------------------------------------------------------- */
import type { BootCallback } from "@quasar/app-vite";

import { defineBoot } from "#q-app/wrappers";
import routes from "src/router/routes";
import { bucket } from "stores/io";

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

const callback: BootCallback = ({ router }) => {
  const [route] = routes;
  router.beforeEach(({ path }, from, next) => {
    if (["/", "/main"].includes(path)) next();
    else next("/");
    if (path === "/" && route) {
      bucket.value = "";
      router.clearRoutes();
      router.addRoute(route);
    }
  });
};

/* -------------------------------------------------------------------------- */
/*                                   Exports                                  */
/* -------------------------------------------------------------------------- */

export default defineBoot(callback);

/* -------------------------------------------------------------------------- */
