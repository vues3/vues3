<template lang="pug">
q-layout(view="hHh Lpr lff")
  q-header
    q-bar.q-electron-drag(
      v-if="$q.platform.is.electron",
      bg-primary,
      text-white
    )
      q-icon(name="wysiwyg")
      .col.text-weight-bold.text-center vueS3
      q-space
      q-btn(@click="minimize", dense, flat, icon="minimize")
      q-btn(
        @click="toggleMaximize",
        dense,
        flat,
        :icon="isMaximized() ? 'unfold_less' : 'unfold_more'"
      )
      q-btn(@click="closeApp", dense, flat, icon="close")
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
          q-item(@click="clickDomain", clickable, v-close-popup)
            q-item-section(avatar)
              q-avatar(color="primary", icon="public", text-color="white")
            q-item-section
              q-item-label Domain
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
import { domain, rightDrawer } from "stores/app";
import { bucket } from "stores/io";
import { useI18n } from "vue-i18n";
// eslint-disable-next-line import/no-unresolved
import "virtual:uno.css";

const { t } = useI18n();
const $q = useQuasar();
const click = (component: Component) => {
  $q.dialog({ component });
};
const cancel = true;
const message = t("Enter a valid domain name:");
const persistent = true;
const title = t("Domain");
const isValid = (val: string) =>
  /\b((?=[a-z0-9-]{1,63}\.)(xn--)?[a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,63}\b/.test(
    val,
  );
const clickDomain = () => {
  const model = domain.value;
  const prompt = { isValid, model };
  $q.dialog({ cancel, message, persistent, prompt, title }).onOk(
    (data: string) => {
      domain.value = data;
    },
  );
};
const minimize = () => {
  window.focusedWindowMinimize();
};
const toggleMaximize = () => {
  window.focusedWindowToggleMaximize();
};
const closeApp = () => {
  window.focusedWindowClose();
};
const isMaximized = () => window.focusedWindowIsMaximized();
</script>
