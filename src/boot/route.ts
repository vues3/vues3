import { defineBoot } from "#q-app/wrappers";
import routes from "src/router/routes";
import { bucket } from "stores/io";

export default defineBoot(({ router }) => {
  const [route] = routes;
  router.beforeEach(({ path }, from, next) => {
    if (["/", "/main"].includes(path)) next();
    else next("/");
    if (path === "/") {
      bucket.value = "";
      router.clearRoutes();
      router.addRoute(route);
    }
  });
});
