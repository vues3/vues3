import type { FuncKeywordDefinition, ValidateFunction } from "ajv";
import Ajv from "ajv";
import type { DynamicDefaultFunc } from "ajv-keywords/dist/definitions/dynamicDefaults";
import dynamicDefaults from "ajv-keywords/dist/definitions/dynamicDefaults";
import Data, { plainData } from "app/src/schemas/data";
import Navbar from "app/src/schemas/navbar";
import Page, { plainPage } from "app/src/schemas/page";
import Resource from "app/src/schemas/resource";
import Settings from "app/src/schemas/settings";
import {
  coerceTypes,
  configurable,
  deep,
  esm,
  removeAdditional,
  useDefaults,
} from "app/src/stores/defaults";
import { FromSchema } from "json-schema-to-ts";
import type { ComputedRef } from "vue";
import { computed, reactive, watch } from "vue";

/**
 * @type {TPage}
 * @property {string} [id] - Идентификатор страницы, значения по умолчанию
 *   вычисляются динамически
 * @property {string | null} [changefreq=null] - Вероятная частота изменения
 *   этой страницы. Это значение предоставляет общую информацию для поисковых
 *   систем и может не соответствовать точно частоте сканирования этой страницы.
 *   Допустимые значения: always, hourly, daily, weekly, monthly, yearly, never.
 *   Default is `null`
 * @property {string | null} [description=null] - Предназначен для
 *   предоставления поисковым системам краткого описания содержимого страницы
 *   для индексации и вывода сопроводительной информации в выдаче результатов
 *   поиска. Когда-то информация из этого тега обязательно отображалась в
 *   поисковой выдаче и имела особый вес при индексации, однако, в связи со
 *   злоупотреблениями, различные поисковые системы используют разные алгоритмы
 *   для оценки релевантности указанного в теге описания и содержимого страницы,
 *   на основании чего могут игнорировать содержимое тега. Default is `null`
 * @property {string | null} [icon=null] - Название иконки сайта из набора
 *   иконок mdi. Default is `null`
 * @property {string | null} [image=null] - Содержит url картинки, используемой
 *   поисковиками в выдаче. Default is `null`
 * @property {string[]} [keywords=[]] -Используется для предоставления данных
 *   поисковикам для повышения значимости некоторых слов при поиске, а также для
 *   навигации внутри сайта по хештегам. Default is `[]`
 * @property {string | null} [label=null] - Краткое название страницы,
 *   используется в пути доступа. Default is `null`
 * @property {string | null} [lastmod=null] - Дата последнего изменения файла.
 *   Эта дата должна быть в формате W3C Datetime. Default is `null`
 * @property {string | null} [loc=null] - URL-адрес страницы. Этот URL-адрес
 *   должен начинаться с префикса (например, HTTP) и заканчиваться косой чертой,
 *   если Ваш веб-сервер требует этого. Длина этого значения не должна превышать
 *   2048 символов. Default is `null`
 * @property {number | null} [priority=null] - Приоритетность URL относительно
 *   других URL на Вашем сайте. Допустимый диапазон значений — от 0,0 до 1,0.
 *   Это значение не влияет на процедуру сравнения Ваших страниц со страницами
 *   на других сайтах — оно только позволяет указать поисковым системам, какие
 *   страницы, по Вашему мнению, более важны для сканеров. Default is `null`
 * @property {string | null} [theme=null] - Тема daisyui, @see
 *   {@link https://daisyui.com/docs/themes/} см. документацию. Default is
 *   `null`
 * @property {string | null} [title=null] - Полный заголовок страницы. Default
 *   is `null`
 * @property {boolean} [enabled=true] - Флаг видимости страницы на сайте. Не
 *   скрывает страницу от поисковиков. Default is `true`
 * @property {string | null} [type=null] - Тип объекта, например, video.movie
 *   (фильм), @see {@link https://ogp.me/#types} см. документацию. Если у вас
 *   несколько объектов на странице, выберите один из них (главный). В
 *   зависимости от типа можно указать дополнительные свойства. Default is
 *   `null`
 * @property {string | null} [alt=null] - Описание картинки для страницы.
 *   Default is `null`
 * @property {string | null} [full=true] - Признак, что страница должна быть
 *   минимум по высоте окна браузера. Default is `true`
 * @property {boolean} [setup=true] - Добавление атрибута setup в таг script.
 *   Default is `true`
 * @property {boolean} [scoped=true] - Добавление атрибута scoped в таг style.
 *   Default is `true`
 * @property {boolean} [contenteditable=false] - Признак редактирования свойства
 *   {@link label}. Default is `false`
 * @property {TPage[]} children - Массив дочерних страниц
 * @property {TPage | null} parent - Родительская страница
 * @property {TPage[]} siblings - Массив одноуровневых страниц
 * @property {TPage[]} branch - Массив объектов, определяющий путь до страницы,
 *   проще говоря, ветка в дереве
 * @property {TPage | null} prev - Предыдущая страница в массиве одноуровневых
 *   страниц
 * @property {TPage | null} next - Последующая страница в массиве одноуровневых
 *   станиц
 * @property {TPage[]} pages - Плоский массив всех объектов страниц
 * @property {Promise<string> | string} html - Обещание на содержимое шаблона
 *   страницы с исправленными путями картинок
 * @property {Promise<string> | string} htm - Обещание на содержимое шаблона
 *   страницы
 * @property {Promise<string> | string} js - Обещание на содержимое скриптов
 *   страницы
 * @property {Promise<string> | string} css - Обещание на содержимое стилей
 *   страницы
 * @property {string} path - Путь до страницы для использования в поисковой
 *   строке браузера
 * @property {number} index - Порядковый номер страницы в массиве одноуровневых
 *   страниц
 * @property {string | null} name - Вычисленное имя страницы, предпочтительно
 *   полное
 * @property {string} url - Если введен loc - значит loc. Иначе возвращает path
 * @property {string | null} favicon - Название фавиконки из набора mdi
 * @property {string} [style] - Сохраненные стили страницы
 * @property {string} [script] - Сохраненные скрипты страницы
 * @property {string} [template] - Сохраненный шаблон страницы
 */
