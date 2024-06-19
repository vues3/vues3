<template lang="pug">
div(
  :class="a.class",
  :id="a.id",
  :key="a.id",
  :role="a.id === that?.id ? 'main' : undefined",
  ref="refs",
  v-cloak,
  v-for="a in siblings",
  v-intersection-observer="[callback,{rootMargin,threshold}]"
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

import { vIntersectionObserver } from "@vueuse/components";
import { views } from "app/src/stores/data";
import {
  behavior,
  immediate,
  rootMargin,
  threshold,
} from "app/src/stores/defaults";
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { getAsyncComponent } from "../stores/monolit";

const route = useRoute();
const router = useRouter();
const the = computed(() => views.value.find(({ id }) => id === route.name));
const that = computed(
  () =>
    (route.path === "/" ? undefined : the.value) ?? views.value[0].children[0],
);
const siblings = computed(() =>
  that.value.siblings.filter(({ enabled }) => enabled),
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
let pause = false;
let push = false;
const callback = ([
  {
    isIntersecting,
    target: { id: name },
  },
]: IntersectionObserverEntry[]) => {
  if (!pause && isIntersecting && name !== that.value.id) {
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
  () => route.name,
  async (value) => {
    if (!push)
      if (route.path === "/") window.scrollTo(0, 0);
      else {
        pause = true;
        await all();
        refs.value.find(({ id }) => id === value)?.scrollIntoView({ behavior });
        pause = false;
      }
    else push = false;
  },
  { immediate },
);
</script>
