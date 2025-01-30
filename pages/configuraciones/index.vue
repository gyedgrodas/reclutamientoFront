<script setup lang="ts">
import { ref } from 'vue'
import { can } from '@layouts/plugins/casl'

definePageMeta({
  middleware: 'permissions',
  action: 'listar configuraciones', // Acción requerida
  subject: 'configuraciones', // Sujeto requerido (esto puede ser el nombre de un recurso o algo más específico)
})

const { get, deleted } = useClienteRequest()

const { showToastSuccess, showToastError, preguntaEliminar } = useToast()

const currentPage = ref(1) // Página actual
const itemsPerPage = ref(2) // Elementos por página
const totalItems = ref(0) // Total de elementos en el backend
const loading = ref(false) // Indicador de carga
const search = ref('') // Búsqueda de usuarios

const headers = [
  {
    title: 'Nombre',
    value: 'nombre',
  },
  {
    title: 'Valor',
    value: 'valor',
  },
  {
    title: 'Descripción',
    value: 'descripcion',
  },
  {
    title: 'Acciones',
    value: 'Acciones',
  },
]

const items = ref([])

const getItems = async (): Promise<object> => {
  try {
    loading.value = true

    const respuesta: { data: [] } = await get('/api/configuracions')

    items.value = respuesta.data
  }
  catch (error: { message: string }) {
    console.error(error.message)
  }

  loading.value = false
}

getItems()

const deleteItem = async (id: number) => {
  const confirm = await preguntaEliminar('¿Desea Eliminar Configuracion?')

  if (!confirm)
    return

  try {
    const respuesta = await deleted(`/api/configuracions/${id}`)

    showToastSuccess(respuesta.message)

    await getItems()
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
      color="success"
      to="/configuraciones/create"
    >
      Nueva Configuracion
    </VBtn>
  </div>

  <VCard>
    <VCardTitle> Configuracion </VCardTitle>

    <VCardText>
      <VDataTableServer
        v-model:items-per-page="itemsPerPage"
        v-model:page="currentPage"
        :items="items"
        :headers="headers"
        :search="search"
        item-value="id"
        :items-length="totalItems"
        :items-per-page-options="[2, 5, 10, 50, -1]"
        :loading="loading"
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
      </VDataTableServer>
    </VCardText>
  </VCard>
</template>

<style scoped lang="scss">

</style>
