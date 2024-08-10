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
          q-item(@click="click", clickable, v-close-popup)
            q-item-section(avatar)
              q-avatar(color="primary", icon="style", text-color="white")
            q-item-section
              q-item-label Loader CSS
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
import VLoaderDialog from "components/VLoaderDialog.vue";
import { useQuasar } from "quasar";
import { rightDrawer } from "stores/app";
import { bucket } from "stores/s3";

const $q = useQuasar();
const component = VLoaderDialog;
const click = () => {
  $q.dialog({ component });
};
</script>
