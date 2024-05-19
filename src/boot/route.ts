import type { Router } from "vue-router";

import privateItems from "assets/private.json";
import publicItems from "assets/public.json";
import { bucket } from "stores/s3";

export default ({ router }: { router: Router }) => {
  const privateTo = privateItems.map((val) => val.to);
  const publicTo = publicItems.map((val) => val.to);

  router.beforeEach(({ path }, from, next) => {
    if (
      (bucket.value && !privateTo.includes(path)) ||
      (!bucket.value && !publicTo.includes(path))
    )
      next("/");
    else next();
    if (path === "/") bucket.value = "";
  });
};
