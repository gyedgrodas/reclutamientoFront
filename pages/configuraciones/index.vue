<script setup lang="ts">
import { ref } from 'vue'
import { can } from '@layouts/plugins/casl'

definePageMeta({
  middleware: 'permissions',
  action: 'listar configuraciones', // Acción requerida
  subject: 'configuraciones', // Sujeto requerido (esto puede ser el nombre de un recurso o algo más específico)
})

const { deleted } = useClienteRequest()

const { showToastSuccess, showToastError, preguntaEliminar } = useToast()

const columnas = [
  { title: 'Nombre', key: 'nombre' },
  { title: 'Valor', key: 'valor' },
  { title: 'Descripción', key: 'descripcion' },
  { title: 'Acciones', key: 'Acciones' },
]

const dataTable = ref(null)

const filtros = ref({
  nombre: '',
})

const deleteItem = async (id: number) => {
  const confirm = await preguntaEliminar('¿Desea Eliminar Configuracion?')

  if (!confirm)
    return

  try {
    const respuesta = await deleted(`/api/configuracions/${id}`)

    showToastSuccess(respuesta.message)

    dataTable.value?.getItems()
  }
  catch (error) {
    showToastError(error.message)
  }
}
</script>

<template>
  <div class="d-flex flex-wrap justify-end justify-sm-space-between gap-y-4 gap-x-6 mb-6">
    <VBtn
      v-if="can('crear configuraciones', 'configuraciones')"
      class="ml-auto"
      color="primary"
      to="/configuraciones/create"
    >
      Nueva Configuracion
    </VBtn>
  </div>

  <VCardText>
    <DataTableComponent
      ref="dataTable"
      :botones="['csv', 'xlsx', 'pdf', 'reiniciar']"
      :cantidad-por-pagina="3"
      :cantidad-por-pagina-opciones="[2, 3, 5]"
      :columnas="columnas"
      endpoint="/api/configuracions"
      titulo="Configuraciones"
      :filtros="filtros"
    >
      <template #item.Acciones="{ item }">
        <VBtn
          v-if="can('ver configuraciones', 'configuraciones')"
          icon
          variant="text"
          color="primary"
          :to="`/configuraciones/show/${item.id}` "
        >
          <VIcon icon="tabler-eye" />
        </VBtn>
        <VBtn
          v-if="can('editar configuraciones', 'configuraciones')"
          icon
          variant="text"
          color="primary"
          :to="`/configuraciones/edit/${item.id}` "
        >
          <VIcon icon="tabler-edit" />
        </VBtn>
        <VBtn
          v-if="can('eliminar configuraciones', 'configuraciones')"
          icon
          color="error"
          variant="text"
          @click="deleteItem(item.id)"
        >
          <VIcon icon="tabler-trash" />
        </VBtn>
      </template>
    </DataTableComponent>
  </VCardText>
</template>

<style scoped lang="scss">

</style>
