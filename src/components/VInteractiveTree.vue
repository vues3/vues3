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
/**
 * Selected - Идентификатор выбранного элемента type- Тип данных expanded -
 * Массив раскрытых узлов tree - Дерево list - Массив, представляющий дерево
 */
interface IProps {
  selected?: string;
  type?: QInputProps["type"];
  expanded?: string[];
  tree?: TView[];
  list: TView[] | TResource[];
}
/**
 * @see {@link https://github.com/vuejs/language-tools/issues/3169}
 * @see {@link https://vuejs.org/api/sfc-script-setup.html#type-only-props-emit-declarations}
 * @todo Переписать в нормальный вид, после обновления vue-tsc. Пока quasar не
 *   работает со второй версией vue-tsc
 */
interface IEmits {
  (e: "update:expanded", value: readonly string[]): void;
  (e: "update:selected", value: string | undefined): void;
}
/** Пропсы */
const props: IProps = withDefaults(defineProps<IProps>(), {
  selected: "",
  type: "text",
  /**
   * Пустой массив по умолчанию
   *
   * @returns - Пустой массив
   */
  expanded: (): string[] => [],
  tree: undefined,
  /**
   * Пустой массив по умолчанию
   *
   * @returns - Пустой массив
   */
  list: (): TView[] => [],
});
/** Ноды для дерева */
const nodes: ComputedRef<QTreeNode[]> = computed(
  () => <QTreeNode[]>(props.tree ?? props.list),
);
/** Объект текущей страницы */
const the: ComputedRef<TView | TResource | null | undefined> = computed(() =>
  props.list.length
    ? props.list.find(({ id }) => id === props.selected) ?? null
    : undefined,
);
/** Эмиттеры */
const emits: IEmits = defineEmits<IEmits>();
/**
 * Обновление массива открытых нод
 *
 * @param value - Массив открытых нод
 */
const updateExpanded = (value: readonly string[]) => {
  emits("update:expanded", value);
};
/**
 * Обновление идентификатора выбранной ноды
 *
 * @param value - Идентификатор выбранной ноды
 */
const updateSelected = (value: string | undefined) => {
  emits("update:selected", value);
};
/** Объект quasar */
const $q: QVueGlobals = useQuasar();
/** Экземпляр дерева */
const qtree: Ref<QTree | undefined> = ref();
/** Заголовок диалога */
const title: string = "Подтверждение";
/** Сообщение диалога */
const message: string = "Вы действительно хотите удалить?";
/** Удаление текущей страницы */
const deleteView = () => {
  if (the.value) {
    const { parent, prev, next, siblings, index } = the.value;
    $q.dialog({ title, message, cancel, persistent }).onOk(() => {
      /** Идентификатор страницы, выбираемой после удаления */
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
/** Перемещение страницы вверх на одну позицию */
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
/** Перемещение страницы вниз на одну позицию */
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
/** Перемещение страницы вправо на одну позицию */
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
/** Перемещение страницы влево на одну позицию */
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
/** Значение для свойства contenteditable */
const value: boolean = false;
/** Добавление новой страницы */
const newView = () => {
  if (the.value) {
    const { parent, children, index, siblings } = the.value;
    /** Идентификатор нового нода */
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
