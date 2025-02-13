<template lang="pug">
q-dialog(@hide="onDialogHide", ref="dialogRef")
  q-card.q-dialog-plugin
    q-card-section.row.q-gutter-sm.justify-center
      q-input(
        :class="{ 'bg-negative': error }",
        :key="i",
        :ref="(el) => { updateFieldRef(el, i - 1); }",
        @blur="fields[selected]?.focus()",
        @click="selected = i - 1",
        @keydown.tab.prevent,
        @keyup.delete="focus(i - 2)",
        @keyup.left="focus(i - 2)",
        @keyup.right="focus(i)",
        @update:model-value="(ev) => { if (ev) focus(i); }",
        autofocus,
        input-class="text-center",
        mask="#",
        maxlength="1",
        outlined,
        style="width: 6ch",
        type="password",
        v-for="i in length",
        v-model="fieldValues[i - 1]"
      )
</template>

<script setup lang="ts">
import type { QInput } from "quasar";
import type { ComponentPublicInstance } from "vue";

import { deep } from "@vues3/shared";
import CryptoJS from "crypto-js";
import { useDialogPluginComponent } from "quasar";
import { computed, ref, watch } from "vue";

/* -------------------------------------------------------------------------- */

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

/* -------------------------------------------------------------------------- */

const error = ref(false),
  fields = ref([] as QInput[]),
  fieldValues = ref([] as number[]),
  length = ref(4),
  payload = computed(() => fieldValues.value.filter(Boolean).join("")),
  props = defineProps<{
    value?: string;
  }>(),
  selected = ref(0);

/* -------------------------------------------------------------------------- */

const focus = (index: number) => {
    if (index >= 0 && index < length.value) selected.value = index;
  },
  updateFieldRef = (
    element: ComponentPublicInstance | Element | null,
    index: number,
  ) => {
    fields.value[index] = element as QInput;
  };

/* -------------------------------------------------------------------------- */

defineEmits([...useDialogPluginComponent.emits]);

watch(
  payload,
  (value) => {
    if (value.length === length.value) {
      if (props.value)
        error.value = !CryptoJS.AES.decrypt(props.value, value).toString();
      if (!error.value) onDialogOK(value);
    } else error.value = false;
  },
  { deep },
);

watch(selected, (value) => {
  fields.value[value]?.select();
});
</script>
