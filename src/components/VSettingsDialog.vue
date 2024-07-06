<template lang="pug">
q-dialog(@hide="onDialogHide", ref="dialogRef")
  q-card.q-dialog-plugin
    q-card-section
      q-input(label="yandex verification id", v-model.trim="settings.yandex")
        template(#prepend)
          q-icon(name="mdi-alpha-y-circle-outline")
      q-input(label="yandex metrika id", v-model.trim="settings.metrika")
        template(#prepend)
          q-icon(name="mdi-ruler")
      q-input(label="google verification id", v-model.trim="settings.google")
        template(#prepend)
          q-icon(name="mdi-google")
      q-input(label="google analytics id", v-model.trim="settings.analytics")
        template(#prepend)
          q-icon(name="mdi-google-analytics")
    q-card-section
      q-list
        q-item(tag="label", v-ripple)
          q-item-section(avatar)
            q-checkbox(v-model="settings.landing")
          q-item-section
            q-item-label В виде лендинга
    q-separator
    q-card-actions.text-primary(align="right")
      q-btn(@click="onDialogCancel", flat, label="Cancel")
      q-btn(@click="onOKClick", flat, label="OK")
</template>
<script setup lang="ts">
import { useDialogPluginComponent } from "quasar";
import { reactive } from "vue";

const props = defineProps<{
  analytics: null | string;
  google: null | string;
  landing: boolean;
  metrika: null | string;
  yandex: null | string;
}>();

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogCancel, onDialogHide, onDialogOK } =
  useDialogPluginComponent();
const settings = reactive({ ...props });
function onOKClick() {
  onDialogOK({ ...settings });
}
</script>
