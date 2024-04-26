<template lang="pug">
.flex.snap-start(v-if="the", :id="the.id", :class="{ 'min-h-full': the.full }")
  .prose.w-full.max-w-none.flex-auto.text-sm(
    v-cloak,
    class="md:text-base lg:text-lg xl:text-xl 2xl:text-2xl",
    :data-theme="the.theme",
    role="main"
  )
    component(
      :is="template",
      :the="the",
      @vue:mounted="GLightbox({ loop, zoomable, selector })"
    )
</template>
<script setup lang="ts">
import type { TView } from "app/src/stores/data";
import { views } from "app/src/stores/data";
import { loop, zoomable } from "app/src/stores/defaults";
import GLightbox from "glightbox";
import type { ComputedRef } from "vue";
import { computed } from "vue";
import type { RouteLocationNormalizedLoaded } from "vue-router";
import { useRoute } from "vue-router";

import { getAsyncComponent, selector } from "../stores/monolit";
/**
 * Текущий роут сайта
 *
 * @type {RouteLocationNormalizedLoaded}
 */
const route: RouteLocationNormalizedLoaded = useRoute();
/**
 * Вычисление текущего объекта с учетом переадресации корневого объекта страницы
 * на первый доступный объект страницы
 *
 * @type {ComputedRef<TView | undefined>}
 */
const the: ComputedRef<TView | undefined> = computed(() => {
  /**
   * Позиция текущей страницы в массиве страниц
   *
   * @type {number}
   */
  const index: number = views.value.findIndex(({ id }) => id === route.name);
  /**
   * Вычисленный текущий объект
   *
   * @type {TView}
   */
  const ret: TView = views.value[index];
  return index ? ret : ret.children[0];
});
/**
 * Вычисление объекта загруженных шаблонов
 *
 * @type {ComputedRef<object | undefined>}
 */
const template: ComputedRef<object | undefined> = computed(
  () => the.value && getAsyncComponent(the.value),
);
</script>
