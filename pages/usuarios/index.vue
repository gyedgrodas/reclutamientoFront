<script setup lang="ts">
import { ref } from 'vue'
import { can } from '@layouts/plugins/casl'

const { get } = useClienteRequest()

definePageMeta({
  middleware: 'permissions',
  action: 'listar usuarios', // Acción requerida
  subject: 'usuarios', // Sujeto requerido (esto puede ser el nombre de un recurso o algo más específico)
})

const { deleted } = useClienteRequest()

const { showToastSuccess, showToastError, preguntaEliminar } = useToast()

const allUsers = ref([])

const filtros = ref({
  usuario_dominio: [],
})

const buscarUsuarios = async (searchTerm: string) => {
  try {
    const url = searchTerm ? `/api/users?filter[usuario_dominio]=${searchTerm} ` : '/api/users'
    const response: any = await get(url)

    allUsers.value = response.data.data

  }
  catch (error) {
    showToastError(error.message)
  }
}

const columnas = [
  { title: 'ID', key: 'id', exportable: true },
  { title: 'Usuario Dominio', key: 'usuario_dominio', exportable: true },
  { title: 'Cif', key: 'cif', exportable: true },
  { title: 'Asociado Id', key: 'asociado_id', exportable: true },
  { title: 'Email', key: 'email', exportable: true },
  { title: 'Nombre', key: 'nombre', exportable: true },
  { title: 'Apellido', key: 'apellido', exportable: true },
  { title: 'fecha de creacion', key: 'created_at', exportable: true },
  { title: 'Acciones', key: 'Acciones', sortable: false, exportable: false },
]

const deleteItem = async (id: number) => {
  const confirm = await preguntaEliminar('¿Desea Eliminar Usuario?')

  if (!confirm)
    return

  try {
    const respuesta = await deleted(`/api/users/${id}`)

    showToastSuccess(respuesta.message)

    // allUsers.value = [...allUsers.value] // Esto garantiza que la tabla se actualice.
  }
  catch (error) {
    showToastError(error.message)
  }
}
</script>

<template>
  <div class="d-flex flex-wrap justify-end justify-sm-space-between mb-6">
    <h1>Gestión de Usuarios</h1>
    <VBtn
      v-if="can('crear usuarios', 'usuarios')"
      class="ms-auto"
      style="inline-size: 18rem;"
      prepend-icon="tabler-plus"
      to="/usuarios/create"
    >
      Nuevo Usuario
    </VBtn>
  </div>
  <VCard class="mb-2">
    <VCardText class="d-flex flex-wrap gap-6 mb-4">
      <div class="app-user-search-filter d-flex align-center flex-wrap gap-6">
        <div style="inline-size: 25rem;">
          <AppAutocomplete
            v-model="filtros.usuario_dominio"
            :items="allUsers"
            item-title="usuario_dominio"
            chips
            multiple
            closable-chips
            placeholder="Seleccionar usuarios"
            @update:search="buscarUsuarios"
            clear-on-select
          />
        </div>
      </div>
    </VCardText>
  </VCard>
  <VCard>
    <DataTableComponent
      :botones="['csv', 'xlsx', 'pdf', 'reiniciar']"
      :cantidad-por-pagina="5"
      :cantidad-por-pagina-opciones="[2, 3, 5]"
      :columnas="columnas"
      endpoint="/api/users"
      :filtros="filtros"
    >
      <template #item.Acciones="{ item }">
        <VBtn
          v-if="can('ver usuarios', 'usuarios')"
          icon
          variant="text"
          color="primary"
          :to="`/apps/user/show/${item.id}`"
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
    </DataTableComponent>
  </VCard>
</template>
