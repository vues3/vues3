<template lang="pug">
div
  q-editor.col.column.full-width(
    :definitions,
    :dense="$q.screen.lt.md",
    :fonts,
    :model-value="htm",
    :toolbar,
    @drop="capture",
    @paste="capture",
    @update:model-value="$emit('update:modelValue', $event)",
    @vue:mounted="nextTick(editor?.focus)",
    content-class="col prose max-w-none",
    flat,
    paragraph-tag="div",
    placeholder="Добавьте контент на вашу страницу...",
    ref="editor"
  )
</template>
<script setup lang="ts">
import type {
  QEditor,
  QEditorCommand,
  QuasarIconSetEditor,
  QuasarLanguageEditorLabel,
  StringDictionary,
} from "quasar";
import type { Ref } from "vue";

import { useFileDialog } from "@vueuse/core";
import { fonts } from "app/uno.config";
import mimes from "assets/mimes.json";
import VLinkDialog from "components/VLinkDialog.vue";
import mime from "mime";
import { uid, useQuasar } from "quasar";
import { urls } from "stores/app";
import { accept } from "stores/defaults";
import { putFile } from "stores/s3";
import { nextTick, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: Promise<string> | string;
  }>(),
  {
    modelValue: "",
  },
);
defineEmits(["update:modelValue"]);
const $q = useQuasar();
const editor: Ref<QEditor | undefined> = ref();
const message =
  "Тип графического файла не подходит для использования в сети интернет";
const insertImage = (file: File) => {
  const { type } = file;
  if (mimes.includes(type)) {
    const filePath = `images/${uid()}.${mime.getExtension(type) ?? ""}`;
    putFile(filePath, type, file).catch(() => {});
    urls.set(filePath, URL.createObjectURL(file));
    editor.value?.runCmd(
      "insertHTML",
      `<img src="${urls.get(filePath) ?? ""}" data-src="/${filePath}">`,
    );
  } else $q.notify({ message });
};
const capture = (evt: ClipboardEvent | DragEvent) => {
  const { files = [] } =
    (evt as DragEvent).dataTransfer ??
    (evt as ClipboardEvent).clipboardData ??
    {};
  if (files.length) {
    evt.preventDefault();
    evt.stopPropagation();
    [...files].forEach(insertImage);
  }
};
const { files, open } = useFileDialog({ accept });
const definitions = {
  ...(Object.fromEntries(
    [
      ["upload", "Загрузка картинки", open],
      [
        "share",
        "Вставка внутренней ссылки",
        () => {
          const component = VLinkDialog;
          $q.dialog({ component }).onOk((value: string) => {
            editor.value?.runCmd("createLink", `/${value}`);
          });
        },
      ],
    ].map(([icon, tip, handler]) => [icon, { handler, icon, tip }]),
  ) as Record<string, QEditorCommand>),
  ...Object.fromEntries(
    [
      ...[...Array(4).keys()].map((key) => [
        `h${String(key + 1)}`,
        `heading${String(key + 1)}`,
      ]),
      ["p", "paragraph"],
      ["code", "code"],
    ].map(([key, value]) => [
      key,
      {
        htmlTip: `<span class="prose"><${key} class="q-ma-none">${$q.lang.editor[value as keyof StringDictionary<QuasarLanguageEditorLabel>]}</${key}></span>`,
      },
    ]),
  ),
};
const list = "no-icons";
const toolbar = [
  ["left", "center", "right", "justify"],
  ["bold", "italic", "strike", "underline", "subscript", "superscript"],
  ["hr", "link"],
  ["print", "fullscreen"],
  [
    ...[
      [
        "formatting",
        [
          "p",
          ...[...Array(4).keys()].map((key) => `h${String(key + 1)}`),
          "code",
        ],
        false,
        false,
      ],
      [
        "fontSize",
        [...Array(7).keys()].map((key) => `size-${String(key + 1)}`),
        true,
        true,
      ],
      ["defaultFont", ["default_font", ...Object.keys(fonts)], false, true],
    ].map(([key, options, fixedLabel, fixedIcon]) => ({
      fixedIcon,
      fixedLabel,
      icon: $q.iconSet.editor[
        key as keyof StringDictionary<QuasarIconSetEditor>
      ],
      label:
        $q.lang.editor[
          key as keyof StringDictionary<QuasarLanguageEditorLabel>
        ],
      list,
      options,
    })),
    "removeFormat",
  ],
  ["quote", "unordered", "ordered", "outdent", "indent"],
  ["undo", "redo"],
  ["upload", "dashboard", "share"],
] as const;
watch(files, (newFiles) => {
  if (newFiles) [...newFiles].forEach(insertImage);
});
const htm = ref(await props.modelValue);
</script>
