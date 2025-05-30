<template lang="pug">
q-layout(view="hHh Lpr lff")
  q-header
    q-toolbar
      q-toolbar-title
        q-avatar(icon="img:favicon.svg", size="xl")
        | VueBro
      q-chip(v-if="bucket", icon="language", :label="bucket", :ripple="false")
      q-btn-dropdown.q-mr-xs(
        v-if="bucket",
        dropdown-icon="apps",
        flat,
        square,
        stretch
      )
        q-list(padding)
          q-item(
            v-close-popup,
            clickable,
            @click="() => { click(VImportmapDialog); }"
          )
            q-item-section(avatar)
              q-avatar(color="primary", icon="map", text-color="white")
            q-item-section
              q-item-label Import Map
          q-item(
            v-close-popup,
            clickable,
            @click="() => { click(VFaviconDialog); }"
          )
            q-item-section(avatar)
              q-avatar(color="primary", icon="image", text-color="white")
            q-item-section
              q-item-label Favicon
          q-item(v-close-popup, clickable, @click="clickRobots")
            q-item-section(avatar)
              q-avatar(color="primary", icon="android", text-color="white")
            q-item-section
              q-item-label Robots.txt
          q-item(v-close-popup, clickable, @click="clickFonts")
            q-item-section(avatar)
              q-avatar(color="primary", icon="spellcheck", text-color="white")
            q-item-section
              q-item-label Fonts
          q-item(v-close-popup, clickable, @click="clickDomain")
            q-item-section(avatar)
              q-avatar(color="primary", icon="public", text-color="white")
            q-item-section
              q-item-label Domain
          q-item(v-close-popup, clickable, to="/")
            q-item-section(avatar)
              q-avatar(color="primary", icon="logout", text-color="white")
            q-item-section
              q-item-label Logout
      q-btn(
        dense,
        flat,
        icon="more_vert",
        round,
        @click="rightDrawer = !rightDrawer"
      )
  q-page-container.window-height
    router-view
</template>

<script setup lang="ts">
import type { Component } from "vue";

import { consoleError } from "@vuebro/shared";
import VFaviconDialog from "components/dialogs/VFaviconDialog.vue";
import VFontsDialog from "components/dialogs/VFontsDialog.vue";
import VImportmapDialog from "components/dialogs/VImportmapDialog.vue";
import { useQuasar } from "quasar";
import { domain, fonts, rightDrawer } from "stores/app";
import { cache, persistent } from "stores/defaults";
// eslint-disable-next-line import-x/no-unresolved
import "virtual:uno.css";
import { bucket, getObjectText, putObject } from "stores/io";
import { useI18n } from "vue-i18n";

const $q = useQuasar(),
  cancel = true,
  click = (component: Component) => {
    $q.dialog({ component });
  },
  { t } = useI18n();

const clickDomain = () => {
    $q.dialog({
      cancel,
      message: t("Enter a valid domain name:"),
      persistent,
      prompt: {
        isValid: (val) =>
          /\b((?=[a-z0-9-]{1,63}\.)(xn--)?[a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,63}\b/.test(
            val,
          ),
        model: domain.value,
      },
      title: t("Domain"),
    }).onOk((data: string) => {
      domain.value = data;
    });
  },
  clickFonts = () => {
    $q.dialog({
      component: VFontsDialog,
      componentProps: { fonts, persistent: true },
    }).onOk((data: string[]) => {
      fonts.length = 0;
      fonts.push(...data);
    });
  },
  clickRobots = async () => {
    const title = "robots.txt";
    $q.dialog({
      cancel,
      message: t(
        "Robots.txt is a text file that contains site indexing parameters for the search engine robots",
      ),
      persistent,
      prompt: { model: await getObjectText(title, cache), type: "textarea" },
      title,
    }).onOk((data: string) => {
      putObject(title, data, "text/plain").catch(consoleError);
    });
  };
</script>
