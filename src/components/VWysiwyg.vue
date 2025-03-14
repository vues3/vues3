<!-- eslint-disable vue/no-v-html vue/no-v-text-v-html-on-component -->
<template lang="pug">
form.col.column(
  autocapitalize="on",
  autocomplete="on",
  autocorrect="on",
  spellcheck="true"
)
  q-editor.col.column(
    ref="editor",
    :definitions,
    :dense="$q.screen.lt.md",
    :fonts,
    :model-value="htm",
    :placeholder,
    :toolbar,
    content-class="col prose max-w-none",
    flat,
    @drop="paste",
    @paste="paste",
    @update:model-value="$emit('update:modelValue', $event)"
  )
  q-tooltip.text-caption.bg-primary(
    v-if="blocks && inViewport",
    v-model="show",
    :target,
    anchor="top left",
    self="top left",
    :scroll-target,
    v-html="tagNameClassList"
  )
  q-menu(
    v-if="blocks",
    touch-position,
    context-menu,
    :target="scrollTarget",
    :scroll-target,
    @show="srcElement = target"
  )
    q-list(dense)
      q-item(
        v-close-popup,
        clickable,
        :disable="!srcElement",
        @click="openClassDialog"
      )
        q-item-section(side)
          q-icon(name="css")
        q-item-section {{ t("Edit classes") }}
</template>
<script setup lang="ts">
import type {
  QEditor,
  QEditorCommand,
  QuasarIconSetEditor,
  QuasarLanguageEditorLabel,
  StringDictionary,
} from "quasar";
import type { Component } from "vue";

import webFonts from "@unocss/preset-web-fonts";
import initUnocssRuntime from "@unocss/runtime";
import {
  consoleError,
  customFetch,
  getFontsObjectFromArray,
} from "@vues3/shared";
import { useFileDialog } from "@vueuse/core";
import Defaults from "app/uno.config";
import mimes from "assets/mimes.json";
import VChipsInputDialog from "components/dialogs/VChipsInputDialog.vue";
import VLinkDialog from "components/dialogs/VLinkDialog.vue";
import mime from "mime";
import { uid, useQuasar } from "quasar";
import { fonts as Fonts, urls } from "stores/app";
import {
  accept,
  bypassDefined,
  cancel,
  immediate,
  persistent,
  reset,
} from "stores/defaults";
import { putObject } from "stores/io";
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
let rootElement: () => Element | undefined;
const editor = ref<QEditor>(),
  scrollTarget = ref<Element>(),
  { files, open } = useFileDialog({ accept, reset }),
  { t } = useI18n();
const $q = useQuasar(),
  blocks = ref(false),
  definitions = {
    ...Object.fromEntries(
      [
        [
          "dashboard",
          t("Show Blocks"),
          () => {
            blocks.value = !blocks.value;
            if (blocks.value) scrollTarget.value?.classList.add("outline");
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
      ].map(
        ([icon, tip, handler]) =>
          [icon, { handler, icon, tip }] as [string, QEditorCommand],
      ),
    ),
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
          htmlTip: `<span class="prose">
  <${key} class="!my-0">${$q.lang.editor[value as keyof StringDictionary<QuasarLanguageEditorLabel>]}</${key}>
</span>`,
        },
      ]),
    ),
  },
  emit = defineEmits(["update:modelValue"]),
  fonts = computed(() => ({
    ...getFontsObjectFromArray([
      "Arial",
      "Arial Black",
      "Comic Sans",
      "Courier New",
      "Impact",
      "Lucida Grande",
      "Times New Roman",
      "Verdana",
    ]),
    ...getFontsObjectFromArray(Fonts),
  })),
  props = withDefaults(
    defineProps<{
      id?: string | undefined;
      modelValue?: Promise<string> | string;
    }>(),
    {
      id: "",
      modelValue: "",
    },
  ),
  htm = ref(await props.modelValue),
  insertImage = (file: File) => {
    const message = t(
        "The graphic file type is not suitable for use on the web",
      ),
      { type } = file;
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
  inViewport = ref(false),
  list = "no-icons",
  placeholder = t("Add some content to your page..."),
  show = ref(false),
  srcElement = ref<boolean | Element>(true),
  tagNameClassList = ref(""),
  target = ref<boolean | Element>(false),
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
  ]);
const onContextmenu = (event: Event) => {
    event.stopPropagation();
  },
  onMouseover = ({ currentTarget, target: element }: Event) => {
    if (
      blocks.value &&
      element !== currentTarget &&
      element instanceof Element
    ) {
      const { x = 0, y = 0 } =
        scrollTarget.value?.getBoundingClientRect() ?? {};
      const { left, top } = element.getBoundingClientRect();
      inViewport.value = left > x && top > y;
      const { classList, tagName } = element;
      tagNameClassList.value = [
        `<strong>${tagName.toLowerCase()}</strong>`,
        ...classList,
      ].join(".");
      target.value = element;
    } else target.value = false;
  },
  openClassDialog = () => {
    if (typeof srcElement.value !== "boolean") {
      const { classList = [] } = srcElement.value;
      const component = VChipsInputDialog as Component,
        message = t(
          "The class global attribute is a list of the classes of the element, separated by ASCII whitespace",
        ),
        title = "class",
        value = [...classList],
        componentProps = { cancel, message, persistent, title, value };
      $q.dialog({ component, componentProps }).onOk((className: string[]) => {
        if (typeof srcElement.value !== "boolean")
          srcElement.value.className = className.join(" ");
        emit("update:modelValue", scrollTarget.value?.innerHTML);
      });
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
  };
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
watch(
  Fonts,
  async (value) => {
    const fonts = getFontsObjectFromArray(value);
    let { presets } = Defaults;
    presets = [...presets, webFonts({ customFetch, fonts })];
    const defaults = { presets };
    await initUnocssRuntime({ bypassDefined, defaults, rootElement });
  },
  { immediate },
);
onMounted(() => {
  rootElement = editor.value?.getContentEl ?? (() => undefined);
  scrollTarget.value = rootElement();
  scrollTarget.value?.addEventListener("mouseover", onMouseover);
  scrollTarget.value?.addEventListener("contextmenu", onContextmenu);
  editor.value?.focus();
});
onUnmounted(() => {
  scrollTarget.value?.removeEventListener("mouseover", onMouseover);
  scrollTarget.value?.removeEventListener("contextmenu", onContextmenu);
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
