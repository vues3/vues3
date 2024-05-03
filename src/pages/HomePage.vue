<template lang="pug">
q-page.column
  .col.column.q-ma-md
    q-img.col.rounded-borders(src="~/assets/bg.jpg", no-spinner)
      q-card.absolute-center
        q-form(@submit="login")
          .row.q-col-gutter-x-md
            .col-12.col-md.min-w-300
              .text-overline WEBSITE
              q-select(
                v-model="cred",
                dark,
                filled,
                clearable,
                label="saved credentials",
                :options="creds",
                hint=""
              )
                template(#prepend)
                  q-icon(name="save")
              q-input(
                v-model.trim="bucket",
                :rules="[(v) => !!v || 'Item is required']",
                lazy-rules,
                dark,
                filled,
                label="domain",
                placeholder="example.com"
              )
                template(#prepend)
                  q-icon(name="language")
              q-input(
                v-model.trim="accessKeyId",
                :rules="[(v) => !!v || 'Item is required']",
                lazy-rules,
                dark,
                filled,
                label="access key id"
              )
                template(#prepend)
                  q-icon(name="key")
              q-input(
                v-model.trim="secretAccessKey",
                :rules="[(v) => !!v || 'Item is required']",
                lazy-rules,
                dark,
                label="secret access key",
                filled,
                :type="isPwd ? 'password' : 'text'"
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
                v-model="provider",
                clearable,
                :options="providers",
                dark,
                filled,
                label="cloud provider",
                hint=""
              )
                template(#prepend)
                  q-icon(name="cloud")
              q-select(
                v-model.trim="region",
                use-input,
                filled,
                hide-selected,
                fill-input,
                input-debounce="0",
                :options="regions",
                label="region",
                lazy-rules,
                :rules="[(v) => !!v || 'Item is required']",
                dark,
                :disable="provider && provider.label === 'yandex'",
                @input-value="(val) => { region = val; }"
              )
                template(#prepend)
                  q-icon(name="flag")
              q-input(
                v-model.trim="endpoint",
                dark,
                filled,
                label="endpoint url",
                :disable="!!provider",
                hint=""
              )
                template(#prepend)
                  q-icon(name="link")
              q-input(
                v-model.trim="wendpoint",
                dark,
                filled,
                label="website endpoint url",
                :disable="!!provider",
                hint=""
              )
                template(#prepend)
                  q-icon(name="web")
          q-toggle.q-mb-md(v-model="remember", label="remember credentials")
          div
            q-btn.full-width(label="LogIn", type="submit", color="primary")
</template>
<script setup lang="ts">
import type { S3ClientConfig } from "@aws-sdk/client-s3";
import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { FetchHttpHandler } from "@smithy/fetch-http-handler";
import type { RemovableRef } from "@vueuse/core";
import { set, useStorage } from "@vueuse/core";
import { useQuasar } from "quasar";
import { accessKeyId, rightDrawer } from "stores/app";
import { bucket, S3, wendpoint } from "stores/s3";
import type { Ref } from "vue";
import { ref, watch } from "vue";
import { useRouter } from "vue-router";

interface IRegion {
  label: string;
  regions: string[];
  region: string;
  endpoint: string;
  wendpoint: string;
}

interface ICred {
  label: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  endpoint: string;
  wendpoint: string;
  provider: string;
}

const router = useRouter();
const $q = useQuasar();
accessKeyId.value = undefined;
bucket.value = "";
wendpoint.value = "";
rightDrawer.value = undefined;
const secretAccessKey = ref("");
const region = ref("");
const endpoint = ref("");
const isPwd = ref(true);
const remember = ref(true);
const providers: IRegion[] = [
  {
    label: "aws",
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
    region: "us-east-1",
    endpoint: "",
    /** @returns - Wendpoint */
    get wendpoint() {
      return `https://s3.${region.value}.amazonaws.com`;
    },
  },
  {
    label: "yandex",
    regions: ["ru-central1"],
    region: "ru-central1",
    endpoint: "https://storage.yandexcloud.net",
    wendpoint: "https://website.yandexcloud.net",
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
watch(region, () => {
  if (provider.value) set(wendpoint, provider.value.wendpoint);
  else set(wendpoint, "");
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
    set(wendpoint, value.wendpoint);
  } else {
    set(bucket, "");
    set(accessKeyId, "");
    set(secretAccessKey, "");
    set(provider, undefined);
    set(region, "");
    set(endpoint, "");
    set(wendpoint, "");
  }
});
let s3Client: S3Client | undefined;
/** { @link https://fetch.spec.whatwg.org/#http-network-or-cache-fetch } */
const login = async () => {
  if (!s3Client)
    try {
      s3Client = new S3Client(<S3ClientConfig>{
        region: region.value,
        endpoint: endpoint.value,
        credentials: {
          accessKeyId: accessKeyId.value,
          secretAccessKey: secretAccessKey.value,
        },
        requestHandler: new FetchHttpHandler({ keepAlive: false }),
      });
      set(creds, [
        ...creds.value.filter(({ label }) => label !== bucket.value),
        ...(remember.value
          ? [
              {
                label: bucket.value,
                accessKeyId: accessKeyId.value,
                secretAccessKey: secretAccessKey.value,
                region: region.value,
                endpoint: endpoint.value,
                wendpoint: wendpoint.value,
                provider: provider.value?.label,
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
      void router.push("/content");
    } catch (err) {
      s3Client = undefined;
      const { message } = <Error>err;
      $q.notify({ message });
    }
};
</script>
<style lang="sass" scoped>
.min-w-300
  min-width: 300px !important
</style>