export type TPage = FromSchema<typeof plainPage> & {
  children: TPage[];
  parent: TPage | null;
  siblings: TPage[];
  branch: TPage[];
  prev: TPage | null;
  next: TPage | null;
  pages: TPage[];
  html?: Promise<string> | string;
  htm: Promise<string> | string;
  js: Promise<string> | string;
  css: Promise<string> | string;
  path: string;
  index: number;
  name: string | null;
  url: string;
  favicon: string | null;
  style?: string | null;
  script?: string | null;
  template?: string | null;
};

/**
 * @type {TResource}
 * @property {string} [id] - Id ресурса, вычисляется динамически
 * @property {boolean} enabled - Признак использования ресурса
 * @property {string} url - Url ресурса
 */
export type TResource = FromSchema<typeof Resource>;

/**
 * @type {TSettings}
 * @property {string | null} yandex - Id яндекса
 * @property {string | null} metrika - Id метрики
 * @property {string | null} google - Id гугла
 * @property {string | null} analytics - Id аналитики
 * @property {boolean} landing - Признак формирования сайта в виде лендинга
 */
export type TSettings = FromSchema<typeof Settings>;

/**
 * @type {TNavbar}
 * @property {string | null} [theme=null] - Тема daisyui, @see
 *   {@link https://daisyui.com/docs/themes/} см. документацию. Default is
 *   `null`
 * @property {boolean} [setup=true] - Добавление атрибута setup в таг script.
 *   Default is `true`
 * @property {boolean} [scoped=true] - Добавление атрибута scoped в таг style.
 *   Default is `true`
 * @property {string[]} classes - Массив классов
 * @property {string[]} scrollClasses - Массив классов, добавляемых при скроле
 * @property {string} [template] - Сохраненный шаблон страницы
 * @property {string} [script] - Сохраненные скрипты страницы
 * @property {string} [style] - Сохраненные стили страницы
 */
export type TNavbar = FromSchema<typeof Navbar>;

