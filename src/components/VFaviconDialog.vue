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
import { putObject } from "stores/io";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

/* -------------------------------------------------------------------------- */

const $q = useQuasar(),
  uploader: Ref<null | QUploader> = ref(null);

/* -------------------------------------------------------------------------- */

const { dialogRef, onDialogHide } = useDialogPluginComponent(),
  { t } = useI18n();

/* -------------------------------------------------------------------------- */

const factory: QUploaderFactoryFn = async (files) => {
  const [file] = files;
  let message = t("Favicon uploaded successfully");
  try {
    if (file)
      await putObject(
        "favicon.ico",
        new Uint8Array(await file.arrayBuffer()),
        "image/vnd.microsoft.icon",
      );
    else throw new Error();
    uploader.value?.reset();
  } catch {
    message = t("Favicon upload failed");
  }
  $q.notify({ message });
  return Promise.reject(new Error());
};

/* -------------------------------------------------------------------------- */

defineEmits([...useDialogPluginComponent.emits]);
</script>
