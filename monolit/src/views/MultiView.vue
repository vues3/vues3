<template lang="pug">
div(
  :class="the.class",
  :id="the.id",
  :key="the.id",
  :role="the.id === that?.id ? 'main' : undefined",
  ref="refs",
  un-cloak,
  v-for="the in $siblings"
)
  component(
    :id="the.id",
    :is="template(the)",
    @vue:mounted="() => { resolve(the); }"
  )
</template>
<script setup lang="ts">
import type { TPage } from "app/src/stores/types";
import type { Ref } from "vue";

import { useIntersectionObserver, useScroll } from "@vueuse/core";
import { behavior, deep, threshold } from "app/src/stores/defaults";
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";

import {
  $siblings,
  getAsyncComponent,
  paused,
  resolve,
  scroll,
  that,
} from "../stores/monolit";

const refs: Ref<HTMLElement[]> = ref([]);
const router = useRouter();
const templates = computed(
  () =>
    Object.fromEntries(
      $siblings.value.map((value) => [value.id, getAsyncComponent(value)]),
    ) as object,
);
const template = ({ id }: TPage) =>
  templates.value[id as keyof object] as object;
const intersecting = computed(
  () => new Map($siblings.value.map(({ id }) => [id, false])),
);
const $intersecting = ref(new Map(intersecting.value));
const onStop = () => {
  if (!paused.value && that.value && $siblings.value.length) {
    const { scrollX, scrollY } = window;
    const [first] = $siblings.value;
    const { root } = first;
    const { $children: [{ id }] = [{}] } = root;
    const name =
      !Math.floor(scrollX) && !Math.floor(scrollY) && first.id === id
        ? root.id
        : ([...intersecting.value.entries()].find(([, value]) => value)?.[0] ??
          [...$intersecting.value.entries()].find(([, value]) => value)?.[0] ??
          first.id);
    scroll.value = false;
    router.push({ name }).catch(() => {});
  }
};
useScroll(window, { behavior, onStop });
const callback = ([
  {
    isIntersecting,
    target: { id },
  },
]: IntersectionObserverEntry[]) => {
  $intersecting.value = new Map(intersecting.value);
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
      const { stop } = useIntersectionObserver(target, callback, { threshold });
      stops.push(stop);
    });
  },
  { deep },
);
</script>
