<template lang="pug">
q-dialog(ref="dialogRef", @hide="onDialogHide")
  q-card.w-full
    q-card-section
      q-input(
        ref="bucketRef",
        v-model.trim="Bucket",
        :rules="[(v: null | string) => !!v || t('Item is required')]",
        clearable,
        label="bucket"
      )
        template(#prepend)
          q-icon(name="delete")
      q-input(v-model.trim="accessKeyId", clearable, label="access key id", hint="" )
        template(#prepend)
          q-icon(name="key")
      q-input(
        v-model.trim="secretAccessKey",
        :type="isPwd ? 'password' : 'text'",
        clearable,
        label="secret access key",
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
        v-model.trim="endpoint",
        :options="endpoints",
        clearable,
        emit-value,
        fill-input,
        hide-selected,
        hint="",
        label="endpoint url",
        type="url",
        use-input,
        @input-value="(value: string) => { endpoint = value; }"
      )
        template(#prepend)
          q-icon(name="link")
      q-select(
        v-model.trim="region",
        :options="getRegions(endpoint)",
        clearable,
        emit-value,
        fill-input,
        hide-selected,
        hint="",
        label="region",
        use-input,
        @input-value="(value: string) => { region = value; }"
      )
        template(#prepend)
          q-icon(name="flag")
    q-separator
    q-card-actions.text-primary.bg-grey-1(align="right")
      q-btn(flat, label="Cancel", @click="onDialogCancel")
      q-btn(
        flat,
        label="Ok",
        @click="() => { bucketRef?.validate(); if (!bucketRef?.hasError) click(encrypt({ Bucket, secretAccessKey, region, endpoint, accessKeyId })); }"
      )
</template>

<script setup lang="ts">
import type { QDialog, QInput } from "quasar";

import endpoints from "assets/endpoints.json";
import regions from "assets/regions.json";
import CryptoJS from "crypto-js";
import { useDialogPluginComponent, useQuasar } from "quasar";
import { enumerable, writable } from "stores/defaults";
import { credential } from "stores/s3";
import { ref, triggerRef, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";

/* -------------------------------------------------------------------------- */

const { dialogRef, onDialogCancel, onDialogHide, onDialogOK } =
    useDialogPluginComponent(),
  { t } = useI18n();

/* -------------------------------------------------------------------------- */

const $q = useQuasar(),
  props = defineProps<{
    pin?: string;
    value?: string;
  }>();

/* -------------------------------------------------------------------------- */

const decrypt = (value?: string) =>
  props.pin
    ? CryptoJS.AES.decrypt(value ?? "", props.pin).toString(CryptoJS.enc.Utf8)
    : (value ?? null);

/* -------------------------------------------------------------------------- */

const cred = credential.value[props.value ?? ""],
  accessKeyId = ref(decrypt(cred?.accessKeyId ?? undefined)),
  Bucket = ref(decrypt(cred?.Bucket ?? undefined)),
  bucketRef = useTemplateRef<QInput>("bucketRef"),
  endpoint = ref(decrypt(cred?.endpoint ?? undefined)),
  isPwd = ref(true),
  region = ref(decrypt(cred?.region ?? undefined)),
  secretAccessKey = ref(decrypt(cred?.secretAccessKey ?? undefined));

/* -------------------------------------------------------------------------- */

const click = (value: Record<string, null | string>) => {
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
  },
  encrypt = (obj: Record<string, null | string>) =>
    props.pin
      ? Object.fromEntries(
          Object.entries(obj).map(([key, value]) => [
            key,
            CryptoJS.AES.encrypt(value ?? "", props.pin ?? "").toString(),
          ]),
        )
      : obj,
  getRegions = (value: null | string) => regions[(value ?? "") as keyof object];

/* -------------------------------------------------------------------------- */

defineEmits([...useDialogPluginComponent.emits]);
</script>
