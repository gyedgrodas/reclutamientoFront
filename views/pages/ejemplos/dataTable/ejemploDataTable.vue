<script lang="ts" setup>

import Documentacion from './documentacion.vue'

const columnas = [
  {title: 'ID', key: 'id', sortable: true, exportable: true},
  {title: 'Nombre', key: 'nombre', sortable: false,},
  {title: 'usuario_dominio', key: 'usuario_dominio'},
  {title: 'Acciones', key: 'Acciones', exportable: true},
];
const filtros = ref({
  nombre: ''
});
</script>

<template>

  <Documentacion/>

  <DataTableComponent
    :botones="['csv', 'xlsx', 'pdf', 'reiniciar']"
    :cantidadPorPagina="3"
    :cantidadPorPaginaOpciones="[2,3,5]"
    :columnas="columnas"
    endpoint="/api/users"
    titulo="Ejemplo de DataTable"
    :filtros="filtros"
    :relaciones="['gerencia', 'puesto']"
  >

    <template #item.Acciones="{ item }">

      <VBtn
        color="primary"
        icon
        variant="text"
      >
        <VIcon icon="tabler-eye"/>
      </VBtn>

      <VBtn
        color="primary"
        icon
        variant="text"
      >
        <VIcon icon="tabler-edit"/>
      </VBtn>

      <VBtn
        color="error"
        icon
        variant="text"
      >
        <VIcon icon="tabler-trash"/>
      </VBtn>


    </template>

  </DataTableComponent>


</template>

<style lang="scss" scoped>

</style>
