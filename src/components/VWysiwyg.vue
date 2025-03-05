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

const { t } = useI18n();

const $q = useQuasar(),
  blocks = ref(false),
  definitions = {
    ...Object.fromEntries(
      [
        ["dashboard", t("Show Blocks"), showBlocks],
        ["wallpaper", t("Upload Image"), openFileDialog],
        ["file_present", t("Insert Route"), openInsertRouteDialog],
      ].map(getButton),
    ),
    ...Object.fromEntries(
      [
        ...[...Array(6).keys()].map(getHeading),
        ["p", "paragraph"],
        ["code", "code"],
      ].map(addProse),
    ),
  },
  editor = ref<QEditor>(),
  emit = defineEmits(["update:modelValue"]),
  fonts = computed(getFonts),
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
  inViewport = ref(false),
  list = "no-icons",
  placeholder = t("Add some content to your page..."),
  scrollTarget = ref<Element>(),
  show = ref(false),
  srcElement = ref<boolean | Element>(true),
  tagNameClassList = ref(""),
  target = ref<boolean | Element>(false),
  toolbar = computed(getToolbar),
  { files, open } = useFileDialog({ accept, reset });

/**
 * Добавляем прозу в поэзию форматирования. С этим классом меню форматирования
 * отображается грамотно форматированным. Больше форматирования богу
 * форматирования!
 */
function addProse([key = "div", value]: string[]) {
  return [
    key,
    {
      htmlTip: `<span class="prose">
  <${key} class="!my-0">${$q.lang.editor[value as keyof StringDictionary<QuasarLanguageEditorLabel>]}</${key}>
</span>`,
    },
  ] as [string, QEditorCommand];
}

/**
 * Великий сравниватель имен шрифтов, нужен для сортировки списка шрифтов в
 * алфавитном порядке
 */
function compareFontNames(a: string, b: string) {
  return a.localeCompare(b);
}

/** Мелкие, суетливые действия при монтировании визуального редактора */
function constructor() {
  rootElement = editor.value?.getContentEl ?? getUndefined;
  scrollTarget.value = rootElement();
  scrollTarget.value?.addEventListener("mouseover", onMouseover);
  scrollTarget.value?.addEventListener("contextmenu", onContextmenu);
  editor.value?.focus();
}

/** Вставка гиперссылки в гипертекст */
function createLink(value: string) {
  editor.value?.runCmd("createLink", value);
}

/** Мелкие, суетливые действия при демонтаже визуального редактора */
function destructor() {
  scrollTarget.value?.removeEventListener("mouseover", onMouseover);
  scrollTarget.value?.removeEventListener("contextmenu", onContextmenu);
}

/**
 * Получение объекта, который определяет сущность кнопки в панели инструментов.
 * Какая сущность будет определена, такова по сути и кнопка выйдет.
 */
function getButton([icon, tip, handler]: ((() => void) | string)[]) {
  return [icon, { handler, icon, tip }] as [string, QEditorCommand];
}

/** Шрифты подгружаемые и системные, гоп в едину кучу (объект). */
function getFonts() {
  return {
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
  };
}

/** Преобразователь бездушной цифры в теплый, лампово-аналоговый размер шрифта */
function getFontSize(key: number) {
  return `size-${String(key + 1)}`;
}

/** Преобразователь бездушной цифры в теплый, лампово-аналоговый номер заголовка */
function getHeader(key: number) {
  return `h${String(key + 1)}`;
}

/**
 * Преобразователь бездушной цифры в теплый, лампово-аналоговый номер заголовка
 * из StringDictionary<QuasarLanguageEditorLabel>
 */
function getHeading(key: number) {
  return [getHeader(key), `heading${String(key + 1)}`];
}

/**
 * Группа крови на рукаве. Мой порядковый номер на рукаве. Пожелай мне удачи в
 * бою, пожелай мне. Не остаться в этой траве, не остаться в этой траве. Пожелай
 * мне удачи, пожелай мне удачи.
 */
function getId() {
  return props.id;
}

/**
 * Что, по-вашему, этот мощный массив, возвращаемый данной функцией? Не
 * говорите, вы не можете этого знать. Это – гигант мысли, отец русской
 * демократии и особа, приближенная к панели инструментов визуального
 * редактора.
 */
function getToolbar() {
  return [
    ["left", "center", "right", "justify"],
    ["bold", "italic", "strike", "underline", "subscript", "superscript"],
    ["hr", "link"],
    ["print", "fullscreen", "dashboard"],
    [
      ...[
        [
          "formatting",
          ["p", ...[...Array(6).keys()].map(getHeader), "code"],
          false,
          false,
        ],
        ["fontSize", [...Array(7).keys()].map(getFontSize), true, true],
        [
          "defaultFont",
          ["default_font", ...Object.keys(fonts.value).sort(compareFontNames)],
          false,
          true,
        ],
      ].map(getToolbarElement),
      "removeFormat",
    ],
    ["quote", "unordered", "ordered", "outdent", "indent"],
    ["undo", "redo"],
    ["wallpaper", "file_present"],
  ];
}

