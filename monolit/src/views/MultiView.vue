<template lang="pug">
div(
  :class="a.class",
  :id="a.id",
  :key="a.id",
  :role="a.id === the?.id ? 'main' : undefined",
  ref="refs"
  v-cloak,
  v-for="a in siblings",
  v-intersection-observer="[callback,{root,rootMargin,threshold}]"
)
  Suspense
    component(
      :is="<object>templates[<keyof object>a.id]",
      :the="a",
      @vue:mounted="(promises[<keyof object>a.id]).resolve"
    )
</template>
<script setup lang="ts">
import type { Ref } from "vue";

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

const route = useRoute();
const router = useRouter();
const the = computed(
  () =>
    (route.path === "/"
      ? undefined
      : views.value.find(({ id }) => id === route.name)) ??
    views.value[0].children[0],
);
const siblings = computed(() =>
  the.value.siblings.filter(({ enabled }) => enabled),
);
const promises = computed(
  () =>
    Object.fromEntries(
      siblings.value.map(({ id }) => [id, Promise.withResolvers()]),
    ) as Record<string, PromiseWithResolvers<undefined>>,
);
const templates = computed(
  () =>
    Object.fromEntries(
      siblings.value.map((a) => [a.id, getAsyncComponent(a)]),
    ) as object,
);
const root = useParentElement() as Ref<HTMLElement>;
let pause = true;
let push = false;
const callback = ([
  {
    isIntersecting,
    target: { id: name },
  },
]: IntersectionObserverEntry[]) => {
  if (!pause && isIntersecting && name !== the.value.id) {
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
      if (route.path === "/") window.scrollTo(0, 0);
      else
        refs.value
          .find(({ id }) => id === the.value.id)
          ?.scrollIntoView({ behavior });
      pause = false;
    } else push = false;
  },
  { immediate },
);
</script>
