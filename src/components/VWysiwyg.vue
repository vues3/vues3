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
    ref="editor"
  )
</template>

<script setup lang="ts">
import type {
  QEditor,
  QEditorProps,
  QuasarIconSetEditor,
  QuasarLanguageEditorLabel,
  StringDictionary,
} from "quasar";
import type { Component, Ref } from "vue";

import webFonts from "@unocss/preset-web-fonts";
import initUnocssRuntime from "@unocss/runtime";
import { consoleError, customFetch, defaultFonts } from "@vues3/shared";
import { reactiveComputed, useFileDialog } from "@vueuse/core";
import Defaults from "app/uno.config";
import mimes from "assets/mimes.json";
import VLinkDialog from "components/VLinkDialog.vue";
import mime from "mime";
import { uid, useQuasar } from "quasar";
import { fonts as Fonts, urls } from "stores/app";
import { accept, bypassDefined, immediate, reset } from "stores/defaults";
import { putObject } from "stores/io";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

/* -------------------------------------------------------------------------- */

const { t } = useI18n();

/* -------------------------------------------------------------------------- */

const $q = useQuasar(),
  editor: Ref<QEditor | undefined> = ref(),
  fonts = reactiveComputed(() =>
    Object.fromEntries(
      [...defaultFonts, ...Fonts].map((value) => [
        value.toLowerCase().replaceAll(" ", "_"),
        value,
      ]),
    ),
  ),
  props = withDefaults(
    defineProps<{
      id: string | undefined;
      modelValue: Promise<string> | string;
    }>(),
    {
      id: "",
      modelValue: "",
    },
  ),
  htm = ref(await props.modelValue),
  list = "no-icons",
  message = t("The graphic file type is not suitable for use on the web"),
  placeholder = t("Add some content to your page..."),
  toolbar = computed(() => [
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
          [
            "default_font",
            ...Object.keys(fonts).sort((a, b) => a.localeCompare(b)),
          ],
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

/* -------------------------------------------------------------------------- */

const insertImage = (file: File) => {
  const { type } = file;
  if (mimes.includes(type)) {
    const filePath = `images/${uid()}.${mime.getExtension(type) ?? ""}`;
    (async () => {
      await putObject(filePath, new Uint8Array(await file.arrayBuffer()), type);
    })().catch(consoleError);
    urls.set(filePath, URL.createObjectURL(file));
    editor.value?.runCmd(
      "insertHTML",
      `<img src="${urls.get(filePath) ?? ""}" data-src="${filePath}" alt="" decoding="async" loading="lazy" />`,
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

/* -------------------------------------------------------------------------- */

const { files, open } = useFileDialog({ accept, reset });

/* -------------------------------------------------------------------------- */

const definitions = {
  ...(Object.fromEntries(
    [
      ["upload", t("Upload Image"), open],
      [
        "share",
        t("Insert Route"),
        () => {
          const component = VLinkDialog as Component;
          $q.dialog({ component }).onOk((value: string) => {
            editor.value?.runCmd("createLink", value);
          });
        },
      ],
    ].map(([icon, tip, handler]) => [icon, { handler, icon, tip }]),
  ) as QEditorProps["definitions"]),
  ...Object.fromEntries(
    [
      ...[...Array(6).keys()].map((key) => [
        `h${String(key + 1)}`,
        `heading${String(key + 1)}`,
      ]),
      ["p", "paragraph"],
      ["code", "code"],
    ].map(([key = "div", value]) => [
      key,
      {
        htmlTip: `<span class="prose"><${key} class="!my-0">${$q.lang.editor[value as keyof StringDictionary<QuasarLanguageEditorLabel>]}</${key}></span>`,
      },
    ]),
  ),
};

/* -------------------------------------------------------------------------- */

defineEmits(["update:modelValue"]);

watch(files, (newFiles) => {
  if (newFiles) [...newFiles].forEach(insertImage);
});

onMounted(() => {
  const rootElement = editor.value?.getContentEl;
  watch(
    fonts,
    async () => {
      if (rootElement) {
        let { presets } = Defaults;
        presets = [...presets, webFonts({ customFetch, fonts })];
        const defaults = { presets };
        await initUnocssRuntime({ bypassDefined, defaults, rootElement });
      }
    },
    { immediate },
  );
  watch(
    () => props.id,
    async () => {
      htm.value = await props.modelValue;
      const contentEl = rootElement?.();
      if (
        contentEl?.innerHTML !== undefined &&
        contentEl.innerHTML !== htm.value
      )
        contentEl.innerHTML = htm.value;
    },
  );
});
</script>
