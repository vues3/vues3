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
          q-avatar(color="black", icon="directions", text-color="white")
        q-item-section
          q-item-label {{ name }}
        q-item-section(side)
          .q-gutter-xs
            q-btn.gt-xs(
              @click="(evt) => { evt.stopPropagation(); remove(name); }",
              dense,
              flat,
              icon="delete",
              round,
              size="12px"
            )
            q-btn.gt-xs(
              @click="(evt) => { evt.stopPropagation(); edit(name); }",
              dense,
              flat,
              icon="edit",
              round,
              size="12px"
            )
            q-btn(dense, flat, icon="lock", round, size="12px")
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
</script>
<style lang="sass" scoped>
.min-w-300
  min-width: 300px !important
</style>
