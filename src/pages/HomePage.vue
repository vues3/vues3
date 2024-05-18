<template lang="pug">
q-page.column
  .col.column.q-ma-md
    q-img.col.rounded-borders(no-spinner, src="~/assets/bg.jpg")
      q-card.absolute-right.min-w-300
        q-list
          q-item.shadow-12.q-my-md.rounded-borders(
            :key="name",
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
      q-card.absolute-left
        q-form(@submit="login")
          .row.q-col-gutter-x-md
            .col-12.col-md.min-w-300
              .text-overline WEBSITE
              q-select(
                :input-debounce,
                :options="creds",
                clearable,
                dark,
                filled,
                hint="",
                label="saved credentials",
                v-model="cred"
              )
                template(#prepend)
                  q-icon(name="save")
              q-input(
                :debounce,
                :rules="[(v) => !!v || 'Item is required']",
                dark,
                filled,
                label="domain",
                lazy-rules,
                placeholder="example.com",
                v-model.trim="bucket"
              )
                template(#prepend)
                  q-icon(name="language")
              q-input(
                :debounce,
                :rules="[(v) => !!v || 'Item is required']",
                dark,
                filled,
                label="access key id",
                lazy-rules,
                v-model.trim="accessKeyId"
              )
                template(#prepend)
                  q-icon(name="key")
              q-input(
                :debounce,
                :rules="[(v) => !!v || 'Item is required']",
                :type="isPwd ? 'password' : 'text'",
                dark,
                filled,
                label="secret access key",
                lazy-rules,
                v-model.trim="secretAccessKey"
              )
                template(#prepend)
                  q-icon(name="lock")
                template(#append)
                  q-icon.cursor-pointer(
                    :name="isPwd ? 'visibility_off' : 'visibility'",
                    @click="isPwd = !isPwd"
                  )
            .col-12.col-md.min-w-300
              .text-overline CLOUD
              q-select(
                :input-debounce,
                :options="providers",
                clearable,
                dark,
                filled,
                hint="",
                label="cloud provider",
                v-model="provider"
              )
                template(#prepend)
                  q-icon(name="cloud")
              q-select(
                :disable="provider && provider.label === 'yandex'",
                :input-debounce,
                :options="regions",
                :rules="[(v) => !!v || 'Item is required']",
                @input-value="(val) => { region = val; }",
                dark,
                fill-input,
                filled,
                hide-selected,
                label="region",
                lazy-rules,
                use-input,
                v-model.trim="region"
              )
                template(#prepend)
                  q-icon(name="flag")
              q-input(
                :debounce,
                :disable="!!provider",
                dark,
                filled,
                hint="",
                label="endpoint url",
                v-model.trim="endpoint"
              )
                template(#prepend)
                  q-icon(name="link")
          q-toggle.q-mb-md(label="remember credentials", v-model="remember")
          div
            q-btn.full-width(color="primary", label="LogIn", type="submit")
</template>
<script setup lang="ts">
import type { S3ClientConfig } from "@aws-sdk/client-s3";
import type { RemovableRef } from "@vueuse/core";
import type { TCredentials } from "stores/app";
import type { Ref } from "vue";

import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { FetchHttpHandler } from "@smithy/fetch-http-handler";
import { set, useStorage } from "@vueuse/core";
import { useQuasar } from "quasar";
import { rightDrawer, validateCredentials } from "stores/app";
import { debounce, inputDebounce, mergeDefaults } from "stores/defaults";
import { S3, bucket } from "stores/s3";
import { ref, watch } from "vue";
import { useRouter } from "vue-router";

interface IRegion {
  endpoint: string;
  label: string;
  region: string;
  regions: string[];
}

interface ICred {
  accessKeyId: string;
  endpoint: string;
  label: string;
  provider: string;
  region: string;
  secretAccessKey: string;
}

const router = useRouter();
const $q = useQuasar();
bucket.value = "";
rightDrawer.value = undefined;
const secretAccessKey = ref("");
const region = ref("");
const endpoint = ref("");
const isPwd = ref(true);
const remember = ref(true);
const accessKeyId: Ref<string | undefined> = ref();
const providers: IRegion[] = [
  {
    endpoint: "",
    label: "aws",
    region: "us-east-1",
    regions: [
      "us-east-2",
      "us-east-1",
      "us-west-1",
      "us-west-2",
      "af-south-1",
      "ap-east-1",
      "ap-southeast-3",
      "ap-south-1",
      "ap-northeast-3",
      "ap-northeast-2",
      "ap-southeast-1",
      "ap-southeast-2",
      "ap-northeast-1",
      "ca-central-1",
      "cn-north-1",
      "cn-northwest-1",
      "eu-central-1",
      "eu-west-1",
      "eu-west-2",
      "eu-south-1",
      "eu-west-3",
      "eu-north-1",
      "me-south-1",
      "sa-east-1",
    ],
  },
  {
    endpoint: "https://storage.yandexcloud.net",
    label: "yandex",
    region: "ru-central1",
    regions: ["ru-central1"],
  },
];
const provider: Ref<IRegion | undefined> = ref();
const regions = ref([]);
const creds: RemovableRef<ICred[]> = useStorage("vues3", []);
const cred: Ref<ICred | undefined> = ref();
watch(provider, (value) => {
  if (value) {
    set(regions, value.regions);
    set(region, value.region);
    set(endpoint, value.endpoint);
  } else {
    set(regions, []);
    set(region, "");
    set(endpoint, "");
  }
});
watch(cred, (value) => {
  if (value) {
    set(bucket, value.label);
    set(accessKeyId, value.accessKeyId);
    set(secretAccessKey, value.secretAccessKey);
    set(
      provider,
      providers.find(({ label }) => label === value.provider),
    );
    set(region, value.region);
    set(endpoint, value.endpoint);
  } else {
    set(bucket, "");
    set(accessKeyId, "");
    set(secretAccessKey, "");
    set(provider, undefined);
    set(region, "");
    set(endpoint, "");
  }
});
let s3Client: S3Client | undefined;
/** @see {@link https://fetch.spec.whatwg.org/#http-network-or-cache-fetch } */
const login = async () => {
  if (!s3Client)
    try {
      s3Client = new S3Client({
        credentials: {
          accessKeyId: accessKeyId.value,
          secretAccessKey: secretAccessKey.value,
        },
        endpoint: endpoint.value,
        region: region.value,
        requestHandler: new FetchHttpHandler({ keepAlive: false }),
      } as S3ClientConfig);
      set(creds, [
        ...creds.value.filter(({ label }) => label !== bucket.value),
        ...(remember.value
          ? [
              {
                accessKeyId: accessKeyId.value,
                endpoint: endpoint.value,
                label: bucket.value,
                provider: provider.value?.label,
                region: region.value,
                secretAccessKey: secretAccessKey.value,
              },
            ]
          : []),
      ]);
      await s3Client.send(
        new HeadBucketCommand({
          Bucket: bucket.value,
        }),
      );
      set(S3, s3Client);
      router.push("/content").catch(() => {});
    } catch (err) {
      s3Client = undefined;
      const { message } = err as Error;
      $q.notify({ message });
    }
};

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
</script>
<style lang="sass" scoped>
.min-w-300
  min-width: 300px !important
</style>
