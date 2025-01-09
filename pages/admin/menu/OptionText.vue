<script setup lang="ts">
import Actions from './Actions.vue';
import {computed} from 'vue';

interface Item {
  id: string;
  titulo?: string | null;
  icon?: string | null;
  heading?: string | null;
  children?: Item[];
}

const props = defineProps<{ item: Item }>();

const esTituloSeccion = computed(() => props.item.heading !== null);

const iconClass = computed(() => {
  if (!props.item.icon)
    return 'tabler-circle';
  return props.item.icon || '';
});

</script>

<template>
  <div>
    <template v-if="esTituloSeccion">
      <div style="display: flex">
        <span v-text="props.item.heading"
              class="heading">
        </span>
        <Actions :id="props.item.id"
                 :esTituloSeccion="true"
        />
      </div>

    </template>

    <template v-else>
      <div class="item-container">
        <i
          v-if="!esTituloSeccion"
          :class="iconClass"
          class="item-icon">
        </i>
        <span v-text="props.item.titulo"></span>
        <Actions :id="props.item.id"/>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.heading {
  font-weight: bold;
  font-size: 1.2em;
  margin-bottom: 8px;
  margin-right: 8px;
}

.item-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-icon {
  width: 25px;
  height: 25px;
}
</style>
