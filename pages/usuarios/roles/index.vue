<script setup lang="ts">
import { ref, watch } from 'vue'
import Swal from 'sweetalert2'
import { format } from 'date-fns'
import RoleForm from '@/components/usuario/RoleForm.vue'

const { put, get, post, deleted } = useClienteRequest()

// Variables reactivas
const allRoles = ref([]) // Lista completa para el selector
const roles = ref([])
const seleccionarRol = ref()
const currentPage = ref(1)
const itemsPerPage = ref(5)
const totalItems = ref(0)
const sortBy = ref('')
const esperar = ref(false)
const verModalDeRol = ref(false)
const formMode = ref('create')

const filters = ref({
  name: [],
})

const buscarRoles = async (searchTerm: string) => {
  try {
    const url = searchTerm ? `/api/roles?filter[name]=${searchTerm} ` : '/api/roles'
    const response: any = await get(url)

    allRoles.value = response.data
  }
  catch (error) {
    console.error('Error al buscar roles:', error)
  }
}

// Cargar roles desde la API
const cargarRoles = async () => {
  esperar.value = true
  try {
    const response: any = await get('/api/roles?include=permissions&', {
      params: {
        'page[number]': currentPage.value,
        'page[size]': itemsPerPage.value,
        'sort': sortBy.value,
        'filter[name]': filters.value.name.join(','),
      },
    })

    if (response) {
      // Roles para la tabla (datos paginados)
      roles.value = response.data.map((item: any) => ({
        ...item,
        created_at: format(new Date(item.created_at), 'dd-MM-yyyy HH:mm:ss'),
        updated_at: format(new Date(item.updated_at), 'dd-MM-yyyy HH:mm:ss'),
      }))

      if (allRoles.value.length === 0)
        allRoles.value = response.data

      totalItems.value = response.total
      itemsPerPage.value = response.per_page
      currentPage.value = response.current_page
    }
  }
  catch (error) {
    console.error('Error al cargar los roles:', error)
  }
  finally {
    esperar.value = false
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

// Guardar o Actualizar un rol (crear o editar)
const guardarRol = async (rolData: any) => {
  try {
    if (formMode.value === 'create') {
      await post('/api/roles', { data: rolData })
      Swal.fire(
        'Agregado!',
        'El rol ha sido agregado con éxito.',
        'success')
    }
    else {
      console.log(rolData)
      await put(`/api/roles/${rolData.id}`, { data: rolData })
      Swal.fire(
        'Actualizado!',
        'El rol ha sido actualizado con éxito.',
        'success')
    }

    verModalDeRol.value = false
    await nextTick()
    await cargarRoles()
  }
  catch (error: any) {
    console.error('Error al guardar el rol:', error)
    Swal.fire(
      'Error!',
      error?.response?.data?.message || 'Error al guardar el rol.',
      'error',
    )
  }
  finally {
    verModalDeRol.value = false
  }
}

// Eliminar un rol
const eliminarRol = async (rol: any) => {
  try {
    await deleted(`/api/roles/${rol.id}`)
    Swal.fire(
      'Eliminado!',
      'El rol ha sido eliminado con éxito.',
      'success')
    await cargarRoles()
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

watch([currentPage, itemsPerPage, sortBy, filters], cargarRoles, { deep: true })

cargarRoles()

const headers = [
  { title: 'Nombre', key: 'name' },
  { title: 'GUARD NAME', key: 'guard_name' },
  { title: 'PERMISOS', key: 'permisos' },
  { title: 'Acción', key: 'actions', sortable: false },
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
            v-model="filters.name"
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
      <VDataTableServer
        v-model:items-per-page="itemsPerPage"
        v-model:page="currentPage"
        :items="roles"
        :headers="headers"
        item-value="id"
        :items-length="totalItems"
        :items-per-page-options="[5, 10, 20, 50, -1]"
        :loading="esperar"
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
      </VDataTableServer>
    </VCardText>
  </VCard>

  <!-- Reutilización del formulario -->
  <RoleForm
    :visible="verModalDeRol"
    :mode="formMode"
    :rol="seleccionarRol"
    @rol-data="guardarRol"
    @cancel="verModalDeRol = false"
  />
</template>
