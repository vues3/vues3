import { isDefined, set } from "@vueuse/core";
import { storeToRefs } from "pinia";

import privateItems from "@/assets/private.json";
import publicItems from "@/assets/public.json";
import storeS3 from "@/stores/s3";
/**
 * @param {object} boot - Boot object
 * @param {object} boot.router - Instance of Vue Router from src/router/index.js
 */
export default ({ router }) => {
  const { S3 } = storeToRefs(storeS3());

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
