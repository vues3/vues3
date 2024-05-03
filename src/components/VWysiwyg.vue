<template lang="pug">
div
  q-editor.col.column.full-width(
    ref="editor",
    paragraph-tag="div",
    :model-value="htm",
    :dense="$q.screen.lt.md",
    :toolbar,
    :fonts,
    content-class="col prose max-w-none full-width text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl",
    flat,
    placeholder="Добавьте контент на вашу страницу...",
    :definitions,
    @paste="capture",
    @drop="capture",
    @update:model-value="$emit('update:modelValue', $event)",
    @vue:mounted="nextTick(editor?.focus)"
  )
  v-template-dialog(v-model="showTemplateDialog", :editor)
  v-link-dialog(v-model="showLinkDialog", :editor)
</template>
<script setup lang="ts">
import "daisyui/dist/full.css";

import { useFileDialog } from "@vueuse/core";
import { fonts } from "app/uno.config";
import VLinkDialog from "components/VLinkDialog.vue";
import VTemplateDialog from "components/VTemplateDialog.vue";
import type {
  QEditor,
  QEditorCommand,
  QuasarIconSetEditor,
  QuasarLanguageEditorLabel,
  QVueGlobals,
  StringDictionary,
} from "quasar";
import { useQuasar } from "quasar";
import { putImage } from "stores/app";
import { $ } from "stores/data";
import { accept } from "stores/defaults";
import { base } from "stores/s3";
import type { Ref } from "vue";
import { nextTick, ref, watch } from "vue";
/** ModelValue - Контент для загрузки в редактор */
interface IProps {
  modelValue: Promise<string> | string;
}
/** Пропсы */
const props: IProps = withDefaults(defineProps<IProps>(), {
  modelValue: "",
});
defineEmits(["update:modelValue"]);
/** Флаг демонстрации модального окна для вставки шаблона */
const showTemplateDialog: Ref<boolean> = ref(false);
/** Флаг демонстрации модального окна для вставки внутренних ссылок */
const showLinkDialog: Ref<boolean> = ref(false);
/** Объект quasar */
const $q: QVueGlobals = useQuasar();
/** Экземпляр редактора */
const editor: Ref<QEditor | undefined> = ref();
/**
 * Функция закачки картинки на сервер
 *
 * @param file - Файл
 * @see {@link
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types#image_types}
 */
const insertImage = (file: File) => {
  (async () => {
    const { filePath, message } = await putImage(file);
    if (message) $q.notify({ message });
    else if (filePath)
      editor.value?.runCmd("insertImage", `${base.value ?? ""}/${filePath}`);
  })().catch(() => {});
};
/**
 * Функция обработки вставки картинок через d'n'd и ctrl+v
 *
 * @param evt - Объект события
 */
const capture = (evt: ClipboardEvent | DragEvent) => {
  const { files = [] } =
    (<DragEvent>evt).dataTransfer ?? (<ClipboardEvent>evt).clipboardData ?? {};
  if (files.length) {
    evt.preventDefault();
    evt.stopPropagation();
    [...files].forEach(insertImage);
  }
};
const { files, open } = useFileDialog({ accept });
/** Определения для редактора */
const definitions: { [commandName: string]: QEditorCommand } = <const>{
  ...(<{ [commandName: string]: QEditorCommand }>Object.fromEntries(
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
    ].map(([icon, tip, handler]) => [icon, { tip, icon, handler }]),
  )),
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
        htmlTip: `<span class="prose"><${key} class="q-ma-none">${$q.lang.editor[<keyof StringDictionary<QuasarLanguageEditorLabel>>value]}</${key}></span>`,
      },
    ]),
  ),
};
/**
 * Выпадающий список без иконок
 *
 * @default
 */
const list: string = "no-icons";
/** Конфигурация тулбара */
const toolbar: (string | object)[][] = <const>[
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
      label:
        $q.lang.editor[<keyof StringDictionary<QuasarLanguageEditorLabel>>key],
      icon: $q.iconSet.editor[<keyof StringDictionary<QuasarIconSetEditor>>key],
      list,
      options,
      fixedLabel,
      fixedIcon,
    })),
    "removeFormat",
  ],
  ["quote", "unordered", "ordered", "outdent", "indent"],
  ["undo", "redo"],
  ["upload", "dashboard", "share"],
];
watch(files, (newFiles) => {
  if (newFiles) [...newFiles].forEach(insertImage);
});
/** Текст для вставки в редактор */
const htm: Ref<string> = ref(await props.modelValue);
</script>
<style lang="sass" scoped>
:deep(router-link)
  color: var(--tw-prose-links)
  text-decoration: underline
  font-weight: 500
</style>
