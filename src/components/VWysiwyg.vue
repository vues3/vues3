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
    @vue:mounted="nextTick(editor.focus)"
  )
  v-template-dialog(v-model="showTemplateDialog", :theme, :editor)
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
import { nextTick, ref, watch, watchPostEffect } from "vue";
/**
 * @type {IProps}
 * @property {Promise<string> | string} modelValue - Контент для загрузки в
 *   редактор
 * @property {string | undefined} theme - Тема
 */
interface IProps {
  modelValue: Promise<string> | string;
  theme: string | undefined;
}
/**
 * Пропсы
 *
 * @type {IProps}
 */
const props: IProps = withDefaults(defineProps<IProps>(), {
  modelValue: "",
  theme: undefined,
});
defineEmits(["update:modelValue"]);
/**
 * Флаг демонстрации модального окна для вставки шаблона
 *
 * @type {Ref<boolean>}
 */
const showTemplateDialog: Ref<boolean> = ref(false);
/**
 * Флаг демонстрации модального окна для вставки внутренних ссылок
 *
 * @type {Ref<boolean>}
 */
const showLinkDialog: Ref<boolean> = ref(false);
/**
 * Объект quasar
 *
 * @type {QVueGlobals}
 */
const $q: QVueGlobals = useQuasar();
/**
 * Экземпляр редактора
 *
 * @type {Ref<QEditor | undefined>}
 */
const editor: Ref<QEditor | undefined> = ref();
/**
 * Функция закачки картинки на сервер
 *
 * @function insertImage
 * @param {object} file - Файл
 * @see {@link
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types#image_types}
 */
const insertImage = async (file: File) => {
  const { filePath, message } = await putImage(file);
  if (message) $q.notify({ message });
  else editor.value?.runCmd("insertImage", `${base.value}/${filePath}`);
};
/**
 * Функция обработки вставки картинок через d'n'd и ctrl+v
 *
 * @function capture
 * @param {ClipboardEvent | DragEvent} evt - Объект события
 */
const capture = (evt: ClipboardEvent | DragEvent) => {
  const { files = [] } =
    (evt as DragEvent)?.dataTransfer ??
    (evt as ClipboardEvent)?.clipboardData ??
    {};
  if (files.length) {
    evt.preventDefault();
    evt.stopPropagation();
    [...files].forEach(insertImage);
  }
};
const { files, open } = useFileDialog({ accept });
/**
 * Определения для редактора
 *
 * @constant
 * @type {object}
 */
const definitions: object = {
  ...Object.fromEntries(
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
          if ($.content?.length) showLinkDialog.value = true;
        },
      ],
    ].map(([icon, tip, handler]) => [icon, { tip, icon, handler }]),
  ),
  ...Object.fromEntries(
    [
      ...[...Array(4).keys()].map((key) => [
        `h${key + 1}`,
        `heading${key + 1}`,
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
/**
 * Выпадающий список без иконок
 *
 * @constant
 * @default
 * @type {string}
 */
const list: string = "no-icons";
/**
 * Конфигурация тулбара
 *
 * @constant
 * @type {string | {}[][]}
 */
const toolbar: string | {}[][] = [
  ["left", "center", "right", "justify"],
  ["bold", "italic", "strike", "underline", "subscript", "superscript"],
  ["hr", "link"],
  ["print", "fullscreen"],
  [
    ...[
      [
        "formatting",
        ["p", ...[...Array(4).keys()].map((key) => `h${key + 1}`), "code"],
        false,
        false,
      ],
      [
        "fontSize",
        [...Array(7).keys()].map((key) => `size-${key + 1}`),
        true,
        true,
      ],
      ["defaultFont", ["default_font", ...Object.keys(fonts)], false, true],
    ].map(([key, options, fixedLabel, fixedIcon]) => ({
      label:
        $q.lang.editor[
          key as keyof StringDictionary<QuasarLanguageEditorLabel>
        ],
      icon: $q.iconSet.editor[
        key as keyof StringDictionary<QuasarIconSetEditor>
      ],
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
] as const;
watch(files, (newFiles) => {
  if (newFiles) [...newFiles].forEach(insertImage);
});
watchPostEffect(() => {
  /**
   * Элемент, в котором содержится контент редактора
   *
   * @constant
   * @type {HTMLElement | undefined}
   */
  const contentEl: HTMLElement | undefined = editor.value?.getContentEl() as
    | HTMLElement
    | undefined;
  if (contentEl) contentEl.dataset.theme = props.theme;
});
/**
 * Текст для вставки в редактор
 *
 * @type {Ref<string | null>}
 */
const htm: Ref<string | null> = ref(await props.modelValue);
</script>
<style lang="sass" scoped>
:deep(router-link)
  color: var(--tw-prose-links)
  text-decoration: underline
  font-weight: 500
</style>
