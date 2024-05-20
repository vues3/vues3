<template lang="pug">
q-dialog(@hide="onDialogHide", ref="dialogRef")
  q-card.q-dialog-plugin
    q-card-section
      q-input(
        :rules="[(v) => !!v || 'Item is required']",
        clearable,
        label="domain",
        placeholder="example.com",
        ref="bucket",
        type="url",
        v-model.trim="Bucket"
      )
        template(#prepend)
          q-icon(name="language")
      q-input(clearable, label="access key id", v-model.trim="accessKeyId")
        template(#prepend)
          q-icon(name="key")
      q-input(
        :type="isPwd ? 'password' : 'text'",
        clearable,
        label="secret access key",
        v-model.trim="secretAccessKey"
      )
        template(#prepend)
          q-icon(name="lock")
        template(#append)
          q-icon.cursor-pointer(
            :name="isPwd ? 'visibility_off' : 'visibility'",
            @click="isPwd = !isPwd"
          )
      q-select(
        :options="endpoints",
        @input-value="(value) => { endpoint = value; }",
        clearable,
        emit-value,
        fill-input,
        hide-selected,
        hint="",
        label="endpoint url",
        type="url",
        use-input,
        v-model.trim="endpoint"
      )
        template(#prepend)
          q-icon(name="link")
      q-select(
        :options="getRegions(endpoint)",
        @input-value="(value) => { region = value; }",
        clearable,
        emit-value,
        fill-input,
        hide-selected,
        hint="",
        label="region",
        use-input,
        v-model.trim="region"
      )
        template(#prepend)
          q-icon(name="flag")
    q-card-actions.text-primary(align="right")
      q-btn(@click="onDialogCancel", flat, label="Отмена")
      q-btn(
        @click="() => { bucket.validate(); if (!bucket.hasError) click({ Bucket, secretAccessKey, region, endpoint, accessKeyId }); }",
        flat,
        label="Ok"
      )
</template>
<script setup lang="ts">
import type { TCredentials } from "stores/types";

import { useStorage } from "@vueuse/core";
import endpoints from "assets/endpoints.json";
import regions from "assets/regions.json";
import { useDialogPluginComponent, useQuasar } from "quasar";
import { enumerable, mergeDefaults, writable } from "stores/defaults";
import { validateCredentials } from "stores/types";
import { ref, triggerRef } from "vue";

// const props =
const props = defineProps<{
  value?: string;
}>();
defineEmits([...useDialogPluginComponent.emits]);
const $q = useQuasar();
const { dialogRef, onDialogCancel, onDialogHide, onDialogOK } =
  useDialogPluginComponent();
const creds = useStorage(
  "@",
  () => {
    const value = {} as TCredentials;
    validateCredentials(value);
    return value;
  },
  localStorage,
  { mergeDefaults },
);
const bucket = ref();
const cred = creds.value[props.value ?? ""] as
  | Record<string, null | string>
  | undefined;
const Bucket = ref(cred?.Bucket ?? "");
const secretAccessKey = ref(cred?.secretAccessKey ?? null);
const region = ref(cred?.region ?? null);
const endpoint = ref(cred?.endpoint ?? null);
const isPwd = ref(true);
const accessKeyId = ref(cred?.accessKeyId ?? null);
const getRegions = (value: null | string) => regions[value as keyof object];
const click = (value: Record<string, null | string>) => {
  if (value.Bucket)
    if (props.value !== value.Bucket && Reflect.has(creds.value, value.Bucket))
      $q.dialog({
        message: "Такая учетная запись уже существует",
        title: "Предупреждение",
      });
    else {
      if (props.value && props.value !== value.Bucket)
        Reflect.deleteProperty(creds.value, props.value);
      Reflect.defineProperty(creds.value, value.Bucket, {
        enumerable,
        value,
        writable,
      });
      triggerRef(creds);
      onDialogOK();
    }
};
</script>
