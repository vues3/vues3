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
    :is="template(a)",
    :the,
    @vue:mounted="resolve(a)",
    un-cloak,
    v-cloak
  )
</template>
<script setup lang="ts">
import type { PromisifyFn } from "@vueuse/core";
import type { TView } from "app/src/stores/types";
import type { Ref } from "vue";

import {
  useDebounceFn,
  useIntersectionObserver,
  useScroll,
} from "@vueuse/core";
import { behavior, deep, rootMargin, threshold } from "app/src/stores/defaults";
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";

import {
  all,
  getAsyncComponent,
  promises,
  siblings,
  that,
  the,
} from "../stores/monolit";

const refs: Ref<HTMLElement[]> = ref([]);
const router = useRouter();
const templates = computed(
  () =>
    Object.fromEntries(
      siblings.value
        .filter(({ enabled }) => enabled)
        .map((a) => [a.id, getAsyncComponent(a)]),
    ) as object,
);
const template = ({ id }: TView) =>
  templates.value[id as keyof object] as object;
const resolve = ({ id }: TView) => {
  promises.value[id as keyof object].resolve(undefined);
};
const intersecting = computed(
  () =>
    new Map(
      siblings.value
        .filter(({ enabled }) => enabled)
        .map(({ id }) => [id, false]),
    ),
);
let debounce: PromisifyFn<() => void> | undefined;
const onStop = () => {
  (async () => {
    if (debounce) {
      await all();
      debounce().catch(() => {});
    }
  })().catch(() => {});
};
const { isScrolling } = useScroll(document, { behavior, onStop });
debounce = useDebounceFn(() => {
  if (!isScrolling.value) {
    const name = [...intersecting.value.entries()].find(
      ([, value]) => value,
    )?.[0];
    if (name && name !== that.value?.id) router.push({ name }).catch(() => {});
  }
});
const callback = ([
  {
    isIntersecting,
    target: { id },
  },
]: IntersectionObserverEntry[]) => {
  intersecting.value.set(id, isIntersecting);
};
const stops: (() => void)[] = [];
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
</script>
