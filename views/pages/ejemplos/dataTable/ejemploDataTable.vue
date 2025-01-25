<script lang="ts" setup>

import Documentacion from './documentacion.vue'

const columnas = [
  {title: 'ID', key: 'id', sortable: true, exportable: true},
  {title: 'titulo', key: 'titulo', sortable: false,},
  {title: 'titulo Seccion', key: 'titulo_seccion', exportable: false},
  {title: 'Acciones', key: 'Acciones'},
];
</script>

<template>

  <Documentacion/>

  <DataTableComponent
    :botones="['csv', 'xlsx', 'pdf', 'reiniciar']"
    :cantidadPorPagina="3"
    :cantidadPorPaginaOpciones="[2,3,5]"
    :columnas="columnas"
    endpoint="/api/menu_opciones"
    nombreArchivoExport="jaja"
    titulo="Ejemplo de DataTable"
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
