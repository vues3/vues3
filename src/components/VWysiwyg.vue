<template lang="pug">
div
  q-editor.col.column.full-width(
    v-if="htm !== null",
    ref="editorRef",
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
    @vue:mounted="nextTick(editorRef.focus)"
  )
  q-dialog(
    v-model="template",
    full-width,
    full-height,
    persistent,
    @show="showDialog"
  )
    q-card.column.w-full
      q-card-section.row.q-pb-none.items-center
        .text-h6 Выбор компонента для вставки
        q-space
        q-btn(v-close-popup, icon="close", flat, round, dense)
      q-card-section
        q-select(
          v-model="model",
          filled,
          :options="templates",
          label="Компонент",
          emit-value,
          map-options
        )
      q-card-section.col.column.w-full
        q-card.col.column.w-full(flat, bordered)
          q-card-section.col.column.w-full
            // eslint-disable vue/no-v-html
            .col.prose.column.q-pa-xl.w-full.max-w-none.overflow-auto(
              ref="modalRef",
              class="[&>*]:m-auto [&>*]:!min-h-fit [&>*]:min-w-fit",
              v-html="model"
            )
            // eslint-enable vue/no-v-html
      q-card-actions.text-primary(align="right")
        q-btn(v-close-popup, flat, label="Отмена")
        q-btn(
          v-close-popup,
          flat,
          label="Ok",
          @click="editorRef.runCmd('insertHTML', html_beautify(model))"
        )
  q-dialog(v-model="routerLink", full-width, full-height, persistent)
    q-card.column
      q-card-section.row.q-pb-none.items-center
        .text-h6 Выбор внутренней ссылки для вставки
        q-space
        q-btn(v-close-popup, icon="close", flat, round, dense)
      q-card-section.col.column.full-width
        q-card.col.column.full-width(flat, bordered)
          q-card-section.col.column.full-width
            q-tree.col.scroll.full-width(
              v-if="$?.content",
              v-model:selected="inserted",
              :nodes="$.content",
              default-expand-all,
              node-key="id",
              no-selection-unset,
              selected-color="primary"
            )
      q-card-actions.text-primary(align="right")
        q-btn(v-close-popup, flat, label="Отмена")
        q-btn(
          v-close-popup,
          flat,
          label="Ok",
          @click="editorRef.runCmd('insertHTML', `<router-link to='/${insertedObject?.path}'>${insertedObject?.label}</router-link>`)"
        )
</template>

<script setup lang="ts">
import "daisyui/dist/full.css";

import { useFileDialog } from "@vueuse/core";
import { html_beautify } from "js-beautify";
import type { QuasarIconSet, QuasarLanguage, QVueGlobals } from "quasar";
import { useQuasar } from "quasar";
import type { ComputedRef, Ref } from "vue";
import {
  computed,
  nextTick,
  ref,
  watch,
  watchEffect,
  watchPostEffect,
} from "vue";

import templates from "@/assets/templates.json";
import { accept, immediate, putImage } from "@/stores/app";
import { base } from "@/stores/s3";
import type { TPage } from "~/monolit/src/stores/data";
import { $, pages } from "~/monolit/src/stores/data";
import { fonts } from "~/uno.config";

interface IProps {
  modelValue: Promise<string> | string;
  theme: string | null;
}

const props: IProps = withDefaults(defineProps<IProps>(), {
  modelValue: "",
  theme: null,
});

defineEmits(["update:modelValue"]);

/** @type {Ref<string | null>} */
const htm: Ref<string | null> = ref(null);

watchEffect(async () => {
  htm.value = await props.modelValue;
});

/** @type {Ref<boolean>} */
const template: Ref<boolean> = ref(false);

/** @type {Ref<boolean>} */
const routerLink: Ref<boolean> = ref(false);

/** @type {QVueGlobals} */
const $q: QVueGlobals = useQuasar();

/** @type {Ref<string | null | undefined>} */
const inserted: Ref<string | null | undefined> = ref(null);

/** @type {ComputedRef<TPage | null>} */
const insertedObject: ComputedRef<TPage | null> = computed(
  () => pages.value.find(({ id }) => id === inserted?.value) ?? null,
);

watch(
  () => $?.content ?? [],
  ([{ id = null } = {}]) => {
    inserted.value = id;
  },
  { immediate },
);

/** @type {Ref<any>} */
const editorRef: Ref<any> = ref(null);

/** @type {Ref<HTMLElement | null>} */
const modalRef: Ref<any> = ref(null);

/**
 * @function insertImage
 * @param {object} file - Файл
 * @see {@link
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types#image_types}
 */
const insertImage = async (file: File) => {
  const { filePath, message } = await putImage(file);

  if (message) $q.notify({ message });
  else editorRef.value.runCmd("insertImage", `${base.value}/${filePath}`);
};

/** @param {object} evt - Объект события */
const capture = (evt: ClipboardEvent | DragEvent) => {
  const { files = [] } =
    (evt as DragEvent)?.dataTransfer ??
    (evt as ClipboardEvent)?.clipboardData ??
    {};
  if (files.length) {
    evt.preventDefault();
    evt.stopPropagation();
    Array.from(files).forEach(insertImage);
  }
};

const { files, open } = useFileDialog({ accept });

watch(files, (newFiles) => {
  if (newFiles) [...newFiles]?.forEach(insertImage);
});

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
          template.value = true;
        },
      ],
      [
        "share",
        "Вставка внутренней ссылки",
        () => {
          routerLink.value = true;
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
        htmlTip: `<span class="prose"><${key} class="q-ma-none">${$q.lang.editor[value as keyof QuasarLanguage["editor"]]}</${key}></span>`,
      },
    ]),
  ),
};

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
      label: $q.lang.editor[key as keyof QuasarLanguage["editor"]],
      icon: $q.iconSet.editor[key as keyof QuasarIconSet["editor"]],
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

watchPostEffect(() => {
  if (editorRef.value)
    editorRef.value.getContentEl().dataset.theme = props.theme;
});

/** ShowDialog */
const showDialog = () => {
  modalRef.value.dataset.theme = props.theme;
};
const [{ value }] = templates;
const model = ref(value);
</script>
<style lang="sass" scoped>
:deep(router-link)
  color: var(--tw-prose-links)
  text-decoration: underline
  font-weight: 500
</style>
