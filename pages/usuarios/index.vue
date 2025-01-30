<script setup lang="ts">
import { ref } from 'vue'
import { can } from '@layouts/plugins/casl'

definePageMeta({
  middleware: 'permissions',
  action: 'listar usuarios', // Acción requerida
  subject: 'usuarios', // Sujeto requerido (esto puede ser el nombre de un recurso o algo más específico)
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
    title: '',
    value: 'id',
  },
  {
    title: 'Usuario Dominio',
    value: 'usuario_dominio',
  },
  {
    title: 'Cif',
    value: 'cif',
  },
  {
    title: 'Asociado Id',
    value: 'asociado_id',
  },
  {
    title: 'Email',
    value: 'email',
  },

  {
    title: 'Nombre',
    value: 'nombre',
  },
  {
    title: 'Apellido',
    value: 'apellido',
  },
  {
    title: 'fecha de creacion',
    value: 'created_at',
  },
  {
    title: 'Acciones',
    value: 'Acciones',
  },
]

const items = ref([])


const getItems = async function (): Promise<void> {
  try {
    loading.value = true

    const respuesta = await get('/api/users', {
      params: {
        'page[number]': currentPage.value,
        'page[size]': itemsPerPage.value,
      },
    })

    if (respuesta) {
      items.value = respuesta.data.data // Aquí deberías obtener la lista de usuarios
      totalItems.value = respuesta.data?.meta.total // Total de registros en el backend
      itemsPerPage.value = respuesta.data?.meta.per_page // Elementos por página
      currentPage.value = respuesta.data?.meta.current_page // Página actual
    }
  }
  catch (error) {
    console.error('Error al obtener los datos:', error.message)
  }
  finally {
    loading.value = false
  }
}

getItems()

watch([currentPage, itemsPerPage], () => {
  getItems() // Vuelve a cargar los datos cuando cambian la página o el tamaño
})

const deleteItem = async (id: number) => {
  const confirm = await preguntaEliminar('¿Desea Eliminar Usuario?')

  if (!confirm)
    return

  try {
    const respuesta = await deleted(`/api/users/${id}`)

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
      v-if="can('crear usuarios', 'usuarios')"
      class="ml-auto"
      color="success"
      to="/usuarios/create"
    >
      Nuevo Usuario
    </VBtn>
  </div>

  <VCard>
    <VCardTitle> Usuario </VCardTitle>

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
            v-if="can('ver usuarios', 'usuarios')"
            icon
            variant="text"
            color="primary"
            :to="`/usuarios/show/${item.id}` "
          >
            <VIcon icon="tabler-eye" />
          </VBtn>
          <VBtn
            v-if="can('editar usuarios', 'usuarios')"
            icon
            variant="text"
            color="primary"
            :to="`/usuarios/edit/${item.id}` "
          >
            <VIcon icon="tabler-edit" />
          </VBtn>
          <VBtn
            v-if="can('eliminar usuarios', 'usuarios')"
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
