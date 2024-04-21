import type { JSONSchemaType } from "json-schema-to-ts/lib/types/definitions/jsonSchema";
/**
 * Модификатор для вотчера, указывает на проверку всех изменений в глубину
 *
 * @constant
 * @default
 * @type {boolean}
 */
export const deep: boolean = true;
/**
 * Replace missing or undefined properties and items with the values from
 * corresponding default keywords.
 *
 * @constant
 * @default
 * @type {boolean}
 */
export const useDefaults: boolean = true;
/**
 * Change data type of data to match type keyword
 *
 * @constant
 * @default
 * @type {boolean}
 */
export const coerceTypes: boolean = true;
/**
 * Remove additional properties
 *
 * @constant
 * @default
 * @type {boolean}
 */
export const removeAdditional: boolean = true;
/**
 * How functions should be exported - by default CJS is used, so the validate
 * function(s) file can be `required`. Set this value to true to export the
 * validate function(s) as ES Modules, enabling bundlers to do their job.
 *
 * @constant
 * @default
 * @type {boolean}
 */
export const esm: boolean = true;
/**
 * Равен true только в том случае, если тип этого дескриптора свойства может
 * быть изменён и если свойство может быть удалено из содержащего его объекта.
 *
 * @constant
 * @default
 * @type {boolean}
 */
export const configurable: boolean = true;
/**
 * Задержка в мс
 *
 * @constant
 * @default
 * @type {number}
 */
export const debounce: number = 1000;
/**
 * Моментальный запуск вотчера
 *
 * @constant
 * @default
 * @type {boolean}
 */
export const immediate: boolean = true;
/**
 * Props for a 'CANCEL' button
 *
 * @constant
 * @default
 * @type {boolean}
 */
export const cancel: boolean = true;
/**
 * User cannot dismiss Dialog if clicking outside of it or hitting ESC key;
 * Also, an app route change won't dismiss it
 *
 * @constant
 * @default
 * @type {boolean}
 */
export const persistent: boolean = true;
/**
 * Выбор иконок по умолчанию скрыт
 *
 * @constant
 * @default
 * @type {boolean}
 */
export const show: boolean = false;
/**
 * Пустой фильтр иконок по умолчанию
 *
 * @constant
 * @default
 * @type {string}
 */
export const filter: string = "";
/**
 * 75 иконок на страницу
 *
 * @constant
 * @default
 * @type {number}
 */
export const itemsPerPage: number = 75;
/**
 * Начальная страница иконок
 *
 * @constant
 * @default
 * @type {number}
 */
export const page: number = 0;
/**
 * Запрет мультивыбора файлов
 *
 * @constant
 * @default
 * @type {boolean}
 */
export const multiple: boolean = false;
/**
 * Типы фалов для выбора
 *
 * @constant
 * @default
 * @type {string}
 */
export const accept: string = "image/*";
/**
 * Заголовок окна выбора файла
 *
 * @constant
 * @default
 * @type {string}
 */
export const capture: string = "Выберите картинку";
/**
 * Reset when open file dialog
 *
 * @constant
 * @default
 * @type {boolean}
 */
export const reset: boolean = true;
/**
 * Настройка кеширования
 *
 * @constant
 * @default
 * @type {RequestCache}
 */
export const cache: RequestCache = "no-cache";
/**
 * Loop slides on end
 *
 * @constant
 * @default
 * @type {boolean}
 * @see {@link https://github.com/biati-digital/glightbox} см. документацию
 */
export const loop: boolean = true;
/**
 * Enable or disable zoomable images you can also use data-zoomable="false" on
 * individual nodes.
 *
 * @constant
 * @default
 * @type {boolean}
 * @see {@link https://github.com/biati-digital/glightbox} см. документацию
 */
export const zoomable: boolean = false;
/**
 * Сдвиг области видимости
 *
 * @constant
 * @default
 * @type {string}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/rootMargin} см. документацию
 */
export const rootMargin: string = "-1% 0px -99%";
/**
 * Процент площади объекта, который должен попасть в область видимости
 *
 * @constant
 * @default
 * @type {number}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/thresholds} см. документацию
 */
export const threshold: number = 0;
/**
 * Быстрый скролл
 *
 * @type {ScrollBehavior}
 */
export const behavior: ScrollBehavior = "instant";
/**
 * Expose more controls
 *
 * @constant
 * @default
 * @type {true}
 */
export const controls: true = true;
/**
 * Enable css property auto prefixer
 *
 * @constant
 * @default
 * @type {boolean}
 */
export const autoPrefix: boolean = true;
/**
 * When enabled, UnoCSS will look for the existing selectors defined in the
 * stylesheet and bypass them. This is useful when using the runtime alongwith
 * the build-time UnoCSS.
 *
 * @constant
 * @default
 * @type {boolean}
 */
export const bypassDefined: boolean = true;
/**
 * Запуск вотчера единожды
 *
 * @constant
 * @default
 * @type {boolean}
 */
export const once: boolean = true;
/**
 * @constant
 * @default
 * @type {boolean}
 */
export const additionalProperties: boolean = false;
/**
 * @constant
 * @default
 * @type {string}
 */
export const type: JSONSchemaType = "object";
/**
 * @constant
 * @default
 * @type {boolean}
 */
export const nullable: boolean = true;
/**
 * @constant
 * @default
 * @type {string}
 */
export const id: string = "uuid";
