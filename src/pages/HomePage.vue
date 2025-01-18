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
    .full-width.q-pt-lg.q-px-lg.q-pb-sm(v-if="$q.platform.is.electron || isFileSystemAccess()")
      q-btn.fit(:label="t('Open...')", push, @click="getDir", color="primary")
    q-list(padding)
      q-item(
        :key="name",
        @click="login(name.toString())",
        clickable,
        v-for="(cred, name) in credential",
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
          q-item-label.rtl(overline, lines="1")
            span.plaintext {{ name }}
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
      q-card.backdrop-blur-sm.absolute-center
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
/* -------------------------------------------------------------------------- */
/*                                   Imports                                  */
/* -------------------------------------------------------------------------- */

import type { TCredentials } from "@vues3/shared";
import type { RemovableRef } from "@vueuse/core";
import type { QVueGlobals } from "quasar";
import type { Component } from "vue";
import type { ComposerTranslation } from "vue-i18n";
import type { Router } from "vue-router";

import { validateCredentials } from "@vues3/shared";
import { useStorage } from "@vueuse/core";
import VCredsDialog from "components/VCredsDialog.vue";
import VOtpDialog from "components/VOtpDialog.vue";
import CryptoJS from "crypto-js";
import contentPage from "pages/ContentPage.vue";
import { useQuasar } from "quasar";
import { rightDrawer } from "stores/app";
import { mergeDefaults } from "stores/defaults";
import { bucket, headBucket, setFileSystemDirectoryHandle } from "stores/io";
import { triggerRef } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

// eslint-disable-next-line no-undef
const APP_VERSION: string = __APP_VERSION__;

/* -------------------------------------------------------------------------- */

const mode = "readwrite";

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

/** Generate a default value for the credentials storage */

const credentialDefaults: () => TCredentials = () => {
  const value = {} as TCredentials;
  validateCredentials?.(value) as boolean;
  return value;
};

/* -------------------------------------------------------------------------- */
/*                                 Composables                                */
/* -------------------------------------------------------------------------- */

const router: Router = useRouter();

/* -------------------------------------------------------------------------- */

const $q: QVueGlobals = useQuasar();

/* -------------------------------------------------------------------------- */

/** A credential storage reference */

const credential: RemovableRef<TCredentials> = useStorage(
  "@",
  credentialDefaults,
  localStorage,
  { mergeDefaults },
);

/* -------------------------------------------------------------------------- */

const { t }: { t: ComposerTranslation } = useI18n();

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

const isFileSystemAccess: () => boolean = () => "showOpenFilePicker" in window;

/* -------------------------------------------------------------------------- */

const directLogin: (bucketValue: string) => void = (bucketValue) => {
  const name = "main";
  const path = `/${name}`;
  const component = contentPage as Component;
  bucket.value = bucketValue;
  router.addRoute({ component, name, path });
  router.push(path).catch((error: unknown) => {
    window.console.error(error);
  });
};

/* -------------------------------------------------------------------------- */

const getDir: () => Promise<void> = async () => {
  if ($q.platform.is.electron) {
    const {
      filePaths: [filePath],
    } = await window.dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    if (filePath) directLogin(filePath);
  } else
    try {
      const dirHandle = await window.showDirectoryPicker({ mode });
      setFileSystemDirectoryHandle(dirHandle);
      const { name } = dirHandle;
      directLogin(name);
    } catch (e) {
      //
    }
};

/* -------------------------------------------------------------------------- */

const getPin: (name: string) => Promise<null | string> = async (name) =>
  new Promise((resolve, reject) => {
    if (name !== credential.value[name]?.Bucket) {
      const component = VOtpDialog as Component;
      const value = credential.value[name]?.Bucket;
      const componentProps = { value };
      $q.dialog({ component, componentProps })
        .onOk((payload: string) => {
          resolve(payload);
        })
        .onCancel(() => {
          reject(new Error(t("Pin is not entered")));
        });
    } else resolve(null);
  });

/* -------------------------------------------------------------------------- */

const login: (bucketValue: string) => Promise<void> = async (bucketValue) => {
  try {
    await headBucket(bucketValue, await getPin(bucketValue));
    directLogin(bucketValue);
  } catch (err) {
    const { message } = err as Error;
    $q.notify({ message });
  }
};

/* -------------------------------------------------------------------------- */

const add: () => void = () => {
  const component = VCredsDialog as Component;
  $q.dialog({ component });
};

/* -------------------------------------------------------------------------- */

const edit: (name: number | string) => Promise<void> = async (name) => {
  const component = VCredsDialog as Component;
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

/* -------------------------------------------------------------------------- */

const remove: (name: number | string) => void = (name) => {
  $q.dialog({
    cancel: true,
    message: t("Do you really want to remove an account from the list?"),
    title: t("Confirm"),
  }).onOk(() => {
    Reflect.deleteProperty(credential.value, name.toString());
    triggerRef(credential);
  });
};

/* -------------------------------------------------------------------------- */

const lock: (name: number | string) => void = (name) => {
  const value =
    name === credential.value[name]?.Bucket
      ? undefined
      : credential.value[name]?.Bucket;
  const componentProps = { value };
  const component = VOtpDialog as Component;
  $q.dialog({ component, componentProps }).onOk((payload: string) => {
    const cred = credential.value[name];
    if (cred)
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

/* -------------------------------------------------------------------------- */
</script>

<style scope lang="sass">
/* -------------------------------------------------------------------------- */
/*                                   Classes                                  */
/* -------------------------------------------------------------------------- */

.rtl
  direction: rtl

/* -------------------------------------------------------------------------- */

.plaintext
  unicode-bidi: plaintext

/* -------------------------------------------------------------------------- */
</style>
