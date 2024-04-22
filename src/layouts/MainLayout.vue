<template lang="pug">
q-layout(view="hHh Lpr lff")
  q-header
    q-toolbar
      q-btn(flat, dense, round, icon="menu", @click="leftDrawer = !leftDrawer")
      q-toolbar-title
        q-avatar(icon="rocket_launch", size="xl")
        | Vue.S3
      q-btn(
        v-if="rightDrawer !== null",
        flat,
        dense,
        round,
        icon="more_vert",
        @click="rightDrawer = !rightDrawer"
      )
  q-drawer(
    v-model="leftDrawer",
    show-if-above,
    mini-to-overlay,
    bordered,
    :mini="miniState",
    side="left",
    @mouseover="miniState = false",
    @focus="miniState = false",
    @mouseout="miniState = true",
    @blur="miniState = true"
  )
    q-list
      q-item(
        v-for="item in items",
        :key="item.title",
        v-bind="item",
        clickable,
        :to="item.to"
      )
        q-item-section(v-if="item.icon", avatar)
          q-icon(:name="item.icon")
        q-item-section
          q-item-label {{ item.title }}
  q-page-container.window-height
    router-view
</template>

<script setup lang="ts">
import privateItems from "assets/private.json";
import publicItems from "assets/public.json";
import { rightDrawer } from "stores/app";
import { S3 } from "stores/s3";
import { computed, ref } from "vue";

const leftDrawer = ref(false);
const miniState = ref(true);
const items = computed(() => (S3.value ? privateItems : publicItems));
</script>
