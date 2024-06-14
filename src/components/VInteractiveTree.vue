<template lang="pug">
q-btn-group.q-mx-xs(flat, spread)
  q-btn(@click="newView", icon="note")
  q-btn(@click="deleteView", icon="delete")
  q-btn(@click="leftView", icon="chevron_left", v-if="tree")
  q-btn(@click="rightView", icon="chevron_right", v-if="tree")
  q-btn(@click="downView", icon="expand_more")
  q-btn(@click="upView", icon="expand_less")
.scroll.col
  q-tree.q-ma-xs(
    :expanded,
    :nodes,
    :selected,
    @update:expanded="updateExpanded($event)",
    @update:selected="updateSelected($event)",
    accordion,
    no-selection-unset,
    node-key="id",
    ref="qtree"
  )
    template(#default-header="prop")
      .row.no-wrap.full-width.items-center(
        @dblclick="prop.node.contenteditable = true"
      )
        q-checkbox.q-mr-xs(dense, v-model="prop.node.enabled")
        q-input.full-width.min-w-96(
          :bg-color="prop.node.id === selected ? 'primary' : undefined",
          :debounce,
          :error="!prop.node[node] || !!list.find((element) => element.id !== prop.node.id && (('path' in element && element.path === prop.node.path) || ('loc' in element && element.loc === prop.node.path)))",
          :error-message="prop.node[node] ? 'Такое имя уже используется' : 'Пустое имя'",
          :readonly="!prop.node.contenteditable",
          :type,
          @click.stop="updateSelected(prop.node.id)",
          @keyup.enter="prop.node.contenteditable = false",
          dense,
          hide-bottom-space,
          outlined,
          v-model.trim="prop.node[node]"
        )
</template>
<script setup lang="ts">
import type { QInputProps, QTree, QTreeNode } from "quasar";
import type { TResource, TView } from "stores/types";
import type { Ref } from "vue";

import { uid, useQuasar } from "quasar";
import { cancel, debounce, immediate, persistent } from "stores/defaults";
import { computed, nextTick, onMounted, ref, watch } from "vue";

interface IEmits {
  (e: "update:expanded", value: readonly string[]): void;
  (e: "update:selected", value: string | undefined): void;
}
const props = withDefaults(
  defineProps<{
    expanded?: string[];
    list: TResource[] | TView[];
    selected?: string;
    tree?: TView[];
    type?: QInputProps["type"];
  }>(),
  {
    expanded: (): string[] => [],
    list: (): TView[] => [],
    selected: "",
    tree: undefined,
    type: "text",
  },
);
const node = props.type === "text" ? "name" : props.type;
const nodes = computed(() => (props.tree ?? props.list) as QTreeNode[]);
const the = computed(() =>
  props.list.length
    ? props.list.find(({ id }) => id === props.selected) ?? null
    : undefined,
);
const emits = defineEmits<IEmits>();
const updateExpanded = (value: readonly string[]) => {
  emits("update:expanded", value);
};
const updateSelected = (value: string | undefined) => {
  emits("update:selected", value);
};
const $q = useQuasar();
const qtree: Ref<QTree | undefined> = ref();
const title = "Confirmation";
const message = "Do you really want to delete?";
const deleteView = () => {
  if (the.value) {
    const { index, next, parent, prev, siblings } = the.value;
    $q.dialog({ cancel, message, persistent, title }).onOk(() => {
      let id;
      switch (true) {
        case !!next:
          ({ id } = next);
          break;
        case !!prev:
          ({ id } = prev);
          break;
        default:
          ({ id } = parent ?? {});
      }
      siblings.splice(index, 1);
      (async () => {
        if (!id) {
          await nextTick();
          [{ id }] = props.list;
        }
        updateSelected(id);
      })().catch(() => {});
    });
  }
};
const upView = () => {
  if (the.value) {
    const { index, siblings } = the.value;
    if (index)
      [siblings[index - 1], siblings[index]] = [
        siblings[index],
        siblings[index - 1],
      ];
  }
};
const downView = () => {
  if (the.value) {
    const { index, siblings } = the.value;
    if (index < siblings.length - 1)
      [siblings[index], siblings[index + 1]] = [
        siblings[index + 1],
        siblings[index],
      ];
  }
};
const rightView = () => {
  if (the.value) {
    const { index, prev, siblings } = the.value;
    if (prev) {
      const { children = [], id } = prev;
      prev.children = [...children, ...siblings.splice(index, 1)];
      qtree.value?.setExpanded(id, true);
    }
  }
};
const leftView = () => {
  if (the.value) {
    const { index, parent } = the.value;
    if (parent) {
      const {
        children,
        id,
        index: grandindex,
        parent: grandparent,
        siblings,
      } = parent;
      if (grandparent) {
        qtree.value?.setExpanded(id, false);
        siblings.splice(
          grandindex + 1,
          0,
          ...(children ?? []).splice(index, 1),
        );
      }
    }
  }
};
const value = false;
const newView = () => {
  if (the.value) {
    const { children, index, parent, siblings } = the.value;
    const id = uid();
    switch (true) {
      case !!parent:
        siblings.splice(index + 1, 0, { id } as TView);
        break;
      case !!children:
        children.unshift({ id } as TView);
        qtree.value?.setExpanded(the.value.id, true);
        break;
      default:
        siblings.splice(index + 1, 0, { id } as TView);
        break;
    }
    updateSelected(id);
  }
};
onMounted(() => {
  const [{ id }] = props.tree ?? [{}];
  if (id) qtree.value?.setExpanded(id, true);
});
watch(
  the,
  (newVal, oldVal) => {
    if (!newVal && props.list.length) {
      const [{ id }] = props.list;
      updateSelected(id);
    }
    if (oldVal) Reflect.defineProperty(oldVal, "contenteditable", { value });
  },
  { immediate },
);
</script>
<style lang="sass" scoped>
.min-w-96
  min-width: 96px
</style>
