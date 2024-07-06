import type { Router } from "vue-router";

import routes from "src/router/routes";
import { bucket } from "stores/s3";

export default ({ router }: { router: Router }) => {
  const [route] = routes;
  router.beforeEach(({ path }, from, next) => {
    if (`/${bucket.value}` === path) next();
    else next("/");
    if (path === "/") {
      bucket.value = "";
      router.clearRoutes();
      router.addRoute(route);
    }
  });
};
