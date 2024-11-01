import { boot } from "quasar/wrappers";
import routes from "src/router/routes";
import { bucket } from "stores/io";

export default boot(({ router }) => {
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
});
