<template lang="pug">
q-btn-group.q-mx-xs(spread, flat)
  q-btn(icon="note", @click="newView")
  q-btn(icon="delete", @click="deleteView")
  q-btn(v-if="nodes", icon="chevron_left", @click="leftView")
  q-btn(v-if="nodes", icon="chevron_right", @click="rightView")
  q-btn(icon="expand_more", @click="downView")
  q-btn(icon="expand_less", @click="upView")
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
import type { TView } from "stores/data";
import { cancel, immediate, persistent } from "stores/defaults";
import type { ComputedRef, Ref } from "vue";
import { computed, nextTick, ref, watch } from "vue";
/**
 * @type {IProps}
 * @property {string} selected - Идентификатор выбранного элемента
 * @property {string} type- Тип данных
 * @property {string[]} expanded - Массив раскрытых узлов
 * @property {TView[]} nodes - Дерево
 * @property {TView[]} list - Массив, представляющий дерево
 */
interface IProps {
  selected?: string;
  type?: string;
  expanded?: string[];
  nodes?: TView[];
  list: TView[];
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
   * @returns {TView[]} - Пустой массив
   */
  list: (): TView[] => [],
});
/**
 * Объект текущей страницы
 *
 * @type {ComputedRef<TView | null | undefined>}
 */
const the: ComputedRef<TView | null | undefined> = computed(() =>
  props.list.length
    ? props.list.find(({ id }) => id === props.selected) ?? null
    : undefined,
);
/**
 * Эмиттеры
 *
 * @type {IEmits}
 */
const emits: IEmits = defineEmits<IEmits>();
/**
 * Обновление массива открытых нод
 *
 * @function updateExpanded
 * @param {string[]} value - Массив открытых нод
 */
const updateExpanded = (value: string[]) => {
  emits("update:expanded", value);
};
/**
 * Обновление идентификатора выбранной ноды
 *
 * @function updateExpanded
 * @param {string | undefined} value - Идентификатор выбранной ноды
 */
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
/**
 * Заголовок диалога
 *
 * @type {string}
 */
const title: string = "Подтверждение";
/**
 * Сообщение диалога
 *
 * @type {string}
 */
const message: string = "Вы действительно хотите удалить?";
/**
 * Удаление текущей страницы
 *
 * @function deleteView
 */
const deleteView = () => {
  if (the.value) {
    const { parent, prev, next, siblings, index } = the.value;
    $q.dialog({ title, message, cancel, persistent }).onOk(async () => {
      /**
       * Идентификатор страницы, выбираемой после удаления
       *
       * @type {string}
       */
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
      if (!id) {
        await nextTick();
        [{ id }] = props.list;
      }
      updateSelected(id);
    });
  }
};
/**
 * Перемещение страницы вверх на одну позицию
 *
 * @function upView
 */
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
/**
 * Перемещение страницы вниз на одну позицию
 *
 * @function downView
 */
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
/**
 * Перемещение страницы вправо на одну позицию
 *
 * @function rightView
 */
const rightView = () => {
  if (the.value) {
    const { index, siblings, prev } = the.value;
    if (prev) {
      const { children = [], id } = prev;
      prev.children = [...children, ...siblings.splice(index, 1)];
      tree.value?.setExpanded(id, true);
    }
  }
};
/**
 * Перемещение страницы влево на одну позицию
 *
 * @function leftView
 */
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
        tree.value?.setExpanded(id, false);
        siblings.splice(grandindex + 1, 0, ...children.splice(index, 1));
      }
    }
  }
};
/**
 * Значение для свойства contenteditable
 *
 * @type {boolean}
 */
const value: boolean = false;
/**
 * Добавление новой страницы
 *
 * @function newView
 */
const newView = () => {
  if (the.value) {
    const { parent, children, index, siblings } = the.value;
    /**
     * Идентификатор нового нода
     *
     * @type {string}
     */
    const id: string = crypto.randomUUID();
    switch (true) {
      case !!parent:
        siblings.splice(index + 1, 0, { id } as TView);
        break;
      case !!children:
        children.unshift({ id } as TView);
        tree.value?.setExpanded(the.value.id, true);
        break;
      default:
        siblings.splice(index + 1, 0, { id } as TView);
        break;
    }
    updateSelected(id);
  }
};
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
