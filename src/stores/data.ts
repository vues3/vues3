import * as mdi from "@mdi/js";
import type { FuncKeywordDefinition, ValidateFunction } from "ajv";
import Ajv from "ajv";
import dynamicDefaults from "ajv-keywords/dist/definitions/dynamicDefaults";
import Data, { plainData } from "app/src/schemas/data";
import Navbar from "app/src/schemas/navbar";
import Resource from "app/src/schemas/resource";
import Settings from "app/src/schemas/settings";
import View, { plainView } from "app/src/schemas/view";
import {
  coerceTypes,
  configurable,
  deep,
  esm,
  removeAdditional,
  useDefaults,
} from "app/src/stores/defaults";
import { FromSchema } from "json-schema-to-ts";
import { uid } from "quasar";
import type { ComputedRef, Ref } from "vue";
import { computed, ref, watch } from "vue";

export type TView = FromSchema<typeof plainView> & {
  children: TView[];
  parent?: TView;
  siblings: TView[];
  branch: TView[];
  prev?: TView;
  next?: TView;
  views: TView[];
  html: Promise<string> | string;
  htm: string;
  js: string;
  css: string;
  path: string;
  index: number;
  name: string;
  url: string;
  favicon: keyof typeof mdi;
  style: Promise<string> | string;
  script: Promise<string> | string;
  template: Promise<string> | string;
};
/**
 * [id] - Id ресурса, вычисляется динамически enabled - Признак использования
 * ресурса url - Url ресурса
 */
export type TResource = FromSchema<typeof Resource> & {
  parent?: undefined;
  children?: undefined;
  siblings: TView[];
  prev?: TView;
  next?: TView;
  index: number;
};
/**
 * Yandex - Id яндекса metrika - Id метрики google - Id гугла analytics - Id
 * аналитики landing - Признак формирования сайта в виде лендинга
 */
export type TSettings = FromSchema<typeof Settings>;
/**
 * [theme=null] - Тема daisyui, @see {@link https://daisyui.com/docs/themes/} см.
 * документацию. Default is `null` [setup=true] - Добавление атрибута setup в
 * таг script. Default is `true` [scoped=true] - Добавление атрибута scoped в
 * таг style. Default is `true` classes - Массив классов scroll - Массив
 * классов, добавляемых при скроле [template] - Сохраненный шаблон страницы
 * [script] - Сохраненные скрипты страницы [style] - Сохраненные стили страницы
 */
export type TNavbar = FromSchema<typeof Navbar>;
/**
 * Settings - Настройки сайта style - Общие стили сайта script - Общие скрипты
 * сайта css - Подключаемые общие стили сайта js - Подключаемые общие скрипты
 * сайта navbar - Навигационная плашка сайта content - Дерево объектов страниц
 * сайта
 */
export type TData = FromSchema<
  typeof plainData,
  { references: [typeof Settings, typeof Resource, typeof Navbar] }
> & { content: TView[] };
/**
 * Динамический расчет uuid при валидации
 *
 * @returns Ф-ция динамического расчета uuid при валидации
 */
dynamicDefaults.DEFAULTS.uuid = (): (() => string) => () => uid();
/**
 * An array or object of schemas that will be added to the instance
 *
 * @default
 */
const schemas: object[] = [Resource, View, Settings, Navbar, Data];
/**
 * Code generation options
 *
 * @default
 */
export const code: object = { esm };
/**
 * An array of keyword definitions or strings
 *
 * @default
 */
const keywords: FuncKeywordDefinition[] = [dynamicDefaults()];
/**
 * Объект валидатора
 *
 * @see {@link https://ajv.js.org} см. документацию
 */
const ajv: Ajv = new Ajv({
  useDefaults,
  coerceTypes,
  removeAdditional,
  schemas,
  code,
  keywords,
});
/** Скомпилированная схема для валидации данных */
export const validate: ValidateFunction = <ValidateFunction>(
  ajv.getSchema("urn:jsonschema:data")
);
/** Функция проверки навбара */
export const validateNavbar: ValidateFunction = <ValidateFunction>(
  ajv.getSchema("urn:jsonschema:navbar")
);
/**
 * Рекурсивная функция преобразования древовидного объекта в массив страниц
 *
 * @param views - Элементы массива страниц
 * @returns - Аддитивный массив страниц
 */
const getViews = (views: TView[]): TView[] =>
  views.flatMap((element) => [element, ...getViews(element.children)]);
