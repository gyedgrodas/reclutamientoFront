<template>
  <DataTableSsr
    :headers="[
      { title: 'ID', value: 'id' },
      { title: 'titulo', value: 'titulo' },
      { title: 'titulo Seccion', value: 'titulo_seccion' },
      { title: 'Acciones', value: 'Acciones' }
    ]"

    endpoint="/api/menu_opciones"

  >

    <template #item.Acciones="{ item }">
      <VBtn
        :to="`/usuarios/show/${item.id}`"
        color="primary"
        icon
        variant="text"
      >
        <VIcon icon="tabler-eye"/>
      </VBtn>
      <VBtn
        :to="`/usuarios/edit/${item.id}`"
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

  </DataTableSsr>
</template>

<script setup>

</script>
