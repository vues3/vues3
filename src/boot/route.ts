import { isDefined, set } from "@vueuse/core";
import type { Router } from "vue-router";

import privateItems from "@/assets/private.json";
import publicItems from "@/assets/public.json";
import { S3 } from "@/stores/s3";
/**
 * @param {object} boot - Boot object
 * @param {object} boot.router - Instance of Vue Router from src/router/index.js
 */
export default ({ router }: { router: Router }) => {
  const privateTo = privateItems.map((val) => val.to);
  const publicTo = publicItems.map((val) => val.to);

  router.beforeEach(({ path }, from, next) => {
    if (
      (isDefined(S3) && !privateTo.includes(path)) ||
      (!isDefined(S3) && !publicTo.includes(path))
    )
      next("/");
    else next();
    if (path === "/") set(S3, undefined);
  });
};