/**
 * @type {TData}
 * @property {TSettings} settings - Настройки сайта
 * @property {string | null} style - Общие стили сайта
 * @property {string | null} script - Общие скрипты сайта
 * @property {TResource[]} css - Подключаемые общие стили сайта
 * @property {TResource[]} js - Подключаемые общие скрипты сайта
 * @property {TNavbar} navbar - Навигационная плашка сайта
 * @property {TPage[]} content - Дерево объектов страниц сайта
 */
export type TData = FromSchema<
  typeof plainData,
  { references: [typeof Settings, typeof Resource, typeof Navbar] }
> & { content: TPage[] | null };

/**
 * Динамический расчет uuid при валидации
 *
 * @returns {DynamicDefaultFunc} Ф-ция динамического расчета uuid при валидации
 */
dynamicDefaults.DEFAULTS.uuid = (): DynamicDefaultFunc => () =>
  crypto.randomUUID() as any;

/**
 * An array or object of schemas that will be added to the instance
 *
 * @constant
 * @default
 * @type {object[]}
 */
const schemas: object[] = [Resource, Page, Settings, Navbar, Data];

/**
 * Code generation options
 *
 * @default
 * @type {object}
 */
export const code: object = { esm };

/**
 * An array of keyword definitions or strings
 *
 * @constant
 * @default
 * @type {FuncKeywordDefinition[]}
 */
const keywords: FuncKeywordDefinition[] = [dynamicDefaults()];

/**
 * Объект валидатора
 *
 * @type {Ajv}
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

/**
 * Скомпилированная схема для валидации данных
 *
 * @type {ValidateFunction}
 */
export const validate: ValidateFunction = ajv.getSchema(
  "urn:jsonschema:data",
) as ValidateFunction;

/**
 * Функция проверки навбара
 *
 * @function validateNavbar
 * @type {ValidateFunction}
 */
export const validateNavbar: ValidateFunction = ajv.getSchema(
  "urn:jsonschema:navbar",
) as ValidateFunction;

/**
 * Рекурсивная функция преобразования древовидного объекта в массив страниц
 *
 * @function getPages
 * @param {TPage[]} pages - Элементы массива страниц
 * @returns {TPage[]} - Аддитивный массив страниц
 */
const getPages = (pages: TPage[]): TPage[] =>
  pages.flatMap((element) => [element, ...getPages(element.children ?? [])]);

/**
 * Объект, на котором определяется свойство позиции в соседних объектах
 *
 * @type {PropertyDescriptor}
 */
const index: PropertyDescriptor = {
  /**
   * Геттер позиции в соседних объектах
   *
   * @returns {number} - Позиция в соседних объектах
   */
  get(this: TPage): number {
    return this.siblings.findIndex(({ id }) => this.id === id);
  },
};

/**
 * Объект, на котором определяется свойство предыдущего объекта
 *
 * @type {PropertyDescriptor}
 */
const prev: PropertyDescriptor = {
  /**
   * Геттер предыдущего объекта
   *
   * @returns {TPage | null} - Предыдущий объект
   */
  get(this: TPage): TPage | null {
    return this.siblings[this.index - 1] ?? null;
  },
};

/**
 * Объект, на котором определяется свойство следующего объекта
 *
 * @type {PropertyDescriptor}
 */
const next: PropertyDescriptor = {
  /**
   * Геттер следующего объекта
   *
   * @returns {TPage | null} - Следующий объект
   */
  get(this: TPage): TPage | null {
    return this.siblings[this.index + 1] ?? null;
  },
};

/**
 * Объект, на котором определяется свойство ветви объектов
 *
 * @type {PropertyDescriptor}
 */
const branch: PropertyDescriptor = {
  /**
   * Геттер ветви объектов
   *
   * @returns {TPage[]} - Ветвь объектов
   */
  get(this: TPage): TPage[] {
    /**
     * Результирующий массив для записи ветви
     *
     * @type {TPage[]}
     */
    const ret: TPage[] = [];
    /**
     * Родительский объект
     *
     * @type {TPage | null}
     */
    let parent: TPage | null = this;
    do {
      ret.unshift(parent);
      ({ parent = null } = parent);
    } while (parent);
    return ret;
  },
};

/**
 * Объект, на котором определяется путь до объекта
 *
 * @type {PropertyDescriptor}
 */
