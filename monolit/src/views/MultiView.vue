<template lang="pug">
.flex.snap-start(
  v-for="a in siblings",
  :id="a.id",
  :key="a.id",
  ref="refs",
  v-intersection-observer="[callback,{root,rootMargin,threshold}]",
  :class="{ 'min-h-full': a.full }"
)
  .prose.w-full.max-w-none.flex-auto.text-sm(
    v-cloak,
    class="md:text-base lg:text-lg xl:text-xl 2xl:text-2xl",
    :data-theme="a.theme",
    :role="a.id === the.id ? 'main' : null"
  )
    component(
      :is="templates[a.id]",
      :the="a",
      @vue:mounted="promises[a.id].resolve"
    )
</template>
<script setup lang="ts">
import { vIntersectionObserver } from "@vueuse/components";
import { useParentElement } from "@vueuse/core";
import GLightbox from "glightbox";
import type { ComputedRef, Ref } from "vue";
import { computed, ref, watch } from "vue";
import type { RouteLocationNormalizedLoaded, Router } from "vue-router";
import { useRoute, useRouter } from "vue-router";

import selectors from "@/assets/glightbox.json";
import type { TPage } from "@/stores/data";
import { pages } from "@/stores/data";
import { getAsyncComponent } from "@/stores/monolit";

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
 * Вычисление текущего объекта с учетом переадресации корневого объекта страницы
 * на первый доступный объект страницы
 *
 * @type {ComputedRef<TPage | null>}
 */
const the: ComputedRef<TPage | null> = computed(() => {
  /**
   * Позиция текущей страницы в массиве страниц
   *
   * @type {number}
   */
  const index: number = pages.value.findIndex(({ id }) => id === route.name);

  /**
   * Вычисленный текущий объект
   *
   * @type {TPage}
   */
  const ret: TPage = pages.value[index];

  return index ? ret : ret.children[0] ?? null;
});

/**
 * Вычисление массива видимых объектов страниц с одинаковым предком
 *
 * @type {ComputedRef<TPage[]>}
 */
const siblings: ComputedRef<TPage[]> = computed(
  () => the.value?.siblings.filter(({ enabled }) => enabled) ?? [],
);

/**
 * Вычисление идентифицированного объекта промисов
 *
 * @type {ComputedRef<object>}
 */
const promises: ComputedRef<object> = computed(() =>
  Object.fromEntries(
    siblings.value.map(({ id }) => [id, Promise.withResolvers()]),
  ),
);

/**
 * Вычисление массива загруженных шаблонов
 *
 * @type {ComputedRef<object>}
 */
const templates: ComputedRef<object> = computed(() =>
  Object.fromEntries(siblings.value.map((a) => [a.id, getAsyncComponent(a)])),
);

/**
 * Сдвиг области видимости
 *
 * @constant
 * @default
 * @type {string}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/rootMargin} см. документацию
 */
const rootMargin: string = "-1% 0px -99%";

/**
 * Процент площади объекта, который должен попасть в область видимости
 *
 * @constant
 * @default
 * @type {number}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/thresholds} см. документацию
 */
const threshold: number = 0;

/**
 * Родительский элемент представления
 *
 * @type {Ref<HTMLElement>}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/root} см. документацию
 */
const root: Ref<HTMLElement> = useParentElement() as Ref<HTMLElement>;

/**
 * Флаг постановки проверки пересечения страницы с областью видимости на паузу
 *
 * @constant
 * @default
 * @type {boolean}
 */
let pause: boolean = true;

/**
 * Флаг условия изменения роута
 *
 * @constant
 * @default
 * @type {boolean}
 */
let push: boolean = false;

/**
 * Процедура обновления роутера, если страница появилась в области видимости
 *
 * @type {IntersectionObserverCallback}
 * @param {IntersectionObserverEntry[]} entries - Массив объектов, описывающих
 *   пересечения
 */
const callback: IntersectionObserverCallback = ([
  {
    isIntersecting,
    target: { id: name },
  },
]: IntersectionObserverEntry[]) => {
  if (!pause && isIntersecting && name !== the.value?.id) {
    push = true;

    router.push({ name });
  }
};

/**
 * Loop slides on end
 *
 * @constant
 * @default
 * @type {boolean}
 * @see {@link https://github.com/biati-digital/glightbox} см. документацию
 */
const loop: boolean = true;

/**
 * Enable or disable zoomable images you can also use data-zoomable="false" on
 * individual nodes.
 *
 * @constant
 * @default
 * @type {boolean}
 * @see {@link https://github.com/biati-digital/glightbox} см. документацию
 */
const zoomable: boolean = false;

/**
 * Name of the selector for example '.glightbox' or 'data-glightbox' or
 * '*[data-glightbox]'
 *
 * @constant
 * @default
 * @type {string}
 * @see {@link https://github.com/biati-digital/glightbox} см. документацию
 */
const selector: string = selectors.map((el) => `a[href${el}]`).join();

/**
 * Массив страниц, отображаемых на экране
 *
 * @type {Ref<HTMLElement[]>}
 */
const refs: Ref<HTMLElement[]> = ref([]);

/**
 * Немедленное срабатывание смотрителя
 *
 * @type {boolean}
 */
const immediate: boolean = true;

/**
 * Быстрый скролл
 *
 * @type {ScrollBehavior}
 */
const behavior: ScrollBehavior = "instant";

/**
 * Процедура ожидания загрузки страниц
 *
 * @async
 * @function all
 */
const all = async () => {
  await Promise.all(
    Object.values(promises.value).map(({ promise }) => promise),
  );
};

watch(
  siblings,
  async () => {
    await all();

    GLightbox({ loop, zoomable, selector });
  },
  { immediate },
);

watch(
  route,
  async () => {
    if (!push) {
      await all();

      pause = true;

      refs.value
        .find(({ id }) => id === the.value?.id)
        ?.scrollIntoView({ behavior });

      pause = false;
    } else push = false;
  },
  { immediate },
);
</script>
