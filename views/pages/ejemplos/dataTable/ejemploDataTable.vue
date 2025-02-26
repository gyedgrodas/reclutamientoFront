<script lang="ts" setup>
import Documentacion from './documentacion.vue'

const columnas = [
  { title: 'ID', key: 'id', sortable: true, exportable: true },
  { title: 'Nombre', key: 'nombre', sortable: false },
  { title: 'usuario_dominio', key: 'usuario_dominio' },
  { title: 'Gerencia', key: 'gerencia_id' },
  { title: 'Acciones', key: 'Acciones', exportable: true },
]

const filtros = ref({
  nombre: '',
})
</script>

<template>
  <Documentacion />

  <DataTableComponent
    :botones="['csv', 'xlsx', 'pdf', 'reiniciar']"
    :cantidad-por-pagina="3"
    :cantidad-por-pagina-opciones="[2, 3, 5]"
    :columnas="columnas"
    endpoint="/api/users"
    titulo="Ejemplo de DataTable"
    :filtros="filtros"
    :relaciones="['usuariosigua.gerencia']"
  >
    <template #item.gerencia_id="{ item }">
      <!-- Ejemplo de como usar datos de relaciones -->

      {{ item.usuariosigua?.gerencia?.nombre }}
    </template>

    <template #item.Acciones="{ item }">
      <VBtn
        color="primary"
        icon
        variant="text"
      >
        <VIcon icon="tabler-eye" />
      </VBtn>

      <VBtn
        color="primary"
        icon
        variant="text"
      >
        <VIcon icon="tabler-edit" />
      </VBtn>

      <VBtn
        color="error"
        icon
        variant="text"
      >
        <VIcon icon="tabler-trash" />
      </VBtn>
    </template>
  </DataTableComponent>
</template>

<style lang="scss" scoped>

</style>
