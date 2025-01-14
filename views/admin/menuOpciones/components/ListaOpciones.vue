<template>
  <ul style="list-style-type: none; ">
    <opcion
      v-for="item in props.opciones"
      :key="item.id"
      :item="item"
    />
  </ul>
</template>

<script lang="ts" setup>
import Opcion from './Opcion.vue';

interface Props {
  opciones: []
}

const props = defineProps<Props>();

</script>

<style scoped>
/* Agrega tus estilos personalizados si es necesario */
</style>
