<template lang="pug">
v-head
  title {{ the?.name || " " }}
  link(
    v-for="a in theCSS",
    :key="a?.id",
    crossorigin,
    rel="stylesheet",
    :href="a?.url"
  )
  component(
    :is="'script'",
    v-for="a in theJS",
    :key="a?.id",
    crossorigin,
    deffer,
    :src="a?.url"
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
    :href="`data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='${mdi?.[the?.favicon ?? 'mdiWeb']}'/></svg>`",
    type="image/svg+xml"
  )
  link(v-if="canonical", rel="canonical", :href="canonical")
  component(:is="'style'", v-if="$?.style") {{ $?.style }}
  component(:is="'script'", v-if="$?.script") {{ $?.script }}
  meta(
    v-if="$?.settings?.yandex",
    name="yandex-verification",
    :content="$?.settings?.yandex"
  )
  meta(
    v-if="$?.settings?.google",
    name="google-site-verification",
    :content="$?.settings?.google"
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
      v-if="pages?.[0]?.visible",
      :class="[...(ready ? [] : $?.navbar?.scrollClasses ?? []), ...($?.navbar?.classes ?? [])]",
      :data-theme="$?.navbar?.theme"
    )
      .navbar
        component(:is="navigator", :the="the")
    router-view
  .drawer-side.z-50(v-if="pages?.[0]?.visible")
    label.drawer-overlay(for="drawer")
    .grid.max-w-full.self-stretch.overflow-x-auto.scroll-smooth(
      :class="{ 'justify-self-stretch': pages?.[0]?.full }"
    )
      .col-start-1.row-start-1.flex
        .prose.w-full.max-w-none.flex-auto.text-sm(
          class="md:text-base lg:text-lg xl:text-xl 2xl:text-2xl",
          :data-theme="pages?.[0]?.theme"
        )
          component(:is="root", :the="pages?.[0]")
      label.btn.btn-circle.btn-ghost.sticky.right-1.top-1.col-start-1.row-start-1.justify-self-end(
        for="drawer"
      )
        svg.h-6.w-6
          path(:d="mdi?.mdiClose")
</template>
<script setup lang="ts">
import { useTimeout } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { computed, ComputedRef, Ref, ref } from "vue";
import {
  RouteLocationNormalizedLoaded,
  Router,
  useRoute,
  useRouter,
} from "vue-router";

import data from "@/stores/data";
import Monolit from "@/stores/monolit";

/** @type {{ fncTemplate: Function }} */
const { fncTemplate }: { fncTemplate: Function } = Monolit();

/** @type {{ $: any }} */
const { $ }: { $: any } = data();

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

  /**
   * Шаблон навбара
   *
   * @type {string}
   */
  const template: string = $?.navbar?.template;

  /**
   * Срипты навбара
   *
   * @type {string}
   */
  const script: string = $?.navbar?.script;

  /**
   * Стили навбара
   *
   * @type {string}
   */
  const style: string = $?.navbar?.style;

  /**
   * Тип скриптов навбара
   *
   * @type {boolean}
   */
  const setup: boolean = $?.navbar?.setup;

  /**
   * Тип стилей навбара
   *
   * @type {boolean}
   */
  const scoped: boolean = $?.navbar?.scoped;

  /**
   * Путь готового шаблона навбара
   *
   * @type {string}
   */
  const path: string = "~";

  return fncTemplate({ id, template, script, style, setup, scoped, path });
});

/** @type {{ pages: any[] }} */
const { pages }: { pages: Ref<any[]> } = storeToRefs(data());

/**
 * Expose more controls
 *
 * @type {boolean}
 */
const controls: boolean = true;

/** @type {{ ready: ComputedRef<boolean>; start: Function }} */
const { ready, start }: { ready: ComputedRef<boolean>; start: Function } =
  useTimeout(1000, { controls });

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
  fncTemplate(pages?.value?.[0]),
);

/**
 * Поиск текущего объекта страницы
 *
 * @type {ComputedRef<any>}
 */
const the: ComputedRef<any> = computed(() =>
  pages?.value?.find(({ id = "" } = {}) => id === route?.name),
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
    the?.value?.urn?.constructor === String &&
    `${window.location.origin}/${the?.value?.urn}`,
);

/**
 * Уникальный ключ для favicon. Иначе иконка динамически не обновляется в chrome
 * при смене страницы
 *
 * @type {string}
 */
const favicon: string = crypto.randomUUID();

/**
 * Ф-ция проверки ресурса
 *
 * @type {Function}
 * @param {any} resource - Объект ресурса
 * @param {boolean} resource.visible - Признак использования
 * @param {string} resource.url - Ссылка на ресурс
 * @returns {boolean} - Флаг проверки ресурса
 */
const alive: Function = ({
  visible = true,
  url = "",
}: {
  visible: boolean;
  url: string;
}): boolean => !!(visible && url);

/**
 * Фильтр глобальных скриптов по видимости
 *
 * @type {ComputedRef<any[]>}
 */
const theJS: ComputedRef<any[]> = computed(() => $?.js?.filter(alive));

/**
 * Фильтр глобальных стилей по видимости
 *
 * @type {ComputedRef<any[]>}
 */
const theCSS: ComputedRef<any[]> = computed(() => $?.css?.filter(alive));

router.beforeEach(() => {
  drawer.value = false;
});
</script>
