<template lang="pug">
q-dialog(ref="dialogRef", :persistent, @hide="onDialogHide")
  q-card.q-dialog-plugin
    q-card-section.q-dialog__title {{ title }}
    q-card-section.q-dialog__message {{ message }}
    q-card-section.q-dialog-plugin__form
      q-select(
        v-model="value",
        hide-dropdown-icon,
        multiple,
        new-value-mode="add",
        stack-label,
        use-chips,
        use-input,
        dense
      )
    q-card-actions(align="right")
      q-btn(
        v-if="cancel",
        color="primary",
        label="Cancel",
        flat,
        @click="onDialogCancel"
      )
      q-btn(color="primary", label="OK", flat, @click="onDialogOK(value)")
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from "quasar";

/* -------------------------------------------------------------------------- */

const value = defineModel<string[]>("value"),
  { dialogRef, onDialogCancel, onDialogHide, onDialogOK } =
    useDialogPluginComponent(),
  { message, persistent, title } = defineProps<{
    cancel: boolean;
    message: string;
    persistent: boolean;
    title: string;
  }>();

/* -------------------------------------------------------------------------- */

defineEmits([...useDialogPluginComponent.emits]);
</script>
