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
    content-class="col prose max-w-none full-width text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl",
    flat,
    paragraph-tag="div",
    placeholder="Добавьте контент на вашу страницу...",
    ref="editor"
  )
  v-template-dialog(:editor, v-model="showTemplateDialog")
  v-link-dialog(:editor, v-model="showLinkDialog")
</template>
<script setup lang="ts">
import type {
  QEditor,
  QEditorCommand,
  QVueGlobals,
  QuasarIconSetEditor,
  QuasarLanguageEditorLabel,
  StringDictionary,
} from "quasar";
import type { Ref } from "vue";

import { useFileDialog } from "@vueuse/core";
import { fonts } from "app/uno.config";
import VLinkDialog from "components/VLinkDialog.vue";
import VTemplateDialog from "components/VTemplateDialog.vue";
import "daisyui/dist/full.css";
import { useQuasar } from "quasar";
import { putImage } from "stores/app";
import { $ } from "stores/data";
import { accept } from "stores/defaults";
import { base } from "stores/s3";
import { nextTick, ref, watch } from "vue";

interface IProps {
  modelValue: Promise<string> | string;
}
const props: IProps = withDefaults(defineProps<IProps>(), {
  modelValue: "",
});
defineEmits(["update:modelValue"]);
const showTemplateDialog: Ref<boolean> = ref(false);
const showLinkDialog: Ref<boolean> = ref(false);
const $q: QVueGlobals = useQuasar();
const editor: Ref<QEditor | undefined> = ref();
const insertImage = (file: File) => {
  (async () => {
    const { filePath, message } = await putImage(file);
    if (message) $q.notify({ message });
    else if (filePath)
      editor.value?.runCmd("insertImage", `${base.value ?? ""}/${filePath}`);
  })().catch(() => {});
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
const definitions: Record<string, QEditorCommand> = {
  ...(Object.fromEntries(
    [
      ["upload", "Загрузка картинки", open],
      [
        "dashboard",
        "Выбор шаблона",
        () => {
          showTemplateDialog.value = true;
        },
      ],
      [
        "share",
        "Вставка внутренней ссылки",
        () => {
          if ($.value?.content.length) showLinkDialog.value = true;
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
} as const;
const list = "no-icons";
const toolbar: (object | string)[][] = [
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
const htm: Ref<string> = ref(await props.modelValue);
</script>
