<template lang="pug">
q-page.column.full-height(v-if="data?.settings")
  q-card.q-ma-xl.col.scroll(flat)
    q-card-section
      .text-h6 YANDEX
    q-separator
    q-card-section
      q-input(
        label="yandex verification id",
        v-model.trim="data.settings.yandex"
      )
        template(#prepend)
          q-icon(name="mdi-alpha-y-circle-outline")
      q-input(label="yandex metrika id", v-model.trim="data.settings.metrika")
        template(#prepend)
          q-icon(name="mdi-ruler")
    q-card-section
      .text-h6 GOOGLE
    q-separator
    q-card-section
      q-input(
        label="google verification id",
        v-model.trim="data.settings.google"
      )
        template(#prepend)
          q-icon(name="mdi-google")
      q-input(
        label="google analytics id",
        v-model.trim="data.settings.analytics"
      )
        template(#prepend)
          q-icon(name="mdi-google-analytics")
    q-card-section
      .text-h6 НАСТРОЙКИ САЙТА
    q-separator
    q-card-section
      q-list
        q-item(tag="label", v-ripple)
          q-item-section(avatar)
            q-checkbox(v-model="data.settings.landing")
          q-item-section
            q-item-label В виде лендинга
</template>
<script setup lang="ts">
import { rightDrawer } from "stores/app";
import { data } from "stores/data";

rightDrawer.value = undefined;
</script>
