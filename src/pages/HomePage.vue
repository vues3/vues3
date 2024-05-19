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
            v-for="(credential, name) in credentials",
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
import type { S3ClientConfig } from "@aws-sdk/client-s3";
import type { TCredentials } from "stores/types";

import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { FetchHttpHandler } from "@smithy/fetch-http-handler";
import { useStorage } from "@vueuse/core";
import { useQuasar } from "quasar";
import { rightDrawer } from "stores/app";
import { mergeDefaults } from "stores/defaults";
import { S3, bucket } from "stores/s3";
import { validateCredentials } from "stores/types";
import { useRouter } from "vue-router";

const router = useRouter();
const $q = useQuasar();
bucket.value = "";
rightDrawer.value = undefined;
let s3Client: S3Client | undefined;
const credentials = useStorage(
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
  if (!s3Client)
    try {
      const requestHandler = new FetchHttpHandler({ keepAlive: false });
      const { Bucket, accessKeyId, endpoint, region, secretAccessKey } =
        credentials.value[key];
      s3Client = new S3Client({
        credentials: { accessKeyId, secretAccessKey },
        endpoint,
        region,
        requestHandler,
      } as S3ClientConfig);
      await s3Client.send(new HeadBucketCommand({ Bucket }));
      bucket.value = Bucket;
      S3.value = s3Client;
      router.push("/content").catch(() => {});
    } catch (err) {
      bucket.value = "";
      s3Client = undefined;
      const { message } = err as Error;
      $q.notify({ message });
    }
};
</script>
<style lang="sass" scoped>
.min-w-300
  min-width: 300px !important
</style>
