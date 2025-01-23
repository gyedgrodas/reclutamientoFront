<template>

  <DataTableSsr
    :cantidadPorPagina="1"
    :cantidadPorPaginaOpciones="[1,2,3]"
    :headers="[
      { title: 'ID', value: 'id' },
      { title: 'titulo', value: 'titulo' },
      { title: 'titulo Seccion', value: 'titulo_seccion' },
      { title: 'Acciones', value: 'Acciones' }
    ]"
    endpoint="/api/menu_opciones"
  >

  </DataTableSsr>

</template>

<script setup>

</script>