const path: PropertyDescriptor = {
  /**
   * Геттер пути до объекта
   *
   * @returns {string | null} - Путь до объекта
   */
  get(this: TPage): string | null {
    return this.branch
      .map(
        ({ label, id }) =>
          encodeURIComponent(label?.replace(" ", "_") ?? "") || id,
      )
      .slice(1)
      .join("/");
  },
};

/**
 * Объект, на котором определяется url ресурса
 *
 * @type {PropertyDescriptor}
 */
const url: PropertyDescriptor = {
  /**
   * Геттер url ресурса
   *
   * @returns {string} - Url ресурса
   */
  get(this: TPage): string {
    return (
      (this.loc && encodeURI(this.loc?.replace(" ", "_") ?? "")) || this.path
    );
  },
};

/**
 * Объект, на котором определяется название страницы
 *
 * @type {PropertyDescriptor}
 */
const name: PropertyDescriptor = {
  /**
   * Геттер названия страницы
   *
   * @returns {string | null} - Название страницы
   */
  get(this: TPage): string | null {
    return this.title ?? this.label ?? null;
  },
};

/**
 * Объект, на котором определяется фавиконка страницы
 *
 * @type {PropertyDescriptor}
 */
const favicon: PropertyDescriptor = {
  /**
   * Геттер фавиконки страницы
   *
   * @returns {string | null} - Фавиконка страницы
   */
  get(this: TPage): string | null {
    return this.icon?.replace(/-./g, (x) => x[1].toUpperCase()) ?? null;
  },
};

/**
 * Функция ремонта плоских массивов js & css
 *
 * @function fixPlain
 * @param {{}} siblings - Объект для defineProperties
 * @param {TResource[]} siblings.value - Исходный массив
 */
const fixPlain = (siblings: { value: TResource[] }) => {
  siblings.value.forEach((element) => {
    Object.defineProperties(element, { siblings, index, prev, next });
  });
};

/**
 * Рекурсивная функция ремонта страниц
 *
 * @function fixDeep
 * @param {{ value: TPage[] }} siblings - Объект для defineProperties
 * @param {TPage[]} [siblings.value] - Элементы массива страниц
 * @param {boolean} [siblings.configurable] - Признак возможности конфигурации
 * @param {{ value: TPage; configurable: boolean }} [parent] - Объект для
 *   defineProperties
 * @param {TPage} parent.value - Родительский объект
 * @param {boolean} [parent.configurable] - Признак возможности конфигурации
 */
const fixDeep = (
  siblings: { value: TPage[]; configurable?: boolean },
  parent: { value: TPage | null; configurable?: boolean } = { value: null },
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

    fixDeep(
      { value: value.children ?? [], configurable },
      { value, configurable },
    );
  });
};

/**
 * Главный реактивный объект данных
 *
 * @type {TData}
 */
export const $: TData = reactive({} as TData);

/**
 * Функция для вызова расчета массива страниц
 *
 * @type {() => any}
 * @returns {TPage[]} - Страницы
 */
const get: () => any = (): TPage[] => getPages($.content ?? []);

/**
 * Расчетный массив страниц
 *
 * @type {ComputedRef<TPage[]>}
 */
export const pages: ComputedRef<TPage[]> = computed(() =>
  get().map((value: TPage) => {
    Object.defineProperty(value, "pages", { get });
    return value;
  }),
);

watch(
  () => $.content ?? [],
  (value) => {
    fixDeep({ value });
  },
  { deep },
);

watch(
  () => $.css ?? [],
  (value) => {
    fixPlain({ value });
  },
  { deep },
);

watch(
  () => $.js ?? [],
  (value) => {
    fixPlain({ value });
  },
  { deep },
);

/**
 * Значение для выключаемых свойств
 *
 * @type {undefined}
 */
const value: undefined = undefined;

watch($, (newValue) => {
  if (Object.keys(newValue).length) {
    ["content", "css", "js"].forEach((key) => {
      if (!(newValue[key as keyof TData] as TPage[] | TResource[])?.length)
        Reflect.defineProperty(newValue, key, { value });
    });
    validate?.(newValue);
  }
});
