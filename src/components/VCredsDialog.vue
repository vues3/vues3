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
      q-input(clearable, label="access key id", v-model.trim="accessKeyId", hint="" )
        template(#prepend)
          q-icon(name="key")
      q-input(
        :type="isPwd ? 'password' : 'text'",
        clearable,
        label="secret access key",
        v-model.trim="secretAccessKey",
        hint=""
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
        v-model.trim="endpoint"
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
        v-model.trim="region"
      )
        template(#prepend)
          q-icon(name="flag")
    q-separator
    q-card-actions.text-primary.bg-grey-1(align="right")
      q-btn(@click="onDialogCancel", flat, label="Cancel")
      q-btn(
        @click="() => { bucketRef?.validate(); if (!bucketRef?.hasError) click(encrypt({ Bucket, secretAccessKey, region, endpoint, accessKeyId })); }",
        flat,
        label="Ok"
      )
</template>
<script setup lang="ts">
/* -------------------------------------------------------------------------- */
/*                                   Imports                                  */
/* -------------------------------------------------------------------------- */

import type { QDialog, QInput, QVueGlobals } from "quasar";
import type { Ref, ShallowRef } from "vue";
import type { Composer } from "vue-i18n";

import endpoints from "assets/endpoints.json";
import regions from "assets/regions.json";
import CryptoJS from "crypto-js";
import { useDialogPluginComponent, useQuasar } from "quasar";
import { enumerable, writable } from "stores/defaults";
import { credential } from "stores/s3";
import { ref, triggerRef, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";

/* -------------------------------------------------------------------------- */
/*                                 Properties                                 */
/* -------------------------------------------------------------------------- */

const props = defineProps<{
  pin?: string;
  value?: string;
}>();

/* -------------------------------------------------------------------------- */
/*                                   Objects                                  */
/* -------------------------------------------------------------------------- */

const $q: QVueGlobals = useQuasar();

/* -------------------------------------------------------------------------- */

const { t }: Composer = useI18n();

/* -------------------------------------------------------------------------- */

const {
  dialogRef,
  onDialogCancel,
  onDialogHide,
  onDialogOK,
}: {
  dialogRef: Ref<QDialog | undefined>;
  onDialogCancel: () => void;
  onDialogHide: () => void;
  onDialogOK: () => void;
} = useDialogPluginComponent();

/* -------------------------------------------------------------------------- */

const cred: null | Record<string, null | string> = (credential.value[
  props.value ?? ""
] ?? null) as null | Record<string, null | string>;

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

const decrypt: (value?: null | string) => null | string = (value) =>
  props.pin
    ? CryptoJS.AES.decrypt(value ?? "", props.pin).toString(CryptoJS.enc.Utf8)
    : (value ?? null);

/* -------------------------------------------------------------------------- */
/*                                 References                                 */
/* -------------------------------------------------------------------------- */

const bucketRef: Readonly<ShallowRef<null | QInput>> =
  useTemplateRef<QInput>("bucketRef");

/* -------------------------------------------------------------------------- */

const Bucket: Ref<null | string> = ref(decrypt(cred?.Bucket));

/* -------------------------------------------------------------------------- */

const secretAccessKey: Ref<null | string> = ref(decrypt(cred?.secretAccessKey));

/* -------------------------------------------------------------------------- */

const region: Ref<null | string> = ref(decrypt(cred?.region));

/* -------------------------------------------------------------------------- */

const endpoint: Ref<null | string> = ref(decrypt(cred?.endpoint));

/* -------------------------------------------------------------------------- */

const isPwd: Ref<boolean> = ref(true);

/* -------------------------------------------------------------------------- */

const accessKeyId: Ref<null | string> = ref(decrypt(cred?.accessKeyId));

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

const getRegions: (value: null | string) => string[] | undefined = (value) =>
  regions[(value ?? "") as keyof object];

/* -------------------------------------------------------------------------- */

const encrypt: (
  obj: Record<string, null | string>,
) => Record<string, null | string> = (obj) =>
  props.pin
    ? Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key,
          CryptoJS.AES.encrypt(value ?? "", props.pin ?? "").toString(),
        ]),
      )
    : obj;

/* -------------------------------------------------------------------------- */

const click: (value: Record<string, null | string>) => void = (value) => {
  if (Bucket.value)
    if (
      props.value !== Bucket.value &&
      Reflect.has(credential.value, Bucket.value)
    )
      $q.dialog({
        message: t("That account already exists"),
        title: t("Confirm"),
      });
    else {
      if (props.value && props.value !== Bucket.value)
        Reflect.deleteProperty(credential.value, props.value);
      Reflect.defineProperty(credential.value, Bucket.value, {
        enumerable,
        value,
        writable,
      });
      triggerRef(credential);
      onDialogOK();
    }
};

/* -------------------------------------------------------------------------- */
/*                                    Main                                    */
/* -------------------------------------------------------------------------- */

defineEmits([...useDialogPluginComponent.emits]);

/* -------------------------------------------------------------------------- */
</script>
