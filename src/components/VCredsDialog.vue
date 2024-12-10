<template lang="pug">
q-dialog(@hide="onDialogHide", ref="dialogRef")
  q-card.w-full
    q-card-section
      q-input(
        :rules="[(v: null | string) => !!v || t('Item is required')]",
        clearable,
        label="bucket",
        ref="bucketRef",
        v-model.trim="Bucket"
      )
        template(#prepend)
          q-icon(name="delete")
        template(#append, v-if="$q.platform.is.electron")
          q-btn(:label="t('Open...')", outline, @click="getDir")
      q-input(
        clearable,
        label="domain",
        ref="domainRef",
        v-model.trim="domain",
        :readonly="equal",
        :rules,
        :hint="t('Select the checkbox if the bucket and the domain are the same')",
      )
        template(#prepend)
          q-icon(name="public")
        template(#after)
          q-checkbox(dense, v-model="equal", :disable="isDirectory")
      q-input(clearable, label="access key id", v-model.trim="accessKeyId", hint="", :disable="isDirectory" )
        template(#prepend)
          q-icon(name="key")
      q-input(
        :type="isPwd ? 'password' : 'text'",
        clearable,
        label="secret access key",
        v-model.trim="secretAccessKey",
        hint="",
        :disable="isDirectory"
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
        @input-value="(value: string) => { endpoint = value; }",
        clearable,
        emit-value,
        fill-input,
        hide-selected,
        hint="",
        label="endpoint url",
        type="url",
        use-input,
        v-model.trim="endpoint",
        :disable="isDirectory"
      )
        template(#prepend)
          q-icon(name="link")
      q-select(
        :options="getRegions(endpoint)",
        @input-value="(value: string) => { region = value; }",
        clearable,
        emit-value,
        fill-input,
        hide-selected,
        hint="",
        label="region",
        use-input,
        v-model.trim="region",
        :disable="isDirectory"
      )
        template(#prepend)
          q-icon(name="flag")
    q-separator
    q-card-actions.text-primary.bg-grey-1(align="right")
      q-btn(@click="onDialogCancel", flat, label="Cancel")
      q-btn(
        @click="() => { bucketRef?.validate(); domainRef?.validate(); if (!bucketRef?.hasError && !domainRef?.hasError) click(encrypt({ Bucket, domain, secretAccessKey, region, endpoint, accessKeyId })); }",
        flat,
        label="Ok"
      )
</template>
<script setup lang="ts">
import type { TCredentials } from "@vues3/shared";
import type { QInput } from "quasar";

import { validateCredentials } from "@vues3/shared";
import { useStorage } from "@vueuse/core";
import endpoints from "assets/endpoints.json";
import regions from "assets/regions.json";
import CryptoJS from "crypto-js";
import { useDialogPluginComponent, useQuasar } from "quasar";
import { enumerable, mergeDefaults, writable } from "stores/defaults";
import { computed, ref, triggerRef, useTemplateRef, watch } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  pin?: string;
  value?: string;
}>();
defineEmits([...useDialogPluginComponent.emits]);
const $q = useQuasar();
const { t } = useI18n();
const { dialogRef, onDialogCancel, onDialogHide, onDialogOK } =
  useDialogPluginComponent();
const bucketRef = useTemplateRef<QInput>("bucketRef");
const domainRef = useTemplateRef<QInput>("domainRef");
const creds = useStorage(
  "@",
  () => {
    const value = {} as TCredentials;
    validateCredentials?.(value) as boolean;
    return value;
  },
  localStorage,
  { mergeDefaults },
);
const cred = creds.value[props.value ?? ""] as
  | Record<string, null | string>
  | undefined;
const decrypt = (value?: null | string) =>
  props.pin
    ? CryptoJS.AES.decrypt(value ?? "", props.pin).toString(CryptoJS.enc.Utf8)
    : (value ?? null);
const Bucket = ref(decrypt(cred?.Bucket));
const domain = ref(decrypt(cred?.domain));
const equal = ref(!!(Bucket.value && Bucket.value === domain.value));
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
        message: t("That account already exists"),
        title: t("Confirm"),
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
const getDir = async () => {
  const {
    filePaths: [filePath],
  } = await window.dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  Bucket.value = filePath;
};
const isDirectory = computed(() => window.isDirectory?.(Bucket.value ?? ""));
/** @see {@link https://www.oreilly.com/library/view/regular-expressions-cookbook/9781449327453/ch08s15.html} */
const rules = [
  (v: null | string) =>
    !(
      v &&
      !/\b((?=[a-z0-9-]{1,63}\.)(xn--)?[a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,63}\b/.test(
        v,
      )
    ) || t("Not a valid domain"),
];
watch(isDirectory, (value) => {
  if (value) {
    accessKeyId.value = null;
    secretAccessKey.value = null;
    endpoint.value = null;
    region.value = null;
    equal.value = false;
  }
});
watch([Bucket, equal], ([newBucket, newEqBucket]) => {
  if (newEqBucket) domain.value = newBucket;
});
</script>
