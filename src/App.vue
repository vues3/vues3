<template lang="pug">
q-layout(view="hHh Lpr lff")
  q-header
    q-toolbar
      q-toolbar-title
        q-avatar(icon="img:favicon.svg", size="xl")
        | vueS3
      q-chip(icon="language", v-if="bucket", :label="bucket", :ripple="false")
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
          q-item(
            @click="() => { click(VFaviconDialog); }",
            clickable,
            v-close-popup
          )
            q-item-section(avatar)
              q-avatar(color="primary", icon="image", text-color="white")
            q-item-section
              q-item-label Favicon
          q-item(
            @click="() => { click(VRobotsDialog); }",
            clickable,
            v-close-popup
          )
            q-item-section(avatar)
              q-avatar(color="primary", icon="android", text-color="white")
            q-item-section
              q-item-label Robots.txt
          q-item(
            @click="() => { click(VFontsDialog); }",
            clickable,
            v-close-popup
          )
            q-item-section(avatar)
              q-avatar(color="primary", icon="spellcheck", text-color="white")
            q-item-section
              q-item-label Fonts
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
import VFaviconDialog from "src/components/VFaviconDialog.vue";
import VFontsDialog from "src/components/VFontsDialog.vue";
import VImportmapDialog from "src/components/VImportmapDialog.vue";
import VRobotsDialog from "src/components/VRobotsDialog.vue";
import { rightDrawer } from "stores/app";
import { bucket } from "stores/io";
// eslint-disable-next-line import/no-unresolved
import "virtual:uno.css";

const $q = useQuasar();
const click = (component: Component) => {
  $q.dialog({ component });
};
</script>
