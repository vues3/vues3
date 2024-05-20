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
        @click="() => { bucket.validate(); if (!bucket.hasError) onDialogOK({ Bucket, secretAccessKey, region, endpoint, accessKeyId }); }",
        flat,
        label="Ok"
      )
</template>
<script setup lang="ts">
import endpoints from "assets/endpoints.json";
import regions from "assets/regions.json";
import { useDialogPluginComponent } from "quasar";
import { ref } from "vue";

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogCancel, onDialogHide, onDialogOK } =
  useDialogPluginComponent();
const bucket = ref();
const Bucket = ref("");
const secretAccessKey = ref("");
const region = ref("");
const endpoint = ref("");
const isPwd = ref(true);
const accessKeyId = ref("");
const getRegions = (value: string) => regions[value as keyof object];
</script>
