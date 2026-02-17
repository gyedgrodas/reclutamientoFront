<script setup lang="ts">
import { ref } from 'vue'
import RoleForm from '@/components/usuario/RoleForm.vue'
import { can } from '@layouts/plugins/casl'
import { MODEL_TYPE_ROLE } from '@/constantes/ModelTypes'
import type { ColumnaInterface } from '@/types/sistema/DataTableTypes';
import type DataTable from "@/components/form-elements/DataTableComponent.vue";

definePageMeta({
  navActiveLink: 'usuarios-roles',
  middleware: 'permissions',
  action: 'listar roles', // Acción requerida
  subject: 'Role',
})

const { get, deleted } = useClienteRequest()
const { paginaEspera } = useCargandoPagina()
const { showToastError, showToastSuccess, preguntaEliminar } = useToast()

// Variables reactivas
const allRoles = ref([]) // Lista completa para el selector
const seleccionarRol = ref()
const verModalDeRol = ref(false)
const formMode = ref('create')
const dataTable = ref<InstanceType<typeof DataTable> | null>(null)

const filtros = ref({
  name: null,
})
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

const cerrarModal = () => {
  verModalDeRol.value = false
  seleccionarRol.value = null // <-- Crucial: limpiar la referencia
}

// Eliminar un rol
const eliminarRol = async (rol: any) => {
  try {
    const confirmado = await preguntaEliminar('¿Estás seguro de eliminar este rol?')

    if (!confirmado)
      return

    paginaEspera.value = true

    await deleted(`/api/roles/${rol.id}`)

    showToastSuccess('Rol eliminado correctamente')
    dataTable.value?.getItems()
  }
  catch (error: any) {
    showToastError('Error al eliminar el rol')
    console.error('Error al eliminar el rol:', error)
  }
  finally {
    paginaEspera.value = false
  }
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
  {
    title: 'GUARD NAME',
    key: 'guard_name',
    sortable: true,
    exportable: true
  },
  {
    title: 'PERMISOS',
    key: 'permisos_separados_coma',
    sortable: false,
    exportable: true
  },
  {
    title: 'Acción',
    key: 'actions',
    sortable: false,
    exportable: false
  },
])

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

</script>

<template>
  <div class="d-flex flex-wrap justify-end justify-sm-space-between mb-6">
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
  <VCard class="mb-2">
    <VCardText class="d-flex flex-wrap gap-6 mb-4">
      <div class="app-user-search-filter d-flex align-center flex-wrap gap-6">
        <div style="inline-size: 25rem;">
          <VLabel>Rol:</VLabel>
          <SelectorPro
            v-model:item-selected="filtros.name"
            url="/api/roles"
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

  <VCard>
    <DataTableComponent
      ref="dataTable"
      :model="MODEL_TYPE_ROLE"
      :botones="['csv', 'xlsx', 'pdf', 'reiniciar']"
      :cantidad-por-pagina="5"
      :cantidad-por-pagina-opciones="[2, 3, 5]"
      :columnas="columnas"
      endpoint="/api/roles"
      :relaciones="['permissions']"
    >
      <template #item.permisos_separados_coma="{ item }">
        <div class="d-flex flex-wrap gap-2 py-2">
          <!-- Se agregó pb-2 -->
          <VChip
            v-for="permiso in item.permissions"
            :key="permiso"
            color="primary"
            size="small"
          >
            {{ permiso.name }}
          </VChip>

        </div>
      </template>
      <template #item.actions="{ item }">
        <VBtn
          v-if="can('ver rol', 'Role')"
          icon="tabler-eye"
          variant="tonal"
          v-tooltip="'Ver'"
          :to="`/admin/usuarios/roles/show/${item.id}`"
          color="info"
        />
        <VBtn
          v-if="can('editar rol', 'Role')"
          icon="tabler-edit"
          variant="tonal"
          v-tooltip="'Editar'"
          color="warning"
          @click="editarRol(item)"
        />
        <VBtn
          v-if="can('eliminar rol', 'Role')"
          icon="tabler-trash"
          variant="tonal"
          v-tooltip="'Eliminar'"
          color="error"
          @click="eliminarRol(item)"
        />

      </template>
      <!--      </VDataTableServer> -->
    </datatablecomponent>
  </VCard>

  <!-- Reutilización del formulario -->
  <RoleForm
    v-if="verModalDeRol"
    :visible="verModalDeRol"
    :mode="formMode"
    :rol="seleccionarRol"
    @cerrar="cerrarModal"
    @actualizar-tabla="dataTable.getItems()"
  />
</template>
