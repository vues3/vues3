<template lang="pug">
q-layout(view="hHh Lpr lff")
  q-header
    q-bar.q-electron-drag(v-if="$q.platform.is.electron")
      q-icon(name="laptop_chromebook")
      div Vue.S3
      q-space
      q-btn(@click="minimize", dense, flat, icon="minimize")
      q-btn(@click="toggleMaximize", dense, flat, icon="crop_square")
      q-btn(@click="closeApp", dense, flat, icon="close")
    q-toolbar
      q-btn(@click="leftDrawer = !leftDrawer", dense, flat, icon="menu", round)
      q-toolbar-title
        q-avatar(icon="img:/favicon.svg", size="xl")
        | Vue.S3
      q-btn(
        @click="rightDrawer = !rightDrawer",
        dense,
        flat,
        icon="more_vert",
        round,
        v-if="rightDrawer !== undefined"
      )
  q-drawer(
    :mini="miniState",
    @blur="miniState = true",
    @focus="miniState = false",
    @mouseout="miniState = true",
    @mouseover="miniState = false",
    bordered,
    mini-to-overlay,
    show-if-above,
    side="left",
    v-model="leftDrawer"
  )
    q-list
      q-item(
        :key="item.title",
        v-for="item in items",
        v-bind="item",
        :to="item.to",
        clickable
      )
        q-item-section(avatar, v-if="item.icon")
          q-icon(:name="item.icon")
        q-item-section
          q-item-label {{ item.title }}
  q-page-container.window-height
    router-view
</template>

<script setup lang="ts">
import privateItems from "assets/private.json";
import publicItems from "assets/public.json";
import { useQuasar } from "quasar";
import { rightDrawer } from "stores/app";
import { bucket } from "stores/s3";
import { computed, ref } from "vue";

declare global {
  interface Window {
    myWindowAPI: Record<string, () => void> | undefined;
  }
}
const $q = useQuasar();
const leftDrawer = ref(false);
const miniState = ref(true);
const items = computed(() => (bucket.value ? privateItems : publicItems));
const minimize = () => {
  window.myWindowAPI?.minimize();
};
const toggleMaximize = () => {
  window.myWindowAPI?.toggleMaximize();
};
const closeApp = () => {
  window.myWindowAPI?.close();
};
</script>
