<template lang="pug">
.flex.snap-start(
  :class="{ 'min-h-full': a.full }",
  :id="a.id",
  :key="a.id",
  ref="refs",
  v-for="a in siblings",
  v-intersection-observer="[callback,{root,rootMargin,threshold}]"
)
  .prose.w-full.max-w-none.flex-auto.text-sm(
    :data-theme="a.theme",
    :role="a.id === the?.id ? 'main' : undefined",
    class="md:text-base lg:text-lg xl:text-xl 2xl:text-2xl",
    v-cloak
  )
    Suspense
      component(
        :is="<object>templates[<keyof object>a.id]",
        :the="a",
        @vue:mounted="(promises[<keyof object>a.id]).resolve"
      )
</template>
<script setup lang="ts">
import type { TView } from "app/src/stores/data";
import type { ComputedRef, Ref } from "vue";
import type { RouteLocationNormalizedLoaded, Router } from "vue-router";

import { vIntersectionObserver } from "@vueuse/components";
import { useParentElement } from "@vueuse/core";
import { views } from "app/src/stores/data";
import {
  behavior,
  immediate,
  loop,
  rootMargin,
  threshold,
  zoomable,
} from "app/src/stores/defaults";
import GLightbox from "glightbox";
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { getAsyncComponent, selector } from "../stores/monolit";

const route: RouteLocationNormalizedLoaded = useRoute();
const router: Router = useRouter();
const the: ComputedRef<TView | undefined> = computed(() => {
  const index: number = views.value.findIndex(({ id }) => id === route.name);
  const ret: TView = views.value[index];
  return index ? ret : ret.children[0];
});
const siblings: ComputedRef<TView[]> = computed(
  () => the.value?.siblings.filter(({ enabled }) => enabled) ?? [],
);
const promises: ComputedRef<Record<string, PromiseWithResolvers<undefined>>> =
  computed(
    () =>
      Object.fromEntries(
        siblings.value.map(({ id }) => [id, Promise.withResolvers()]),
      ) as Record<string, PromiseWithResolvers<undefined>>,
  );
const templates: ComputedRef<object> = computed(
  () =>
    Object.fromEntries(
      siblings.value.map((a) => [a.id, getAsyncComponent(a)]),
    ) as object,
);
const root: Ref<HTMLElement> = useParentElement() as Ref<HTMLElement>;
let pause = true;
let push = false;
const callback: IntersectionObserverCallback = ([
  {
    isIntersecting,
    target: { id: name },
  },
]: IntersectionObserverEntry[]) => {
  if (!pause && isIntersecting && name !== the.value?.id) {
    push = true;
    router.push({ name }).catch(() => {});
  }
};
const refs: Ref<HTMLElement[]> = ref([]);
const all = async () => {
  await Promise.all(
    Object.values(promises.value).map(({ promise }) => promise),
  );
};
watch(
  siblings,
  async () => {
    await all();
    GLightbox({ loop, selector, zoomable });
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
