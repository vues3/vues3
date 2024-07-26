<template lang="pug">
div(
  :class="the.class",
  :id="the.id",
  :key="the.id",
  :role="the.id === that?.id ? 'main' : undefined",
  ref="refs",
  v-for="the in views"
)
  component(:is="template(the)", :the, @vue:mounted="resolve(the)")
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
import { behavior, deep } from "app/src/stores/defaults";
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";

import {
  all,
  getAsyncComponent,
  promises,
  scroll,
  siblings,
  that,
} from "../stores/monolit";

const refs: Ref<HTMLElement[]> = ref([]);
const router = useRouter();
const views = computed(() => siblings.value.filter(({ enabled }) => enabled));
const templates = computed(
  () =>
    Object.fromEntries(
      views.value.map((value) => [value.id, getAsyncComponent(value)]),
    ) as object,
);
const template = ({ id }: TView) =>
  templates.value[id as keyof object] as object;
const resolve = ({ id }: TView) => {
  promises.value[id as keyof object].resolve(undefined);
};
const intersecting = computed(
  () => new Map(views.value.map(({ id }) => [id, false])),
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
    if (name && name !== that.value?.id) {
      scroll.value = false;
      router.push({ name }).catch(() => {});
    }
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
      const { stop } = useIntersectionObserver(target, callback);
      stops.push(stop);
    });
  },
  { deep },
);
</script>
