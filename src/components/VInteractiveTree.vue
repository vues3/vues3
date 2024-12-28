<template lang="pug">
q-btn-group.q-mx-xs(flat, spread)
  q-btn(@click="clickAdd", icon="note")
  q-btn(@click="clickRemove", icon="delete")
  q-btn(@click="clickLeft", icon="chevron_left")
  q-btn(@click="clickRight", icon="chevron_right")
  q-btn(@click="clickDown", icon="expand_more")
  q-btn(@click="clickUp", icon="expand_less")
.scroll.col
  q-tree.q-ma-xs(
    :nodes,
    :selected,
    accordion,
    no-selection-unset,
    node-key="id",
    ref="qtree"
  )
    template(#default-header="prop")
      .row.no-wrap.full-width.items-center(
        @dblclick="prop.node.contenteditable = true",
        @keypress.stop
      )
        q-checkbox.q-mr-xs(dense, v-model="prop.node.enabled")
        q-input.full-width.min-w-96(
          :bg-color="prop.node.id === selected ? 'primary' : undefined",
          :error="error(prop.node)",
          :error-message="errorMessage(prop.node)",
          :readonly="!prop.node.contenteditable",
          @click.stop="selected = prop.node.id",
          @keyup.enter="prop.node.contenteditable = false",
          dense,
          hide-bottom-space,
          outlined,
          v-model.trim="prop.node.name"
        )
</template>
<script setup lang="ts">
import type { TPage } from "@vues3/shared";
import type { QTree, QTreeNode } from "quasar";
import type { Ref } from "vue";

import { add, data, down, left, pages, remove, right, up } from "@vues3/shared";
import { useQuasar } from "quasar";
import { deleted, selected } from "stores/app";
import { cancel, immediate, persistent } from "stores/defaults";
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const errors = [
  (propNode: TPage) => !propNode.name,
  (propNode: TPage) =>
    !!pages.value.find(
      (element) =>
        element.id !== propNode.id &&
        propNode.path &&
        (("path" in element && element.path === propNode.path) ||
          ("loc" in element && element.loc === propNode.path)),
    ),
  (propNode: TPage) =>
    ["?", "\\", "#"].some((value) => propNode.name?.includes(value)),
];
const error = (propNode: TPage) =>
  errors
    .map((value) => value(propNode))
    .reduceRight(
      (previousValue, currentValue) => previousValue || currentValue,
    );
const errorMessage = (propNode: TPage) => {
  switch (true) {
    case errors[0]?.(propNode):
      return t("The name is empty");
    case errors[1]?.(propNode):
      return t("That name is already in use");
    case errors[2]?.(propNode):
      return t("Prohibited characters are used");
    default:
      return undefined;
  }
};
const nodes = data as QTreeNode[];
const the = computed(() =>
  pages.value.length
    ? (pages.value.find(({ id }) => id === selected.value) ?? null)
    : undefined,
);
const $q = useQuasar();
const qtree: Ref<QTree | undefined> = ref();
const title = t("Confirm");
const message = t("Do you really want to delete?");
const clickUp = () => {
  if (the.value?.id) up(the.value.id);
};
const clickDown = () => {
  if (the.value?.id) down(the.value.id);
};
const clickLeft = () => {
  if (the.value?.id) {
    const id = left(the.value.id);
    if (id) qtree.value?.setExpanded(id, true);
  }
};
const clickRight = () => {
  if (the.value?.id) {
    const id = right(the.value.id);
    if (id) qtree.value?.setExpanded(id, true);
  }
};
const clickAdd = () => {
  if (the.value?.id) {
    const id = add(the.value.id);
    if (id) {
      if (the.value.children.length)
        qtree.value?.setExpanded(the.value.id, true);
      selected.value = id;
    }
  }
};
const clickRemove = () => {
  if (the.value?.parent)
    $q.dialog({ cancel, message, persistent, title }).onOk(() => {
      if (the.value?.id) {
        deleted.value = the.value;
        const id = remove(the.value.id);
        if (id) selected.value = id;
      }
    });
};
const value = false;
onMounted(() => {
  const [{ id } = {}] = data;
  if (id) qtree.value?.setExpanded(id, true);
});
watch(
  the,
  (newVal, oldVal) => {
    if (!newVal) {
      const [{ id } = {}] = pages.value;
      selected.value = id;
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
