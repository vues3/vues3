import { fileURLToPath, URL } from "node:url";

import { templateCompilerOptions } from "@tresjs/core";
import { Extractor } from "@unocss/core";
import extractorPug from "@unocss/extractor-pug";
import UnoCSS from "@unocss/vite";
// import legacy from "@vitejs/plugin-legacy";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

/**
 * Extractors are used to extract the usage of utilities from your source code
 *
 * @type {Extractor[]}
 * @see {@link https://unocss.dev/config/extractors} см. документацию
 */
const extractors: Array<Extractor> = [extractorPug()];

/**
 * Массив с типами замещаемых полифилов
 *
 * @type {string[]}
 */
// const modernPolyfills: Array<string> = ["es.promise.with-resolvers"];

/**
 * Конфигурационный файл UnoCSS
 *
 * @constant
 * @default
 * @type {string}
 */
const configFile: string = "../uno.config.js";

/**
 * Массив плагинов для использования
 *
 * @constant
 * @default
 * @type {any[]}
 */
const plugins: Array<any> = [
  vue({ ...templateCompilerOptions }),
  UnoCSS({ configFile, extractors }),
  // legacy({ modernPolyfills }),
];

/**
 * Будет передано в @rollup/plugin-alias как его entries option. Может быть
 * объектом, или массивом пар { find, replacement }.
 *
 * Когда вы связываете (aliasing - делаете алиасы) к file system paths, всегда
 * используйте абсолютные пути. Относительные alias значения будут
 * использоваться как есть и не будут резолвнуты в file system paths.
 *
 * @constant
 * @default
 * @type {object}
 */
const alias: object = {
  "@": fileURLToPath(new URL("./src", import.meta.url)),
  "~": fileURLToPath(new URL("..", import.meta.url)),
};

/**
 * Блок resolve
 *
 * @constant
 * @default
 * @type {object}
 */
const resolve: object = { alias };

/**
 * Когда установлено в значение true, сборка будет генерировать manifest.json
 * файл, который содержит mapping нехешированных имён ресурсов (assets) к их
 * хешированным версиям, который в дальнейшем может быть использован серверным
 * фреймворком чтобы срендерить корректные ссылки на ресурсы (assets).
 *
 * @constant
 * @default
 * @type {boolean}
 */
const manifest: boolean = true;

/**
 * По умолчанию, Vite будет очищать outDir при сборке build, если он внутри
 * корня проекта. Выведет ошибку если outDir находится вне рутовой директории,
 * чтобы избеать случайного удаления важных файлов. Вы можете явно указать этот
 * параметр чтобы отключить warning'и. Это также можно сдлеать с помощью
 * параметра командной строки --emptyOutDir.
 *
 * @constant
 * @default
 * @type {string}
 */

const outDir: string = "../public/monolit";

/**
 * Разборка по вендорам. Allows the creation of custom shared common chunks.
 * When using the object form, each property represents a chunk that contains
 * the listed modules and all their dependencies if they are part of the module
 * graph unless they are already in another manual chunk. The name of the chunk
 * will be determined by the property key.
 *
 * @type {Function}
 * @param {string} id - Путь до модуля
 * @returns {string} - Вендор
 */
const manualChunks: Function = (id: string = ""): string =>
  id?.split("node_modules/")?.[1]?.split("/")?.[0] ?? "";

/**
 * Блок output
 *
 * @constant
 * @default
 * @type {object}
 */
const output: object = { manualChunks };

/**
 * Напрямую кастомизируйте основные настройки Rollup сборки. Это то же самое,
 * что и опции, которые могут быть экспортированы из Rollup конфиг файла и они
 * будут смёржены с Vite's внутренними Rollup опциями. Смотрите Rollup options
 * документацию для большей информации.
 *
 * @constant
 * @default
 * @type {object}
 */
const rollupOptions: object = { output };

/**
 * Блок build
 *
 * @constant
 * @default
 * @type {object}
 */
const build: object = { manifest, outDir, rollupOptions };

/**
 * Определяет глоальную замену констант. Записи будут определяться как
 * глобальные во время dev разработки и статически заменяться во время build.
 *
 * @constant
 * @default
 * @type {object}
 */
const define: object = {
  __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
};

export default defineConfig({ plugins, resolve, build, define });
