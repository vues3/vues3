<template lang="pug">
q-page.column
  .col.column.q-ma-md
    q-img.col.rounded-borders(no-spinner, src="~/assets/bg.jpg")
      q-card.absolute-right.min-w-300.q-ma-xl
        q-list
          q-item.shadow-12.q-my-md.rounded-borders(
            :key="name",
            @click="login(name)",
            clickable,
            v-for="(cred, name) in creds",
            v-ripple
          )
            q-item-section(avatar)
              q-avatar(color="white", icon="directions", text-color="black")
            q-item-section
              q-item-label {{ name }}
            q-item-section(side)
              .q-gutter-xs.text-white
                q-btn.gt-xs(dense, flat, icon="delete", round, size="12px")
                q-btn.gt-xs(dense, flat, icon="done", round, size="12px")
                q-btn(dense, flat, icon="more_vert", round, size="12px")
</template>
<script setup lang="ts">
import type { TCredentials } from "stores/types";

import { useStorage } from "@vueuse/core";
import { useQuasar } from "quasar";
import { rightDrawer } from "stores/app";
import { mergeDefaults } from "stores/defaults";
import { bucket, headBucket } from "stores/s3";
import { validateCredentials } from "stores/types";
import { useRouter } from "vue-router";

const router = useRouter();
const $q = useQuasar();
rightDrawer.value = undefined;
const creds = useStorage(
  "@",
  () => {
    const value = {} as TCredentials;
    validateCredentials(value);
    return value;
  },
  localStorage,
  { mergeDefaults },
);
const login = async (key: number | string) => {
  if (!bucket.value)
    try {
      await headBucket(key.toString());
      bucket.value = key.toString();
      router.push("/content").catch(() => {});
    } catch (err) {
      bucket.value = "";
      const { message } = err as Error;
      $q.notify({ message });
    }
};
</script>
<style lang="sass" scoped>
.min-w-300
  min-width: 300px !important
</style>
