<template lang="pug">
q-layout(view="hHh Lpr lff")
  q-header
    q-toolbar
      q-toolbar-title
        q-avatar(icon="img:favicon.svg", size="xl")
        | VueS3
      q-btn-dropdown.q-mr-xs(
        dropdown-icon="apps",
        flat,
        square,
        stretch,
        v-if="bucket"
      )
        q-list(padding)
          q-item(
            @click="() => { click(VImportmapDialog); }",
            clickable,
            v-close-popup
          )
            q-item-section(avatar)
              q-avatar(color="primary", icon="map", text-color="white")
            q-item-section
              q-item-label Import Map
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
import type { Component } from "vue";

import "@unocss/reset/tailwind-compat.css";
import { useQuasar } from "quasar";
import VImportmapDialog from "src/components/VImportmapDialog.vue";
import { rightDrawer } from "stores/app";
import { bucket } from "stores/s3";
// eslint-disable-next-line import/no-unresolved
import "virtual:uno.css";

const $q = useQuasar();
const click = (component: Component) => {
  $q.dialog({ component });
};
</script>
