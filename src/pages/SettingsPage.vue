<template lang="pug">
q-page.column.full-height(v-if="$?.settings")
  q-card.q-ma-xl.col.scroll(flat)
    q-card-section
      .text-h6 YANDEX
    q-separator
    q-card-section
      q-input(
        :debounce,
        label="yandex verification id",
        v-model.trim="$.settings.yandex"
      )
        template(#prepend)
          q-icon(name="mdi-alpha-y-circle-outline")
      q-input(
        :debounce,
        label="yandex metrika id",
        v-model.trim="$.settings.metrika"
      )
        template(#prepend)
          q-icon(name="mdi-ruler")
    q-card-section
      .text-h6 GOOGLE
    q-separator
    q-card-section
      q-input(
        :debounce,
        label="google verification id",
        v-model.trim="$.settings.google"
      )
        template(#prepend)
          q-icon(name="mdi-google")
      q-input(
        :debounce,
        label="google analytics id",
        v-model.trim="$.settings.analytics"
      )
        template(#prepend)
          q-icon(name="mdi-google-analytics")
    q-card-section
      .text-h6 SITE SETTINGS
    q-separator
    q-card-section
      q-list
        q-item(tag="label", v-ripple)
          q-item-section(avatar)
            q-checkbox(v-model="$.settings.landing")
          q-item-section
            q-item-label В виде лендинга
</template>
<script setup lang="ts">
import { rightDrawer } from "stores/app";
import { $ } from "stores/data";
import { debounce } from "stores/defaults";

rightDrawer.value = undefined;
</script>
