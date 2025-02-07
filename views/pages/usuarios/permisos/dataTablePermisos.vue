<script setup lang="ts">
import { defineExpose, ref } from 'vue'
import Swal from 'sweetalert2'
import DataModal from '@/views/pages/usuarios/permisos/dataModal.vue'

const { deleted, get } = useClienteRequest()
const esperar = ref(false)

const allPermisos = ref([])
const dialog = ref(false)
const isEditing = ref(false)
const deleteDialog = ref(false)

const filtros = ref({
  name: [],
})

const buscarPermisos = async (searchTerm: string) => {
  try {
    const url = searchTerm ? `/api/permisos?filter[name]=${searchTerm} ` : '/api/permisos'
    const response: any = await get(url)

    allPermisos.value = Array.isArray(response.data) ? response.data : response.data.data

    console.log('permisos encontrados:', allPermisos.value)
  }
  catch (error) {
    console.error('Error al buscar permisos:', error)
  }
}

const dialogItem = ref<{ id: number | null; name: string; guard_name: string }>({
  id: null,
  name: '',
  guard_name: 'api',
})

const openDialog = (editing = false, item: { id: number | null; name: string; guard_name: string } | null = null) => {
  isEditing.value = editing
  dialogItem.value = item ? { ...item } : { id: null, name: '', guard_name: 'api' }
  dialog.value = true
}

const closeDialog = (value: boolean) => {
  dialog.value = value
}

const columnas = [
  { title: 'NOMBRE', key: 'name', sortable: true },
  { title: 'SUJETO', key: 'subject', sortable: true },
  { title: 'GUARD NAME', key: 'guard_name', sortable: true },
  { title: 'Roles', key: 'roles', sortable: false, exportable: false },
  { title: 'ACCIONES', key: 'actions', sortable: false, exportable: false },
]

const deleteItem = (item: any) => {
  dialogItem.value = { ...item }
  deleteDialog.value = true
}

const deleteItemConfirm = async () => {
  try {
    deleteDialog.value = false // Cierra el diálogo de confirmación

    // Muestra la alerta inmediatamente
    Swal.fire({
      title: 'Eliminado!',
      text: 'El permiso ha sido eliminado.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
    })

    // Realiza la eliminación en el backend
    await deleted(`/api/permisos/${dialogItem.value.id}`)
    esperar.value = true
  }
  catch (error) {
    console.error('Error al eliminar el permiso:', error)
    Swal.fire({
      title: 'Error',
      text: 'No se pudo eliminar el permiso.',
      icon: 'error',
      showConfirmButton: true,
    })
  }
  finally {
    dialogItem.value = { id: null, name: '', guard_name: '' } // Limpia el diálogo
  }
}

defineExpose({
  openDialog,
})
</script>

<template>
  <VCard class="mb-2">
    <VCardText class="d-flex flex-wrap gap-6 mb-4">
      <div class="app-user-search-filter d-flex align-center flex-wrap gap-6">
        <div style="inline-size: 25rem;">
          <AppAutocomplete
            v-model="filtros.name"
            :items="allPermisos"
            item-title="name"
            chips
            multiple
            closable-chips
            :clearable="true"
            placeholder="Seleccionar roles"
            @update:search="buscarPermisos"
          />
        </div>
      </div>
    </VCardText>
  </VCard>
  <!-- Tabla de datos -->
  <DataTableComponent
    :botones="['csv', 'xlsx', 'pdf', 'reiniciar']"
    :cantidad-por-pagina="5"
    :cantidad-por-pagina-opciones="[2, 3, 5]"
    :columnas="columnas"
    endpoint="/api/permisos"
    :filtros="filtros"
    :relaciones="['roles']"
  >
    <!-- Columna personalizada de permisos -->
    <template #item.roles="{ item }">
      <div class="d-flex flex-wrap gap-2 py-2">
        <!-- Se agregó pb-2 -->
        <VChip
          v-for="role in item.roles"
          :key="role.id"
          color="primary"
          size="small"
        >
          {{ role.name }}
        </VChip>
        <VChip
          v-if="!item.roles.length"
          color="warning"
          size="small"
        >
          Sin roles
        </VChip>
      </div>
    </template>

    <!-- Acciones -->
    <template #item.actions="{ item }">
      <div class="d-flex gap-1">
        <VBtn
          icon="tabler-eye"
          variant="text"
          color="primary"
          :to="`/usuarios/permisos/show/${item.id}`"
        />
        <IconBtn @click="openDialog(true, item)">
          <VIcon
            icon="tabler-edit"
            color="primary"
          />
        </IconBtn>
        <IconBtn @click="deleteItem(item)">
          <VIcon
            icon="tabler-trash"
            color="error"
          />
        </IconBtn>
      </div>
    </template>
  </datatablecomponent>

  <DataModal
    v-model:abrirModal="dialog"
    :is-editing="isEditing"
    :dialog-item="dialogItem"
    @actualizar-abrir-modal="closeDialog"
  />

  <!-- Diálogo de eliminación -->
  <VDialog
    v-model="deleteDialog"
    max-width="500px"
  >
    <VCard title="Confirmar eliminación">
      <VCardText>
        <p>¿Estás seguro de que deseas eliminar este permiso?</p>
      </VCardText>
      <VCardActions>
        <VBtn
          color="error"
          @click="deleteDialog = false"
        >
          Cancelar
        </VBtn>
        <VBtn
          color="success"
          @click="deleteItemConfirm"
        >
          Aceptar
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
