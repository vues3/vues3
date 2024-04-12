<template lang="pug">
q-btn-group.q-mx-xs(spread, flat)
  q-btn(icon="note", @click="newPage")
  q-btn(icon="delete", @click="deletePage")
  q-btn(v-if="nodes", icon="chevron_left", @click="leftPage")
  q-btn(v-if="nodes", icon="chevron_right", @click="rightPage")
  q-btn(icon="expand_more", @click="downPage")
  q-btn(icon="expand_less", @click="upPage")
.scroll.col
  q-tree.q-ma-xs(
    ref="tree",
    :selected="selected",
    :expanded="expanded",
    :nodes="nodes ?? list",
    node-key="id",
    no-selection-unset,
    accordion,
    @update:selected="$emit('update:selected', $event)",
    @update:expanded="$emit('update:expanded', $event)"
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
          :type="type",
          outlined,
          :bg-color="prop.node.id === selected ? 'primary' : undefined",
          @click.stop="$emit('update:selected', prop.node.id)",
          @keyup.enter="prop.node.contenteditable = false"
        )
</template>
<script setup>
import { get } from "@vueuse/core";
import { uid, useQuasar } from "quasar";
import { computed, ref, watch } from "vue";

const props = defineProps({
  selected: { default: "", type: String },
  type: { default: "text", type: String },
  expanded: {
    /** @returns {Array} - Пустой массив */
    default: () => [],
    type: Array,
  },
  nodes: { default: undefined, type: Array },
  list: {
    /** @returns {Array} - Пустой массив */
    default: () => [],
    type: Array,
  },
});
const immediate = true;
const the = computed(() =>
  props.list.length
    ? props.list.find(({ id }) => id === props.selected) ?? null
    : undefined,
);
const emits = defineEmits(["update:expanded", "update:selected"]);
const $q = useQuasar();
const tree = ref();
const updateSelected = "update:selected";
const value = false;
watch(
  the,
  (newVal, oldVal) => {
    if (!newVal && props.list.length) emits(updateSelected, props.list[0].id);
    if (oldVal) Reflect.defineProperty(oldVal, "contenteditable", { value });
  },
  { immediate },
);
/** Добавление новой страницы */
const newPage = () => {
  const { parent, children, index, siblings } = get(the);
  const id = uid();
  const enabled = true;
  const page = { id, enabled };
  switch (true) {
    case !!parent:
      siblings.splice(index + 1, 0, page);
      break;
    case !!children:
      children.unshift(page);
      break;
    default:
      siblings.splice(index + 1, 0, page);
      break;
  }
  emits(updateSelected, id);
};
/** Удаление текущей страницы */
const deletePage = () => {
  const { parent, children, prev, next, siblings, index, url } = get(the);
  if (
    parent ||
    (url && !(siblings.length - 1)) ||
    (!(parent || children) && siblings.length - 1)
  )
    $q.dialog({
      title: "Подтверждение",
      message: "Вы действительно хотите удалить?",
      cancel: true,
      persistent: true,
    }).onOk(() => {
      let id;
      switch (true) {
        case !!next:
          ({ id } = next);
          break;
        case !!prev:
          ({ id } = prev);
          break;
        default:
          ({ id = uid() } = parent ?? {});
      }
      siblings.splice(index, 1);
      if (!siblings.length && !parent) siblings.push({ id, enabled: true });
      emits(updateSelected, id);
    });
};
/** Перемещение страницы вверх на одну позицию */
const upPage = () => {
  const { index, siblings } = get(the);
  if (index)
    [siblings[index - 1], siblings[index]] = [
      siblings[index],
      siblings[index - 1],
    ];
};
/** Перемещение страницы вниз на одну позицию */
const downPage = () => {
  const { index, siblings } = get(the);
  if (index < siblings.length - 1)
    [siblings[index], siblings[index + 1]] = [
      siblings[index + 1],
      siblings[index],
    ];
};
/** Перемещение страницы вправо на одну позицию */
const rightPage = () => {
  const { index, siblings, prev } = get(the);
  if (prev) {
    const { children = [], id } = prev;
    prev.children = [...children, ...siblings.splice(index, 1)];
    get(tree).setExpanded(id, true);
  }
};
/** Перемещение страницы влево на одну позицию */
const leftPage = () => {
  const {
    index,
    parent: { index: parIndex, parent, siblings, children, id } = {},
  } = get(the);
  if (parent) {
    get(tree).setExpanded(id, false);
    siblings.splice(parIndex + 1, 0, ...children.splice(index, 1));
  }
};
</script>
<style lang="sass" scoped>
.min-w-96
  min-width: 96px
</style>
