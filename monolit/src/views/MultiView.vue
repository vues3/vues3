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
    :is="<object>templates[<keyof object>a.id]",
    :the,
    @vue:mounted="(promises[<keyof object>a.id]).resolve",
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
  deep,
  immediate,
  rootMargin,
  threshold,
} from "app/src/stores/defaults";
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { getAsyncComponent } from "../stores/monolit";

let pause = false;
let push = false;
const refs: Ref<HTMLElement[]> = ref([]);
const onStop = () => {
  pause = false;
};
useScroll(document, { onStop });
const route = useRoute();
const router = useRouter();
const the = computed(() => views.value.find(({ id }) => id === route.name));
const that = computed(() =>
  route.path === "/" ? the.value?.children?.[0] : the.value,
);
const parent = computed(() => that.value?.parent);
const siblings = computed(
  () =>
    parent.value?.children?.filter(({ enabled }) => enabled) ??
    (that.value ? [that.value] : []),
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
const intersecting = computed(
  () => new Map(siblings.value.map((a) => [a.id, false])),
);
const debouncedFn = useDebounceFn(() => {
  const [name] =
    [...intersecting.value.entries()].find(([, value]) => value) ?? [];
  if (!pause && name && name !== that.value?.id) {
    push = true;
    router.push({ name }).catch(() => {});
  }
});
const callback = ([
  {
    isIntersecting,
    target: { id: name },
  },
]: IntersectionObserverEntry[]) => {
  intersecting.value.set(name, isIntersecting);
  debouncedFn().catch(() => {});
};
const stops: (() => void)[] = [];
const all = async () => {
  await Promise.all(
    Object.values(promises.value).map(({ promise }) => promise),
  );
};
watch(
  () => route.name,
  async (value) => {
    if (!push) {
      pause = true;
      await all();
      const index = refs.value.findIndex(({ id }) => id === value);
      if (index <= 0) window.scrollTo(0, 0);
      else refs.value[index]?.scrollIntoView();
    } else push = false;
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
</script>
