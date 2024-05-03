/**
 * Модификатор для вотчера, указывает на проверку всех изменений в глубину
 *
 * @default
 */
export const deep: boolean = true;
/**
 * Replace missing or undefined properties and items with the values from
 * corresponding default keywords.
 *
 * @default
 */
export const useDefaults: boolean = true;
/**
 * Change data type of data to match type keyword
 *
 * @default
 */
export const coerceTypes: boolean = true;
/**
 * Remove additional properties
 *
 * @default
 */
export const removeAdditional: boolean = true;
/**
 * How functions should be exported - by default CJS is used, so the validate
 * function(s) file can be `required`. Set this value to true to export the
 * validate function(s) as ES Modules, enabling bundlers to do their job.
 *
 * @default
 */
export const esm: boolean = true;
/**
 * Равен true только в том случае, если тип этого дескриптора свойства может
 * быть изменён и если свойство может быть удалено из содержащего его объекта.
 *
 * @default
 */
export const configurable: boolean = true;
/**
 * Задержка в мс
 *
 * @default
 */
export const debounce: number = 1000;
/**
 * Моментальный запуск вотчера
 *
 * @default
 */
export const immediate: boolean = true;
/**
 * Props for a 'CANCEL' button
 *
 * @default
 */
export const cancel: boolean = true;
/**
 * User cannot dismiss Dialog if clicking outside of it or hitting ESC key;
 * Also, an app route change won't dismiss it
 *
 * @default
 */
export const persistent: boolean = true;
/**
 * Пустой фильтр иконок по умолчанию
 *
 * @default
 */
export const filter: string = "";
/**
 * 75 иконок на страницу
 *
 * @default
 */
export const itemsPerPage: number = 75;
/**
 * Начальная страница иконок
 *
 * @default
 */
export const page: number = 0;
/**
 * Запрет мультивыбора файлов
 *
 * @default
 */
export const multiple: boolean = false;
/**
 * Типы фалов для выбора
 *
 * @default
 */
export const accept: string = "image/*";
/**
 * Заголовок окна выбора файла
 *
 * @default
 */
export const capture: string = "Выберите картинку";
/**
 * Reset when open file dialog
 *
 * @default
 */
export const reset: boolean = true;
/**
 * Настройка кеширования
 *
 * @default
 */
export const cache: RequestCache = "no-cache";
/**
 * Loop slides on end
 *
 * @default
 * @see {@link https://github.com/biati-digital/glightbox} см. документацию
 */
export const loop: boolean = true;
/**
 * Enable or disable zoomable images you can also use data-zoomable="false" on
 * individual nodes.
 *
 * @default
 * @see {@link https://github.com/biati-digital/glightbox} см. документацию
 */
export const zoomable: boolean = false;
/**
 * Сдвиг области видимости
 *
 * @default
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/rootMargin} см. документацию
 */
export const rootMargin: string = "-1% 0px -99%";
/**
 * Процент площади объекта, который должен попасть в область видимости
 *
 * @default
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/thresholds} см. документацию
 */
export const threshold: number = 0;
/**
 * Быстрый скролл
 *
 * @default
 */
export const behavior: ScrollBehavior = "instant";
/**
 * Expose more controls
 *
 * @default
 */
export const controls: true = <const>true;
/**
 * Enable css property auto prefixer
 *
 * @default
 */
export const autoPrefix: boolean = true;
/**
 * When enabled, UnoCSS will look for the existing selectors defined in the
 * stylesheet and bypass them. This is useful when using the runtime alongwith
 * the build-time UnoCSS.
 *
 * @default
 */
export const bypassDefined: boolean = true;
/**
 * Запуск вотчера единожды
 *
 * @default
 */
export const once: boolean = true;
/**
 * Смешивание сохраненного объекта с объектом по умолчанию
 *
 * @default
 */
export const mergeDefaults: boolean = true;
