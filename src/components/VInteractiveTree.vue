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
    :selected,
    :expanded,
    :nodes="nodes ?? list",
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
import type { QTree, QVueGlobals } from "quasar";
import { useQuasar } from "quasar";
import type { ComputedRef, Ref } from "vue";
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
 * @type {IEmits}
 * @see {@link https://github.com/vuejs/language-tools/issues/3169}
 * @see {@link https://vuejs.org/api/sfc-script-setup.html#type-only-props-emit-declarations}
 * @todo Переписать в нормальный вид, после обновления vue-tsc. Пока quasar не
 *   работает со второй версией vue-tsc
 */
interface IEmits {
  (e: "update:expanded", value: string[]): void;
  (e: "update:selected", value: string | undefined): void;
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
   * Пустой массив по умолчанию
   *
   * @function expanded
   * @returns {string[]} - Пустой массив
   */
  expanded: (): string[] => [],
  nodes: undefined,
  /**
   * Пустой массив по умолчанию
   *
   * @function list
   * @returns {TPage[]} - Пустой массив
   */
  list: (): TPage[] => [],
});

/**
 * Объект текущей страницы
 *
 * @type {ComputedRef<TPage | undefined>}
 */
const the: ComputedRef<TPage | undefined> = computed(() =>
  props.list.length
    ? props.list.find(({ id }) => id === props.selected)
    : undefined,
);

/**
 * Эмиттеры
 *
 * @type {IEmits}
 */
const emits: IEmits = defineEmits<IEmits>();

/** @param value */
const updateExpanded = (value: string[]) => {
  emits("update:expanded", value);
};

/** @param value */
const updateSelected = (value: string | undefined) => {
  emits("update:selected", value);
};

/**
 * Объект quasar
 *
 * @type {QVueGlobals}
 */
const $q: QVueGlobals = useQuasar();

/**
 * Экземпляр дерева
 *
 * @type {Ref<QTree | undefined>}
 */
const tree: Ref<QTree | undefined> = ref();

const value = false;

watch(
  the,
  (newVal, oldVal) => {
    if (!newVal && props.list.length) updateSelected(props.list[0].id);
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

    updateSelected(id);
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

        updateSelected(id);
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

      tree.value?.setExpanded(id, true);
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
        tree.value?.setExpanded(id, false);
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
