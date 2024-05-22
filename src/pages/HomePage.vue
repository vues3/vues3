<template lang="pug">
q-drawer(bordered, side="right", v-model="rightDrawer")
  q-card(flat)
    q-list(padding)
      q-item(
        :key="name",
        @click="login(name)",
        clickable,
        v-for="(cred, name) in creds",
        v-ripple
      )
        q-item-section(avatar)
          q-btn(
            :icon="name === cred.Bucket ? 'lock_open' : 'lock'",
            @click="(evt) => { evt.stopPropagation(); lock(name); }",
            flat,
            padding="sm"
          )
        q-item-section
          q-item-label {{ name }}
        q-item-section(side)
          .q-gutter-xs
            q-btn.gt-xs(
              @click="(evt) => { evt.stopPropagation(); remove(name); }",
              dense,
              flat,
              icon="delete",
              size="md"
            )
            q-btn.gt-xs(
              @click="(evt) => { evt.stopPropagation(); edit(name); }",
              dense,
              flat,
              icon="edit",
              size="md"
            )
    q-card-actions(vertical)
      q-btn(@click="add", fab, icon="add", round)
q-page.column
  .col.column.q-ma-md
    q-img.col.rounded-borders(no-spinner, src="~/assets/bg.jpg")
      q-card.absolute-center
        q-card-section
          .text-h5 Vue.S3
        q-card-section
          q-timeline(color="black", layout="comfortable", side="left")
            q-timeline-entry(icon="rocket_launch", title="Homepage")
              template(#subtitle)
                a.text-white(
                  href="https://vues3.ru",
                  rel="noopener noreferrer",
                  target="_blank"
                ) vues3.ru
            q-timeline-entry(icon="share", title="Repository")
              template(#subtitle)
                a.text-white(
                  href="https://github.com/vues3",
                  rel="noopener noreferrer",
                  target="_blank"
                ) github.com/vues3
</template>
<script setup lang="ts">
import type { TCredentials } from "stores/types";

import { useStorage } from "@vueuse/core";
import VCredsDialog from "components/VCredsDialog.vue";
import VOtpDialog from "components/VOtpDialog.vue";
import CryptoJS from "crypto-js";
import { useQuasar } from "quasar";
import { rightDrawer } from "stores/app";
import { mergeDefaults } from "stores/defaults";
import { bucket, headBucket } from "stores/s3";
import { validateCredentials } from "stores/types";
import { triggerRef } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const $q = useQuasar();
rightDrawer.value = true;
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
  if (!bucket.value) {
    // if (key !== creds.value[name].Bucket)
    //   $q.dialog({
    //     component: VOtpDialog,
    //     componentProps: {
    //       value: key,
    //     },
    //   }).onOk((data: string) => {});
    try {
      await headBucket(key.toString());
      bucket.value = key.toString();
      router.push("/content").catch(() => {});
    } catch (err) {
      bucket.value = "";
      const { message } = err as Error;
      $q.notify({ message });
    }
  }
};
const add = () => {
  const component = VCredsDialog;
  $q.dialog({ component });
};
const edit = (name: number | string) => {
  const component = VCredsDialog;
  const value = name;
  const componentProps = { value };
  $q.dialog({ component, componentProps });
};
const remove = (name: number | string) => {
  $q.dialog({
    cancel: true,
    message: "Вы действительно хотите удалить учетную запись из списка?",
    title: "Подтверждение",
  }).onOk(() => {
    Reflect.deleteProperty(creds.value, name.toString());
    triggerRef(creds);
  });
};
const lock = (name: number | string) => {
  const value =
    name === creds.value[name].Bucket ? undefined : creds.value[name].Bucket;
  const componentProps = { value };
  const component = VOtpDialog;
  $q.dialog({ component, componentProps }).onOk((data: string) => {
    if (name === creds.value[name].Bucket) {
      creds.value[name].Bucket = CryptoJS.AES.encrypt(
        creds.value[name].Bucket,
        data,
      ).toString();
      creds.value[name].accessKeyId = CryptoJS.AES.encrypt(
        creds.value[name].accessKeyId ?? "",
        data,
      ).toString();
      creds.value[name].endpoint = CryptoJS.AES.encrypt(
        creds.value[name].endpoint,
        data,
      ).toString();
      creds.value[name].region = CryptoJS.AES.encrypt(
        creds.value[name].region,
        data,
      ).toString();
      creds.value[name].secretAccessKey = CryptoJS.AES.encrypt(
        creds.value[name].secretAccessKey ?? "",
        data,
      ).toString();
    } else {
      creds.value[name].Bucket = CryptoJS.AES.decrypt(
        creds.value[name].Bucket,
        data,
      ).toString(CryptoJS.enc.Utf8);
      creds.value[name].accessKeyId = CryptoJS.AES.decrypt(
        creds.value[name].accessKeyId ?? "",
        data,
      ).toString(CryptoJS.enc.Utf8);
      creds.value[name].endpoint = CryptoJS.AES.decrypt(
        creds.value[name].endpoint,
        data,
      ).toString(CryptoJS.enc.Utf8);
      creds.value[name].region = CryptoJS.AES.decrypt(
        creds.value[name].region,
        data,
      ).toString(CryptoJS.enc.Utf8);
      creds.value[name].secretAccessKey = CryptoJS.AES.decrypt(
        creds.value[name].secretAccessKey ?? "",
        data,
      ).toString(CryptoJS.enc.Utf8);
    }
  });
};
</script>
<style lang="sass" scoped>
.min-w-300
  min-width: 300px !important
</style>
