<script setup lang="ts">
import { ref } from 'vue'
import Swal from 'sweetalert2'
import RoleForm from '@/components/usuario/RoleForm.vue'

const { get, deleted } = useClienteRequest()

// Variables reactivas
const allRoles = ref([]) // Lista completa para el selector
const seleccionarRol = ref()
const verModalDeRol = ref(false)
const formMode = ref('create')

const filtros = ref({
  name: [],
})

const buscarRoles = async (searchTerm: string) => {
  try {
    const url = searchTerm ? `/api/roles?filter[name]=${searchTerm} ` : '/api/roles'
    const response: any = await get(url)

    allRoles.value = Array.isArray(response.data) ? response.data : response.data.data

    console.log('Roles encontrados:', allRoles.value)
  }
  catch (error) {
    console.error('Error al buscar roles:', error)
  }
}

// Crear un nuevo rol
const crearNuevoRol = () => {
  seleccionarRol.value = null
  formMode.value = 'create'
  verModalDeRol.value = true
}

// Editar un rol existente
const editarRol = (rol: any) => {
  seleccionarRol.value = rol
  formMode.value = 'edit'
  verModalDeRol.value = true
}

// Eliminar un rol
const eliminarRol = async (rol: any) => {
  try {
    await deleted(`/api/roles/${rol.id}`)
    Swal.fire(
      'Eliminado!',
      'El rol ha sido eliminado con éxito.',
      'success')
  }
  catch (error: any) {
    console.error('Error al eliminar el rol:', error)
    Swal.fire(
      'Error!',
      error?.response?.data?.message || 'Error al eliminar el rol.',
      'error',
    )
  }
}

const columnas = [
  { title: 'Nombre', key: 'name', sortable: true, exportable: true },
  { title: 'GUARD NAME', key: 'guard_name', sortable: true, exportable: true },
  { title: 'PERMISOS', key: 'permisos', sortable: false, exportable: true },
  { title: 'Acción', key: 'actions', sortable: false, exportable: false },
]
</script>

<template>
  <div class="container mt-5">
    <div class="d-flex justify-content-between">
      <h1>Gestión de Roles</h1>
      <VBtn
        class="ms-auto"
        style="inline-size: 18rem;"
        prepend-icon="tabler-plus"
        @click="crearNuevoRol"
      >
        Nuevo Rol
      </VBtn>
    </div>
  </div>
  <VCard class="mb-2">
    <VCardText class="d-flex flex-wrap gap-6 mb-4">
      <div class="app-user-search-filter d-flex align-center flex-wrap gap-6">
        <div style="inline-size: 25rem;">
          <AppAutocomplete
            v-model="filtros.name"
            :items="allRoles"
            item-title="name"
            chips
            multiple
            closable-chips
            placeholder="Seleccionar roles"
            @update:search="buscarRoles"
          />
        </div>
      </div>
    </VCardText>
  </VCard>

  <VCard>
    <VCardText>
      <DataTableComponent
        :botones="['csv', 'xlsx', 'pdf', 'reiniciar']"
        :cantidad-por-pagina="5"
        :cantidad-por-pagina-opciones="[2, 3, 5]"
        :columnas="columnas"
        endpoint="/api/roles"
        :filtros="filtros"
        :relaciones="['permissions']"
      >
        <template #item.permisos="{ item }">
          <div class="d-flex flex-wrap gap-2 py-2">
            <!-- Se agregó pb-2 -->
            <VChip
              v-for="permiso in item.permissions"
              :key="permiso.id"
              color="primary"
              size="small"
            >
              {{ permiso.name }}
            </VChip>
            <VChip
              v-if="!item.permissions.length"
              color="warning"
              size="small"
            >
              Sin Permisos
            </VChip>
          </div>
        </template>
        <template #item.actions="{ item }">
          <VBtn
            icon="tabler-edit"
            variant="text"
            color="primary"
            @click="editarRol(item)"
          />
          <VBtn
            icon="tabler-trash"
            variant="text"
            color="error"
            @click="eliminarRol(item)"
          />
        </template>
        <!--      </VDataTableServer> -->
      </datatablecomponent>
    </VCardText>
  </VCard>

  <!-- Reutilización del formulario -->
  <RoleForm
    :visible="verModalDeRol"
    :mode="formMode"
    :rol="seleccionarRol"
    @cerrar="verModalDeRol = false"
  />
</template>
