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
    :role="a.id === the?.id ? 'main' : undefined"
  )
    Suspense
      component(
        :is="<object>templates[<keyof object>a.id]",
        :the="a",
        @vue:mounted="(promises[<keyof object>a.id]).resolve"
      )
</template>
<script setup lang="ts">
import { vIntersectionObserver } from "@vueuse/components";
import { useParentElement } from "@vueuse/core";
import type { TView } from "app/src/stores/data";
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
import type { ComputedRef, Ref } from "vue";
import { computed, ref, watch } from "vue";
import type { RouteLocationNormalizedLoaded, Router } from "vue-router";
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
      <Record<string, PromiseWithResolvers<undefined>>>(
        Object.fromEntries(
          siblings.value.map(({ id }) => [id, Promise.withResolvers()]),
        )
      ),
  );
const templates: ComputedRef<object> = computed(
  () =>
    <object>(
      Object.fromEntries(
        siblings.value.map((a) => [a.id, getAsyncComponent(a)]),
      )
    ),
);
const root: Ref<HTMLElement> = <Ref<HTMLElement>>useParentElement();
let pause: boolean = true;
let push: boolean = false;
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
