<template lang="pug">
q-dialog(@hide="onDialogHide", ref="dialogRef")
  q-card.q-dialog-plugin
    q-card-section.row.q-gutter-sm.justify-center
      q-input(
        :class="{ 'bg-negative': error }",
        :key="i",
        :ref="(el) => { updateFieldRef(el, i - 1); }",
        @blur="fields[selected].focus()",
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
import type { ComponentPublicInstance, ComputedRef, Ref } from "vue";

import CryptoJS from "crypto-js";
import { useDialogPluginComponent } from "quasar";
import { deep } from "stores/defaults";
import { computed, ref, watch } from "vue";

defineEmits([...useDialogPluginComponent.emits]);
const props = defineProps<{
  value?: string;
}>();
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const length = ref(4);
const fields: Ref<QInput[]> = ref([]);
const fieldValues: Ref<number[]> = ref([]);
const selected = ref(0);
const payload: ComputedRef<string> = computed(() =>
  fieldValues.value.filter(Boolean).join(""),
);
const error = ref(false);
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
const updateFieldRef = (
  element: ComponentPublicInstance | Element | null,
  index: number,
) => {
  fields.value[index] = element as QInput;
};
const focus = (index: number) => {
  if (index >= 0 && index < length.value) selected.value = index;
};
watch(selected, (value) => {
  fields.value[value].select();
});
</script>
