<script setup lang="ts">
import { ref, computed } from 'vue'
import { can } from '@layouts/plugins/casl'
import { MODEL_TYPE_CONFIGURACION } from '@/constantes/ModelTypes'

definePageMeta({
  navActiveLink: 'admin-configuraciones',
  middleware: 'permissions',
  action: 'listar configuraciones', // Acción requerida
  subject: 'Configuracion', // Sujeto requerido (esto puede ser el nombre de un recurso o algo más específico)
})

const {deleted} = useClienteRequest()

const { showToastSuccess, showToastError, preguntaEliminar } = useToast()

const filtros = ref({
  nombre: '',
  tipo: null,
  grupo: '',
})

const tipos = ['boolean', 'float', 'integer', 'string']

const columnas = computed(() => [
  {
    title: 'Nombre',
    key: 'nombre',
    OpcionesFiltro: {
      campo: 'nombre',
      operador: 'like',
      valor: filtros.value.nombre,
    },
  },
  {
    title: 'Tipo',
    key: 'tipo',
    OpcionesFiltro: {
      campo: 'tipo',
      operador: '=',
      valor: filtros.value.tipo,
    },
  },
  {
    title: 'Grupo',
    key: 'grupo',
    OpcionesFiltro: {
      campo: 'grupo',
      operador: 'like',
      valor: filtros.value.grupo,
    },
  },
  { title: 'Valor', key: 'valor' },
  { title: 'Descripción', key: 'descripcion', sortable: false },
  { title: 'Acciones', key: 'Acciones', sortable: false, exportable: false },
])

const dataTable = ref(null)

const filtrar = () => {
  dataTable.value?.getItems()
}

const limpiarFiltros = () => {
  filtros.value = {
    nombre: '',
    tipo: null,
    grupo: '',
  }
  setTimeout(() => {
    dataTable.value?.getItems()
  }, 500)
}

const deleteItem = async (id: number) => {
  const confirm = await preguntaEliminar('¿Desea Eliminar Configuracion?')

  if (!confirm)
    return

  try {
    const respuesta = await deleted(`/api/configuracions/${id}`)

    showToastSuccess(respuesta.message)

    dataTable.value?.getItems()
  } catch (error) {
    showToastError(error.message)
  }
}
</script>

<template>
  <div class="d-flex flex-wrap justify-end justify-sm-space-between gap-y-4 gap-x-6 mb-6">
    <h1 v-text="'Configuraciones'"></h1>
    <VBtn
      v-if="can('crear configuraciones', 'configuraciones')"
      class="ml-auto"
      color="primary"
      to="/admin/configuraciones/create"
    >
      <VIcon class="tabler-plus mr-1" />
      Nueva Configuracion
    </VBtn>
  </div>

  <VCard class="mb-6">
    <VCardText>
      <VRow>
        <VCol cols="12" md="4">
          <AppTextField
            v-model="filtros.nombre"
            label="Nombre"
            placeholder="Buscar por nombre"
          />
        </VCol>
        <VCol cols="12" md="4">
          <AppAutocomplete
            v-model="filtros.tipo"
            :items="tipos"
            label="Tipo"
            placeholder="Seleccione Tipo"
            clearable
          />
        </VCol>
        <VCol cols="12" md="4">
          <AppTextField
            v-model="filtros.grupo"
            label="Grupo"
            placeholder="Buscar por grupo"
          />
        </VCol>
        <VCol cols="12" class="d-flex justify-end">
          <VBtn
            color="secondary"
            variant="tonal"
            class="mr-2"
            @click="limpiarFiltros"
          >
            <VIcon icon="tabler-clear-all" start />
            Limpiar
          </VBtn>
          <VBtn color="primary" @click="filtrar">
            <VIcon icon="tabler-filter" start />
            Filtrar
          </VBtn>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>

  <DataTableComponent
    ref="dataTable"
    :model="MODEL_TYPE_CONFIGURACION"
    :botones="['csv', 'xlsx', 'pdf', 'reiniciar']"
    :cantidad-por-pagina="5"
    :cantidad-por-pagina-opciones="[2, 3, 5]"
    :columnas="columnas"
    endpoint="/api/configuracions"
  >
    <template #item.valor="{ item }">
      <span>{{ item.valor }}</span>
    </template>

    <template #item.Acciones="{ item }">
      <VBtn
        v-if="can('ver configuraciones', 'Configuracion')"
        icon="tabler-eye"
        variant="tonal"
        v-tooltip="'Ver'"
        color="info"
        :to="`/admin/configuraciones/show/${item.id}` "
      >
        <VIcon icon="tabler-eye"/>
      </VBtn>
      <VBtn
        v-if="can('editar configuraciones', 'Configuracion')"
        icon="tabler-edit"
        v-tooltip="'Editar'"
        variant="tonal"
        color="warning"
        :to="`/admin/configuraciones/edit/${item.id}` "
      >
        <VIcon icon="tabler-edit"/>
      </VBtn>
      <VBtn
        v-if="can('eliminar configuraciones', 'Configuracion')"
        icon="tabler-trash"
        color="error"
        variant="tonal"
        v-tooltip="'Eliminar'"
        @click="deleteItem(item.id)"
      />
    </template>
  </DataTableComponent>

</template>

<style scoped lang="scss">

</style>
