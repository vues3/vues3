<template lang="pug">
q-dialog(@hide="onDialogHide", ref="dialogRef")
  q-card.q-dialog-plugin
    q-card-section CSS
    q-card-section.h-96(horizontal)
      suspense
        v-source-code.col.h-96(lang="css", v-model="style")
    q-separator
    q-card-actions.text-primary(align="right")
      q-btn(@click="onDialogHide", flat, label="Close")
</template>
<script setup lang="ts">
import type { Ref } from "vue";

import VSourceCode from "components/VSourceCode.vue";
import { debounce, useDialogPluginComponent } from "quasar";
import { cache, second } from "stores/defaults";
import { getObject, putObject } from "stores/s3";
import { ref, watch } from "vue";

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide } = useDialogPluginComponent();
const style: Ref<Promise<string> | string> = ref(
  new Promise((resolve) => {
    getObject("index.css", cache).then(
      (value) => {
        resolve(value.text());
      },
      () => {},
    );
  }),
);
watch(
  style,
  debounce((value) => {
    putObject("index.css", "text/css", value as string).catch(() => {});
  }, second),
);
</script>
