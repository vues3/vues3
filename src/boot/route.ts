import privateItems from "assets/private.json";
import publicItems from "assets/public.json";
import { S3 } from "stores/s3";
import type { Router } from "vue-router";
/**
 * @param boot - Boot object
 * @param boot.router - Instance of Vue Router from src/router/index.js
 */
export default ({ router }: { router: Router }) => {
  const privateTo = privateItems.map((val) => val.to);
  const publicTo = publicItems.map((val) => val.to);

  router.beforeEach(({ path }, from, next) => {
    if (
      (S3.value && !privateTo.includes(path)) ||
      (!S3.value && !publicTo.includes(path))
    )
      next("/");
    else next();
    if (path === "/") S3.value = undefined;
  });
};
