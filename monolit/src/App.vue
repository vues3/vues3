<template lang="pug">
v-head
  title {{ the?.name || " " }}
  link(
    v-for="a in theCSS",
    :key="a.id",
    crossorigin,
    rel="stylesheet",
    :href="a.url"
  )
  component(
    :is="'script'",
    v-for="a in theJS",
    :key="a.id",
    crossorigin,
    deffer,
    :src="a.url"
  )
  meta(
    v-if="the?.description",
    name="description",
    :content="the?.description"
  )
  meta(v-if="the?.name", property="og:title", :content="the?.name")
  meta(v-if="the?.type", property="og:type", :content="the?.type")
  meta(v-if="canonical", property="og:url", :content="canonical")
  meta(v-if="the?.image", property="og:image", :content="the?.image")
  meta(v-if="the?.alt", property="og:image:alt", :content="the?.alt")
  link(
    :key="favicon",
    rel="icon",
    :href="`data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='${mdi[the?.favicon ?? 'mdiWeb']}'/></svg>`",
    type="image/svg+xml"
  )
  link(v-if="canonical", rel="canonical", :href="canonical")
  component(:is="'style'", v-if="$.style") {{ $.style }}
  component(:is="'script'", v-if="$.script") {{ $.script }}
  meta(
    v-if="$.settings?.yandex",
    name="yandex-verification",
    :content="$.settings?.yandex"
  )
  meta(
    v-if="$.settings?.google",
    name="google-site-verification",
    :content="$.settings?.google"
  )
.drawer.h-dvh
  input#drawer.drawer-toggle(
    v-model="drawer",
    type="checkbox",
    aria-labelledby="#drawer"
  )
  .drawer-content.snap-y.snap-mandatory.overflow-y-auto.scroll-smooth(
    @scroll.passive="start"
  )
    .z-40(
      v-if="views[0]?.enabled",
      :class="[...(ready ? [] : $.navbar?.scroll ?? []), ...($.navbar?.classes ?? [])]",
      :data-theme="$.navbar?.theme"
    )
      .navbar
        component(:is="navigator", :the)
    router-view
  .drawer-side.z-50(v-if="views[0]?.enabled")
    label.drawer-overlay(for="drawer")
    .grid.max-w-full.self-stretch.overflow-x-auto.scroll-smooth(
      :class="{ 'justify-self-stretch': views[0]?.full }"
    )
      .col-start-1.row-start-1.flex
        .prose.w-full.max-w-none.flex-auto.text-sm(
          class="md:text-base lg:text-lg xl:text-xl 2xl:text-2xl",
          :data-theme="views[0]?.theme"
        )
          component(:is="root", :the="views[0]")
      label.btn.btn-circle.btn-ghost.sticky.right-1.top-1.col-start-1.row-start-1.justify-self-end(
        for="drawer"
      )
        svg.h-6.w-6
          path(:d="mdi.mdiClose")
</template>
<script setup lang="ts">
import { useTimeout } from "@vueuse/core";
import type { TResource, TView } from "app/src/stores/data";
import { $, views } from "app/src/stores/data";
import { controls } from "app/src/stores/defaults";
import type { ComputedRef, Ref } from "vue";
import { computed, ref } from "vue";
import type { RouteLocationNormalizedLoaded, Router } from "vue-router";
import { useRoute, useRouter } from "vue-router";

import { favicon, getAsyncComponent } from "./stores/monolit";

const { ready, start } = useTimeout(1000, { controls });
/**
 * Путь готового шаблона навбара
 *
 * @type {string}
 */
const path: string = "~";
/**
 * Вычисление навбара
 *
 * @type {computed}
 */
const navigator: ComputedRef<object> = computed(() => {
  /**
   * Id навбара
   *
   * @type {string}
   */
  const id: string = crypto.randomUUID();
  return getAsyncComponent({
    id,
    ...$.value.navbar,
    path,
  } as TView);
});
/**
 * Текущий роут сайта
 *
 * @type {RouteLocationNormalizedLoaded}
 */
const route: RouteLocationNormalizedLoaded = useRoute();
/**
 * Роутер сайта
 *
 * @type {Router}
 */
const router: Router = useRouter();
/**
 * Вычисление шаблона корневой страницы
 *
 * @type {ComputedRef<object>}
 */
const root: ComputedRef<object> = computed(() =>
  getAsyncComponent(views.value[0]),
);
/**
 * Поиск текущего объекта страницы
 *
 * @type {ComputedRef<TView | undefined>}
 */
const the: ComputedRef<TView | undefined> = computed(() =>
  views.value.find(({ id }) => id === route.name),
);
/**
 * Ссылка на переключатель панели
 *
 * @type {Ref<boolean>}
 */
const drawer: Ref<boolean> = ref(false);
/**
 * Вычисление канонического пути
 *
 * @type {ComputedRef<string | false>}
 */
const canonical: ComputedRef<string | false> = computed(
  () =>
    the.value?.url.constructor === String &&
    `${window.location.origin}/${the.value.url}`,
);
/**
 * Ф-ция проверки ресурса
 *
 * @function alive
 * @param {any} resource - Объект ресурса
 * @param {boolean} resource.enabled - Признак использования
 * @param {string} resource.url - Ссылка на ресурс
 * @returns {boolean} - Флаг проверки ресурса
 */
const alive = ({ enabled, url }: TResource): boolean => !!(enabled && url);
/**
 * Фильтр глобальных скриптов по видимости
 *
 * @type {ComputedRef<TResource[]>}
 */
const theJS: ComputedRef<TResource[]> = computed(
  () => $.value.js?.filter(alive) ?? [],
);
/**
 * Фильтр глобальных стилей по видимости
 *
 * @type {ComputedRef<TResource[]>}
 */
const theCSS: ComputedRef<TResource[]> = computed(
  () => $.value.css?.filter(alive) ?? [],
);
router.beforeEach(() => {
  drawer.value = false;
});
</script>
