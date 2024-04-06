<template lang="pug">
.flex.snap-start(:id="the?.id", :class="{ 'min-h-full': the?.full }")
  .prose.w-full.max-w-none.flex-auto.text-sm(
    v-cloak,
    class="md:text-base lg:text-lg xl:text-xl 2xl:text-2xl",
    :data-theme="the?.theme",
    role="main"
  )
    component(
      :is="template",
      :the="the",
      @vue:mounted="GLightbox({ loop, zoomable, selector })"
    )
</template>
<script setup lang="ts">
import GLightbox from "glightbox";
import { storeToRefs } from "pinia";
import { computed, ComputedRef, Ref } from "vue";
import { RouteLocationNormalizedLoaded, useRoute } from "vue-router";

import selectors from "@/assets/glightbox.json";
import data from "@/stores/data";
import Monolit from "@/stores/monolit";

/** @type {{ fncTemplate: Function }} */
const { fncTemplate }: { fncTemplate: Function } = Monolit();

/** @type {{ pages: any[] }} */
const { pages }: { pages: Ref<any[]> } = storeToRefs(data());

/**
 * Текущий роут сайта
 *
 * @type {RouteLocationNormalizedLoaded}
 */
const route: RouteLocationNormalizedLoaded = useRoute();

/**
 * Вычисление переадресации корневого объекта страницы на первый доступный
 * объект страницы
 *
 * @type {ComputedRef<object>}
 */
const the: ComputedRef<object> = computed(() => {
  /**
   * Позиция текущей страницы в массиве страниц
   *
   * @type {number}
   */
  const index: number = pages?.value?.findIndex(
    ({ id = "" } = {}) => id === route.name,
  );

  /**
   * Вычисленный текущий объект
   *
   * @type {any}
   */
  const ret: any = pages?.value?.[index];

  return index ? ret : ret?.children?.[0];
});

/**
 * Вычисление объекта загруженных шаблонов
 *
 * @type {ComputedRef<object>}
 */
const template: ComputedRef<object> = computed(() => fncTemplate(the?.value));

/**
 * Loop slides on end
 *
 * @type {boolean}
 * @see {@link https://github.com/biati-digital/glightbox} см. документацию
 */
const loop: boolean = true;

/**
 * Enable or disable zoomable images you can also use data-zoomable="false" on
 * individual nodes.
 *
 * @type {boolean}
 * @see {@link https://github.com/biati-digital/glightbox} см. документацию
 */
const zoomable: boolean = false;

/**
 * Name of the selector for example '.glightbox' or 'data-glightbox' or
 * '*[data-glightbox]'
 *
 * @type {string}
 * @see {@link https://github.com/biati-digital/glightbox} см. документацию
 */
const selector: string = selectors?.map((el = "") => `a[href${el}]`)?.join();
</script>
