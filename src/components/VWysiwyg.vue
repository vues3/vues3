<template lang="pug">
form(
  autocapitalize="on",
  autocomplete="on",
  autocorrect="on",
  spellcheck="true"
)
  q-editor.col.column.full-width(
    :definitions,
    :dense="$q.screen.lt.md",
    :fonts,
    :model-value="htm",
    :placeholder,
    :toolbar,
    @drop="capture",
    @paste="capture",
    @update:model-value="$emit('update:modelValue', $event)",
    @vue:mounted="nextTick(editor?.focus)",
    content-class="col prose max-w-none",
    flat,
    paragraph-tag="div",
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

import presetWebFonts from "@unocss/preset-web-fonts";
import initUnocssRuntime from "@unocss/runtime";
import { useFileDialog } from "@vueuse/core";
import Defaults from "app/uno.config";
import mimes from "assets/mimes.json";
import VLinkDialog from "components/VLinkDialog.vue";
import mime from "mime";
import { uid, useQuasar } from "quasar";
import { fonts as Fonts, urls } from "stores/app";
import { getFonts } from "stores/data";
import { accept, bypassDefined, customFetch, immediate } from "stores/defaults";
import { putFile } from "stores/s3";
import { computed, nextTick, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

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
const { t } = useI18n();
const editor: Ref<QEditor | undefined> = ref();
const placeholder = t("Add some content to your page...");
const rootElement = editor.value?.getContentEl;
watch(
  () => getFonts(Fonts),
  (fonts) => {
    let { presets } = Defaults;
    presets = [
      ...presets,
      presetWebFonts({
        customFetch,
        fonts,
      }),
    ];
    const defaults = { presets };
    initUnocssRuntime({ bypassDefined, defaults, rootElement });
  },
  { immediate },
);
const fonts = computed(() => ({
  ...getFonts([
    "Arial",
    "Arial Black",
    "Comic Sans",
    "Courier New",
    "Impact",
    "Lucida Grande",
    "Times New Roman",
    "Verdana",
  ]),
  ...getFonts(Fonts),
}));
const message = t("The graphic file type is not suitable for use on the web");
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
      ["upload", t("Upload Image"), open],
      [
        "share",
        t("Insert Route"),
        () => {
          const component = VLinkDialog;
          $q.dialog({ component }).onOk((value: string) => {
            editor.value?.runCmd("createLink", value);
          });
        },
      ],
    ].map(([icon, tip, handler]) => [icon, { handler, icon, tip }]),
  ) as Record<string, QEditorCommand>),
  ...Object.fromEntries(
    [
      ...[...Array(6).keys()].map((key) => [
        `h${String(key + 1)}`,
        `heading${String(key + 1)}`,
      ]),
      ["p", "paragraph"],
      ["code", "code"],
    ].map(([key, value]) => [
      key,
      {
        htmlTip: `<span class="prose"><${key} class="!my-0">${$q.lang.editor[value as keyof StringDictionary<QuasarLanguageEditorLabel>]}</${key}></span>`,
      },
    ]),
  ),
};
const list = "no-icons";
const toolbar = computed(() => [
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
          ...[...Array(6).keys()].map((key) => `h${String(key + 1)}`),
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
      [
        "defaultFont",
        ["default_font", ...Object.keys(fonts.value)],
        false,
        true,
      ],
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
]);
watch(files, (newFiles) => {
  if (newFiles) [...newFiles].forEach(insertImage);
});
const htm = ref(await props.modelValue);
</script>
