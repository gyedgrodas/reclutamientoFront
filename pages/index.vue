<template>

  <DataTableSsr
    :cantidadPorPagina="10"
    :cantidadPorPaginaOpciones="[10,10,10]"
    :headers="headers"
    endpoint="/api/menu_opciones"
  >

  </DataTableSsr>

</template>

<script setup>

const headers = [
  {title: 'ID', value: 'id'},
  {title: 'titulo', value: 'titulo'},
  {title: 'titulo Seccion', value: 'titulo_seccion'},
  {title: 'Acciones', value: 'Acciones'}
];

</script>
