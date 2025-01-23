<template>

  <DataTableSsr
    :cantidadPorPagina="7"
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
