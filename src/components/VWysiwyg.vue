<!-- eslint-disable vue/no-v-text-v-html-on-component -->
<template lang="pug">
form.col.column(
  autocapitalize="on",
  autocomplete="on",
  autocorrect="on",
  spellcheck="true"
)
  q-editor.col.column(
    :definitions,
    :dense="$q.screen.lt.md",
    :fonts,
    :model-value="htm",
    :placeholder,
    :toolbar,
    @drop="paste",
    @paste="paste",
    @update:model-value="$emit('update:modelValue', $event)",
    content-class="col prose max-w-none",
    flat,
    ref="editor"
  )
  q-tooltip.text-caption.bg-primary(
    :target,
    anchor="top left",
    self="top left",
    :scroll-target,
    v-model="show",
    v-html="tooltip"
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
import { consoleError, customFetch, getFonts } from "@vues3/shared";
import { useFileDialog } from "@vueuse/core";
import Defaults from "app/uno.config";
import mimes from "assets/mimes.json";
import VLinkDialog from "components/VLinkDialog.vue";
import mime from "mime";
import { uid, useQuasar } from "quasar";
import { fonts as Fonts, urls } from "stores/app";
import { accept, bypassDefined, immediate, reset } from "stores/defaults";
import { putObject } from "stores/io";
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

/* -------------------------------------------------------------------------- */

let blocks = false,
  rootElement: () => Element | undefined;

/* -------------------------------------------------------------------------- */

watch(
  () => getFonts(Fonts),
  async (fonts) => {
    let { presets } = Defaults;
    presets = [...presets, webFonts({ customFetch, fonts })];
    const defaults = { presets };
    await initUnocssRuntime({ bypassDefined, defaults, rootElement });
  },
  { immediate },
);

/* -------------------------------------------------------------------------- */

const { t } = useI18n();

const $q = useQuasar(),
  editor: Ref<QEditor | undefined> = ref(),
  fonts = computed(() => ({
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
  })),
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
  scrollTarget: Ref<Element | undefined> = ref(),
  show = ref(false),
  target: Ref<boolean | Element> = ref(false),
  toolbar = computed(() => [
    ["left", "center", "right", "justify"],
    ["bold", "italic", "strike", "underline", "subscript", "superscript"],
    ["hr", "link"],
    ["print", "fullscreen", "dashboard"],
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
            ...Object.keys(fonts.value).sort((a, b) => a.localeCompare(b)),
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
    ["wallpaper", "file_present"],
  ]),
  tooltip = ref("");

const insertImage = (file: File) => {
    const { type } = file;
    if (mimes.includes(type)) {
      const filePath = `images/${uid()}.${mime.getExtension(type) ?? ""}`;
      (async () => {
        await putObject(
          filePath,
          new Uint8Array(await file.arrayBuffer()),
          type,
        );
      })().catch(consoleError);
      urls.set(filePath, URL.createObjectURL(file));
      editor.value?.runCmd(
        "insertHTML",
        `<img src="${urls.get(filePath) ?? ""}" data-src="${filePath}" alt="" decoding="async" loading="lazy" />`,
      );
    } else $q.notify({ message });
  },
  listener: EventListener = ({ currentTarget, target: element }) => {
    if (!blocks) target.value = false;
    else if (element !== currentTarget && element instanceof Element) {
      const { classList, tagName } = element;
      tooltip.value = [
        `<strong>${tagName.toLowerCase()}</strong>`,
        ...classList,
      ].join(".");
      target.value = element;
    }
  },
  paste = (evt: ClipboardEvent | DragEvent) => {
    const { files = [] } =
      (evt as DragEvent).dataTransfer ??
      (evt as ClipboardEvent).clipboardData ??
      {};
    if (files.length) {
      evt.preventDefault();
      evt.stopPropagation();
      [...files].forEach(insertImage);
    }
  },
  { files, open } = useFileDialog({ accept, reset });

const definitions = {
  ...(Object.fromEntries(
    [
      [
        "dashboard",
        t("Show Blocks"),
        () => {
          blocks = !blocks;
          if (blocks) scrollTarget.value?.classList.add("outline");
          else scrollTarget.value?.classList.remove("outline");
        },
      ],
      ["wallpaper", t("Upload Image"), open],
      [
        "file_present",
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

watch(target, async () => {
  show.value = false;
  await nextTick();
  show.value = true;
});

watch(
  () => props.id,
  async () => {
    htm.value = await props.modelValue;
    if (scrollTarget.value && scrollTarget.value.innerHTML !== htm.value)
      scrollTarget.value.innerHTML = htm.value;
  },
);

onMounted(() => {
  rootElement = editor.value?.getContentEl ?? (() => undefined);
  scrollTarget.value = rootElement();
  scrollTarget.value?.addEventListener("mouseover", listener);
  editor.value?.focus();
});

onUnmounted(() => {
  scrollTarget.value?.removeEventListener("mouseover", listener);
});
</script>

<style scoped>
:deep(.outline *) {
  outline-style: dashed;
  outline-width: 2px;
  outline-offset: 2px;
  outline-color: rgb(25, 118, 210);
}
</style>
