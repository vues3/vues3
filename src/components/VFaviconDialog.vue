<template lang="pug">
q-dialog(@hide="onDialogHide", ref="dialogRef")
  q-card
    q-card-section(horizontal)
      q-uploader.min-h-72(
        :factory,
        accept="image/vnd.microsoft.icon",
        flat,
        label="Favicon",
        ref="uploader",
        square
      )
    q-separator
    q-card-actions.text-primary(align="right")
      q-btn(:label="t('Close')", @click="onDialogHide", flat)
</template>
<script setup lang="ts">
import type { QUploader, QUploaderFactoryFn } from "quasar";
import type { Ref } from "vue";

import { useDialogPluginComponent, useQuasar } from "quasar";
import { putFile } from "stores/s3";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

defineEmits([...useDialogPluginComponent.emits]);
const $q = useQuasar();
const { t } = useI18n();
const { dialogRef, onDialogHide } = useDialogPluginComponent();

const uploader: Ref<QUploader | undefined> = ref();
const factory: QUploaderFactoryFn = async (files) => {
  const [file] = files;
  let message = t("Favicon uploaded successfully");
  try {
    await putFile("favicon.ico", "image/vnd.microsoft.icon", file);
    uploader.value?.reset();
  } catch (e) {
    message = t("Favicon upload failed");
  }
  $q.notify({ message });
  return Promise.reject(new Error());
};
</script>
