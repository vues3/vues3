<template lang="pug">
q-layout(view="hHh Lpr lff")
  q-header
    q-toolbar
      q-toolbar-title
        q-avatar(icon="img:/src/assets/favicon.svg", size="xl")
        | Vue.S3
      q-btn-dropdown.q-mr-xs(
        dropdown-icon="apps",
        flat,
        square,
        stretch,
        v-if="bucket"
      )
        q-list(padding)
          q-item(@click="click", clickable, v-close-popup)
            q-item-section(avatar)
              q-avatar(color="primary", icon="settings", text-color="white")
            q-item-section
              q-item-label Settings
          q-item(clickable, to="/", v-close-popup)
            q-item-section(avatar)
              q-avatar(color="primary", icon="logout", text-color="white")
            q-item-section
              q-item-label Logout
      q-btn(
        @click="rightDrawer = !rightDrawer",
        dense,
        flat,
        icon="more_vert",
        round
      )
  q-page-container.window-height
    router-view
</template>

<script setup lang="ts">
import type { TSettings } from "stores/types";

import VSettingsDialog from "components/VSettingsDialog.vue";
import { useQuasar } from "quasar";
import { rightDrawer } from "stores/app";
import { data } from "stores/data";
import { bucket } from "stores/s3";

declare global {
  interface Window {
    myWindowAPI: Record<string, () => void> | undefined;
  }
}
const $q = useQuasar();
const component = VSettingsDialog;
const click = () => {
  const componentProps = {
    ...(data.value?.settings ?? {}),
  };
  $q.dialog({ component, componentProps }).onOk((value: TSettings) => {
    if (data.value) data.value.settings = value;
  });
};
</script>
