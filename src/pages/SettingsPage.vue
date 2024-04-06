<template lang="pug">
q-page.column.full-height
  q-card.q-ma-xl.col.scroll(flat)
    q-card-section
      .text-h6 YANDEX
    q-separator
    q-card-section
      q-input(v-model.trim="$.settings.yandex", label="yandex verification id")
        template(#prepend)
          q-icon(name="mdi-alpha-y-circle-outline")
      q-input(v-model.trim="$.settings.metrika", label="yandex metrika id")
        template(#prepend)
          q-icon(name="mdi-ruler")
    q-card-section
      .text-h6 GOOGLE
    q-separator
    q-card-section
      q-input(v-model.trim="$.settings.google", label="google verification id")
        template(#prepend)
          q-icon(name="mdi-google")
      q-input(v-model.trim="$.settings.analytics", label="google analytics id")
        template(#prepend)
          q-icon(name="mdi-google-analytics")
    q-card-section
      .text-h6 НАСТРОЙКИ САЙТА
    q-separator
    q-card-section
      q-list
        q-item(v-ripple, tag="label")
          q-item-section(avatar)
            q-checkbox(v-model="$.settings.landing")
          q-item-section
            q-item-label В виде лендинга
</template>
<script setup>
import { get } from "@vueuse/core";
import { storeToRefs } from "pinia";

import app from "@/stores/app";
import data from "~/monolit/src/stores/data";

const { state } = storeToRefs(app());
const { $ } = data();
get(state).rightDrawer = null;
</script>
