<script setup lang="ts">
import { ref } from 'vue'
import DataModal from '@/views/pages/usuarios/permisos/dataModal.vue'
import { can } from '@layouts/plugins/casl'
import { MODEL_TYPE_PERMISSION } from '@/constantes/ModelTypes'
import type { ColumnaInterface } from '@/types/sistema/DataTableTypes';
import type DataTable from "@/components/form-elements/DataTableComponent.vue";

const { deleted, get } = useClienteRequest()

const { showToastError, showToastSuccess, preguntaEliminar } = useToast()
const { paginaEspera } = useCargandoPagina()

const allPermisos = ref([])
const dialog = ref(false)
const isEditing = ref(false)
const dataTable = ref<InstanceType<typeof DataTable> | null>(null)

const filtros = ref({
  name: null,
})

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

const columnas = computed<ColumnaInterface[]>(() => [
  {
    title: 'Nombre',
    key: 'name',
    sortable: true,
    exportable: true,
    OpcionesFiltro: {
      campo: 'id',
      operador: 'in',
      valor: filtros.value.name,
    },
  },
  { title: 'SUJETO', key: 'subject', sortable: true },
  { title: 'GUARD NAME', key: 'guard_name', sortable: true },
  { title: 'Roles', key: 'roles_separados_coma', sortable: false, exportable: true },
  { title: 'ACCIONES', key: 'actions', sortable: false, exportable: false },
])

const deleteItem = async (item: any) => {
  try {
    const confirmado = await preguntaEliminar('¿Estás seguro de eliminar este permiso?')

    if (!confirmado)
      return

    paginaEspera.value = true

    await deleted(`/api/permisos/${item.id}`)
    showToastSuccess('Permiso eliminado correctamente')

    dataTable.value?.getItems()
  }
  catch (error) {
    showToastError('Error al eliminar el permiso')
    console.error('Error al eliminar el permiso:', error)
  }
  finally {
    paginaEspera.value = false
    dialogItem.value = { id: null, name: '', guard_name: '' } // Limpia el diálogo
  }
}

const filtrar = (): void => {
  paginaEspera.value = true
  setTimeout(() => {
    dataTable.value?.getItems()
    paginaEspera.value = false
  }, 500);
}
const limpiarFiltros = (): void => {
  paginaEspera.value = true
  filtros.value.name = null
  setTimeout(() => {
    dataTable.value?.getItems()
    paginaEspera.value = false
  }, 100);
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
          <VLabel>Permiso:</VLabel>
          <SelectorPro
            v-model:item-selected="filtros.name"
            url="/api/permisos"
            placeholder="Escribe para buscar..."
            item-value="id"
            item-title="name"
            :campos-a-filtrar="['name']"
            :multiple="true"
          />
        </div>
      </div>
    </VCardText>
    <VCardText class="d-flex justify-end">
      <div class="d-flex gap-2">
        <VBtn
          type="reset"
          color="secondary"
          @click="limpiarFiltros"
        >
          <VIcon
            icon="tabler-clear-all"
            start
            size="22"
          />
          Limpiar
        </VBtn>

        <VBtn
          type="submit"
          color="primary"
          @click="filtrar"
        >
          <VIcon
            icon="tabler-filter"
            start
            size="22"
          />
          Filtrar
        </VBtn>
      </div>
    </VCardText>
  </VCard>
  <!-- Tabla de datos -->
  <DataTableComponent
    :model="MODEL_TYPE_PERMISSION"
    ref="dataTable"
    :botones="['csv', 'xlsx', 'pdf', 'reiniciar']"
    :cantidad-por-pagina="5"
    :cantidad-por-pagina-opciones="[2, 3, 5]"
    :columnas="columnas"
    endpoint="/api/permisos"
    :filtros="filtros"
    :relaciones="['roles']"
  >
    <!-- Columna personalizada de permisos -->
    <template #item.roles_separados_coma="{ item }">
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
          v-if="can('ver permisos', 'Permission')"
          icon="tabler-eye"
          variant="tonal"
          v-tooltip="'Ver'"
          color="info"
          :to="`/admin/usuarios/permisos/show/${item.id}`"
        />
        <VBtn
          v-if="can('editar permisos', 'Permission')"
          icon="tabler-edit"
          variant="tonal"
          v-tooltip="'Editar'"
          color="warning"
          @click="openDialog(true, item)"
        />
        <VBtn
          v-if="can('eliminar permisos', 'Permission')"
          icon="tabler-trash"
          variant="tonal"
          v-tooltip="'Eliminar'"
          color="error"
          @click="deleteItem(item)"
        />

      </div>
    </template>
  </datatablecomponent>
  <DataModal
    v-model:abrirModal="dialog"
    :is-editing="isEditing"
    :dialog-item="dialogItem"
    @actualizar-abrir-modal="closeDialog"
    @actualizar-tabla="dataTable.getItems()"
  />
</template>