/** Объект, на котором определяется свойство позиции в соседних объектах */
const index: PropertyDescriptor = {
  /**
   * Геттер позиции в соседних объектах
   *
   * @returns - Позиция в соседних объектах
   */
  get(this: TView): number {
    return this.siblings.findIndex(({ id }) => this.id === id);
  },
};
/** Объект, на котором определяется свойство предыдущего объекта */
const prev: PropertyDescriptor = {
  /**
   * Геттер предыдущего объекта
   *
   * @returns - Предыдущий объект
   */
  get(this: TView): TView | undefined {
    return this.siblings[this.index - 1];
  },
};
/** Объект, на котором определяется свойство следующего объекта */
const next: PropertyDescriptor = {
  /**
   * Геттер следующего объекта
   *
   * @returns - Следующий объект
   */
  get(this: TView): TView | undefined {
    return this.siblings[this.index + 1];
  },
};
/** Объект, на котором определяется свойство ветви объектов */
const branch: PropertyDescriptor = {
  /**
   * Геттер ветви объектов
   *
   * @returns - Ветвь объектов
   */
  get(this: TView): TView[] {
    /** Результирующий массив для записи ветви */
    const ret: TView[] = [this];
    /** Родительский объект */
    let parent: TView | undefined;
    while ((parent = ret[0]?.parent)) ret.unshift(parent);
    return ret;
  },
};
/** Объект, на котором определяется путь до объекта */
const path: PropertyDescriptor = {
  /**
   * Геттер пути до объекта
   *
   * @returns - Путь до объекта
   */
  get(this: TView): string {
    return this.branch
      .map(
        ({ label, id }) =>
          encodeURIComponent(label?.replace(" ", "_") ?? "") || id,
      )
      .slice(1)
      .join("/");
  },
};
/** Объект, на котором определяется url ресурса */
const url: PropertyDescriptor = {
  /**
   * Геттер url ресурса
   *
   * @returns - Url ресурса
   */
  get(this: TView): string {
    return (
      (this.loc && encodeURI(this.loc.replace(" ", "_") || "")) || this.path
    );
  },
};
/** Объект, на котором определяется название страницы */
const name: PropertyDescriptor = {
  /**
   * Геттер названия страницы
   *
   * @returns - Название страницы
   */
  get(this: TView): string | null {
    return this.title ?? this.label;
  },
};
/** Объект, на котором определяется фавиконка страницы */
const favicon: PropertyDescriptor = {
  /**
   * Геттер фавиконки страницы
   *
   * @returns - Фавиконка страницы
   */
  get(this: TView): string | undefined {
    return this.icon?.replace(/-./g, (x) => x[1].toUpperCase());
  },
};
/**
 * Функция ремонта плоских массивов js & css
 *
 * @param siblings - Объект для defineProperties
 * @param siblings.value - Исходный массив
 */
const fixPlain = (siblings: { value: TResource[] }) => {
  siblings.value.forEach((element) => {
    Object.defineProperties(element, { siblings, index, prev, next });
  });
};
/**
 * Рекурсивная функция ремонта страниц
 *
 * @param siblings - Объект для defineProperties
 * @param [siblings.value] - Элементы массива страниц
 * @param [siblings.configurable] - Признак возможности конфигурации
 * @param [parent] - Объект для defineProperties
 * @param parent.value - Родительский объект
 * @param [parent.configurable] - Признак возможности конфигурации
 */
const fixDeep = (
  siblings: { value: TView[]; configurable?: boolean },
  parent: { value?: TView; configurable?: boolean } = { value: undefined },
) => {
  siblings.value.forEach((value) => {
    Object.defineProperties(value, {
      parent,
      siblings,
      branch,
      path,
      index,
      prev,
      next,
      name,
      url,
      favicon,
    });
    fixDeep({ value: value.children, configurable }, { value, configurable });
  });
};
/** Главный реактивный объект данных */
export const $: Ref<TData | undefined> = ref();
/**
 * Функция для вызова расчета массива страниц
 *
 * @returns - Страницы
 */
const get: () => TView[] = (): TView[] => getViews($.value?.content ?? []);
/** Расчетный массив страниц */
export const views: ComputedRef<TView[]> = computed(() =>
  get().map((value: TView) => {
    Object.defineProperty(value, "views", { get });
    return value;
  }),
);
watch(
  () => $.value?.content ?? [],
  (value) => {
    fixDeep({ value });
  },
  { deep },
);
watch(
  () => <TResource[]>($.value?.css ?? []),
  (value: TResource[]) => {
    fixPlain({ value });
  },
  { deep },
);
watch(
  () => <TResource[]>($.value?.js ?? []),
  (value: TResource[]) => {
    fixPlain({ value });
  },
  { deep },
);
/** Значение для выключаемых свойств */
const value: undefined = undefined;
watch(
  $,
  (newValue) => {
    if (newValue) {
      ["content", "css", "js"].forEach((key) => {
        if (!(<TView[] | TResource[]>newValue[<keyof TData>key]).length)
          Reflect.defineProperty(newValue, key, { value });
      });
      validate(newValue);
    }
  },
  { deep },
);
