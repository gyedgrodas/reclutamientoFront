<template>
  <DataTableSsr>
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

    <template #item.usuario_dominio="{ item }">
      <span class="text-primary">{{ item.usuario_dominio }}</span>
    </template>
  </DataTableSsr>
</template>

<script setup>

</script>
