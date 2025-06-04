<template lang="pug">
q-drawer(v-model="rightDrawer", bordered, show-if-above, side="right")
  q-card(flat)
    q-card-section
      q-item
        q-item-section(avatar)
          q-icon(name="storage")
        q-item-section
          .text-overline {{ t("S3 Accounts") }}
    q-separator
    .full-width.q-pt-lg.q-px-lg.q-pb-sm(
      v-if="$q.platform.is.electron || isFileSystemAccess()"
    )
      q-btn.fit(:label="t('Open...')", push, color="primary", @click="getDir")
    q-list(padding)
      q-item(
        v-for="[name, cred] in Object.entries(credential).sort()",
        :key="name",
        v-ripple,
        clickable,
        @click="login(name.toString())"
      )
        q-item-section(avatar)
          q-btn(
            :icon="name === cred.Bucket ? 'lock_open' : 'lock'",
            flat,
            padding="sm",
            @click="(evt: Event) => { evt.stopPropagation(); lock(name.toString()); }"
          )
        q-item-section
          q-item-label.rtl(overline, lines="1")
            span.plaintext {{ name }}
        q-item-section(side)
          .q-gutter-xs
            q-btn.gt-xs(
              dense,
              flat,
              icon="delete",
              size="md",
              @click="(evt: Event) => { evt.stopPropagation(); remove(name); }"
            )
            q-btn.gt-xs(
              dense,
              flat,
              icon="edit",
              size="md",
              @click="(evt: Event) => { evt.stopPropagation(); edit(name); }"
            )
    q-card-actions(vertical)
      q-btn(fab, icon="add", round, @click="add")
q-page.column
  .col.column.q-ma-md
    q-img.col.rounded-borders(no-spinner, src="~/assets/bg.jpg")
      q-card.absolute-center.backdrop-blur-sm
        q-card-section
          .text-h5 VueBro
        q-card-section
          q-timeline(color="black", layout="comfortable", side="left")
            q-timeline-entry(:title="t('Homepage')", icon="home")
              template(#subtitle)
                a.text-no-wrap.text-white(
                  :href="`https://${t('vuebro.github.io')}`",
                  rel="noopener noreferrer",
                  target="_blank"
                ) {{ t("vuebro.github.io") }}
            q-timeline-entry(:title="t('Repository')", icon="share")
              template(#subtitle)
                a.text-no-wrap.text-white(
                  href="https://github.com/vuebro",
                  rel="noopener noreferrer",
                  target="_blank"
                ) github.com/vuebro
            q-timeline-entry(:title="t('Facebook')", icon="group")
              template(#subtitle)
                a.text-no-wrap.text-white(
                  :href="`https://${t('facebook.com/vuebro')}`",
                  rel="noopener noreferrer",
                  target="_blank"
                ) {{ t("facebook.com/vuebro") }}
        q-card-section
          .text-overline {{ t("ver") }}.: {{ APP_VERSION }}
</template>
<script setup lang="ts">
import type { TCredentials } from "@vuebro/shared";

import { consoleError, validateCredentials } from "@vuebro/shared";
import { useStorage } from "@vueuse/core";
import VCredsDialog from "components/dialogs/VCredsDialog.vue";
import VOtpDialog from "components/dialogs/VOtpDialog.vue";
import CryptoJS from "crypto-js";
import contentPage from "pages/ContentPage.vue";
import { useQuasar } from "quasar";
import { rightDrawer } from "stores/app";
import { mergeDefaults, persistent } from "stores/defaults";
import { bucket, headBucket, setFileSystemDirectoryHandle } from "stores/io";
import { triggerRef } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

const { t } = useI18n();

const $q = useQuasar(),
  // eslint-disable-next-line no-undef
  APP_VERSION = __APP_VERSION__,
  credential = useStorage(
    "@",
    () => {
      const value = {} as TCredentials;
      validateCredentials?.(value) as boolean;
      return value;
    },
    localStorage,
    { mergeDefaults },
  ),
  router = useRouter();

const add = () => {
    $q.dialog({ component: VCredsDialog, componentProps: { persistent } });
  },
  directLogin = (bucketValue: string) => {
    const name = "main",
      path = `/${name}`;
    bucket.value = bucketValue;
    router.addRoute({ component: contentPage, name, path });
    router.push(path).catch(consoleError);
  },
  getDir = async () => {
    if ($q.platform.is.electron) {
      const {
        filePaths: [filePath],
      } = await window.dialog.showOpenDialog({
        properties: ["openDirectory"],
      });
      if (filePath) directLogin(filePath);
    } else
      try {
        const dirHandle = await window.showDirectoryPicker({
          mode: "readwrite",
        });
        setFileSystemDirectoryHandle(dirHandle);
        const { name } = dirHandle;
        directLogin(name);
      } catch (err) {
        const { message } = err as Error;
        $q.notify({ message });
      }
  },
  getPin = async (name: string): Promise<string | undefined> =>
    new Promise((resolve, reject) => {
      if (name !== credential.value[name]?.Bucket) {
        $q.dialog({
          component: VOtpDialog,
          componentProps: { model: credential.value[name]?.Bucket },
        })
          .onOk((payload: string) => {
            resolve(payload);
          })
          .onCancel(() => {
            reject(new Error(t("Pin is not entered")));
          });
      } else resolve(undefined);
    }),
  isFileSystemAccess = () => "showOpenFilePicker" in window,
  lock = (name: string) => {
    $q.dialog({
      component: VOtpDialog,
      componentProps: {
        model:
          name === credential.value[name]?.Bucket
            ? undefined
            : credential.value[name]?.Bucket,
      },
    }).onOk((payload: string) => {
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
  },
  login = async (bucketValue: string) => {
    try {
      await headBucket(bucketValue, await getPin(bucketValue));
      directLogin(bucketValue);
    } catch (err) {
      const { message } = err as Error;
      $q.notify({ message });
    }
  },
  remove = (name: number | string) => {
    $q.dialog({
      cancel: true,
      message: t("Do you really want to remove an account from the list?"),
      title: t("Confirm"),
    }).onOk(() => {
      Reflect.deleteProperty(credential.value, name.toString());
      triggerRef(credential);
    });
  };

const edit = async (name: number | string) => {
  try {
    $q.dialog({
      component: VCredsDialog,
      componentProps: {
        model: name,
        persistent,
        pin: await getPin(name.toString()),
      },
    });
  } catch (err) {
    const { message } = err as Error;
    $q.notify({ message });
  }
};
</script>

<style scope>
.rtl {
  direction: rtl;
}
.plaintext {
  unicode-bidi: plaintext;
}
</style>
