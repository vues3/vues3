<template lang="pug">
div(
  :class="a.class",
  :id="a.id",
  :key="a.id",
  :role="a.id === that?.id ? 'main' : undefined",
  ref="refs",
  v-cloak,
  v-for="a in siblings"
)
  component(
    :a,
    :is="templates[a.id as keyof object] as object",
    :the,
    @vue:mounted="promises[a.id as keyof object].resolve",
    un-cloak,
    v-cloak
  )
</template>
<script setup lang="ts">
import type { Ref } from "vue";

import {
  useDebounceFn,
  useIntersectionObserver,
  useScroll,
} from "@vueuse/core";
import { views } from "app/src/stores/data";
import {
  behavior,
  deep,
  immediate,
  left,
  rootMargin,
  threshold,
  top,
} from "app/src/stores/defaults";
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { getAsyncComponent } from "../stores/monolit";

const refs: Ref<HTMLElement[]> = ref([]);
const route = useRoute();
const router = useRouter();
const the = computed(() => views.value.find(({ id }) => id === route.name));
const that = computed(() =>
  route.path === "/" ? the.value?.children?.[0] : the.value,
);
const siblings = computed(() => that.value?.siblings ?? []);
const promiseWithResolvers = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve };
};
const promises = computed(
  () =>
    Object.fromEntries(
      siblings.value
        .filter(({ enabled }) => enabled)
        .map(({ id }) => [id, promiseWithResolvers()]),
    ) as Record<string, PromiseWithResolvers<undefined>>,
);
const templates = computed(
  () =>
    Object.fromEntries(
      siblings.value
        .filter(({ enabled }) => enabled)
        .map((a) => [a.id, getAsyncComponent(a)]),
    ) as object,
);
const intersecting = computed(
  () =>
    new Map(
      siblings.value
        .filter(({ enabled }) => enabled)
        .map(({ id }) => [id, false]),
    ),
);
const getName = () =>
  [...intersecting.value.entries()].find(([, value]) => value)?.[0];
const { isScrolling } = useScroll(document, { behavior });
const callback = ([
  {
    isIntersecting,
    target: { id },
  },
]: IntersectionObserverEntry[]) => {
  intersecting.value.set(id, isIntersecting);
};
const stops: (() => void)[] = [];
const all = () =>
  Promise.all(Object.values(promises.value).map(({ promise }) => promise));
const debounce = useDebounceFn(() => {
  if (!isScrolling.value) {
    const name = getName();
    if (name && name !== that.value?.id) router.push({ name }).catch(() => {});
  }
});
watch(
  () => route.name,
  async (value) => {
    if (getName() !== value) {
      await all();
      setTimeout(() => {
        if (siblings.value.findIndex(({ id }) => id === value) <= 0)
          window.scrollTo({ behavior, left, top });
        else
          refs.value
            .find(({ id }) => id === value)
            ?.scrollIntoView({ behavior });
      }, 100);
    }
  },
  { immediate },
);
watch(
  refs,
  (value) => {
    stops.forEach((stop: () => void) => {
      stop();
    });
    stops.length = 0;
    value.forEach((target) => {
      const { stop } = useIntersectionObserver(target, callback, {
        rootMargin,
        threshold,
      });
      stops.push(stop);
    });
  },
  { deep },
);
watch(isScrolling, async (value) => {
  if (!value) {
    await all();
    debounce().catch(() => {});
  }
});
</script>
