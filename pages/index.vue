<template>
  <DataTableSsr
    :headers="[
      { text: 'ID', value: 'id' },
      { text: 'Nombre', value: 'nombre' },
      { text: 'Email', value: 'email' },
      { text: 'Acciones', value: 'Acciones' }
    ]"

    endpoint="/api/users"

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
