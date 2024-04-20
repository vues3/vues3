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
<script setup lang="ts">
import { useQuasar } from "quasar";
import type { ComputedRef } from "vue";
import { computed, ref, watch } from "vue";

import type { TPage } from "@/stores/data";
import { cancel, immediate, persistent } from "@/stores/defaults";

/**
 * @type {IProps}
 * @property {string} selected - Идентификатор выбранного элемента
 * @property {string} type- Тип данных
 * @property {string[]} expanded - Массив раскрытых узлов
 * @property {TPage[]} nodes - Дерево
 * @property {TPage[]} list - Массив, представляющий дерево
 */
interface IProps {
  selected?: string;
  type?: string;
  expanded?: string[];
  nodes?: TPage[];
  list: TPage[];
}

/**
 * Пропсы
 *
 * @type {IProps}
 */
const props: IProps = withDefaults(defineProps<IProps>(), {
  selected: "",
  type: "text",
  /**
   * @function expanded
   * @returns {string[]} - Пустой массив
   */
  expanded: (): string[] => [],
  nodes: undefined,
  /**
   * @function list
   * @returns {TPage[]} - Пустой массив
   */
  list: (): TPage[] => [],
});

/**
 * Объект текущей страницы
 *
 * @type {ComputedRef<TPage>}
 */
const the: ComputedRef<TPage | null | undefined> = computed(() =>
  props.list.length
    ? props.list.find(({ id }) => id === props.selected) ?? null
    : undefined,
);

/** Эмиттеры */
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
  if (the.value) {
    const { parent, children, index, siblings } = the.value;

    const id = crypto.randomUUID();

    switch (true) {
      case !!parent:
        siblings.splice(index + 1, 0, { id } as TPage);

        break;

      case !!children:
        children.unshift({ id } as TPage);

        break;

      default:
        siblings.splice(index + 1, 0, { id } as TPage);

        break;
    }

    emits(updateSelected, id);
  }
};

const title = "Подтверждение";

const message = "Вы действительно хотите удалить?";

/** Удаление текущей страницы */
const deletePage = () => {
  if (the.value) {
    const { parent, children, prev, next, siblings, index, url } = the.value;

    if (
      parent ||
      (url && !(siblings.length - 1)) ||
      (!(parent || children) && siblings.length - 1)
    )
      $q.dialog({ title, message, cancel, persistent }).onOk(() => {
        let id: string | undefined = crypto.randomUUID();

        switch (true) {
          case !!next:
            ({ id } = next);

            break;

          case !!prev:
            ({ id } = prev);

            break;

          default:
            ({ id } = parent ?? { id });
        }

        siblings.splice(index, 1);

        if (!siblings.length && !parent) siblings.push({ id } as TPage);

        emits(updateSelected, id);
      });
  }
};

/** Перемещение страницы вверх на одну позицию */
const upPage = () => {
  if (the.value) {
    const { index, siblings } = the.value;

    if (index)
      [siblings[index - 1], siblings[index]] = [
        siblings[index],
        siblings[index - 1],
      ];
  }
};

/** Перемещение страницы вниз на одну позицию */
const downPage = () => {
  if (the.value) {
    const { index, siblings } = the.value;

    if (index < siblings.length - 1)
      [siblings[index], siblings[index + 1]] = [
        siblings[index + 1],
        siblings[index],
      ];
  }
};

/** Перемещение страницы вправо на одну позицию */
const rightPage = () => {
  if (the.value) {
    const { index, siblings, prev } = the.value;

    if (prev) {
      const { children = [], id } = prev;

      prev.children = [...children, ...siblings.splice(index, 1)];

      tree.value.setExpanded(id, true);
    }
  }
};

/** Перемещение страницы влево на одну позицию */
const leftPage = () => {
  if (the.value) {
    const { index, parent } = the.value;
    if (parent) {
      const {
        index: parIndex,
        parent: parParent,
        siblings,
        children,
        id,
      } = parent;
      if (parParent) {
        tree.value.setExpanded(id, false);
        siblings.splice(parIndex + 1, 0, ...children.splice(index, 1));
      }
    }
  }
};
</script>
<style lang="sass" scoped>
.min-w-96
  min-width: 96px
</style>
