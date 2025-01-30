import { defineBoot } from "#q-app/wrappers";
import routes from "src/router/routes";
import { bucket } from "stores/io";

/* -------------------------------------------------------------------------- */

export default defineBoot(({ router }) => {
  const [route] = routes;
  router.beforeEach(({ path }, _from, next) => {
    if (["/", "/main"].includes(path)) next();
    else next("/");
    if (path === "/" && route) {
      bucket.value = "";
      router.clearRoutes();
      router.addRoute(route);
    }
  });
});
