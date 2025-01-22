<script lang="ts" setup>
import {ref} from 'vue';

// Datos y configuración de la tabla
const items = ref([
  {
    id: 1,
    usuario_dominio: 'usuario_dominio_1',
  },
  {
    id: 2,
    usuario_dominio: 'usuario_dominio_2',
  },
]);

const currentPage = ref(1);
const itemsPerPage = ref(2);
const totalItems = ref(items.value.length);
const loading = ref(false);
const search = ref('');

const headers = [
  {
    title: 'ID',
    value: 'id',
  },
  {
    title: 'Usuario Dominio',
    value: 'usuario_dominio',
  },
  {
    title: 'Acciones',
    value: 'Acciones',
  },
];

</script>

<template>
  <VDataTableServer
      v-model:items-per-page="itemsPerPage"
      v-model:page="currentPage"
      :headers="headers"
      :items="items"
      :items-length="totalItems"
      :items-per-page-options="[2, 5, 10, 50, -1]"
      :loading="loading"
      :search="search"
      item-value="id"
  >

    <template
        v-for="(slot, name) in $slots"
        :key="name"
        v-slot:[name]="slotProps"
    >
      <slot :name="name" v-bind="slotProps"></slot>
    </template>

  </VDataTableServer>
</template>

<style lang="scss" scoped>
/* Estilos personalizados */
</style>
