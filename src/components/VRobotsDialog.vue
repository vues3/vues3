<template lang="pug">
q-dialog(@hide="onDialogHide", ref="dialogRef")
  q-card.q-dialog-plugin
    q-card-section robots.txt
    q-separator
    q-card-section.h-96.overflow-y-auto
      q-input(
        autofocus,
        autogrow,
        borderless,
        dense,
        type="textarea",
        v-model="text"
      )
    q-separator
    q-card-actions.text-primary(align="right")
      q-btn(@click="onDialogHide", flat, label="Close")
</template>
<script setup lang="ts">
import type { Ref } from "vue";

import { debounce, useDialogPluginComponent } from "quasar";
import { cache, second } from "stores/defaults";
import { getObject, putObject } from "stores/s3";
import { onBeforeMount, ref, watch } from "vue";

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide } = useDialogPluginComponent();
const text: Ref<string | undefined> = ref();
onBeforeMount(async () => {
  text.value = await (await getObject("robots.txt", cache)).text();
});
watch(
  text,
  debounce((value) => {
    putObject("robots.txt", "text/plain", value as string).catch(() => {});
  }, second),
);
</script>
