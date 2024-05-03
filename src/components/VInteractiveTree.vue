<template lang="pug">
q-btn-group.q-mx-xs(spread, flat)
  q-btn(icon="note", @click="newView")
  q-btn(icon="delete", @click="deleteView")
  q-btn(v-if="tree", icon="chevron_left", @click="leftView")
  q-btn(v-if="tree", icon="chevron_right", @click="rightView")
  q-btn(icon="expand_more", @click="downView")
  q-btn(icon="expand_less", @click="upView")
.scroll.col
  q-tree.q-ma-xs(
    ref="qtree",
    :selected,
    :expanded,
    :nodes,
    node-key="id",
    no-selection-unset,
    accordion,
    @update:selected="updateSelected($event)",
    @update:expanded="updateExpanded($event)"
  )
    template(#default-header="prop")
      .row.no-wrap.full-width.items-center(
        @dblclick="prop.node.contenteditable = true"
      )
        q-checkbox.q-mr-xs(v-model="prop.node.enabled", dense)
        q-input.full-width.min-w-96(
          v-model.trim="prop.node[type === 'text' ? 'label' : type]",
          dense,
          :readonly="!prop.node.contenteditable",
          :type,
          outlined,
          :bg-color="prop.node.id === selected ? 'primary' : undefined",
          @click.stop="updateSelected(prop.node.id)",
          @keyup.enter="prop.node.contenteditable = false"
        )
</template>
<script setup lang="ts">
import type { QInputProps, QTree, QTreeNode, QVueGlobals } from "quasar";
import { uid, useQuasar } from "quasar";
import type { TResource, TView } from "stores/data";
import { cancel, immediate, persistent } from "stores/defaults";
import type { ComputedRef, Ref } from "vue";
import { computed, nextTick, onMounted, ref, watch } from "vue";

interface IProps {
  selected?: string;
  type?: QInputProps["type"];
  expanded?: string[];
  tree?: TView[];
  list: TView[] | TResource[];
}
interface IEmits {
  (e: "update:expanded", value: readonly string[]): void;
  (e: "update:selected", value: string | undefined): void;
}
const props: IProps = withDefaults(defineProps<IProps>(), {
  selected: "",
  type: "text",
  expanded: (): string[] => [],
  tree: undefined,
  list: (): TView[] => [],
});
const nodes: ComputedRef<QTreeNode[]> = computed(
  () => <QTreeNode[]>(props.tree ?? props.list),
);
const the: ComputedRef<TView | TResource | null | undefined> = computed(() =>
  props.list.length
    ? props.list.find(({ id }) => id === props.selected) ?? null
    : undefined,
);
const emits: IEmits = defineEmits<IEmits>();
const updateExpanded = (value: readonly string[]) => {
  emits("update:expanded", value);
};
const updateSelected = (value: string | undefined) => {
  emits("update:selected", value);
};
const $q: QVueGlobals = useQuasar();
const qtree: Ref<QTree | undefined> = ref();
const title: string = "Подтверждение";
const message: string = "Вы действительно хотите удалить?";
const deleteView = () => {
  if (the.value) {
    const { parent, prev, next, siblings, index } = the.value;
    $q.dialog({ title, message, cancel, persistent }).onOk(() => {
      let id: string | undefined;
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
    const { index, siblings, prev } = the.value;
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
        index: grandindex,
        parent: grandparent,
        siblings,
        children,
        id,
      } = parent;
      if (grandparent) {
        qtree.value?.setExpanded(id, false);
        siblings.splice(grandindex + 1, 0, ...children.splice(index, 1));
      }
    }
  }
};
const value: boolean = false;
const newView = () => {
  if (the.value) {
    const { parent, children, index, siblings } = the.value;
    const id: string = uid();
    switch (true) {
      case !!parent:
        siblings.splice(index + 1, 0, <TView>{ id });
        break;
      case !!children:
        children.unshift(<TView>{ id });
        qtree.value?.setExpanded(the.value.id, true);
        break;
      default:
        siblings.splice(index + 1, 0, <TView>{ id });
        break;
    }
    updateSelected(id);
  }
};
onMounted(() => {
  if (props.tree?.length) qtree.value?.setExpanded(props.tree[0].id, true);
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
