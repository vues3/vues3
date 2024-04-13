<template lang="pug">
div
  q-editor.col.column.full-width(
    v-if="htm !== null",
    ref="editorRef",
    :model-value="htm",
    :dense="$q?.screen?.lt?.md",
    :toolbar="editorTlb",
    :fonts="fonts",
    content-class="col prose max-w-none full-width text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl",
    flat,
    placeholder="Добавьте контент на вашу страницу...",
    :definitions="editorDef",
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
              :nodes="$?.content",
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
import mime from "mime";
import { storeToRefs } from "pinia";
import { useQuasar } from "quasar";
import type { Ref } from "vue";
import {
  computed,
  nextTick,
  ref,
  watch,
  watchEffect,
  watchPostEffect,
} from "vue";

import mimes from "@/assets/mimes.json";
import templates from "@/assets/templates.json";
import s3 from "@/stores/s3";
import data from "~/monolit/src/stores/data";
import { fonts } from "~/uno.config";

interface IProps {
  modelValue: Promise<string> | string;
  theme: string | null;
}

const { modelValue, theme } = withDefaults(defineProps<IProps>(), {
  modelValue: "",
  theme: null,
});

defineEmits(["update:modelValue"]);
const htm: Ref<string | null> = ref(null);
watchEffect(async () => {
  htm.value = await modelValue;
});

const template = ref(false);
const routerLink = ref(false);
const $q = useQuasar();
const S3 = s3();
const { base } = storeToRefs(S3);
const { putFile } = S3;
const { pages } = storeToRefs(data());
const { $ } = data();
const inserted: Ref<string | null | undefined> = ref(null);
const insertedObject = computed(() =>
  pages.value.find(({ id }) => id === inserted?.value),
);
const immediate = true;
watch(
  () => $?.content ?? [],
  ([{ id }]) => {
    inserted.value = id;
  },
  { immediate },
);
const editorRef = ref();
const modalRef = ref();
/**
 * { @link
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types#image_types
 * }
 *
 * @param {object} file - Файл
 */
const putImage = async (file: File) => {
  try {
    const { type } = file;
    if (mimes?.includes(type)) {
      const filePath = `assets/${crypto?.randomUUID()}.${mime?.getExtension(type)}`;
      await putFile(filePath, type, file);
      editorRef?.value?.runCmd("insertImage", `${base?.value}/${filePath}`);
    } else
      throw new Error(
        "Тип графического файла не подходит для использования в сети интернет",
      );
  } catch (err) {
    const { message } = err as Error;
    $q?.notify({ message });
  }
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
    Array.from(files).forEach(putImage);
  }
};
const accept = "image/*";
const { files, open } = useFileDialog({ accept });
watch(files, (newFiles) => {
  if (newFiles) [...newFiles]?.forEach(putImage);
});
const e = $q?.lang?.editor;
const i = $q?.iconSet?.editor;
const editorDef = {
  upload: {
    tip: "Загрузка картинки",
    icon: "cloud_upload",
    handler: open,
  },
  template: {
    tip: "Выбор шаблона",
    icon: "dashboard",
    /** Открытие модального окна */
    handler() {
      template.value = true;
    },
  },
  routerLink: {
    tip: "Вставка внутренней ссылки",
    icon: "share",
    /** Открытие модального окна */
    handler() {
      routerLink.value = true;
    },
  },
  h1: {
    cmd: "formatBlock",
    param: "H1",
    icon: i.heading1 || i.heading,
    tip: e.heading1,
    htmlTip: `<span class="prose"><h1 class="no-margin">${e.heading1}</h1></span>`,
  },
  h2: {
    cmd: "formatBlock",
    param: "H2",
    icon: i.heading2 || i.heading,
    tip: e.heading2,
    htmlTip: `<span class="prose"><h2 class="no-margin">${e.heading2}</h2></span>`,
  },
  h3: {
    cmd: "formatBlock",
    param: "H3",
    icon: i.heading3 || i.heading,
    tip: e.heading3,
    htmlTip: `<span class="prose"><h3 class="no-margin">${e.heading3}</h3></span>`,
  },
  h4: {
    cmd: "formatBlock",
    param: "H4",
    icon: i.heading4 || i.heading,
    tip: e.heading4,
    htmlTip: `<span class="prose"><h4 class="no-margin">${e.heading4}</h4></span>`,
  },
  p: {
    cmd: "formatBlock",
    param: "DIV",
    icon: i.heading,
    tip: e.paragraph,
  },
  code: {
    cmd: "formatBlock",
    param: "PRE",
    icon: i.code,
    htmlTip: `<span class="prose"><code>${e.code}</code></span>`,
  },
};
const editorTlb = [
  ["left", "center", "right", "justify"],
  ["bold", "italic", "strike", "underline", "subscript", "superscript"],
  ["token", "hr", "link", "custom_btn"],
  ["print", "fullscreen"],
  [
    {
      label: e.formatting,
      icon: i.formatting,
      list: "no-icons",
      options: ["p", "h1", "h2", "h3", "h4", "code"],
    },
    {
      label: e.fontSize,
      icon: i.fontSize,
      fixedLabel: true,
      fixedIcon: true,
      list: "no-icons",
      options: [
        "size-1",
        "size-2",
        "size-3",
        "size-4",
        "size-5",
        "size-6",
        "size-7",
      ],
    },
    {
      label: e.defaultFont,
      icon: i.font,
      fixedIcon: true,
      list: "no-icons",
      options: ["default_font", ...Object.keys(fonts)],
    },
    "removeFormat",
  ],
  ["quote", "unordered", "ordered", "outdent", "indent"],
  ["undo", "redo"],
  ["upload", "template", "routerLink"],
];
watchPostEffect(() => {
  if (editorRef.value) editorRef.value.getContentEl().dataset.theme = theme;
});
/** ShowDialog */
const showDialog = () => {
  modalRef.value.dataset.theme = theme;
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
