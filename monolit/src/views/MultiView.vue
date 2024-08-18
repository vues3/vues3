<template lang="pug">
div(
  :class="the.class",
  :id="the.id",
  :key="the.id",
  :role="the.id === that?.id ? 'main' : undefined",
  ref="refs",
  v-for="the in pages"
)
  component(:is="template(the)", :the, @vue:mounted="resolve(the)")
</template>
<script setup lang="ts">
import type { TView } from "app/src/stores/types";
import type { Ref } from "vue";

import { useIntersectionObserver, useScroll } from "@vueuse/core";
import { behavior, deep } from "app/src/stores/defaults";
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";

import {
  enabled,
  getAsyncComponent,
  pages,
  resolve,
  scroll,
  that,
} from "../stores/monolit";

const refs: Ref<HTMLElement[]> = ref([]);
const router = useRouter();
const templates = computed(
  () =>
    Object.fromEntries(
      pages.value.map((value) => [value.id, getAsyncComponent(value)]),
    ) as object,
);
const template = ({ id }: TView) =>
  templates.value[id as keyof object] as object;
const intersecting = computed(
  () => new Map(pages.value.map(({ id }) => [id, false])),
);
const onStop = () => {
  if (enabled.value) {
    const name = [...intersecting.value.entries()].find(
      ([, value]) => value,
    )?.[0];
    if (name && name !== that.value?.id) {
      scroll.value = false;
      router.push({ name }).catch(() => {});
    }
  }
};
useScroll(window, { behavior, onStop });
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
      const { stop } = useIntersectionObserver(target, callback);
      stops.push(stop);
    });
  },
  { deep },
);
</script>
