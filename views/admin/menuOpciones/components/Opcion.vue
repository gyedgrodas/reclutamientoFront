<template>
  <li
    :id="props.item.id"
    style="margin-bottom: 10px; list-style-type: none;"
  >
    <option-text :item="props.item"/>

    <ul v-if="props.item.children && props.item.children.length > 0">
      <opcion
        v-for="child in props.item.children"
        :key="child.id"
        :item="child"
        style="margin-left: 35px; margin-top: 10px;"
      />
    </ul>
  </li>
</template>

<script lang="ts" setup>
import OptionText from './OpcionTexto.vue';

interface Item {
  id: string | number;
  children?: Item[];
}

interface Props {
  item: Item;
}

const props = defineProps<Props>();
</script>

<style scoped>
li {
  margin-bottom: 10px;
  list-style-type: none;
}

ul {
  margin-left: 35px;
  margin-top: 10px;
}
</style>
