<template lang="pug">
q-page-sticky(position="bottom-right", :offset="[18, 18]")
  Transition(
    appear,
    enter-active-class="animated zoomIn",
    leave-active-class="animated zoomOut"
  )
    q-fab(
      v-if="visible",
      v-model="state",
      icon="add",
      direction="up",
      color="accent"
    )
      q-fab-action(color="primary", icon="note", @click="clickAdd")
      q-fab-action(color="primary", icon="delete", @click="clickRemove")
      q-fab-action(color="secondary", icon="chevron_left", @click="clickLeft")
      q-fab-action(
        color="secondary",
        icon="chevron_right",
        @click="clickRight"
      )
      q-fab-action(color="secondary", icon="expand_more", @click="clickDown")
      q-fab-action(color="secondary", icon="expand_less", @click="clickUp")
.scroll.col
  q-tree.q-ma-xs(
    ref="qtree",
    :nodes,
    :selected,
    no-selection-unset,
    node-key="id"
  )
    template(#default-header="prop")
      .row.no-wrap.full-width.items-center(
        v-intersection="onIntersection",
        :data-id="prop.node.id",
        @dblclick="prop.node.contenteditable = true",
        @keypress.stop
      )
        q-checkbox.q-mr-xs(v-model="prop.node.enabled", dense)
        q-input.full-width.min-w-96(
          v-model.trim="prop.node.name",
          :bg-color="prop.node.id === selected ? 'primary' : undefined",
          :error="error(prop.node)",
          :error-message="errorMessage(prop.node)",
          :readonly="!prop.node.contenteditable",
          dense,
          hide-bottom-space,
          outlined,
          @click.stop="selected = prop.node.id",
          @keyup.enter="prop.node.contenteditable = false"
        )
</template>
<script setup lang="ts">
import type { TPage } from "@vues3/shared";
import type { QTree } from "quasar";

import {
  add,
  atlas,
  down,
  left,
  nodes,
  pages,
  remove,
  right,
  up,
} from "@vues3/shared";
import { useQuasar } from "quasar";
import { deleted, selected } from "stores/app";
import { cancel, immediate, persistent } from "stores/defaults";
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
const $q = useQuasar(),
  errors = [
    (propNode: TPage) => !propNode.name,
    (propNode: TPage) =>
      !!pages.value.find(
        (element) =>
          propNode.path &&
          ((element.id !== propNode.id && element.path === propNode.path) ||
            element.loc === propNode.path),
      ),
    (propNode: TPage) =>
      ["?", "\\", "#"].some((value) => propNode.name?.includes(value)),
  ],
  message = t("Do you really want to delete?"),
  qtree = ref<QTree>(),
  state = ref(false),
  the = computed(() =>
    pages.value.length ? (atlas[selected.value ?? ""] ?? null) : undefined,
  ),
  title = t("Confirm"),
  value = false,
  visible = ref(false);
const clickAdd = () => {
    if (the.value?.id) {
      const id = add(the.value.id);
      if (id) {
        if (the.value.children.length)
          qtree.value?.setExpanded(the.value.id, true);
        selected.value = id;
      }
    }
    state.value = true;
  },
  clickDown = () => {
    if (the.value?.id) down(the.value.id);
    state.value = true;
  },
  clickLeft = () => {
    if (the.value?.id) {
      const id = left(the.value.id);
      if (id) qtree.value?.setExpanded(id, true);
    }
    state.value = true;
  },
  clickRemove = () => {
    if (the.value?.parent)
      $q.dialog({ cancel, message, persistent, title }).onOk(() => {
        if (the.value?.id) {
          deleted.value = the.value;
          const id = remove(the.value.id);
          if (id) selected.value = id;
        }
      });
    state.value = true;
  },
  clickRight = () => {
    if (the.value?.id) {
      const id = right(the.value.id);
      if (id) qtree.value?.setExpanded(id, true);
    }
    state.value = true;
  },
  clickUp = () => {
    if (the.value?.id) up(the.value.id);
    state.value = true;
  },
  error = (propNode: TPage) =>
    errors
      .map((errFnc) => errFnc(propNode))
      .reduceRight(
        (previousValue, currentValue) => previousValue || currentValue,
      ),
  errorMessage = (propNode: TPage) => {
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
  },
  onIntersection = (entry: IntersectionObserverEntry) => {
    if (
      entry.target instanceof HTMLElement &&
      entry.target.dataset.id === selected.value
    )
      visible.value = entry.isIntersecting;
  };
watch(
  the,
  (newVal, oldVal) => {
    visible.value = true;
    if (!newVal) {
      const [{ id } = {}] = pages.value;
      selected.value = id;
    }
    if (oldVal) Reflect.defineProperty(oldVal, "contenteditable", { value });
  },
  { immediate },
);
onMounted(() => {
  const [{ id } = {}] = nodes;
  if (id) qtree.value?.setExpanded(id, true);
});
</script>
<style scoped>
.min-w-96 {
  min-width: 96px;
}
</style>
