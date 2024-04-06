<template lang="pug">
.flex.snap-start(
  v-for="a in siblings",
  :id="a?.id",
  :key="a?.id",
  ref="refs",
  v-intersection-observer="[callback,{root,rootMargin,threshold}]",
  :class="{ 'min-h-full': a?.full }"
)
  .prose.w-full.max-w-none.flex-auto.text-sm(
    v-cloak,
    class="md:text-base lg:text-lg xl:text-xl 2xl:text-2xl",
    :data-theme="a?.theme",
    :role="a?.id === the?.id ? 'main' : null"
  )
    component(
      :is="templates?.[a?.id]",
      :the="a",
      @vue:mounted="promises?.[a?.id]?.resolve"
    )
</template>
<script setup lang="ts">
import { vIntersectionObserver } from "@vueuse/components";
import { useParentElement } from "@vueuse/core";
import GLightbox from "glightbox";
import { storeToRefs } from "pinia";
import { computed, ComputedRef, Ref, ref, watch } from "vue";
import {
  RouteLocationNormalizedLoaded,
  Router,
  useRoute,
  useRouter,
} from "vue-router";

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
 * Роутер сайта
 *
 * @type {Router}
 */
const router: Router = useRouter();

/**
 * Вычисление текущего объекта с учетом переадресации корневого объекта страницы
 * на первый доступный объект страницы
 *
 * @type {ComputedRef<any>}
 */
const the: ComputedRef<any> = computed(() => {
  /**
   * Позиция текущей страницы в массиве страниц
   *
   * @type {number}
   */
  const index: number = pages?.value?.findIndex(
    ({ id = "" } = {}) => id === route?.name,
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
 * Вычисление массива видимых объектов страниц с одинаковым предком
 *
 * @type {ComputedRef<any[]>}
 */
const siblings: ComputedRef<any[]> = computed(() =>
  the?.value?.siblings?.filter(({ visible = true } = {}) => visible),
);

/**
 * Вычисление идентифицированного объекта промисов
 *
 * @type {ComputedRef<any[]>}
 */
const promises: ComputedRef<any[]> = computed(() =>
  Object.fromEntries(
    siblings?.value?.map(({ id = "" } = {}) => [id, Promise.withResolvers()]) ??
      [],
  ),
);

/**
 * Вычисление массива загруженных шаблонов
 *
 * @type {ComputedRef<object[]>}
 */
const templates: ComputedRef<object[]> = computed(() =>
  Object.fromEntries(
    siblings?.value?.map((a = { id: "" }) => [a?.id, fncTemplate(a)]) ?? [],
  ),
);

/**
 * Сдвиг области видимости
 *
 * @type {string}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/rootMargin} см. документацию
 */
const rootMargin: string = "-1% 0px -99%";

/**
 * Процент площади объекта, который должен попасть в область видимости
 *
 * @type {number}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/thresholds} см. документацию
 */
const threshold: number = 0;

/**
 * Родительский элемент представления
 *
 * @type {Ref<HTMLElement | SVGElement | null | undefined>}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/root} см. документацию
 */
const root: Ref<HTMLElement | SVGElement | null | undefined> =
  useParentElement();

/**
 * Флаг постановки проверки пересечения страницы с облатью видимости на паузу
 *
 * @type {boolean}
 */
let pause: boolean = false;

/**
 * Флаг условия изменения роута
 *
 * @type {boolean}
 */
let push: boolean = false;

/**
 * Процедура обновления роутера, если страница появилась в области видимости
 *
 * @type {IntersectionObserverCallback}
 * @param {Array} entries - Массив объектов, описывающих пересечения
 * @param {IntersectionObserverEntry} entries."0" - Первый и единственный
 *   объект, описывающий пересечение
 */
const callback: IntersectionObserverCallback = ([
  {
    isIntersecting = false,
    target: { id: name = "" },
  },
]: IntersectionObserverEntry[]) => {
  if (!pause && isIntersecting && name !== the?.value?.id) {
    push = true;
    router.push({ name });
  }
};

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

/**
 * Массив страниц, отображаемых на экране
 *
 * @type {Ref<any[]>}
 */
const refs: Ref<any[]> = ref([]);

/**
 * Немедленное срабатывание смотрителя
 *
 * @type {boolean}
 */
const immediate: boolean = true;

/**
 * Быстрый скролл
 *
 * @type {string}
 */
const behavior: string = "instant";

/**
 * Процедура ожидания загрузки страниц
 *
 * @type {Function}
 */
const all: Function = async () => {
  await Promise.all(
    Object.values(promises?.value ?? {})?.map(
      ({ promise = null } = {}) => promise,
    ),
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
      refs?.value
        ?.find(({ id = "" } = {}) => id === the?.value?.id)
        ?.scrollIntoView({ behavior });
      pause = false;
    } else push = false;
  },
  { immediate },
);
</script>
