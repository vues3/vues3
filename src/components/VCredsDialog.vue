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
        @click="() => { bucket.validate(); if (!bucket.hasError) click(encrypt({ Bucket, secretAccessKey, region, endpoint, accessKeyId })); }",
        flat,
        label="Ok"
      )
</template>
<script setup lang="ts">
import type { TCredentials } from "stores/types";

import { useStorage } from "@vueuse/core";
import endpoints from "assets/endpoints.json";
import regions from "assets/regions.json";
import CryptoJS from "crypto-js";
import { useDialogPluginComponent, useQuasar } from "quasar";
import { enumerable, mergeDefaults, writable } from "stores/defaults";
import { validateCredentials } from "stores/types";
import { ref, triggerRef } from "vue";

const props = defineProps<{
  pin?: string;
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
const decrypt = (value?: null | string) =>
  props.pin
    ? CryptoJS.AES.decrypt(value ?? "", props.pin).toString(CryptoJS.enc.Utf8)
    : value ?? null;
const Bucket = ref(decrypt(cred?.Bucket));
const secretAccessKey = ref(decrypt(cred?.secretAccessKey));
const region = ref(decrypt(cred?.region));
const endpoint = ref(decrypt(cred?.endpoint));
const isPwd = ref(true);
const accessKeyId = ref(decrypt(cred?.accessKeyId));
const getRegions = (value: null | string) => regions[value as keyof object];
const encrypt = (obj: Record<string, null | string>) =>
  props.pin
    ? Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key,
          CryptoJS.AES.encrypt(value ?? "", props.pin ?? "").toString(),
        ]),
      )
    : obj;
const click = (value: Record<string, null | string>) => {
  if (Bucket.value)
    if (props.value !== Bucket.value && Reflect.has(creds.value, Bucket.value))
      $q.dialog({
        message: "The account already exists",
        title: "Warning",
      });
    else {
      if (props.value && props.value !== Bucket.value)
        Reflect.deleteProperty(creds.value, props.value);
      Reflect.defineProperty(creds.value, Bucket.value, {
        enumerable,
        value,
        writable,
      });
      triggerRef(creds);
      onDialogOK();
    }
};
</script>
