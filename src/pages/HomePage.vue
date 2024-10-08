<template lang="pug">
q-drawer(bordered, show-if-above, side="right", v-model="rightDrawer")
  q-card(flat)
    q-card-section
      q-item
        q-item-section(avatar)
          q-icon(name="storage")
        q-item-section
          .text-overline {{ t("S3 Accounts") }}
    q-separator
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
            @click="(evt: Event) => { evt.stopPropagation(); lock(name); }",
            flat,
            padding="sm"
          )
        q-item-section
          q-item-label(overline) {{ name }}
          q-item-label(caption, v-if="name !== domain(String(name))") {{ domain(String(name)) }}
        q-item-section(side)
          .q-gutter-xs
            q-btn.gt-xs(
              @click="(evt: Event) => { evt.stopPropagation(); remove(name); }",
              dense,
              flat,
              icon="delete",
              size="md"
            )
            q-btn.gt-xs(
              @click="(evt: Event) => { evt.stopPropagation(); edit(name); }",
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
          .text-h5 vueS3
        q-card-section
          q-timeline(color="black", layout="comfortable", side="left")
            q-timeline-entry(:title="t('Homepage')", icon="home")
              template(#subtitle)
                a.text-no-wrap.text-white(
                  :href="`https://${t('vues3.com')}`",
                  rel="noopener noreferrer",
                  target="_blank"
                ) {{ t('vues3.com') }}
            q-timeline-entry(:title="t('Repository')", icon="share")
              template(#subtitle)
                a.text-no-wrap.text-white(
                  href="https://github.com/vues3",
                  rel="noopener noreferrer",
                  target="_blank"
                ) github.com/vues3
            q-timeline-entry(:title="t('Facebook')", icon="group")
              template(#subtitle)
                a.text-no-wrap.text-white(
                  :href="`https://${t('facebook.com/vues3')}`",
                  rel="noopener noreferrer",
                  target="_blank"
                ) {{ t('facebook.com/vues3') }}
        q-card-section
          .text-overline {{ t("ver") }}.: {{ APP_VERSION }}
</template>
<script setup lang="ts">
import type { TCredentials } from "stores/types";

import { useStorage } from "@vueuse/core";
import VCredsDialog from "components/VCredsDialog.vue";
import VOtpDialog from "components/VOtpDialog.vue";
import CryptoJS from "crypto-js";
import contentPage from "pages/ContentPage.vue";
import { useQuasar } from "quasar";
import { domain, rightDrawer } from "stores/app";
import { mergeDefaults } from "stores/defaults";
import { bucket, headBucket } from "stores/s3";
import { validateCredentials } from "stores/types";
import { triggerRef } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

const { t } = useI18n();
// eslint-disable-next-line no-undef
const APP_VERSION = __APP_VERSION__;
const router = useRouter();
const $q = useQuasar();
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
const getPin = async (name: string): Promise<string | undefined> =>
  new Promise((resolve, reject) => {
    if (name !== creds.value[name].Bucket) {
      const component = VOtpDialog;
      const value = creds.value[name].Bucket;
      const componentProps = { value };
      $q.dialog({ component, componentProps })
        .onOk((payload: string) => {
          resolve(payload);
        })
        .onCancel(() => {
          reject(new Error(t("Pin is not entered")));
        });
    } else resolve(undefined);
  });
const login = async (value: number | string) => {
  const name = value as string;
  const path = `/${name}`;
  const component = contentPage;
  if (!bucket.value)
    try {
      await headBucket(name, await getPin(name));
      bucket.value = name;
      router.addRoute({ component, name, path });
      router.push(path).catch(() => {});
    } catch (err) {
      bucket.value = "";
      const { message } = err as Error;
      $q.notify({ message });
    }
};
const add = () => {
  const component = VCredsDialog;
  $q.dialog({ component });
};
const edit = async (name: number | string) => {
  const component = VCredsDialog;
  const value = name;
  try {
    const pin = await getPin(name.toString());
    const componentProps = { pin, value };
    $q.dialog({ component, componentProps });
  } catch (err) {
    const { message } = err as Error;
    $q.notify({ message });
  }
};
const remove = (name: number | string) => {
  $q.dialog({
    cancel: true,
    message: t("Do you really want to remove an account from the list?"),
    title: t("Confirm"),
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
  $q.dialog({ component, componentProps }).onOk((payload: string) => {
    const cred = creds.value[name];
    if (name === cred.Bucket) {
      Object.keys(cred).forEach((key) => {
        cred[key] = CryptoJS.AES.encrypt(
          (cred[key] ?? "") as string,
          payload,
        ).toString();
      });
    } else {
      Object.keys(cred).forEach((key) => {
        cred[key] = CryptoJS.AES.decrypt(
          (cred[key] ?? "") as string,
          payload,
        ).toString(CryptoJS.enc.Utf8);
      });
    }
  });
};
</script>
