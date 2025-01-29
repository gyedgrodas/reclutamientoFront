<script setup lang="ts">
import { defineExpose, onMounted, ref } from 'vue'
import Swal from 'sweetalert2'
import DataModal from '@/views/pages/usuarios/permisos/dataModal.vue'

const { get, deleted } = useClienteRequest()
const permisos = ref([])
const esperar = ref(false)

const paginacion = ref({
  currentPage: 1,
  totalItems: 0,
  itemsPerPage: 5,
})

const dialog = ref(false)
const isEditing = ref(false)
const deleteDialog = ref(false)

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

const headers = [
  { title: 'NOMBRE', key: 'name', width: '15%', sortable: true },
  { title: 'SUJETO', key: 'subject', width: '15%', sortable: true },
  { title: 'GUARD NAME', key: 'guard_name', width: '10%', sortable: true },

  { title: 'Roles', key: 'roles', sortable: false },

  // { title: 'CREADO', key: 'created_at' },
  // { title: 'MODIFICADO', key: 'updated_at' },
  { title: 'ACCIONES', key: 'actions', sortable: false },
]

const orden = ref([{ key: 'name', order: 'asc' }] as const)

const deleteItem = (item: any) => {
  dialogItem.value = { ...item }
  deleteDialog.value = true
}

const cargarPermisos = async () => {
  console.log(orden)
  esperar.value = true

  const sortParam = orden.value.length
    ? (orden.value[0].order === 'asc' ? orden.value[0].key : `-${orden.value[0].key}`)
    : '' // 👈 No enviar `sort` si no hay orden
  try {
    const response: any = await get('/api/permisos',
      {
        'include': 'roles',
        'sort': sortParam,
        'page[number]': paginacion.value.currentPage,
        'page[size]': paginacion.value.itemsPerPage,
      },
    )

    if (response) {
      permisos.value = response.data.map((item: any) => ({
        ...item,
      }))

      paginacion.value.totalItems = response.total
      paginacion.value.itemsPerPage = response.per_page
      paginacion.value.currentPage = response.current_page
      esperar.value = false
    }
  }
  catch (error) {
    console.error('Error al cargar los permisos:', error)
  }
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

    // Recarga la tabla
    await cargarPermisos()
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

watch(() => [paginacion.value.currentPage, paginacion.value.itemsPerPage], () => {
  cargarPermisos()
}, { deep: true })

onMounted(cargarPermisos)
defineExpose({
  openDialog,
})
</script>

<template>
  <!-- Tabla de datos -->
  <VDataTableServer
    v-model:items-per-page="paginacion.itemsPerPage"
    v-model:page="paginacion.currentPage"
    v-model:sort-by="orden"
    :headers="headers"
    :items="permisos"
    item-value="id"
    :items-length="paginacion.totalItems"
    :items-per-page-options="[5, 10, 20, 50, -1]"
    :loading="esperar"
    @update:sort-by="cargarPermisos"
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
  </VDataTableServer>

  <DataModal
    v-model:abrirModal="dialog"
    :is-editing="isEditing"
    :dialog-item="dialogItem"
    @actualizar-abrir-modal="closeDialog"
    @actualizar-tabla="cargarPermisos"
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
