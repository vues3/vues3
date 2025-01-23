<template lang="pug">
q-dialog(@hide="onDialogHide", ref="dialogRef")
  q-card.w-full
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
/* -------------------------------------------------------------------------- */
/*                                   Imports                                  */
/* -------------------------------------------------------------------------- */

import type { QDialog } from "quasar";
import type { Ref } from "vue";

import { consoleError } from "@vues3/shared";
import { debounce, useDialogPluginComponent } from "quasar";
import { cache, second } from "stores/defaults";
import { getObjectText, putObject } from "stores/io";
import { onBeforeMount, ref, watch } from "vue";

/* -------------------------------------------------------------------------- */
/*                                   Objects                                  */
/* -------------------------------------------------------------------------- */

const {
  dialogRef,
  onDialogHide,
}: {
  dialogRef: Ref<QDialog | undefined>;
  onDialogHide: () => void;
} = useDialogPluginComponent();

/* -------------------------------------------------------------------------- */
/*                                 References                                 */
/* -------------------------------------------------------------------------- */

const text: Ref<string | undefined> = ref();

/* -------------------------------------------------------------------------- */
/*                                  Watchers                                  */
/* -------------------------------------------------------------------------- */

watch(
  text,
  debounce((value) => {
    putObject("robots.txt", value as string, "text/plain").catch(consoleError);
  }, second),
);

/* -------------------------------------------------------------------------- */
/*                                    Main                                    */
/* -------------------------------------------------------------------------- */

defineEmits([...useDialogPluginComponent.emits]);

/* -------------------------------------------------------------------------- */

onBeforeMount(async () => {
  text.value = await getObjectText("robots.txt", cache);
});

/* -------------------------------------------------------------------------- */
</script>
