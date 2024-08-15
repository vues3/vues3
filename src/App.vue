<template lang="pug">
q-layout(view="hHh Lpr lff")
  q-header
    q-toolbar
      q-toolbar-title
        q-avatar(icon="img:favicon.svg", size="xl")
        | Vue.S3
      q-btn-dropdown.q-mr-xs(
        dropdown-icon="apps",
        flat,
        square,
        stretch,
        v-if="bucket"
      )
        q-list(padding)
          q-item(
            @click="() => { click('VImportmapDialog'); }",
            clickable,
            v-close-popup
          )
            q-item-section(avatar)
              q-avatar(color="primary", icon="map", text-color="white")
            q-item-section
              q-item-label Import Map
          q-item(
            @click="() => { click('VStyleDialog'); }",
            clickable,
            v-close-popup
          )
            q-item-section(avatar)
              q-avatar(color="primary", icon="style", text-color="white")
            q-item-section
              q-item-label CSS
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
import "@unocss/reset/tailwind-compat.css";
import { useQuasar } from "quasar";
import { rightDrawer } from "stores/app";
import { bucket } from "stores/s3";
// eslint-disable-next-line import/no-unresolved
import "virtual:uno.css";

const $q = useQuasar();
const click = async (name: string) => {
  const { default: component } = (await import(
    `src/components/${name}.vue`
  )) as typeof import("*.vue");
  $q.dialog({ component });
};
</script>