/** Преобразователь скромного массива сырых данных в элемент панели инструментов */
function getToolbarElement([key, options, fixedLabel, fixedIcon]: (
  | boolean
  | string
  | string[]
)[]) {
  return {
    fixedIcon,
    fixedLabel,
    icon: $q.iconSet.editor[key as keyof StringDictionary<QuasarIconSetEditor>],
    label:
      $q.lang.editor[key as keyof StringDictionary<QuasarLanguageEditorLabel>],
    list,
    options,
  };
}

/** Загадочная функция, всегда дающая неопределенный ответ */
function getUndefined() {
  return undefined;
}

/** Инициализация UnoCSS со всеми шрифтами */
async function initUnocss(value: string[]) {
  const fonts = getFontsObjectFromArray(value);
  let { presets } = Defaults;
  presets = [...presets, webFonts({ customFetch, fonts })];
  const defaults = { presets };
  await initUnocssRuntime({ bypassDefined, defaults, rootElement });
}

/**
 * Пока картинка летит на сервер, вставляем в визуальный редактор её цифровой
 * двойник в виде бинарного объекта, а реальную ссылку пишем в data-src
 */
function insertImage(file: File) {
  const message = t("The graphic file type is not suitable for use on the web"),
    { type } = file;
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
}

/** Картинки, в очередь на загрузку становись! */
function insertImages(newFiles: FileList | null) {
  if (newFiles) [...newFiles].forEach(insertImage);
}

/** Галя, у нас отмена запрета контекстного меню */
function onContextmenu(event: Event) {
  event.stopPropagation();
}

/** Шпионит за передвижениями мыши по визуальному редактору */
function onMouseover({ currentTarget, target: element }: Event) {
  if (blocks.value && element !== currentTarget && element instanceof Element) {
    const { x = 0, y = 0 } = scrollTarget.value?.getBoundingClientRect() ?? {};
    const { left, top } = element.getBoundingClientRect();
    inViewport.value = left > x && top > y;
    const { classList, tagName } = element;
    tagNameClassList.value = [
      `<strong>${tagName.toLowerCase()}</strong>`,
      ...classList,
    ].join(".");
    target.value = element;
  } else target.value = false;
}

/**
 * Функция открывает диалоговое окно, в котором список классов. Хочешь правь
 * его, а хочешь нет, кому какая разница?
 */
function openClassDialog() {
  if (typeof srcElement.value !== "boolean") {
    const { classList = [] } = srcElement.value;
    const component = VChipsInputDialog as Component,
      message = t(
        "The class global attribute is a list of the classes of the element, separated by ASCII whitespace",
      ),
      title = "class",
      value = [...classList],
      componentProps = { cancel, message, persistent, title, value };
    $q.dialog({ component, componentProps }).onOk(updateClasses);
  }
}

/** Открывашка для системного диалога выбора картинки */
function openFileDialog() {
  open();
}

/** Открывашка для диалога вставки внутренних ссылок */
function openInsertRouteDialog() {
  const component = VLinkDialog as Component;
  $q.dialog({ component }).onOk(createLink);
}

/** Перехват вставки или броска картинки */
function paste(evt: ClipboardEvent | DragEvent) {
  const { files = [] } =
    (evt as DragEvent).dataTransfer ??
    (evt as ClipboardEvent).clipboardData ??
    {};
  if (files.length) {
    evt.preventDefault();
    evt.stopPropagation();
    [...files].forEach(insertImage);
  }
}

/** Пользователь сменить документ изволил, грузим новое содержимое */
async function setHtm() {
  htm.value = await props.modelValue;
  if (scrollTarget.value && scrollTarget.value.innerHTML !== htm.value)
    scrollTarget.value.innerHTML = htm.value;
}

/** Включение блокового статуса */
function showBlocks() {
  blocks.value = !blocks.value;
  if (blocks.value) scrollTarget.value?.classList.add("outline");
  else scrollTarget.value?.classList.remove("outline");
}

/**
 * При переходе с дочернего элемента на родительский подсказка пропадает. Этот
 * костыль возвращает подсказку на экран
 */
async function toggleTooltipShow() {
  show.value = false;
  await nextTick();
  show.value = true;
}

/** Меняем классовую принадлежность несознательного элемента */
function updateClasses(className: string[]) {
  if (typeof srcElement.value !== "boolean")
    srcElement.value.className = className.join(" ");
  emit("update:modelValue", scrollTarget.value?.innerHTML);
}

/* -------------------------------------------------------------------------- */

watch(files, insertImages);
watch(target, toggleTooltipShow);
watch(getId, setHtm);
watch(Fonts, initUnocss, { immediate });

onMounted(constructor);
onUnmounted(destructor);
</script>

<style scoped>
:deep(.outline *) {
  outline-style: dashed;
  outline-width: 2px;
  outline-offset: 2px;
  outline-color: rgb(25, 118, 210);
}
</style>
