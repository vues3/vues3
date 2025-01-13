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
/* -------------------------------------------------------------------------- */
/*                                   Imports                                  */
/* -------------------------------------------------------------------------- */

import type {
  QDialog,
  QUploader,
  QUploaderFactoryFn,
  QVueGlobals,
} from "quasar";
import type { Ref } from "vue";
import type { Composer } from "vue-i18n";

import { useDialogPluginComponent, useQuasar } from "quasar";
import { putObject } from "stores/io";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

/* -------------------------------------------------------------------------- */
/*                                   Objects                                  */
/* -------------------------------------------------------------------------- */

const $q: QVueGlobals = useQuasar();

/* -------------------------------------------------------------------------- */

const { t }: Composer = useI18n();

/* -------------------------------------------------------------------------- */

const {
  dialogRef,
  onDialogHide,
}: {
  dialogRef: Ref<QDialog | undefined>;
  onDialogHide: () => void;
} = useDialogPluginComponent();

/* -------------------------------------------------------------------------- */
/*                                 References                                 */
/* -------------------------------------------------------------------------- */

const uploader: Ref<null | QUploader> = ref(null);

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
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
/*                                    Main                                    */
/* -------------------------------------------------------------------------- */

defineEmits([...useDialogPluginComponent.emits]);

/* -------------------------------------------------------------------------- */
</script>
